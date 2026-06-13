import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI, Type } from '@google/genai';
import { CompanySignals } from '../signals/types';
import {
  ActionPriority,
  EnrichmentResult,
  RecommendedAction,
} from './enrichment.types';

export interface CompanyProfile {
  legalName: string;
  industry: string;
  country: string;
  segment: string;
  lifecycleStage: string;
  status: string;
  creditLineApproved: number;
  creditLineUsed: number;
  monthlyBilling: number;
  recentOperations: Array<{
    type: string;
    amount: number;
    date: string;
    status: string;
  }>;
  recentInteractions: Array<{ channel: string; date: string; summary: string }>;
}

const MODEL = 'gemini-2.5-flash';
const VALID_PRIORITIES: ActionPriority[] = ['ALTA', 'MEDIA', 'BAJA'];

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    aiSummary: { type: Type.STRING },
    healthScore: { type: Type.INTEGER },
    recommendedActions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          action: { type: Type.STRING },
          rationale: { type: Type.STRING },
          priority: { type: Type.STRING, enum: VALID_PRIORITIES },
        },
        required: ['action', 'rationale', 'priority'],
      },
    },
  },
  required: ['aiSummary', 'healthScore', 'recommendedActions'],
};

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private readonly client: GoogleGenAI | null;

  constructor(config: ConfigService) {
    const apiKey = config.get<string>('GEMINI_API_KEY');
    this.client = apiKey ? new GoogleGenAI({ apiKey }) : null;
    if (!this.client) {
      this.logger.warn(
        'GEMINI_API_KEY no configurada — el enriquecimiento IA está deshabilitado',
      );
    }
  }

  /** Whether a valid API key was provided at boot. */
  get enabled(): boolean {
    return this.client !== null;
  }

  async enrich(
    profile: CompanyProfile,
    signals: CompanySignals,
  ): Promise<EnrichmentResult> {
    if (!this.client) {
      throw new ServiceUnavailableException('GEMINI_API_KEY no configurada');
    }
    const raw = await this.callWithRetry(this.buildPrompt(profile, signals));
    return this.parse(raw);
  }

  private buildPrompt(
    profile: CompanyProfile,
    signals: CompanySignals,
  ): string {
    return [
      'Eres un analista de cartera para los KAM (Key Account Managers) de una',
      'fintech B2B de factoring y confirming. A partir del perfil de la empresa y',
      'sus señales ya calculadas, genera un análisis breve y accionable en español.',
      '',
      'Reglas:',
      '- aiSummary: 2 a 3 frases, en español, tono profesional y directo. Resume la',
      '  situación de la cuenta y qué la hace prioritaria. No inventes cifras: usa',
      '  solo los datos provistos.',
      '- recommendedActions: entre 2 y 4 acciones concretas que el KAM puede ejecutar,',
      '  cada una con su justificación y prioridad (ALTA, MEDIA o BAJA).',
      '- healthScore: entero de 0 a 100 (100 = cuenta muy sana, 0 = crítica),',
      '  coherente con el riesgo de churn, la mora y la tendencia de volumen.',
      '',
      'PERFIL DE LA EMPRESA:',
      JSON.stringify(profile, null, 2),
      '',
      'SEÑALES CALCULADAS (fuente de verdad, no las recalcules):',
      JSON.stringify(signals, null, 2),
    ].join('\n');
  }

  private async callWithRetry(prompt: string, attempts = 3): Promise<string> {
    for (let attempt = 0; attempt < attempts; attempt++) {
      try {
        const res = await this.client!.models.generateContent({
          model: MODEL,
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: RESPONSE_SCHEMA,
            temperature: 0.4,
          },
        });
        const text = res.text;
        if (!text) throw new Error('Respuesta vacía de Gemini');
        return text;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        const isRetryable = /\b429\b|rate|quota|unavailable|timeout/i.test(message);
        if (isRetryable && attempt < attempts - 1) {
          const waitMs = 2 ** attempt * 1000;
          this.logger.warn(
            `Gemini error transitorio (${message}); reintento en ${waitMs}ms`,
          );
          await new Promise((r) => setTimeout(r, waitMs));
          continue;
        }
        throw err;
      }
    }
    throw new Error('Gemini: reintentos agotados');
  }

  private parse(raw: string): EnrichmentResult {
    let data: Record<string, unknown>;
    try {
      data = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      throw new Error('Gemini devolvió JSON inválido');
    }

    const aiSummary = String(data.aiSummary ?? '').trim();
    const healthScore = Math.max(
      0,
      Math.min(100, Math.round(Number(data.healthScore))),
    );

    const rawActions = Array.isArray(data.recommendedActions)
      ? (data.recommendedActions as Record<string, unknown>[])
      : [];
    const recommendedActions: RecommendedAction[] = rawActions
      .slice(0, 4)
      .map((a) => ({
        action: String(a.action ?? '').trim(),
        rationale: String(a.rationale ?? '').trim(),
        priority: VALID_PRIORITIES.includes(a.priority as ActionPriority)
          ? (a.priority as ActionPriority)
          : 'MEDIA',
      }))
      .filter((a) => a.action.length > 0);

    if (!aiSummary || Number.isNaN(healthScore)) {
      throw new Error('Gemini: payload incompleto');
    }

    return { aiSummary, healthScore, recommendedActions };
  }
}

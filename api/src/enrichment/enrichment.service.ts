import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { computeSignals } from '../signals/signals.service';
import { buildCompanyInput } from '../signals/company-input';
import { toNumber } from '../common/decimal.util';
import { CompanyProfile, GeminiService } from './gemini.service';

/** Re-enrich a company only if its AI data is missing or older than this. */
const STALE_HOURS = 20;
/** Delay between calls in the batch to stay under the free-tier rate limit. */
const BATCH_DELAY_MS = 1500;

@Injectable()
export class EnrichmentService {
  private readonly logger = new Logger(EnrichmentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly gemini: GeminiService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_6AM)
  async scheduledRun(): Promise<void> {
    if (!this.gemini.enabled) {
      this.logger.warn('Cron IA omitido: Gemini deshabilitado (sin API key)');
      return;
    }
    await this.enrichAllStale();
  }

  /** Enrich every company whose AI data is missing or stale. */
  async enrichAllStale(): Promise<{ processed: number; ok: number; failed: number }> {
    const cutoff = new Date(Date.now() - STALE_HOURS * 3600 * 1000);
    const companies = await this.prisma.company.findMany({
      where: {
        OR: [{ aiGeneratedAt: null }, { aiGeneratedAt: { lt: cutoff } }],
      },
      select: { id: true },
    });

    this.logger.log(`Enriquecimiento batch: ${companies.length} empresa(s)`);
    let ok = 0;
    let failed = 0;

    for (const { id } of companies) {
      try {
        await this.enrichCompany(id);
        ok++;
      } catch (err) {
        failed++;
        const message = err instanceof Error ? err.message : String(err);
        this.logger.error(`Falló empresa ${id}: ${message}`);
      }
      await new Promise((r) => setTimeout(r, BATCH_DELAY_MS));
    }

    this.logger.log(`Batch terminado: ${ok} ok, ${failed} fallida(s)`);
    return { processed: companies.length, ok, failed };
  }

  /**
   * Enrich a single company. When `kamId` is provided (manual trigger),
   * ownership is enforced; the cron passes no `kamId` (system context).
   */
  async enrichCompany(companyId: string, kamId?: string) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      include: {
        operations: { orderBy: { date: 'desc' } },
        interactions: { orderBy: { date: 'desc' }, take: 5 },
      },
    });

    if (!company) throw new NotFoundException('Company not found');
    if (kamId && company.kamId !== kamId) {
      throw new ForbiddenException('Not your company');
    }

    const signals = computeSignals(buildCompanyInput(company));
    const profile: CompanyProfile = {
      legalName: company.legalName,
      industry: company.industry,
      country: company.country,
      segment: company.segment,
      lifecycleStage: company.lifecycleStage,
      status: company.status,
      creditLineApproved: toNumber(company.creditLineApproved),
      creditLineUsed: toNumber(company.creditLineUsed),
      monthlyBilling: toNumber(company.monthlyBilling),
      recentOperations: company.operations.slice(0, 10).map((o) => ({
        type: o.type,
        amount: toNumber(o.amount),
        date: o.date.toISOString().slice(0, 10),
        status: o.status,
      })),
      recentInteractions: company.interactions.map((i) => ({
        channel: i.channel,
        date: i.date.toISOString().slice(0, 10),
        summary: i.summary,
      })),
    };

    const result = await this.gemini.enrich(profile, signals);

    return this.prisma.company.update({
      where: { id: companyId },
      data: {
        aiSummary: result.aiSummary,
        healthScore: result.healthScore,
        recommendedActions:
          result.recommendedActions as unknown as Prisma.InputJsonValue,
        aiGeneratedAt: new Date(),
      },
      select: {
        aiSummary: true,
        healthScore: true,
        recommendedActions: true,
        aiGeneratedAt: true,
      },
    });
  }
}

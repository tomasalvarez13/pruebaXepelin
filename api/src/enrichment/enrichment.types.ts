export type ActionPriority = 'ALTA' | 'MEDIA' | 'BAJA';

export type ChurnRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface RecommendedAction {
  action: string;
  rationale: string;
  priority: ActionPriority;
}

/**
 * Structured output produced by the LLM for a single company (the four
 * AI-calculated columns: health_score, churn_risk, summary, recommended_actions).
 * The deterministic signals still drive instant list sorting/filtering and are
 * fed to the model as context.
 */
export interface EnrichmentResult {
  healthScore: number; // 0-100, higher = healthier
  churnRisk: ChurnRiskLevel;
  aiSummary: string;
  recommendedActions: RecommendedAction[];
}

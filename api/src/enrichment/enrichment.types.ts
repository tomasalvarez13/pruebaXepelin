export type ActionPriority = 'ALTA' | 'MEDIA' | 'BAJA';

export interface RecommendedAction {
  action: string;
  rationale: string;
  priority: ActionPriority;
}

/**
 * Structured output produced by the LLM for a single company.
 * The deterministic signals remain the source of truth for sorting/filtering;
 * these fields only add a narrative layer on top.
 */
export interface EnrichmentResult {
  aiSummary: string;
  healthScore: number; // 0-100, higher = healthier
  recommendedActions: RecommendedAction[];
}

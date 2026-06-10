import { SIGNALS_CONFIG } from './config';
import { CompanySignals, CompanyInput } from './types';

const FINANCED_TYPES = new Set(['FACTORING', 'CONFIRMING']);

export function computeSignals(
  company: CompanyInput,
  now: Date = new Date(),
): CompanySignals {
  const cfg = SIGNALS_CONFIG;
  const periodMs = cfg.PERIOD_DAYS * 24 * 60 * 60 * 1000;

  const cutoff90 = new Date(now.getTime() - periodMs);
  const cutoff180 = new Date(now.getTime() - 2 * periodMs);

  const ops = company.operations;
  const financedOps = ops.filter((o) => FINANCED_TYPES.has(o.type));

  const financedVolume90d = financedOps
    .filter((o) => o.date >= cutoff90)
    .reduce((sum, o) => sum + o.amount, 0);

  const financedVolumePrev90d = financedOps
    .filter((o) => o.date >= cutoff180 && o.date < cutoff90)
    .reduce((sum, o) => sum + o.amount, 0);

  const volumeTrendPct =
    financedVolumePrev90d > 0
      ? (financedVolume90d - financedVolumePrev90d) / financedVolumePrev90d
      : financedVolume90d > 0
        ? 1
        : 0;

  const opDates = ops.map((o) => o.date.getTime());
  const daysSinceLastOp =
    opDates.length > 0
      ? Math.floor((now.getTime() - Math.max(...opDates)) / (24 * 60 * 60 * 1000))
      : null;

  const monthlyFinanced = financedVolume90d / 3;
  const sowPct =
    company.monthlyBilling > 0 ? monthlyFinanced / company.monthlyBilling : null;

  const lineUtilization =
    company.creditLineApproved > 0
      ? company.creditLineUsed / company.creditLineApproved
      : null;

  const hasOverdue = ops.some(
    (o) => o.status === 'VENCIDA' || o.daysPastDue > 0,
  );
  const overdueAmount = ops
    .filter((o) => o.status === 'VENCIDA')
    .reduce((sum, o) => sum + o.amount, 0);

  const estGrossProfit90d = financedVolume90d * cfg.TAKE_RATE;

  const productsUsed = [...new Set(ops.map((o) => o.type))];

  // Churn score
  let churnScore = 0;
  if (daysSinceLastOp !== null) {
    if (daysSinceLastOp > cfg.CHURN_DAYS_HIGH) churnScore += 2;
    else if (daysSinceLastOp > cfg.CHURN_DAYS_MEDIUM) churnScore += 1;
  }
  if (volumeTrendPct < cfg.VOLUME_DROP_HIGH) churnScore += 2;
  else if (volumeTrendPct < cfg.VOLUME_DROP_MEDIUM) churnScore += 1;
  if (hasOverdue) churnScore += 1;
  if (company.lifecycleStage === 'ENROLADO' && ops.length === 0) churnScore += 1;

  const churnRisk: CompanySignals['churnRisk'] =
    churnScore >= cfg.CHURN_SCORE_HIGH
      ? 'HIGH'
      : churnScore >= cfg.CHURN_SCORE_MEDIUM
        ? 'MEDIUM'
        : 'LOW';

  // Expansion
  const expansionReasons: string[] = [];
  if (sowPct !== null && sowPct < cfg.SOW_EXPANSION_THRESHOLD && company.monthlyBilling > 500_000) {
    expansionReasons.push('SOW bajo, espacio para crecer');
  }
  if (
    lineUtilization !== null &&
    lineUtilization < cfg.LINE_UTILIZATION_EXPANSION_THRESHOLD &&
    !hasOverdue &&
    volumeTrendPct >= 0
  ) {
    expansionReasons.push('Línea subutilizada');
  }
  if (productsUsed.length === 1) {
    expansionReasons.push('Mono-producto, candidato a cross-sell');
  }
  const expansion = expansionReasons.length > 0;

  // Value tier
  const valueTier: CompanySignals['valueTier'] =
    estGrossProfit90d >= cfg.TIER_A_THRESHOLD
      ? 'A'
      : estGrossProfit90d >= cfg.TIER_B_THRESHOLD
        ? 'B'
        : 'C';

  // Priority
  const isHighValue = valueTier === 'A' || valueTier === 'B';
  let priorityLabel: CompanySignals['priorityLabel'];
  if (isHighValue && (churnRisk === 'HIGH' || expansion)) {
    priorityLabel = 'ALTA';
  } else if (churnRisk === 'MEDIUM' || (expansion && valueTier === 'C')) {
    priorityLabel = 'MEDIA';
  } else if (churnRisk === 'HIGH') {
    priorityLabel = 'ALTA';
  } else {
    priorityLabel = 'BAJA';
  }

  // Priority reason
  const reasons: string[] = [];
  if (daysSinceLastOp !== null && daysSinceLastOp > cfg.CHURN_DAYS_MEDIUM) {
    reasons.push(`Sin actividad ${daysSinceLastOp}d`);
  }
  if (volumeTrendPct < cfg.VOLUME_DROP_MEDIUM) {
    reasons.push(`Caída ${Math.abs(Math.round(volumeTrendPct * 100))}% volumen`);
  }
  if (hasOverdue) {
    reasons.push('Mora activa');
  }
  if (company.lifecycleStage === 'ENROLADO' && ops.length === 0) {
    reasons.push(
      daysSinceLastOp === null
        ? 'Enrolado sin activar'
        : `Enrolado sin activar`,
    );
  }
  if (sowPct !== null && sowPct < cfg.SOW_EXPANSION_THRESHOLD) {
    reasons.push(`SOW ${Math.round(sowPct * 100)}%`);
  }
  if (expansion) {
    reasons.push('Expansión');
  }
  const priorityReason = reasons.length > 0 ? reasons.join(' · ') : 'Sin alertas';

  return {
    financedVolume90d,
    financedVolumePrev90d,
    volumeTrendPct,
    daysSinceLastOp,
    sowPct,
    lineUtilization,
    hasOverdue,
    overdueAmount,
    estGrossProfit90d,
    productsUsed,
    churnRisk,
    churnScore,
    expansion,
    expansionReasons,
    valueTier,
    priorityLabel,
    priorityReason,
  };
}

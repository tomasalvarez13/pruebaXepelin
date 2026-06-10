export interface CompanySignals {
  financedVolume90d: number;
  financedVolumePrev90d: number;
  volumeTrendPct: number;
  daysSinceLastOp: number | null;
  sowPct: number | null;
  lineUtilization: number | null;
  hasOverdue: boolean;
  overdueAmount: number;
  estGrossProfit90d: number;
  productsUsed: string[];
  churnRisk: 'LOW' | 'MEDIUM' | 'HIGH';
  churnScore: number;
  expansion: boolean;
  expansionReasons: string[];
  valueTier: 'A' | 'B' | 'C';
  priorityLabel: 'ALTA' | 'MEDIA' | 'BAJA';
  priorityReason: string;
}

export interface CompanyListItem {
  id: string;
  legalName: string;
  taxId: string;
  industry: string;
  country: 'CL' | 'MX';
  segment: string;
  lifecycleStage: string;
  status: string;
  onboardedAt: string;
  creditLineApproved: number;
  creditLineUsed: number;
  monthlyBilling: number;
  notes: string | null;
  healthScore: number | null;
  churnRisk: string | null;
  aiSummary: string | null;
  recommendedActions: unknown | null;
  aiGeneratedAt: string | null;
  signals: CompanySignals;
  daysSinceLastInteraction: number | null;
}

export interface Operation {
  id: string;
  type: string;
  amount: number;
  date: string;
  status: string;
  daysPastDue: number;
}

export interface Interaction {
  id: string;
  channel: string;
  date: string;
  summary: string;
}

export interface CompanyDetail extends CompanyListItem {
  operations: Operation[];
  interactions: Interaction[];
}

export interface KamInfo {
  id: string;
  email: string;
  name: string;
}

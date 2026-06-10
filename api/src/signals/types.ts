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

export interface OperationInput {
  type: string;
  amount: number;
  date: Date;
  status: string;
  daysPastDue: number;
}

export interface CompanyInput {
  lifecycleStage: string;
  creditLineApproved: number;
  creditLineUsed: number;
  monthlyBilling: number;
  operations: OperationInput[];
}

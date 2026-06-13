import { toNumber } from '../common/decimal.util';
import { CompanyInput, OperationInput } from './types';

type DecimalLike = Parameters<typeof toNumber>[0];

interface CompanyLike {
  lifecycleStage: string;
  creditLineApproved: DecimalLike;
  creditLineUsed: DecimalLike;
  monthlyBilling: DecimalLike;
  operations: Array<{
    type: string;
    amount: DecimalLike;
    date: Date;
    status: string;
    daysPastDue: number;
  }>;
}

/**
 * Maps a Prisma company (with `operations` included) into the plain
 * `CompanyInput` consumed by the deterministic signals engine.
 */
export function buildCompanyInput(company: CompanyLike): CompanyInput {
  const operations: OperationInput[] = company.operations.map((o) => ({
    type: o.type,
    amount: toNumber(o.amount),
    date: o.date,
    status: o.status,
    daysPastDue: o.daysPastDue,
  }));

  return {
    lifecycleStage: company.lifecycleStage,
    creditLineApproved: toNumber(company.creditLineApproved),
    creditLineUsed: toNumber(company.creditLineUsed),
    monthlyBilling: toNumber(company.monthlyBilling),
    operations,
  };
}

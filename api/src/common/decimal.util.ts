import { Decimal } from '@prisma/client/runtime/library';

export function toNumber(val: Decimal | number | null | undefined): number {
  if (val === null || val === undefined) return 0;
  if (val instanceof Decimal) return val.toNumber();
  return Number(val);
}

type AnyRecord = Record<string, unknown>;

export function serializeCompany<T extends AnyRecord>(company: T): T {
  const decimalFields = ['creditLineApproved', 'creditLineUsed', 'monthlyBilling', 'amount'];
  const result: AnyRecord = { ...company };
  for (const key of decimalFields) {
    if (key in result && result[key] !== undefined) {
      result[key] = toNumber(result[key] as Decimal);
    }
  }
  if ('operations' in result && Array.isArray(result['operations'])) {
    result['operations'] = (result['operations'] as AnyRecord[]).map((op) => ({
      ...op,
      amount: toNumber(op['amount'] as Decimal),
    }));
  }
  return result as T;
}

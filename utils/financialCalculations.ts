import {
  FinancialItem,
  FinancialItemStatus,
  FinancialItemTotals,
  FinancialPeriod,
  FinancialSummaryTotals,
} from '../types/financial';

export const roundMoney = (value: number): number => Math.round((value + Number.EPSILON) * 100) / 100;

export const getFinancialItemStatus = (
  item: Pick<FinancialItem, 'plannedAmount' | 'paidAmount'>,
): FinancialItemStatus => {
  if (item.paidAmount === 0) return 'pending';
  if (item.paidAmount < item.plannedAmount) return 'partial';
  if (item.paidAmount === item.plannedAmount) return 'paid';
  return 'exceeded';
};

export const getFinancialItemTotals = (
  item: Pick<FinancialItem, 'plannedAmount' | 'paidAmount'>,
): FinancialItemTotals => ({
  remaining: roundMoney(Math.max(item.plannedAmount - item.paidAmount, 0)),
  exceeded: roundMoney(Math.max(item.paidAmount - item.plannedAmount, 0)),
  percentage: item.plannedAmount > 0 ? Math.round((item.paidAmount / item.plannedAmount) * 1000) / 10 : 0,
  status: getFinancialItemStatus(item),
});

export const getFinancialSummary = (period: FinancialPeriod): FinancialSummaryTotals => {
  const totalPlanned = roundMoney(period.items.reduce((total, item) => total + item.plannedAmount, 0));
  const totalPaid = roundMoney(period.items.reduce((total, item) => total + item.paidAmount, 0));
  const totalPending = roundMoney(
    period.items.reduce((total, item) => total + Math.max(item.plannedAmount - item.paidAmount, 0), 0),
  );
  const totalExceeded = roundMoney(
    period.items.reduce((total, item) => total + Math.max(item.paidAmount - item.plannedAmount, 0), 0),
  );

  return {
    totalPlanned,
    totalPaid,
    totalPending,
    totalExceeded,
    estimatedBalance: roundMoney(period.startingAmount - totalPaid),
    availableUnallocated: roundMoney(period.startingAmount - totalPlanned),
  };
};

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  FINANCIAL_SCHEMA_VERSION,
  FinancialData,
  FinancialItem,
  FinancialItemType,
  FinancialPeriod,
  FinancialPeriodStatus,
} from '../types/financial';
import { DEFAULT_CURRENCY, isCurrencyCode } from '../types/purchase';
import { roundMoney } from '../utils/financialCalculations';
import { createId } from '../utils/purchase';

export const FINANCIAL_DATA_KEY = '@2fc-compras/financial';

const isNonNegativeNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0;
const isPositiveNumber = (value: unknown): value is number => isNonNegativeNumber(value) && value > 0;
const asRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === 'object' ? (value as Record<string, unknown>) : null;
const validDate = (value: unknown, fallback: string): string =>
  typeof value === 'string' && !Number.isNaN(Date.parse(value)) ? value : fallback;
const normalizeItemType = (value: unknown): FinancialItemType => (value === 'fixed' ? 'fixed' : 'variable');
const isPeriodStatus = (value: unknown): value is FinancialPeriodStatus =>
  value === 'draft' || value === 'open' || value === 'closed';

const safeParse = (value: string): unknown | null => {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const normalizeItem = (value: unknown, fallbackDate: string): FinancialItem | null => {
  const item = asRecord(value);
  if (!item || typeof item.name !== 'string' || !item.name.trim() || !isPositiveNumber(item.plannedAmount)) {
    return null;
  }
  const createdAt = validDate(item.createdAt, fallbackDate);
  const paidAmount = isNonNegativeNumber(item.paidAmount) ? roundMoney(item.paidAmount) : 0;
  return {
    id: typeof item.id === 'string' && item.id ? item.id : createId(),
    name: item.name.trim(),
    type: normalizeItemType(item.type),
    plannedAmount: roundMoney(item.plannedAmount),
    paidAmount,
    createdAt,
    updatedAt: validDate(item.updatedAt, createdAt),
    paidAt: paidAmount > 0 ? validDate(item.paidAt, createdAt) : undefined,
  };
};

const sumLegacyMovements = (value: unknown): number => {
  if (!Array.isArray(value)) return 0;
  return roundMoney(value.reduce((total, entry) => {
    const movement = asRecord(entry);
    return total + (movement && isPositiveNumber(movement.amount) ? movement.amount : 0);
  }, 0));
};

const migrateLegacyPeriod = (value: unknown): FinancialPeriod | null => {
  const period = asRecord(value);
  if (!period || !Number.isInteger(period.year) || !Number.isInteger(period.month)) return null;
  const startingAmount = isPositiveNumber(period.startingAmount)
    ? period.startingAmount
    : isPositiveNumber(period.income)
      ? period.income
      : null;
  if ((period.month as number) < 0 || (period.month as number) > 11 || !startingAmount) return null;

  const now = new Date().toISOString();
  const createdAt = validDate(period.createdAt, now);
  const items: FinancialItem[] = [];

  const unifiedItems = Array.isArray(period.items) ? period.items : null;
  const hasUnifiedItems = unifiedItems !== null;

  if (unifiedItems) {
    unifiedItems.forEach((entry) => {
      const item = normalizeItem(entry, createdAt);
      if (item) items.push(item);
    });
  }

  if (!hasUnifiedItems && Array.isArray(period.fixedExpenses)) {
    period.fixedExpenses.forEach((entry) => {
      const expense = asRecord(entry);
      if (!expense || typeof expense.name !== 'string' || !expense.name.trim() || !isPositiveNumber(expense.amount)) return;
      const itemCreatedAt = validDate(expense.createdAt, createdAt);
      const paidAmount = expense.paid === true ? roundMoney(expense.amount) : 0;
      items.push({
        id: typeof expense.id === 'string' && expense.id ? expense.id : createId(),
        name: expense.name.trim(),
        type: 'fixed',
        plannedAmount: roundMoney(expense.amount),
        paidAmount,
        createdAt: itemCreatedAt,
        updatedAt: itemCreatedAt,
        paidAt: paidAmount > 0 ? validDate(expense.paidAt, itemCreatedAt) : undefined,
      });
    });
  }

  if (!hasUnifiedItems && Array.isArray(period.categories)) {
    period.categories.forEach((entry) => {
      const category = asRecord(entry);
      const plannedAmount = category && isPositiveNumber(category.budget)
        ? category.budget
        : category && isPositiveNumber(category.totalAmount)
          ? category.totalAmount
          : null;
      if (!category || typeof category.name !== 'string' || !category.name.trim() || !plannedAmount) return;
      const itemCreatedAt = validDate(category.createdAt, createdAt);
      const paidAmount = sumLegacyMovements(category.movements ?? category.payments);
      items.push({
        id: typeof category.id === 'string' && category.id ? category.id : createId(),
        name: category.name.trim(),
        type: 'variable',
        plannedAmount: roundMoney(plannedAmount),
        paidAmount,
        createdAt: itemCreatedAt,
        updatedAt: itemCreatedAt,
        paidAt: paidAmount > 0 ? itemCreatedAt : undefined,
      });
    });
  }

  const inferredStatus: FinancialPeriodStatus = items.some((item) => item.paidAmount > 0) ? 'open' : 'draft';
  const status = isPeriodStatus(period.status) ? period.status : inferredStatus;

  return {
    id: typeof period.id === 'string' && period.id ? period.id : createId(),
    year: period.year as number,
    month: period.month as number,
    startingAmount: roundMoney(startingAmount),
    currency: isCurrencyCode(period.currency) ? period.currency : DEFAULT_CURRENCY,
    status,
    items,
    createdAt,
    openedAt: status !== 'draft' ? validDate(period.openedAt, createdAt) : undefined,
    closedAt: status === 'closed' ? validDate(period.closedAt, createdAt) : undefined,
  };
};

const migrateFinancialData = (value: unknown): FinancialData | null => {
  const root = asRecord(value);
  if (!root) return null;
  const sourcePeriods = Array.isArray(root.periods) ? root.periods : [];
  const periods = sourcePeriods.map(migrateLegacyPeriod).filter((period): period is FinancialPeriod => Boolean(period));

  if (periods.length === 0 && isPositiveNumber(root.income)) {
    const now = new Date();
    const oldPeriod = migrateLegacyPeriod({
      id: createId(),
      year: now.getFullYear(),
      month: now.getMonth(),
      income: root.income,
      currency: isCurrencyCode(root.currency) ? root.currency : DEFAULT_CURRENCY,
      fixedExpenses: root.fixedExpenses,
      categories: root.categories ?? root.partialExpenses,
      createdAt: now.toISOString(),
    });
    if (oldPeriod) periods.push(oldPeriod);
  }

  if (periods.length === 0) return null;
  return { schemaVersion: FINANCIAL_SCHEMA_VERSION, periods };
};

export const loadFinancialData = async (): Promise<FinancialData | null> => {
  const stored = await AsyncStorage.getItem(FINANCIAL_DATA_KEY);
  return stored ? migrateFinancialData(safeParse(stored)) : null;
};

export const saveFinancialData = async (data: FinancialData): Promise<void> => {
  await AsyncStorage.setItem(FINANCIAL_DATA_KEY, JSON.stringify({ ...data, schemaVersion: FINANCIAL_SCHEMA_VERSION }));
};

import { useEffect, useMemo, useState } from 'react';
import { loadFinancialData, saveFinancialData } from '../services/financialStorage';
import {
  FINANCIAL_SCHEMA_VERSION,
  FinancialData,
  FinancialItem,
  FinancialItemType,
  FinancialMovement,
  FinancialPeriod,
} from '../types/financial';
import { CurrencyCode } from '../types/purchase';
import { roundMoney } from '../utils/financialCalculations';
import { createId } from '../utils/purchase';

const comparePeriods = (a: Pick<FinancialPeriod, 'year' | 'month'>, b: Pick<FinancialPeriod, 'year' | 'month'>) =>
  a.year === b.year ? a.month - b.month : a.year - b.year;

export function useFinancial() {
  const [data, setData] = useState<FinancialData | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [hasSaveError, setHasSaveError] = useState(false);

  useEffect(() => {
    void loadFinancialData()
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setIsReady(true));
  }, []);

  useEffect(() => {
    if (!isReady || !data) return;
    void saveFinancialData(data).then(() => setHasSaveError(false)).catch(() => setHasSaveError(true));
  }, [data, isReady]);

  const periods = useMemo(
    () => (data ? [...data.periods].sort((a, b) => comparePeriods(b, a)) : []),
    [data],
  );

  const periodExists = (year: number, month: number): boolean =>
    Boolean(data?.periods.some((period) => period.year === year && period.month === month));

  const createPeriod = (year: number, month: number, startingAmount: number, currency: CurrencyCode): string | null => {
    if (periodExists(year, month)) return null;
    const now = new Date().toISOString();
    const period: FinancialPeriod = {
      id: createId(),
      year,
      month,
      startingAmount: roundMoney(startingAmount),
      currency,
      status: 'draft',
      items: [],
      createdAt: now,
    };
    setData((current) => ({
      schemaVersion: FINANCIAL_SCHEMA_VERSION,
      periods: [period, ...(current?.periods ?? [])],
    }));
    return period.id;
  };

  const updatePeriod = (periodId: string, updater: (period: FinancialPeriod) => FinancialPeriod) => {
    setData((current) =>
      current
        ? { ...current, periods: current.periods.map((period) => period.id === periodId ? updater(period) : period) }
        : current,
    );
  };

  const updateStartingAmount = (periodId: string, startingAmount: number, currency: CurrencyCode) => {
    updatePeriod(periodId, (period) => ({ ...period, startingAmount: roundMoney(startingAmount), currency }));
  };

  const addItem = (periodId: string, name: string, plannedAmount: number, type: FinancialItemType) => {
    const now = new Date().toISOString();
    const item: FinancialItem = {
      id: createId(),
      name: name.trim(),
      type,
      plannedAmount: roundMoney(plannedAmount),
      paidAmount: 0,
      movements: [],
      createdAt: now,
      updatedAt: now,
    };
    updatePeriod(periodId, (period) => ({ ...period, items: [item, ...period.items] }));
  };

  const updateItem = (periodId: string, itemId: string, name: string, plannedAmount: number, type: FinancialItemType) => {
    updatePeriod(periodId, (period) => ({
      ...period,
      items: period.items.map((item) =>
        item.id === itemId
          ? {
              ...item,
              name: name.trim(),
              plannedAmount: roundMoney(plannedAmount),
              type,
              movements: type === 'variable'
                ? item.type === 'variable'
                  ? item.movements
                  : item.paidAmount > 0
                    ? [{ id: createId(), description: '', amount: item.paidAmount, createdAt: new Date().toISOString() }]
                    : []
                : [],
              updatedAt: new Date().toISOString(),
            }
          : item,
      ),
    }));
  };

  const updatePaidAmount = (periodId: string, itemId: string, paidAmount: number) => {
    updatePeriod(periodId, (period) => ({
      ...period,
      items: period.items.map((item) => {
        if (item.id !== itemId) return item;
        if (item.type === 'variable') return item;
        const nextPaid = roundMoney(paidAmount);
        const now = new Date().toISOString();
        return { ...item, paidAmount: nextPaid, updatedAt: now, paidAt: nextPaid >= item.plannedAmount ? now : undefined };
      }),
    }));
  };

  const addMovement = (periodId: string, itemId: string, description: string, amount: number) => {
    updatePeriod(periodId, (period) => ({
      ...period,
      items: period.items.map((item) => {
        if (item.id !== itemId || item.type !== 'variable') return item;
        const now = new Date().toISOString();
        const movement: FinancialMovement = {
          id: createId(),
          description: description.trim(),
          amount: roundMoney(amount),
          createdAt: now,
        };
        const movements = [movement, ...item.movements];
        const paidAmount = roundMoney(movements.reduce((total, entry) => total + entry.amount, 0));
        return { ...item, movements, paidAmount, updatedAt: now, paidAt: paidAmount >= item.plannedAmount ? now : undefined };
      }),
    }));
  };

  const deleteMovement = (periodId: string, itemId: string, movementId: string) => {
    updatePeriod(periodId, (period) => ({
      ...period,
      items: period.items.map((item) => {
        if (item.id !== itemId || item.type !== 'variable') return item;
        const movements = item.movements.filter((movement) => movement.id !== movementId);
        const paidAmount = roundMoney(movements.reduce((total, entry) => total + entry.amount, 0));
        return {
          ...item,
          movements,
          paidAmount,
          updatedAt: new Date().toISOString(),
          paidAt: paidAmount >= item.plannedAmount ? item.paidAt ?? new Date().toISOString() : undefined,
        };
      }),
    }));
  };

  const markItemPaid = (periodId: string, itemId: string) => {
    const period = data?.periods.find((entry) => entry.id === periodId);
    const item = period?.items.find((entry) => entry.id === itemId);
    if (item) updatePaidAmount(periodId, itemId, item.plannedAmount);
  };

  const deleteItem = (periodId: string, itemId: string) => {
    updatePeriod(periodId, (period) => ({ ...period, items: period.items.filter((item) => item.id !== itemId) }));
  };

  const startPeriod = (periodId: string) => {
    updatePeriod(periodId, (period) =>
      period.status === 'draft' ? { ...period, status: 'open', openedAt: new Date().toISOString() } : period,
    );
  };

  const closePeriod = (periodId: string) => {
    updatePeriod(periodId, (period) =>
      period.status === 'open' ? { ...period, status: 'closed', closedAt: new Date().toISOString() } : period,
    );
  };

  const deletePeriod = (periodId: string) => {
    setData((current) => current ? { ...current, periods: current.periods.filter((period) => period.id !== periodId) } : current);
  };

  return {
    periods,
    isReady,
    hasSaveError,
    periodExists,
    createPeriod,
    updateStartingAmount,
    addItem,
    updateItem,
    updatePaidAmount,
    addMovement,
    deleteMovement,
    markItemPaid,
    deleteItem,
    startPeriod,
    closePeriod,
    deletePeriod,
  };
}

import { CurrencyCode } from './purchase';

export const FINANCIAL_SCHEMA_VERSION = 4;

export type FinancialItemType = 'fixed' | 'variable';
export type FinancialItemStatus = 'pending' | 'partial' | 'paid' | 'exceeded';
export type FinancialPeriodStatus = 'draft' | 'open' | 'closed';

export interface FinancialMovement {
  id: string;
  description: string;
  amount: number;
  createdAt: string;
}

export interface FinancialItem {
  id: string;
  name: string;
  type: FinancialItemType;
  plannedAmount: number;
  paidAmount: number;
  movements: FinancialMovement[];
  createdAt: string;
  updatedAt: string;
  paidAt?: string;
}

export interface FinancialItemDraft {
  id: string;
  name: string;
  type: FinancialItemType;
  plannedAmount: number;
}

export interface FinancialPeriod {
  id: string;
  year: number;
  month: number;
  startingAmount: number;
  currency: CurrencyCode;
  status: FinancialPeriodStatus;
  items: FinancialItem[];
  createdAt: string;
  openedAt?: string;
  closedAt?: string;
}

export interface FinancialData {
  schemaVersion: number;
  periods: FinancialPeriod[];
}

export interface FinancialItemTotals {
  remaining: number;
  exceeded: number;
  percentage: number;
  status: FinancialItemStatus;
}

export interface FinancialSummaryTotals {
  totalPlanned: number;
  totalPaid: number;
  totalPending: number;
  totalExceeded: number;
  estimatedBalance: number;
  availableUnallocated: number;
}

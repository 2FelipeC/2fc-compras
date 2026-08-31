export const SUPPORTED_CURRENCIES = ['EUR', 'COP', 'USD', 'MXN', 'GBP'] as const;

export type CurrencyCode = (typeof SUPPORTED_CURRENCIES)[number];

export const DEFAULT_CURRENCY: CurrencyCode = 'EUR';

export const isCurrencyCode = (value: unknown): value is CurrencyCode =>
  typeof value === 'string' && SUPPORTED_CURRENCIES.includes(value as CurrencyCode);

export interface Product {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface ActivePurchase {
  id: string;
  budget: number;
  currency: CurrencyCode;
  products: Product[];
  totalSpent: number;
  startedAt: string;
}

export interface CompletedPurchase extends ActivePurchase {
  endedAt: string;
}

export type Screen = 'home' | 'start' | 'active' | 'detail';

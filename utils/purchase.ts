import { ActivePurchase, Product } from '../types/purchase';

export type BudgetStatus = 'positive' | 'warning' | 'danger';

export const parseNumber = (value: string): number => Number(value.replace(',', '.'));

export const createId = (): string => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

export const calculateTotalSpent = (products: Product[]): number =>
  Math.round(products.reduce((total, product) => total + product.price * product.quantity, 0) * 100) / 100;

export const getPurchaseBalance = (purchase: Pick<ActivePurchase, 'budget' | 'totalSpent'>): number =>
  Math.round((purchase.budget - purchase.totalSpent) * 100) / 100;

export const getBudgetProgress = (purchase: Pick<ActivePurchase, 'budget' | 'totalSpent'>): number =>
  purchase.budget > 0 ? Math.min(purchase.totalSpent / purchase.budget, 1) : 0;

export const getBudgetPercentage = (purchase: Pick<ActivePurchase, 'budget' | 'totalSpent'>): number =>
  purchase.budget > 0 ? Math.round((purchase.totalSpent / purchase.budget) * 100) : 0;

export const getBudgetStatus = (purchase: Pick<ActivePurchase, 'budget' | 'totalSpent'>): BudgetStatus => {
  const percentage = getBudgetPercentage(purchase);

  if (percentage >= 100) {
    return 'danger';
  }

  if (percentage >= 85) {
    return 'warning';
  }

  return 'positive';
};

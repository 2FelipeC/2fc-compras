import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivePurchase, CompletedPurchase, DEFAULT_CURRENCY, isCurrencyCode, Product } from '../types/purchase';
import { calculateTotalSpent } from '../utils/purchase';

export const ACTIVE_PURCHASE_KEY = '2fc-compras:active-purchase';
export const PURCHASE_HISTORY_KEY = '2fc-compras:purchase-history';

interface StoredData {
  activePurchase: ActivePurchase | null;
  purchaseHistory: CompletedPurchase[];
}

const safeParse = (value: string): unknown | null => {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const isProduct = (value: unknown): value is Product => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const product = value as Product;

  return (
    typeof product.id === 'string' &&
    typeof product.name === 'string' &&
    product.name.trim().length > 0 &&
    Number.isFinite(product.price) &&
    product.price > 0 &&
    Number.isInteger(product.quantity) &&
    product.quantity >= 1
  );
};

const isActivePurchase = (value: unknown): value is ActivePurchase => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const purchase = value as ActivePurchase;

  return (
    typeof purchase.id === 'string' &&
    Number.isFinite(purchase.budget) &&
    purchase.budget > 0 &&
    Array.isArray(purchase.products) &&
    purchase.products.every(isProduct) &&
    Number.isFinite(purchase.totalSpent) &&
    typeof purchase.startedAt === 'string' &&
    (purchase.currency === undefined || isCurrencyCode(purchase.currency))
  );
};

const isCompletedPurchase = (value: unknown): value is CompletedPurchase =>
  isActivePurchase(value) && typeof (value as CompletedPurchase).endedAt === 'string';

const normalizeActivePurchase = (purchase: ActivePurchase): ActivePurchase => ({
  ...purchase,
  currency: isCurrencyCode(purchase.currency) ? purchase.currency : DEFAULT_CURRENCY,
  totalSpent: calculateTotalSpent(purchase.products),
});

export const loadStoredData = async (): Promise<StoredData> => {
  const [storedActivePurchase, storedPurchaseHistory] = await Promise.all([
    AsyncStorage.getItem(ACTIVE_PURCHASE_KEY),
    AsyncStorage.getItem(PURCHASE_HISTORY_KEY),
  ]);

  let activePurchase: ActivePurchase | null = null;
  let purchaseHistory: CompletedPurchase[] = [];

  if (storedActivePurchase) {
    const parsedActivePurchase = safeParse(storedActivePurchase);

    if (isActivePurchase(parsedActivePurchase)) {
      activePurchase = normalizeActivePurchase(parsedActivePurchase);
    }
  }

  if (storedPurchaseHistory) {
    const parsedPurchaseHistory = safeParse(storedPurchaseHistory);

    if (Array.isArray(parsedPurchaseHistory)) {
      purchaseHistory = parsedPurchaseHistory.filter(isCompletedPurchase).map((purchase) => ({
        ...normalizeActivePurchase(purchase),
        endedAt: purchase.endedAt,
      }));
    }
  }

  return {
    activePurchase,
    purchaseHistory,
  };
};

export const saveActivePurchase = async (purchase: ActivePurchase | null): Promise<void> => {
  if (purchase) {
    await AsyncStorage.setItem(ACTIVE_PURCHASE_KEY, JSON.stringify(purchase));
    return;
  }

  await AsyncStorage.removeItem(ACTIVE_PURCHASE_KEY);
};

export const savePurchaseHistory = async (purchaseHistory: CompletedPurchase[]): Promise<void> => {
  await AsyncStorage.setItem(PURCHASE_HISTORY_KEY, JSON.stringify(purchaseHistory));
};

export interface Product {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface ActivePurchase {
  id: string;
  budget: number;
  products: Product[];
  totalSpent: number;
  startedAt: string;
}

export interface CompletedPurchase extends ActivePurchase {
  endedAt: string;
}

export type Screen = 'home' | 'start' | 'active' | 'detail';

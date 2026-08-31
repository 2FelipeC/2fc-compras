import { FinancialItem, FinancialItemType } from '../types/financial';
import { createId } from './purchase';

interface DefaultFinancialItem {
  name: string;
  plannedAmount: number;
  type: FinancialItemType;
}

const defaultFinancialItems: DefaultFinancialItem[] = [
  { name: 'Préstamo', plannedAmount: 300, type: 'fixed' },
  { name: 'Alquiler', plannedAmount: 200, type: 'fixed' },
  { name: 'Supermercado', plannedAmount: 220, type: 'variable' },
  { name: 'Gimnasio', plannedAmount: 30, type: 'fixed' },
  { name: 'O2', plannedAmount: 15, type: 'fixed' },
  { name: 'Apple + Google', plannedAmount: 4, type: 'fixed' },
  { name: 'eDreams', plannedAmount: 5, type: 'fixed' },
  { name: 'Spotify', plannedAmount: 12, type: 'fixed' },
  { name: 'ChatGPT', plannedAmount: 22, type: 'fixed' },
  { name: 'Peluquería', plannedAmount: 50, type: 'variable' },
  { name: 'Gasolina', plannedAmount: 50, type: 'variable' },
  { name: 'Remitly', plannedAmount: 60, type: 'fixed' },
  { name: 'Ahorro', plannedAmount: 50, type: 'variable' },
  { name: 'Imprevistos', plannedAmount: 50, type: 'variable' },
  { name: 'Ocio', plannedAmount: 30, type: 'variable' },
];

export const createDefaultFinancialItems = (createdAt: string): FinancialItem[] =>
  defaultFinancialItems.map((item) => ({
    id: createId(),
    ...item,
    paidAmount: 0,
    createdAt,
    updatedAt: createdAt,
  }));

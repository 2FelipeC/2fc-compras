import { Language } from '../i18n/translations';
import { CurrencyCode, DEFAULT_CURRENCY } from '../types/purchase';

export const getLocaleForLanguage = (language: Language): string => (language === 'en' ? 'en-US' : 'es-ES');

export const formatCurrency = (
  value: number,
  currency: CurrencyCode = DEFAULT_CURRENCY,
  language: Language = 'es',
): string =>
  new Intl.NumberFormat(getLocaleForLanguage(language), {
    style: 'currency',
    currency,
  }).format(value);

export const formatDateTime = (value: string, language: Language = 'es'): string =>
  new Intl.DateTimeFormat(getLocaleForLanguage(language), {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));

export const formatMonthYear = (year: number, month: number, language: Language = 'es'): string =>
  capitalizeFirst(new Intl.DateTimeFormat(getLocaleForLanguage(language), {
    month: 'long',
    year: 'numeric',
  }).format(new Date(year, month, 1)));

export const formatMonthName = (month: number, language: Language = 'es'): string =>
  capitalizeFirst(new Intl.DateTimeFormat(getLocaleForLanguage(language), {
    month: 'long',
  }).format(new Date(2020, month, 1)));

const capitalizeFirst = (value: string): string =>
  value.length > 0 ? `${value.charAt(0).toLocaleUpperCase()}${value.slice(1)}` : value;

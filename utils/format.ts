export const formatCurrency = (value: number): string =>
  new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
  }).format(value);

export const formatDateTime = (value: string): string =>
  new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));

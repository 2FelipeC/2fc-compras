import { StyleSheet, Text, View } from 'react-native';
import { useLanguage } from '../../context/LanguageContext';
import { useAppTheme } from '../../context/ThemeContext';
import { AppTheme, radius, spacing, typography } from '../../styles/theme';
import { FinancialSummaryTotals } from '../../types/financial';
import { CurrencyCode } from '../../types/purchase';
import { formatCurrency } from '../../utils/format';

interface Props {
  startingAmount: number;
  currency: CurrencyCode;
  totals: FinancialSummaryTotals;
}

export function FinancialSummary({ startingAmount, currency, totals }: Props) {
  const { theme } = useAppTheme();
  const { language, t } = useLanguage();
  const styles = createStyles(theme);
  const rows = [
    [t.financial.startingAmount, startingAmount],
    [t.financial.budgeted, totals.totalPlanned],
    [t.financial.actualSpent, totals.totalPaid],
    [t.financial.remaining, totals.totalPending],
    [t.financial.estimatedBalance, totals.estimatedBalance],
    [t.financial.availableUnallocated, totals.availableUnallocated],
  ] as const;

  return (
    <View style={styles.card}>
      {rows.map(([label, value], index) => (
        <View key={label} style={[styles.row, index > 0 && styles.divider]}>
          <Text style={styles.label}>{label}</Text>
          <Text style={[styles.value, value < 0 && styles.danger]}>{formatCurrency(value, currency, language)}</Text>
        </View>
      ))}
    </View>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    card: {
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: radius.lg,
      backgroundColor: theme.colors.surface,
    },
    row: {
      minHeight: 52,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.md,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
    },
    divider: { borderTopWidth: 1, borderTopColor: theme.colors.border },
    label: { flex: 1, color: theme.colors.textSecondary, fontSize: typography.small, fontWeight: '700' },
    value: { color: theme.colors.textPrimary, fontSize: typography.body, fontWeight: '900', textAlign: 'right' },
    danger: { color: theme.colors.danger },
  });

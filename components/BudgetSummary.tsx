import { StyleSheet, Text, View } from 'react-native';
import { useLanguage } from '../context/LanguageContext';
import { useAppTheme } from '../context/ThemeContext';
import { AppTheme, radius, spacing, typography } from '../styles/theme';
import { ActivePurchase } from '../types/purchase';
import { formatCurrency } from '../utils/format';
import { getBudgetPercentage, getBudgetProgress, getBudgetStatus, getPurchaseBalance } from '../utils/purchase';

interface BudgetSummaryProps {
  purchase: Pick<ActivePurchase, 'budget' | 'totalSpent'>;
  compact?: boolean;
}

export function BudgetSummary({ purchase, compact = false }: BudgetSummaryProps) {
  const { theme } = useAppTheme();
  const { t } = useLanguage();
  const styles = createStyles(theme);
  const balance = getPurchaseBalance(purchase);
  const progress = getBudgetProgress(purchase);
  const percentage = getBudgetPercentage(purchase);
  const status = getBudgetStatus(purchase);
  const isOverBudget = balance < 0;
  const progressColor =
    status === 'danger' ? theme.colors.danger : status === 'warning' ? theme.colors.warning : theme.colors.primary;

  return (
    <View style={[styles.card, isOverBudget && styles.alertCard, compact && styles.compactCard]}>
      <View style={styles.summaryRow}>
        <View style={styles.stat}>
          <Text style={styles.label}>{t.summary.budget}</Text>
          <Text style={styles.value}>{formatCurrency(purchase.budget)}</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.label}>{t.summary.spent}</Text>
          <Text style={styles.value}>{formatCurrency(purchase.totalSpent)}</Text>
        </View>
      </View>

      <View style={styles.availableBlock}>
        <Text style={styles.label}>{isOverBudget ? t.summary.exceeded : t.summary.available}</Text>
        <Text style={[styles.availableValue, isOverBudget ? styles.negativeValue : styles.positiveValue]}>
          {formatCurrency(Math.abs(balance))}
        </Text>
      </View>

      <View style={styles.progressHeader}>
        <Text style={styles.progressLabel}>{t.summary.budgetUsed}</Text>
        <Text style={[styles.progressPercent, status === 'danger' && styles.negativeText]}>{percentage}%</Text>
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress * 100}%`, backgroundColor: progressColor }]} />
      </View>

      {isOverBudget ? (
        <View style={styles.overBudgetBox}>
          <Text style={styles.overBudgetTitle}>{t.summary.overBudgetTitle}</Text>
          <Text style={styles.overBudgetText}>
            {t.summary.overBudgetText.replace('{{amount}}', formatCurrency(Math.abs(balance)))}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    card: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: radius.xl,
      backgroundColor: theme.colors.surface,
      padding: spacing.lg,
    },
    compactCard: {
      padding: spacing.md,
    },
    alertCard: {
      borderColor: theme.colors.danger,
      backgroundColor: theme.colors.surfaceSecondary,
    },
    summaryRow: {
      flexDirection: 'row',
      gap: spacing.md,
    },
    stat: {
      flex: 1,
      gap: spacing.xs,
    },
    label: {
      color: theme.colors.textSecondary,
      fontSize: typography.small,
      fontWeight: '700',
    },
    value: {
      color: theme.colors.textPrimary,
      fontSize: 18,
      fontWeight: '800',
    },
    availableBlock: {
      marginTop: spacing.lg,
      gap: spacing.xs,
    },
    availableValue: {
      fontSize: 30,
      fontWeight: '900',
    },
    positiveValue: {
      color: theme.colors.success,
    },
    negativeValue: {
      color: theme.colors.primaryDark,
    },
    progressHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: spacing.lg,
      marginBottom: spacing.sm,
    },
    progressLabel: {
      color: theme.colors.textSecondary,
      fontSize: typography.small,
      fontWeight: '700',
    },
    progressPercent: {
      color: theme.colors.textPrimary,
      fontSize: typography.small,
      fontWeight: '800',
    },
    progressTrack: {
      height: 8,
      overflow: 'hidden',
      borderRadius: radius.pill,
      backgroundColor: theme.colors.progressTrack,
    },
    progressFill: {
      height: '100%',
      borderRadius: radius.pill,
    },
    overBudgetBox: {
      marginTop: spacing.md,
      borderRadius: radius.md,
      backgroundColor: theme.colors.surface,
      padding: spacing.md,
    },
    overBudgetTitle: {
      color: theme.colors.primaryDark,
      fontSize: typography.body,
      fontWeight: '900',
    },
    overBudgetText: {
      marginTop: spacing.xs,
      color: theme.colors.primaryDark,
      fontSize: typography.small,
      fontWeight: '700',
    },
    negativeText: {
      color: theme.colors.primaryDark,
    },
  });

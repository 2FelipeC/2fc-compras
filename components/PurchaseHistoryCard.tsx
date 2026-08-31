import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useLanguage } from '../context/LanguageContext';
import { useAppTheme } from '../context/ThemeContext';
import { AppTheme, radius, spacing, typography } from '../styles/theme';
import { CompletedPurchase } from '../types/purchase';
import { formatCurrency, formatDateTime } from '../utils/format';
import { getPurchaseBalance } from '../utils/purchase';

interface PurchaseHistoryCardProps {
  purchase: CompletedPurchase;
  onOpen: () => void;
  onDelete: () => void;
}

export function PurchaseHistoryCard({ purchase, onOpen, onDelete }: PurchaseHistoryCardProps) {
  const { theme } = useAppTheme();
  const { language, t } = useLanguage();
  const styles = createStyles(theme);
  const balance = getPurchaseBalance(purchase);
  const hasOverspent = balance < 0;

  return (
    <View style={styles.card}>
      <Pressable style={styles.openArea} onPress={onOpen}>
        <View style={styles.headerRow}>
          <Text style={styles.date}>{formatDateTime(purchase.endedAt, language)}</Text>
          <Text style={styles.products}>
            {t.history.products.replace('{{count}}', String(purchase.products.length))}
          </Text>
        </View>
        <View style={styles.grid}>
          <Text style={styles.meta}>
            {t.history.budget} {formatCurrency(purchase.budget, purchase.currency, language)}
          </Text>
          <Text style={styles.meta}>
            {t.history.spent} {formatCurrency(purchase.totalSpent, purchase.currency, language)}
          </Text>
          <Text style={[styles.meta, hasOverspent ? styles.negative : styles.positive]}>
            {hasOverspent ? t.history.exceeded : t.history.remaining}{' '}
            {formatCurrency(Math.abs(balance), purchase.currency, language)}
          </Text>
        </View>
      </Pressable>

      <Pressable style={styles.deleteArea} onPress={onDelete} hitSlop={8}>
        <Ionicons name="trash-outline" size={20} color={theme.colors.primaryDark} />
      </Pressable>
    </View>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    card: {
      flexDirection: 'row',
      alignItems: 'stretch',
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: radius.lg,
      backgroundColor: theme.colors.surface,
    },
    openArea: {
      flex: 1,
      padding: spacing.md,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
      marginBottom: spacing.sm,
    },
    date: {
      flex: 1,
      color: theme.colors.textPrimary,
      fontSize: typography.body,
      fontWeight: '900',
    },
    products: {
      color: theme.colors.textSecondary,
      fontSize: typography.small,
      fontWeight: '700',
    },
    grid: {
      gap: spacing.xs,
    },
    meta: {
      color: theme.colors.textSecondary,
      fontSize: typography.small,
      fontWeight: '700',
    },
    positive: {
      color: theme.colors.success,
    },
    negative: {
      color: theme.colors.primaryDark,
    },
    deleteArea: {
      width: 50,
      alignItems: 'center',
      justifyContent: 'center',
      borderLeftWidth: 1,
      borderLeftColor: theme.colors.border,
      backgroundColor: theme.colors.surfaceSecondary,
    },
  });

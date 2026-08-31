import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useLanguage } from '../context/LanguageContext';
import { useAppTheme } from '../context/ThemeContext';
import { AppTheme, radius, spacing, typography } from '../styles/theme';
import { CurrencyCode, Product } from '../types/purchase';
import { formatCurrency } from '../utils/format';

interface ProductItemProps {
  product: Product;
  currency: CurrencyCode;
  onDelete?: () => void;
}

export function ProductItem({ product, currency, onDelete }: ProductItemProps) {
  const { theme } = useAppTheme();
  const { language } = useLanguage();
  const styles = createStyles(theme);
  const productTotal = product.price * product.quantity;

  return (
    <View style={styles.row}>
      <View style={styles.copy}>
        <Text style={styles.name}>{product.name}</Text>
        <Text style={styles.meta}>
          {product.quantity} x {formatCurrency(product.price, currency, language)}
        </Text>
      </View>
      <Text style={styles.total}>{formatCurrency(productTotal, currency, language)}</Text>
      {onDelete ? (
        <Pressable style={styles.deleteButton} onPress={onDelete} hitSlop={10}>
          <Ionicons name="trash-outline" size={19} color={theme.colors.primaryDark} />
        </Pressable>
      ) : null}
    </View>
  );
}

const createStyles = (theme: AppTheme) =>
StyleSheet.create({
  row: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    paddingVertical: spacing.md,
  },
  copy: {
    flex: 1,
    gap: spacing.xs,
  },
  name: {
    color: theme.colors.textPrimary,
    fontSize: typography.body,
    fontWeight: '800',
  },
  meta: {
    color: theme.colors.textSecondary,
    fontSize: typography.small,
    fontWeight: '600',
  },
  total: {
    color: theme.colors.textPrimary,
    fontSize: typography.body,
    fontWeight: '900',
  },
  deleteButton: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    backgroundColor: theme.colors.surfaceSecondary,
  },
});

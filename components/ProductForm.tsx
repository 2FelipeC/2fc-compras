import { StyleSheet, Text, TextInput, View } from 'react-native';
import { useLanguage } from '../context/LanguageContext';
import { useAppTheme } from '../context/ThemeContext';
import { AppTheme, radius, spacing, typography } from '../styles/theme';
import { PrimaryButton } from './PrimaryButton';

interface ProductFormProps {
  productName: string;
  productPrice: string;
  productQuantity: string;
  onChangeProductName: (value: string) => void;
  onChangeProductPrice: (value: string) => void;
  onChangeProductQuantity: (value: string) => void;
  onSubmit: () => void;
}

export function ProductForm({
  productName,
  productPrice,
  productQuantity,
  onChangeProductName,
  onChangeProductPrice,
  onChangeProductQuantity,
  onSubmit,
}: ProductFormProps) {
  const { theme } = useAppTheme();
  const { t } = useLanguage();
  const styles = createStyles(theme);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{t.productForm.title}</Text>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>{t.productForm.product}</Text>
        <TextInput
          value={productName}
          onChangeText={onChangeProductName}
          placeholder={t.productForm.productPlaceholder}
          placeholderTextColor={theme.colors.textSecondary}
          returnKeyType="next"
          style={styles.input}
        />
      </View>

      <View style={styles.row}>
        <View style={styles.column}>
          <Text style={styles.label}>{t.productForm.price}</Text>
          <TextInput
            value={productPrice}
            onChangeText={onChangeProductPrice}
            placeholder={t.productForm.pricePlaceholder}
            placeholderTextColor={theme.colors.textSecondary}
            keyboardType="decimal-pad"
            style={styles.input}
          />
        </View>

        <View style={styles.column}>
          <Text style={styles.label}>{t.productForm.quantity}</Text>
          <TextInput
            value={productQuantity}
            onChangeText={onChangeProductQuantity}
            placeholder={t.productForm.quantityPlaceholder}
            placeholderTextColor={theme.colors.textSecondary}
            keyboardType="number-pad"
            style={styles.input}
          />
        </View>
      </View>

      <PrimaryButton label={t.productForm.addProduct} iconName="add" onPress={onSubmit} />
    </View>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    card: {
      gap: spacing.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: radius.xl,
      backgroundColor: theme.colors.surface,
      padding: spacing.lg,
    },
    title: {
      color: theme.colors.textPrimary,
      fontSize: typography.section,
      fontWeight: '900',
    },
    fieldGroup: {
      gap: spacing.sm,
    },
    row: {
      flexDirection: 'row',
      gap: spacing.md,
    },
    column: {
      flex: 1,
      gap: spacing.sm,
    },
    label: {
      color: theme.colors.textPrimary,
      fontSize: typography.small,
      fontWeight: '800',
    },
    input: {
      minHeight: 48,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: radius.md,
      backgroundColor: theme.colors.inputBackground,
      paddingHorizontal: spacing.md,
      color: theme.colors.textPrimary,
      fontSize: typography.body,
    },
  });

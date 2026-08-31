import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { PrimaryButton } from '../../components/PrimaryButton';
import { useLanguage } from '../../context/LanguageContext';
import { useAppTheme } from '../../context/ThemeContext';
import { AppTheme, layout, radius, spacing, typography } from '../../styles/theme';
import { CurrencyCode, SUPPORTED_CURRENCIES } from '../../types/purchase';
import { formatMonthName } from '../../utils/format';

interface Props {
  month: number;
  yearInput: string;
  amountInput: string;
  currency: CurrencyCode;
  onChangeMonth: (month: number) => void;
  onChangeYear: (year: string) => void;
  onChangeAmount: (amount: string) => void;
  onChangeCurrency: (currency: CurrencyCode) => void;
  onSubmit: () => void;
  onBack: () => void;
  errorMessage?: string;
}

export function FinancialCreatePeriodScreen(props: Props) {
  const { theme } = useAppTheme();
  const { language, t } = useLanguage();
  const styles = createStyles(theme);
  return (
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
      <PrimaryButton label={t.common.back} iconName="chevron-back" variant="ghost" onPress={props.onBack} />
      <View style={styles.card}>
        <Text style={styles.title}>{t.financial.addMonth}</Text>
        {props.errorMessage ? <Text style={styles.error}>{props.errorMessage}</Text> : null}
        <Text style={styles.label}>{t.financial.month}</Text>
        <View style={styles.monthGrid}>{Array.from({ length: 12 }, (_, month) => <Pressable key={month} style={[styles.option, props.month === month && styles.optionActive]} onPress={() => props.onChangeMonth(month)}><Text style={[styles.optionText, props.month === month && styles.optionTextActive]}>{formatMonthName(month, language)}</Text></Pressable>)}</View>
        <Text style={styles.label}>{t.financial.year}</Text>
        <TextInput value={props.yearInput} onChangeText={props.onChangeYear} keyboardType="number-pad" maxLength={4} style={styles.input} placeholder="2026" placeholderTextColor={theme.colors.textSecondary} />
        <Text style={styles.label}>{t.financial.startingAmount}</Text>
        <TextInput value={props.amountInput} onChangeText={props.onChangeAmount} keyboardType="decimal-pad" style={styles.input} placeholder="0,00" placeholderTextColor={theme.colors.textSecondary} />
        <Text style={styles.label}>{t.financial.currencyLabel}</Text>
        <View style={styles.row}>{SUPPORTED_CURRENCIES.map((value) => <Pressable key={value} style={[styles.option, props.currency === value && styles.optionActive]} onPress={() => props.onChangeCurrency(value)}><Text style={[styles.optionText, props.currency === value && styles.optionTextActive]}>{value}</Text></Pressable>)}</View>
        <PrimaryButton label={t.financial.createMonth} iconName="calendar-outline" onPress={props.onSubmit} />
      </View>
    </ScrollView>
  );
}

const createStyles = (theme: AppTheme) => StyleSheet.create({
  content: { width: '100%', maxWidth: layout.maxContentWidth, alignSelf: 'center', padding: layout.horizontalPadding, paddingBottom: spacing.xxxl },
  card: { gap: spacing.lg, marginTop: spacing.xl, borderWidth: 1, borderColor: theme.colors.border, borderRadius: radius.xl, backgroundColor: theme.colors.surface, padding: spacing.xl },
  title: { color: theme.colors.textPrimary, fontSize: 28, fontWeight: '900' },
  label: { color: theme.colors.textPrimary, fontSize: typography.small, fontWeight: '800' },
  input: { minHeight: 52, borderWidth: 1, borderColor: theme.colors.border, borderRadius: radius.md, backgroundColor: theme.colors.inputBackground, paddingHorizontal: spacing.md, color: theme.colors.textPrimary, fontSize: typography.body, fontWeight: '700' },
  monthGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  option: { minHeight: 40, minWidth: 68, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.colors.border, borderRadius: radius.md, paddingHorizontal: spacing.sm },
  optionActive: { borderColor: theme.colors.primary, backgroundColor: theme.colors.primarySoft },
  optionText: { color: theme.colors.textSecondary, fontSize: typography.small, fontWeight: '800' },
  optionTextActive: { color: theme.colors.primaryDark },
  error: { color: theme.colors.danger, fontSize: typography.small, fontWeight: '800', lineHeight: 19 },
});

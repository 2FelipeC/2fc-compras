import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { useLanguage } from '../../context/LanguageContext';
import { useAppTheme } from '../../context/ThemeContext';
import { useFinancial } from '../../hooks/useFinancial';
import { AppTheme, spacing, typography } from '../../styles/theme';
import { CurrencyCode, DEFAULT_CURRENCY } from '../../types/purchase';
import { getFinancialSummary } from '../../utils/financialCalculations';
import { parseNumber } from '../../utils/purchase';
import { FinancialCreatePeriodScreen } from './FinancialCreatePeriodScreen';
import { FinancialDashboardScreen } from './FinancialDashboardScreen';
import { FinancialPeriodsScreen } from './FinancialPeriodsScreen';

interface Props {
  onBackToMenu: () => void;
}

type ViewName = 'list' | 'create' | 'detail';

export function FinancialModule({ onBackToMenu }: Props) {
  const { theme, isDark } = useAppTheme();
  const { t } = useLanguage();
  const styles = createStyles(theme);
  const financial = useFinancial();
  const now = new Date();
  const [view, setView] = useState<ViewName>('list');
  const [selectedPeriodId, setSelectedPeriodId] = useState<string | null>(null);
  const [month, setMonth] = useState(now.getMonth());
  const [yearInput, setYearInput] = useState(String(now.getFullYear()));
  const [amountInput, setAmountInput] = useState('');
  const [currency, setCurrency] = useState<CurrencyCode>(DEFAULT_CURRENCY);
  const [createError, setCreateError] = useState('');

  useEffect(() => {
    if (financial.hasSaveError) Alert.alert(t.financial.saveErrorTitle, t.financial.saveErrorMessage);
  }, [financial.hasSaveError, t.financial.saveErrorMessage, t.financial.saveErrorTitle]);

  const selectedPeriod = financial.periods.find((period) => period.id === selectedPeriodId) ?? null;
  const openCreate = () => {
    const date = new Date();
    setMonth(date.getMonth());
    setYearInput(String(date.getFullYear()));
    setAmountInput('');
    setCurrency(DEFAULT_CURRENCY);
    setCreateError('');
    setView('create');
  };
  const createMonth = () => {
    const year = Number(yearInput);
    const amount = parseNumber(amountInput);
    if (!Number.isInteger(year) || year < 1900 || year > 9999) {
      setCreateError(t.financial.invalidYearMessage);
      Alert.alert(t.financial.invalidYearTitle, t.financial.invalidYearMessage);
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      setCreateError(t.financial.invalidIncomeMessage);
      Alert.alert(t.financial.invalidIncomeTitle, t.financial.invalidIncomeMessage);
      return;
    }
    if (financial.periodExists(year, month)) {
      setCreateError(t.financial.duplicateMonthMessage);
      Alert.alert(t.financial.duplicateMonthTitle, t.financial.duplicateMonthMessage);
      return;
    }
    const id = financial.createPeriod(year, month, amount, currency);
    if (id) {
      setCreateError('');
      setSelectedPeriodId(id);
      setView('detail');
    }
  };

  let content;
  if (!financial.isReady) {
    content = <View style={styles.loading}><Text style={styles.loadingText}>{t.common.loading}</Text></View>;
  } else if (view === 'create') {
    content = (
      <FinancialCreatePeriodScreen
        month={month}
        yearInput={yearInput}
        amountInput={amountInput}
        currency={currency}
        onChangeMonth={(value) => { setMonth(value); setCreateError(''); }}
        onChangeYear={(value) => { setYearInput(value); setCreateError(''); }}
        onChangeAmount={(value) => { setAmountInput(value); setCreateError(''); }}
        onChangeCurrency={(value) => { setCurrency(value); setCreateError(''); }}
        onSubmit={createMonth}
        onBack={() => setView('list')}
        errorMessage={createError}
      />
    );
  } else if (view === 'detail' && selectedPeriod) {
    const periodId = selectedPeriod.id;
    content = (
      <FinancialDashboardScreen
        period={selectedPeriod}
        totals={getFinancialSummary(selectedPeriod)}
        onBack={() => setView('list')}
        onUpdateSettings={(amount, nextCurrency) => financial.updateStartingAmount(periodId, amount, nextCurrency)}
        onAddItem={(name, amount, type) => financial.addItem(periodId, name, amount, type)}
        onUpdateItem={(itemId, name, amount, type) => financial.updateItem(periodId, itemId, name, amount, type)}
        onUpdatePaid={(itemId, amount) => financial.updatePaidAmount(periodId, itemId, amount)}
        onAddMovement={(itemId, description, amount) => financial.addMovement(periodId, itemId, description, amount)}
        onDeleteMovement={(itemId, movementId) => financial.deleteMovement(periodId, itemId, movementId)}
        onMarkPaid={(itemId) => financial.markItemPaid(periodId, itemId)}
        onDeleteItem={(itemId) => financial.deleteItem(periodId, itemId)}
        onStartPeriod={() => financial.startPeriod(periodId)}
        onClosePeriod={() => financial.closePeriod(periodId)}
        onDeletePeriod={() => {
          financial.deletePeriod(periodId);
          setSelectedPeriodId(null);
          setView('list');
        }}
      />
    );
  } else {
    content = (
      <FinancialPeriodsScreen
        periods={financial.periods}
        onBack={onBackToMenu}
        onAddMonth={openCreate}
        onOpenPeriod={(id) => {
          setSelectedPeriodId(id);
          setView('detail');
        }}
        onDeletePeriod={financial.deletePeriod}
      />
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style={isDark ? 'light' : 'dark'} backgroundColor={theme.colors.background} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={12} style={styles.keyboard}>
        {content}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (theme: AppTheme) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.colors.background },
  keyboard: { flex: 1 },
  loading: { flex: 1, justifyContent: 'center', padding: spacing.xl },
  loadingText: { color: theme.colors.textPrimary, fontSize: typography.section, fontWeight: '900', textAlign: 'center' },
});

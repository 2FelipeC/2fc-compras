import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { PrimaryButton } from '../../components/PrimaryButton';
import { useLanguage } from '../../context/LanguageContext';
import { useAppTheme } from '../../context/ThemeContext';
import { AppTheme, layout, radius, spacing, typography } from '../../styles/theme';
import { FinancialPeriod, FinancialPeriodStatus } from '../../types/financial';
import { formatCurrency, formatMonthYear } from '../../utils/format';
import { getFinancialSummary } from '../../utils/financialCalculations';

interface Props {
  periods: FinancialPeriod[];
  onBack: () => void;
  onAddMonth: () => void;
  onOpenPeriod: (id: string) => void;
  onDeletePeriod: (id: string) => void;
}

export function FinancialPeriodsScreen({ periods, onBack, onAddMonth, onOpenPeriod, onDeletePeriod }: Props) {
  const { theme } = useAppTheme();
  const { language, t } = useLanguage();
  const styles = createStyles(theme);
  const [periodToDelete, setPeriodToDelete] = useState<FinancialPeriod | null>(null);
  const groups: { status: FinancialPeriodStatus; title: string }[] = [
    { status: 'open', title: t.financial.inProgress },
    { status: 'draft', title: t.financial.settingUp },
    { status: 'closed', title: t.financial.history },
  ];

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <PrimaryButton label={t.menu.backToMenu} iconName="chevron-back" variant="ghost" onPress={onBack} />
      <View style={styles.header}>
        <View><Text style={styles.title}>{t.financial.title}</Text><Text style={styles.subtitle}>{t.financial.monthsSubtitle}</Text></View>
        <Pressable style={styles.addButton} onPress={onAddMonth}><Ionicons name="add" size={22} color="#FFFFFF" /><Text style={styles.addText}>{t.financial.addMonth}</Text></Pressable>
      </View>

      {periods.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="calendar-outline" size={34} color={theme.colors.textSecondary} />
          <Text style={styles.emptyText}>{t.financial.noMonths}</Text>
          <PrimaryButton label={t.financial.addMonth} iconName="add" onPress={onAddMonth} />
        </View>
      ) : groups.map((group) => {
        const groupPeriods = periods.filter((period) => period.status === group.status);
        if (groupPeriods.length === 0) return null;
        return (
          <View key={group.status} style={styles.section}>
            <Text style={styles.sectionTitle}>{group.title}</Text>
            <View style={styles.list}>
              {groupPeriods.map((period) => {
                const totals = getFinancialSummary(period);
                return (
                  <View key={period.id} style={styles.card}>
                    <Pressable style={styles.cardContent} onPress={() => onOpenPeriod(period.id)}>
                      <View style={styles.cardHeader}><Text style={styles.month}>{formatMonthYear(period.year, period.month, language)}</Text><Text style={[styles.status, period.status === 'closed' && styles.closed]}>{t.financial[period.status]}</Text></View>
                      <Text style={styles.line}>{t.financial.startingAmount}: {formatCurrency(period.startingAmount, period.currency, language)}</Text>
                      {period.status === 'draft' ? (
                        <Text style={styles.line}>{period.items.length} {t.financial.items}</Text>
                      ) : (
                        <>
                          <Text style={styles.line}>{t.financial.actualSpent}: {formatCurrency(totals.totalPaid, period.currency, language)}</Text>
                          <Text style={styles.balance}>{period.status === 'closed' ? t.financial.finalBalance : t.financial.estimatedBalance}: {formatCurrency(totals.estimatedBalance, period.currency, language)}</Text>
                        </>
                      )}
                    </Pressable>
                    <Pressable style={styles.deleteButton} onPress={() => setPeriodToDelete(period)}>
                      <Ionicons name="trash-outline" size={18} color={theme.colors.danger} />
                      <Text style={styles.deleteText}>{t.financial.deletePeriod}</Text>
                    </Pressable>
                  </View>
                );
              })}
            </View>
          </View>
        );
      })}
      <Modal visible={Boolean(periodToDelete)} transparent animationType="fade" onRequestClose={() => setPeriodToDelete(null)}>
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>{t.financial.deletePeriodTitle}</Text>
            <Text style={styles.periodName}>
              {periodToDelete ? formatMonthYear(periodToDelete.year, periodToDelete.month, language) : ''}
            </Text>
            <Text style={styles.confirmationText}>{t.financial.deletePeriodMessage}</Text>
            <PrimaryButton
              label={t.common.delete}
              iconName="trash-outline"
              variant="dangerOutline"
              onPress={() => {
                if (periodToDelete) onDeletePeriod(periodToDelete.id);
                setPeriodToDelete(null);
              }}
            />
            <PrimaryButton label={t.common.cancel} variant="secondary" onPress={() => setPeriodToDelete(null)} />
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const createStyles = (theme: AppTheme) => StyleSheet.create({
  content: { width: '100%', maxWidth: layout.maxContentWidth, alignSelf: 'center', gap: spacing.xl, padding: layout.horizontalPadding, paddingBottom: spacing.xxxl },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  title: { color: theme.colors.textPrimary, fontSize: typography.title, fontWeight: '900' },
  subtitle: { marginTop: spacing.xs, color: theme.colors.textSecondary, fontSize: typography.small, fontWeight: '600' },
  addButton: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: spacing.xs, borderRadius: radius.md, backgroundColor: theme.colors.primary, paddingHorizontal: spacing.md },
  addText: { color: '#FFFFFF', fontSize: typography.small, fontWeight: '900' },
  empty: { alignItems: 'center', gap: spacing.lg, borderWidth: 1, borderStyle: 'dashed', borderColor: theme.colors.border, borderRadius: radius.lg, padding: spacing.xxl },
  emptyText: { color: theme.colors.textSecondary, fontSize: typography.body, fontWeight: '700', textAlign: 'center' },
  section: { gap: spacing.md },
  sectionTitle: { color: theme.colors.textSecondary, fontSize: typography.small, fontWeight: '900' },
  list: { gap: spacing.md },
  card: { overflow: 'hidden', borderWidth: 1, borderColor: theme.colors.border, borderRadius: radius.lg, backgroundColor: theme.colors.surface },
  cardContent: { gap: spacing.sm, padding: spacing.lg },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  month: { flex: 1, color: theme.colors.textPrimary, fontSize: typography.section, fontWeight: '900' },
  status: { color: theme.colors.primary, fontSize: typography.small, fontWeight: '900' },
  closed: { color: theme.colors.textSecondary },
  line: { color: theme.colors.textSecondary, fontSize: typography.small, fontWeight: '700' },
  balance: { color: theme.colors.textPrimary, fontSize: typography.body, fontWeight: '900' },
  deleteButton: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, borderTopWidth: 1, borderTopColor: theme.colors.border, paddingHorizontal: spacing.lg },
  deleteText: { color: theme.colors.danger, fontSize: typography.small, fontWeight: '900' },
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.42)', padding: spacing.lg },
  modal: { width: '100%', maxWidth: layout.maxContentWidth, alignSelf: 'center', gap: spacing.md, borderWidth: 1, borderColor: theme.colors.border, borderRadius: radius.xl, backgroundColor: theme.colors.surface, padding: spacing.xl },
  modalTitle: { color: theme.colors.textPrimary, fontSize: typography.section, fontWeight: '900' },
  periodName: { color: theme.colors.primary, fontSize: typography.body, fontWeight: '900' },
  confirmationText: { color: theme.colors.textPrimary, fontSize: typography.body, fontWeight: '700', lineHeight: 24 },
});

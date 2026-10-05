import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useLanguage } from '../../context/LanguageContext';
import { useAppTheme } from '../../context/ThemeContext';
import { AppTheme, radius, spacing, typography } from '../../styles/theme';
import { FinancialItem } from '../../types/financial';
import { CurrencyCode } from '../../types/purchase';
import { formatCurrency, formatDateTime } from '../../utils/format';
import { getFinancialItemTotals } from '../../utils/financialCalculations';

interface Props {
  item: FinancialItem;
  currency: CurrencyCode;
  readOnly?: boolean;
  onMarkPaid: () => void;
  onChangePaid: () => void;
  onAddMovement: () => void;
  onDeleteMovement: (movementId: string) => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function FinancialItemCard({ item, currency, readOnly, onMarkPaid, onChangePaid, onAddMovement, onDeleteMovement, onEdit, onDelete }: Props) {
  const { theme } = useAppTheme();
  const { language, t } = useLanguage();
  const styles = createStyles(theme);
  const totals = getFinancialItemTotals(item);
  const progress = Math.min(item.plannedAmount > 0 ? item.paidAmount / item.plannedAmount : 0, 1);
  const statusLabel = t.financial[totals.status];

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleArea}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.type}>{item.type === 'fixed' ? t.financial.fixed : t.financial.variable}</Text>
        </View>
        <Text style={[styles.status, totals.status === 'exceeded' && styles.danger, totals.status === 'paid' && styles.success]}>
          {statusLabel}
        </Text>
      </View>
      <View style={styles.metrics}>
        <View><Text style={styles.metricLabel}>{t.financial.planned}</Text><Text style={styles.metricValue}>{formatCurrency(item.plannedAmount, currency, language)}</Text></View>
        <View><Text style={styles.metricLabel}>{item.type === 'variable' ? t.financial.spent : t.financial.paid}</Text><Text style={styles.metricValue}>{formatCurrency(item.paidAmount, currency, language)}</Text></View>
        <View><Text style={styles.metricLabel}>{t.financial.remaining}</Text><Text style={[styles.metricValue, totals.remaining < 0 && styles.danger]}>{formatCurrency(totals.remaining, currency, language)}</Text></View>
      </View>
      <View style={styles.progressTrack}><View style={[styles.progressFill, totals.status === 'exceeded' && styles.progressDanger, { width: `${progress * 100}%` }]} /></View>
      <Text style={styles.progressText}>{formatCurrency(item.paidAmount, currency, language)} / {formatCurrency(item.plannedAmount, currency, language)} · {totals.percentage}%</Text>
      {item.type === 'variable' && (
        <View style={styles.movementsSection}>
          <View style={styles.movementsHeader}>
            <Text style={styles.movementsTitle}>{t.financial.movementHistory}</Text>
            <Text style={styles.movementCount}>{item.movements.length}</Text>
          </View>
          {item.movements.length === 0 ? (
            <Text style={styles.emptyMovements}>{t.financial.noMovements}</Text>
          ) : item.movements.map((movement) => (
            <View key={movement.id} style={styles.movementRow}>
              <View style={styles.movementCopy}>
                <Text style={styles.movementDescription}>{movement.description || t.financial.previousAccumulated}</Text>
                <Text style={styles.movementDate}>{formatDateTime(movement.createdAt, language)}</Text>
              </View>
              <Text style={styles.movementAmount}>{formatCurrency(movement.amount, currency, language)}</Text>
              {!readOnly && (
                <Pressable style={styles.movementDelete} onPress={() => onDeleteMovement(movement.id)} hitSlop={8}>
                  <Ionicons name="trash-outline" size={17} color={theme.colors.danger} />
                </Pressable>
              )}
            </View>
          ))}
        </View>
      )}
      {!readOnly && (
        <View style={styles.actions}>
          {item.type === 'fixed' && item.paidAmount !== item.plannedAmount && (
            <Pressable style={styles.primaryAction} onPress={onMarkPaid}><Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" /><Text style={styles.primaryText}>{t.financial.markPaid}</Text></Pressable>
          )}
          <Pressable style={styles.action} onPress={item.type === 'variable' ? onAddMovement : onChangePaid}><Ionicons name={item.type === 'variable' ? 'add-circle-outline' : 'cash-outline'} size={18} color={theme.colors.primary} /><Text style={styles.actionText}>{item.type === 'variable' ? t.financial.addMovement : t.financial.updatePaid}</Text></Pressable>
          <Pressable style={styles.iconAction} onPress={onEdit}><Ionicons name="pencil-outline" size={19} color={theme.colors.textSecondary} /></Pressable>
          <Pressable style={styles.iconAction} onPress={onDelete}><Ionicons name="trash-outline" size={19} color={theme.colors.danger} /></Pressable>
        </View>
      )}
    </View>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    card: { gap: spacing.md, borderWidth: 1, borderColor: theme.colors.border, borderRadius: radius.lg, backgroundColor: theme.colors.surface, padding: spacing.lg },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: spacing.md },
    titleArea: { flex: 1, gap: spacing.xs },
    name: { color: theme.colors.textPrimary, fontSize: typography.section, fontWeight: '900' },
    type: { color: theme.colors.textSecondary, fontSize: typography.small, fontWeight: '700' },
    status: { color: theme.colors.warning, fontSize: typography.small, fontWeight: '900' },
    success: { color: theme.colors.success },
    danger: { color: theme.colors.danger },
    metrics: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm },
    metricLabel: { color: theme.colors.textSecondary, fontSize: 11, fontWeight: '700' },
    metricValue: { marginTop: 2, color: theme.colors.textPrimary, fontSize: typography.small, fontWeight: '900' },
    progressTrack: { height: 8, overflow: 'hidden', borderRadius: radius.pill, backgroundColor: theme.colors.progressTrack },
    progressFill: { height: '100%', borderRadius: radius.pill, backgroundColor: theme.colors.primary },
    progressDanger: { backgroundColor: theme.colors.danger },
    progressText: { color: theme.colors.textSecondary, fontSize: 11, fontWeight: '700' },
    movementsSection: { gap: spacing.sm, borderTopWidth: 1, borderTopColor: theme.colors.border, paddingTop: spacing.md },
    movementsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    movementsTitle: { color: theme.colors.textPrimary, fontSize: typography.small, fontWeight: '900' },
    movementCount: { color: theme.colors.textSecondary, fontSize: typography.small, fontWeight: '800' },
    emptyMovements: { color: theme.colors.textSecondary, fontSize: typography.small, fontWeight: '600' },
    movementRow: { minHeight: 46, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    movementCopy: { flex: 1, gap: 2 },
    movementDescription: { color: theme.colors.textPrimary, fontSize: typography.small, fontWeight: '800' },
    movementDate: { color: theme.colors.textSecondary, fontSize: 11, fontWeight: '600' },
    movementAmount: { color: theme.colors.textPrimary, fontSize: typography.small, fontWeight: '900' },
    movementDelete: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center', borderRadius: radius.md, backgroundColor: theme.colors.surfaceSecondary },
    actions: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing.sm },
    primaryAction: { minHeight: 40, flexDirection: 'row', alignItems: 'center', gap: spacing.xs, borderRadius: radius.md, backgroundColor: theme.colors.primary, paddingHorizontal: spacing.md },
    primaryText: { color: '#FFFFFF', fontSize: typography.small, fontWeight: '900' },
    action: { minHeight: 40, flexDirection: 'row', alignItems: 'center', gap: spacing.xs, borderWidth: 1, borderColor: theme.colors.primary, borderRadius: radius.md, paddingHorizontal: spacing.md },
    actionText: { color: theme.colors.primary, fontSize: typography.small, fontWeight: '900' },
    iconAction: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.colors.border, borderRadius: radius.md },
  });

import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { FinancialItemCard } from '../../components/financial/FinancialItemCard';
import { FinancialSummary } from '../../components/financial/FinancialSummary';
import { PrimaryButton } from '../../components/PrimaryButton';
import { useLanguage } from '../../context/LanguageContext';
import { useAppTheme } from '../../context/ThemeContext';
import { AppTheme, layout, radius, spacing, typography } from '../../styles/theme';
import { FinancialItem, FinancialItemType, FinancialPeriod, FinancialSummaryTotals } from '../../types/financial';
import { CurrencyCode, SUPPORTED_CURRENCIES } from '../../types/purchase';
import { formatCurrency, formatMonthYear } from '../../utils/format';
import { parseNumber } from '../../utils/purchase';

type Filter = 'all' | FinancialItemType;
type ItemModal = { mode: 'add' } | { mode: 'edit'; item: FinancialItem } | null;

interface Props {
  period: FinancialPeriod;
  totals: FinancialSummaryTotals;
  onBack: () => void;
  onUpdateSettings: (amount: number, currency: CurrencyCode) => void;
  onAddItem: (name: string, amount: number, type: FinancialItemType) => void;
  onUpdateItem: (id: string, name: string, amount: number, type: FinancialItemType) => void;
  onUpdatePaid: (id: string, amount: number) => void;
  onAddMovement: (itemId: string, description: string, amount: number) => void;
  onDeleteMovement: (itemId: string, movementId: string) => void;
  onMarkPaid: (id: string) => void;
  onDeleteItem: (id: string) => void;
  onStartPeriod: () => void;
  onClosePeriod: () => void;
  onDeletePeriod: () => void;
}

export function FinancialDashboardScreen(props: Props) {
  const { theme } = useAppTheme();
  const { language, t } = useLanguage();
  const styles = createStyles(theme);
  const [filter, setFilter] = useState<Filter>('all');
  const [itemModal, setItemModal] = useState<ItemModal>(null);
  const [paidItem, setPaidItem] = useState<FinancialItem | null>(null);
  const [movementItem, setMovementItem] = useState<FinancialItem | null>(null);
  const [movementToDelete, setMovementToDelete] = useState<{ itemId: string; movementId: string } | null>(null);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [confirmation, setConfirmation] = useState<'start' | 'close' | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FinancialItem | 'period' | null>(null);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [movementDescription, setMovementDescription] = useState('');
  const [type, setType] = useState<FinancialItemType>('fixed');
  const [startingAmount, setStartingAmount] = useState(String(props.period.startingAmount));
  const [currency, setCurrency] = useState<CurrencyCode>(props.period.currency);
  const isReadOnly = props.period.status === 'closed';
  const visibleItems = props.period.items.filter((item) => filter === 'all' || item.type === filter);
  const monthName = formatMonthYear(props.period.year, props.period.month, language);

  const openAdd = () => { setName(''); setAmount(''); setType('fixed'); setItemModal({ mode: 'add' }); };
  const openEdit = (item: FinancialItem) => { setName(item.name); setAmount(String(item.plannedAmount)); setType(item.type); setItemModal({ mode: 'edit', item }); };
  const submitItem = () => {
    const parsed = parseNumber(amount);
    if (!name.trim()) return Alert.alert(t.financial.missingNameTitle, t.financial.missingNameMessage);
    if (!Number.isFinite(parsed) || parsed <= 0) return Alert.alert(t.financial.invalidAmountTitle, t.financial.invalidAmountMessage);
    if (itemModal?.mode === 'edit') props.onUpdateItem(itemModal.item.id, name.trim(), parsed, type);
    else props.onAddItem(name.trim(), parsed, type);
    setItemModal(null);
  };
  const submitPaid = () => {
    if (!paidItem) return;
    const parsed = parseNumber(amount);
    if (!Number.isFinite(parsed) || parsed < 0) return Alert.alert(t.financial.invalidPaidTitle, t.financial.invalidPaidMessage);
    props.onUpdatePaid(paidItem.id, parsed);
    setPaidItem(null);
  };
  const openMovement = (item: FinancialItem) => {
    setMovementDescription('');
    setAmount('');
    setMovementItem(item);
  };
  const submitMovement = () => {
    if (!movementItem) return;
    const parsed = parseNumber(amount);
    if (!movementDescription.trim()) return Alert.alert(t.financial.missingMovementTitle, t.financial.missingMovementMessage);
    if (!Number.isFinite(parsed) || parsed <= 0) return Alert.alert(t.financial.invalidAmountTitle, t.financial.invalidAmountMessage);
    props.onAddMovement(movementItem.id, movementDescription.trim(), parsed);
    setMovementItem(null);
  };
  const submitSettings = () => {
    const parsed = parseNumber(startingAmount);
    if (!Number.isFinite(parsed) || parsed <= 0) return Alert.alert(t.financial.invalidIncomeTitle, t.financial.invalidIncomeMessage);
    props.onUpdateSettings(parsed, currency);
    setSettingsVisible(false);
  };
  const periodSummary = (closing: boolean) =>
    `${monthName}\n\n${t.financial.startingAmount}: ${formatCurrency(props.period.startingAmount, props.period.currency, language)}\n${t.financial.budgeted}: ${formatCurrency(props.totals.totalPlanned, props.period.currency, language)}\n${closing ? t.financial.actualSpent : t.financial.availableUnallocated}: ${formatCurrency(closing ? props.totals.totalPaid : props.totals.availableUnallocated, props.period.currency, language)}\n${closing ? t.financial.finalBalance : t.financial.items}: ${closing ? formatCurrency(props.totals.estimatedBalance, props.period.currency, language) : props.period.items.length}${closing ? `\n${t.financial.budgetPending}: ${formatCurrency(props.totals.totalPending, props.period.currency, language)}` : ''}`;

  return (
    <>
      <ScrollView contentContainerStyle={styles.content}>
        <PrimaryButton label={t.common.back} iconName="chevron-back" variant="ghost" onPress={props.onBack} />
        <View style={styles.header}>
          <View style={styles.headerCopy}><Text style={styles.title}>{monthName}</Text><Text style={[styles.status, props.period.status === 'closed' && styles.closed]}>{t.financial[props.period.status]}</Text></View>
          {props.period.status === 'draft' && <Pressable style={styles.iconButton} onPress={() => { setStartingAmount(String(props.period.startingAmount)); setCurrency(props.period.currency); setSettingsVisible(true); }}><Ionicons name="settings-outline" size={21} color={theme.colors.textPrimary} /></Pressable>}
        </View>
        <FinancialSummary startingAmount={props.period.startingAmount} currency={props.period.currency} totals={props.totals} />

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View><Text style={styles.sectionTitle}>{t.financial.monthlyItems}</Text><Text style={styles.counter}>{props.period.items.length} {t.financial.items}</Text></View>
            {!isReadOnly && <Pressable style={styles.addButton} onPress={openAdd}><Ionicons name="add" size={22} color="#FFFFFF" /><Text style={styles.addText}>{t.financial.addExpense}</Text></Pressable>}
          </View>
          <View style={styles.filters}>{(['all', 'fixed', 'variable'] as Filter[]).map((value) => <Pressable key={value} style={[styles.chip, filter === value && styles.chipActive]} onPress={() => setFilter(value)}><Text style={[styles.chipText, filter === value && styles.chipTextActive]}>{value === 'all' ? t.financial.all : value === 'fixed' ? t.financial.fixedPlural : t.financial.variablePlural}</Text></Pressable>)}</View>
          {props.period.items.length === 0 && <View style={styles.empty}><Text style={styles.emptyText}>{t.financial.noItems}</Text>{!isReadOnly && <PrimaryButton label={t.financial.addExpense} iconName="add" onPress={openAdd} />}</View>}
          <View style={styles.list}>{visibleItems.map((item) => (
            <FinancialItemCard
              key={item.id}
              item={item}
              currency={props.period.currency}
              readOnly={isReadOnly}
              onMarkPaid={() => props.onMarkPaid(item.id)}
              onChangePaid={() => { setAmount(String(item.paidAmount)); setPaidItem(item); }}
              onAddMovement={() => openMovement(item)}
              onDeleteMovement={(movementId) => setMovementToDelete({ itemId: item.id, movementId })}
              onEdit={() => openEdit(item)}
              onDelete={() => setDeleteTarget(item)}
            />
          ))}</View>
        </View>

        {props.period.status === 'draft' && <PrimaryButton label={t.financial.startMonth} iconName="play-outline" onPress={() => setConfirmation('start')} />}
        {props.period.status === 'open' && <PrimaryButton label={t.financial.closeMonth} iconName="lock-closed-outline" variant="dangerOutline" onPress={() => setConfirmation('close')} />}
        {props.period.status === 'draft' && <PrimaryButton label={t.financial.deletePeriod} iconName="trash-outline" variant="dangerOutline" onPress={() => setDeleteTarget('period')} />}
      </ScrollView>

      <Modal visible={Boolean(itemModal)} transparent animationType="slide" onRequestClose={() => setItemModal(null)}><View style={styles.overlay}><View style={styles.modal}>
        <Text style={styles.modalTitle}>{itemModal?.mode === 'edit' ? t.financial.editItem : t.financial.addExpense}</Text>
        <Text style={styles.label}>{t.financial.itemName}</Text><TextInput value={name} onChangeText={setName} style={styles.input} placeholder={t.financial.itemNamePlaceholder} placeholderTextColor={theme.colors.textSecondary} />
        <Text style={styles.label}>{t.financial.planned}</Text><TextInput value={amount} onChangeText={setAmount} keyboardType="decimal-pad" style={styles.input} placeholder="0,00" placeholderTextColor={theme.colors.textSecondary} />
        <TypeSelector type={type} setType={setType} styles={styles} />
        <PrimaryButton label={t.financial.saveItem} iconName="save-outline" onPress={submitItem} /><PrimaryButton label={t.common.cancel} variant="secondary" onPress={() => setItemModal(null)} />
      </View></View></Modal>

      <Modal visible={Boolean(paidItem)} transparent animationType="slide" onRequestClose={() => setPaidItem(null)}><View style={styles.overlay}><View style={styles.modal}>
        <Text style={styles.modalTitle}>{paidItem?.type === 'variable' ? t.financial.updateSpent : t.financial.updatePaid}</Text><Text style={styles.counter}>{paidItem?.name}</Text>
        <Text style={styles.label}>{paidItem?.type === 'variable' ? t.financial.spent : t.financial.paid}</Text><TextInput value={amount} onChangeText={setAmount} keyboardType="decimal-pad" style={styles.input} placeholder="0,00" placeholderTextColor={theme.colors.textSecondary} />
        <PrimaryButton label={paidItem?.type === 'variable' ? t.financial.updateSpent : t.financial.updatePaid} iconName="cash-outline" onPress={submitPaid} /><PrimaryButton label={t.common.cancel} variant="secondary" onPress={() => setPaidItem(null)} />
      </View></View></Modal>

      <Modal visible={Boolean(movementItem)} transparent animationType="slide" onRequestClose={() => setMovementItem(null)}><View style={styles.overlay}><View style={styles.modal}>
        <Text style={styles.modalTitle}>{t.financial.addMovement}</Text><Text style={styles.counter}>{movementItem?.name}</Text>
        <Text style={styles.label}>{t.financial.movementDescription}</Text>
        <TextInput value={movementDescription} onChangeText={setMovementDescription} style={styles.input} placeholder={t.financial.movementDescriptionPlaceholder} placeholderTextColor={theme.colors.textSecondary} autoFocus />
        <Text style={styles.label}>{t.financial.amount}</Text>
        <TextInput value={amount} onChangeText={setAmount} keyboardType="decimal-pad" style={styles.input} placeholder="0,00" placeholderTextColor={theme.colors.textSecondary} />
        <PrimaryButton label={t.financial.addMovement} iconName="add-circle-outline" onPress={submitMovement} />
        <PrimaryButton label={t.common.cancel} variant="secondary" onPress={() => setMovementItem(null)} />
      </View></View></Modal>

      <Modal visible={settingsVisible} transparent animationType="slide" onRequestClose={() => setSettingsVisible(false)}><View style={styles.overlay}><View style={styles.modal}>
        <Text style={styles.modalTitle}>{t.financial.editStartingAmount}</Text>
        <Text style={styles.label}>{t.financial.startingAmount}</Text><TextInput value={startingAmount} onChangeText={setStartingAmount} keyboardType="decimal-pad" style={styles.input} />
        <View style={styles.filters}>{SUPPORTED_CURRENCIES.map((value) => <Pressable key={value} style={[styles.chip, currency === value && styles.chipActive]} onPress={() => setCurrency(value)}><Text style={[styles.chipText, currency === value && styles.chipTextActive]}>{value}</Text></Pressable>)}</View>
        <PrimaryButton label={t.financial.saveSettings} iconName="save-outline" onPress={submitSettings} /><PrimaryButton label={t.common.cancel} variant="secondary" onPress={() => setSettingsVisible(false)} />
      </View></View></Modal>

      <Modal visible={Boolean(confirmation)} transparent animationType="fade" onRequestClose={() => setConfirmation(null)}><View style={styles.overlay}><View style={styles.modal}>
        <Text style={styles.modalTitle}>{confirmation === 'close' ? `${t.financial.closeMonth} · ${monthName}` : t.financial.startMonthTitle}</Text>
        <Text style={styles.confirmationText}>{periodSummary(confirmation === 'close')}</Text>
        <PrimaryButton
          label={confirmation === 'close' ? t.financial.closeMonth : t.financial.startMonth}
          iconName={confirmation === 'close' ? 'lock-closed-outline' : 'play-outline'}
          variant={confirmation === 'close' ? 'dangerOutline' : 'primary'}
          onPress={() => {
            if (confirmation === 'close') props.onClosePeriod();
            else props.onStartPeriod();
            setConfirmation(null);
          }}
        />
        <PrimaryButton label={t.common.cancel} variant="secondary" onPress={() => setConfirmation(null)} />
      </View></View></Modal>

      <Modal visible={Boolean(deleteTarget)} transparent animationType="fade" onRequestClose={() => setDeleteTarget(null)}><View style={styles.overlay}><View style={styles.modal}>
        <Text style={styles.modalTitle}>{deleteTarget === 'period' ? t.financial.deletePeriodTitle : t.financial.deleteItemTitle}</Text>
        {deleteTarget !== 'period' && deleteTarget ? <Text style={styles.deleteItemName}>{deleteTarget.name}</Text> : null}
        <Text style={styles.confirmationText}>{deleteTarget === 'period' ? t.financial.deletePeriodMessage : t.financial.deleteItemMessage}</Text>
        <PrimaryButton
          label={t.common.delete}
          iconName="trash-outline"
          variant="dangerOutline"
          onPress={() => {
            if (deleteTarget === 'period') props.onDeletePeriod();
            else if (deleteTarget) props.onDeleteItem(deleteTarget.id);
            setDeleteTarget(null);
          }}
        />
        <PrimaryButton label={t.common.cancel} variant="secondary" onPress={() => setDeleteTarget(null)} />
      </View></View></Modal>

      <Modal visible={Boolean(movementToDelete)} transparent animationType="fade" onRequestClose={() => setMovementToDelete(null)}><View style={styles.overlay}><View style={styles.modal}>
        <Text style={styles.modalTitle}>{t.financial.deleteMovementTitle}</Text>
        <Text style={styles.confirmationText}>{t.financial.deleteMovementMessage}</Text>
        <PrimaryButton
          label={t.financial.deleteMovement}
          iconName="trash-outline"
          variant="dangerOutline"
          onPress={() => {
            if (movementToDelete) props.onDeleteMovement(movementToDelete.itemId, movementToDelete.movementId);
            setMovementToDelete(null);
          }}
        />
        <PrimaryButton label={t.common.cancel} variant="secondary" onPress={() => setMovementToDelete(null)} />
      </View></View></Modal>
    </>
  );
}

function TypeSelector({ type, setType, styles }: { type: FinancialItemType; setType: (type: FinancialItemType) => void; styles: ReturnType<typeof createStyles> }) {
  const { t } = useLanguage();
  return <View style={styles.filters}>{(['fixed', 'variable'] as FinancialItemType[]).map((value) => <Pressable key={value} style={[styles.chip, type === value && styles.chipActive]} onPress={() => setType(value)}><Text style={[styles.chipText, type === value && styles.chipTextActive]}>{value === 'fixed' ? t.financial.fixed : t.financial.variable}</Text></Pressable>)}</View>;
}

const createStyles = (theme: AppTheme) => StyleSheet.create({
  content: { width: '100%', maxWidth: layout.maxContentWidth, alignSelf: 'center', gap: spacing.xl, padding: layout.horizontalPadding, paddingBottom: spacing.xxxl },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  headerCopy: { flex: 1, gap: spacing.xs },
  title: { color: theme.colors.textPrimary, fontSize: 28, fontWeight: '900' },
  status: { color: theme.colors.primary, fontSize: typography.small, fontWeight: '900' },
  closed: { color: theme.colors.textSecondary },
  iconButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.colors.border, borderRadius: radius.md, backgroundColor: theme.colors.surface },
  section: { gap: spacing.md },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  sectionTitle: { color: theme.colors.textPrimary, fontSize: typography.section, fontWeight: '900' },
  counter: { marginTop: spacing.xs, color: theme.colors.textSecondary, fontSize: typography.small, fontWeight: '700' },
  addButton: { minHeight: 42, flexDirection: 'row', alignItems: 'center', gap: spacing.xs, borderRadius: radius.md, backgroundColor: theme.colors.primary, paddingHorizontal: spacing.md },
  addText: { color: '#FFFFFF', fontSize: typography.small, fontWeight: '900' },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: { minHeight: 40, justifyContent: 'center', borderWidth: 1, borderColor: theme.colors.border, borderRadius: radius.md, backgroundColor: theme.colors.surface, paddingHorizontal: spacing.md },
  chipActive: { borderColor: theme.colors.primary, backgroundColor: theme.colors.primarySoft },
  chipText: { color: theme.colors.textSecondary, fontSize: typography.small, fontWeight: '900' },
  chipTextActive: { color: theme.colors.primaryDark },
  empty: { gap: spacing.md, borderWidth: 1, borderStyle: 'dashed', borderColor: theme.colors.border, borderRadius: radius.lg, padding: spacing.lg },
  emptyText: { color: theme.colors.textSecondary, fontSize: typography.body, fontWeight: '700', textAlign: 'center' },
  list: { gap: spacing.md },
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.42)', padding: spacing.lg },
  modal: { width: '100%', maxWidth: layout.maxContentWidth, alignSelf: 'center', gap: spacing.md, borderWidth: 1, borderColor: theme.colors.border, borderRadius: radius.xl, backgroundColor: theme.colors.surface, padding: spacing.xl },
  modalTitle: { color: theme.colors.textPrimary, fontSize: typography.section, fontWeight: '900' },
  confirmationText: { color: theme.colors.textPrimary, fontSize: typography.body, fontWeight: '700', lineHeight: 24 },
  deleteItemName: { color: theme.colors.primary, fontSize: typography.body, fontWeight: '900' },
  label: { color: theme.colors.textPrimary, fontSize: typography.small, fontWeight: '800' },
  input: { minHeight: 52, borderWidth: 1, borderColor: theme.colors.border, borderRadius: radius.md, backgroundColor: theme.colors.inputBackground, paddingHorizontal: spacing.md, color: theme.colors.textPrimary, fontSize: typography.body, fontWeight: '700' },
});

import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { AppHeader } from '../../components/AppHeader';
import { BudgetSummary } from '../../components/BudgetSummary';
import { PrimaryButton } from '../../components/PrimaryButton';
import { ProductForm } from '../../components/ProductForm';
import { ProductItem } from '../../components/ProductItem';
import { PurchaseHistoryCard } from '../../components/PurchaseHistoryCard';
import { SettingsModal } from '../../components/SettingsModal';
import { useLanguage } from '../../context/LanguageContext';
import { useAppTheme } from '../../context/ThemeContext';
import { loadStoredData, saveActivePurchase, savePurchaseHistory } from '../../services/storage';
import { AppTheme, layout, radius, spacing, typography } from '../../styles/theme';
import { ActivePurchase, CompletedPurchase, CurrencyCode, DEFAULT_CURRENCY, Screen, SUPPORTED_CURRENCIES } from '../../types/purchase';
import { formatCurrency, formatDateTime } from '../../utils/format';
import { calculateTotalSpent, createId, getPurchaseBalance, parseNumber } from '../../utils/purchase';

const currencyValues: CurrencyCode[] = [...SUPPORTED_CURRENCIES];

interface PurchasesModuleProps {
  onBackToMenu: () => void;
}

interface ConfirmationState {
  title: string;
  message?: string;
  confirmLabel: string;
  destructive?: boolean;
  onConfirm: () => void;
}

export function PurchasesModule({ onBackToMenu }: PurchasesModuleProps) {
  const { theme, isDark } = useAppTheme();
  const { language, t } = useLanguage();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [screen, setScreen] = useState<Screen>('home');
  const [activePurchase, setActivePurchase] = useState<ActivePurchase | null>(null);
  const [purchaseHistory, setPurchaseHistory] = useState<CompletedPurchase[]>([]);
  const [selectedPurchase, setSelectedPurchase] = useState<CompletedPurchase | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isSettingsVisible, setIsSettingsVisible] = useState(false);
  const [confirmation, setConfirmation] = useState<ConfirmationState | null>(null);
  const [replaceActiveConfirmed, setReplaceActiveConfirmed] = useState(false);
  const [budgetInput, setBudgetInput] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyCode>(DEFAULT_CURRENCY);
  const [productName, setProductName] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [productQuantity, setProductQuantity] = useState('1');
  const actionLockRef = useRef(false);

  const sortedHistory = useMemo(
    () => [...purchaseHistory].sort((first, second) => Date.parse(second.endedAt) - Date.parse(first.endedAt)),
    [purchaseHistory],
  );

  useEffect(() => {
    const loadData = async () => {
      try {
        const storedData = await loadStoredData();
        setActivePurchase(storedData.activePurchase);
        setPurchaseHistory(storedData.purchaseHistory);
        setSelectedCurrency(storedData.activePurchase?.currency ?? DEFAULT_CURRENCY);
      } catch {
        Alert.alert(t.alerts.loadErrorTitle, t.alerts.loadErrorMessage);
      } finally {
        setIsReady(true);
      }
    };

    void loadData();
  }, []);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    void saveActivePurchase(activePurchase).catch(() => {
      Alert.alert(t.alerts.saveActiveErrorTitle, t.alerts.saveActiveErrorMessage);
    });
  }, [activePurchase, isReady, t.alerts.saveActiveErrorMessage, t.alerts.saveActiveErrorTitle]);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    void savePurchaseHistory(purchaseHistory).catch(() => {
      Alert.alert(t.alerts.saveActiveErrorTitle, t.alerts.saveHistoryErrorMessage);
    });
  }, [isReady, purchaseHistory, t.alerts.saveActiveErrorTitle, t.alerts.saveHistoryErrorMessage]);

  const runGuardedAction = (action: () => void) => {
    if (actionLockRef.current) {
      return;
    }

    actionLockRef.current = true;
    try {
      action();
    } finally {
      actionLockRef.current = false;
    }
  };

  const resetProductForm = () => {
    setProductName('');
    setProductPrice('');
    setProductQuantity('1');
  };

  const requestConfirmation = (nextConfirmation: ConfirmationState) => {
    setConfirmation(nextConfirmation);
  };

  const confirmPendingAction = () => {
    const action = confirmation?.onConfirm;
    setConfirmation(null);
    action?.();
  };

  const createPurchase = (budget: number) => {
    setActivePurchase({
      id: createId(),
      budget,
      currency: selectedCurrency,
      products: [],
      totalSpent: 0,
      startedAt: new Date().toISOString(),
    });
    setBudgetInput('');
    resetProductForm();
    setSelectedPurchase(null);
    setReplaceActiveConfirmed(false);
    setScreen('active');
  };

  const openNewPurchaseScreen = () => {
    runGuardedAction(() => {
      if (!activePurchase) {
        setReplaceActiveConfirmed(false);
        setScreen('start');
        return;
      }

      requestConfirmation({
        title: t.alerts.activePurchaseExistsTitle,
        message: t.alerts.activePurchaseExistsMessage,
        confirmLabel: t.alerts.newPurchase,
        destructive: true,
        onConfirm: () => {
          setReplaceActiveConfirmed(true);
          setScreen('start');
        },
      });
    });
  };

  const startPurchase = () => {
    runGuardedAction(() => {
      const parsedBudget = parseNumber(budgetInput);

      if (!Number.isFinite(parsedBudget) || parsedBudget <= 0) {
        Alert.alert(t.alerts.invalidBudgetTitle, t.alerts.invalidBudgetMessage);
        return;
      }

      if (activePurchase && !replaceActiveConfirmed) {
        requestConfirmation({
          title: t.alerts.activePurchaseExistsTitle,
          message: t.alerts.activePurchaseExistsMessage,
          confirmLabel: t.alerts.startNew,
          destructive: true,
          onConfirm: () => createPurchase(parsedBudget),
        });
        return;
      }

      createPurchase(parsedBudget);
    });
  };

  const continuePurchase = () => {
    setSelectedPurchase(null);
    setScreen('active');
  };

  const addProduct = () => {
    runGuardedAction(() => {
      const trimmedName = productName.trim();
      const parsedPrice = parseNumber(productPrice);
      const parsedQuantity = parseNumber(productQuantity);

      if (!activePurchase) {
        return;
      }

      if (!trimmedName) {
        Alert.alert(t.alerts.missingProductTitle, t.alerts.missingProductMessage);
        return;
      }

      if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
        Alert.alert(t.alerts.invalidPriceTitle, t.alerts.invalidPriceMessage);
        return;
      }

      if (!Number.isInteger(parsedQuantity) || parsedQuantity < 1) {
        Alert.alert(t.alerts.invalidQuantityTitle, t.alerts.invalidQuantityMessage);
        return;
      }

      const nextProducts = [
        {
          id: createId(),
          name: trimmedName,
          price: parsedPrice,
          quantity: parsedQuantity,
        },
        ...activePurchase.products,
      ];

      setActivePurchase({
        ...activePurchase,
        products: nextProducts,
        totalSpent: calculateTotalSpent(nextProducts),
      });
      resetProductForm();
    });
  };

  const removeProduct = (productId: string) => {
    if (!activePurchase) {
      return;
    }

    const nextProducts = activePurchase.products.filter((product) => product.id !== productId);

    setActivePurchase({
      ...activePurchase,
      products: nextProducts,
      totalSpent: calculateTotalSpent(nextProducts),
    });
  };

  const goBackToHome = () => {
    runGuardedAction(() => {
      requestConfirmation({
        title: t.alerts.backHomeTitle,
        message: t.alerts.backHomeMessage,
        confirmLabel: t.common.backHome,
        onConfirm: () => {
          setReplaceActiveConfirmed(false);
          setScreen('home');
        },
      });
    });
  };

  const finishPurchase = () => {
    runGuardedAction(() => {
      if (!activePurchase) {
        return;
      }

      requestConfirmation({
        title: t.alerts.finishPurchaseTitle,
        confirmLabel: t.alerts.finishPurchase,
        destructive: true,
        onConfirm: () => {
          const completedPurchase: CompletedPurchase = {
            ...activePurchase,
            endedAt: new Date().toISOString(),
          };

          setPurchaseHistory((currentHistory) => [completedPurchase, ...currentHistory]);
          setActivePurchase(null);
          setSelectedPurchase(null);
          resetProductForm();
          setReplaceActiveConfirmed(false);
          setScreen('home');
        },
      });
    });
  };

  const confirmDeletePurchase = (purchaseId: string) => {
    runGuardedAction(() => {
      requestConfirmation({
        title: t.alerts.deletePurchaseTitle,
        message: t.alerts.deletePurchaseMessage,
        confirmLabel: t.common.delete,
        destructive: true,
        onConfirm: () => {
          setPurchaseHistory((currentHistory) => currentHistory.filter((purchase) => purchase.id !== purchaseId));
          if (selectedPurchase?.id === purchaseId) {
            setSelectedPurchase(null);
            setScreen('home');
          }
        },
      });
    });
  };

  const openPurchaseDetail = (purchase: CompletedPurchase) => {
    setSelectedPurchase(purchase);
    setScreen('detail');
  };

  const getCurrencyLabel = (value: CurrencyCode) => t.currencies[value];

  const renderHome = () => (
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.screenContent}>
      <PrimaryButton label={t.menu.backToMenu} iconName="chevron-back" variant="ghost" onPress={onBackToMenu} />
      <AppHeader onOpenSettings={() => setIsSettingsVisible(true)} />

      {activePurchase ? (
        <View style={styles.activeCard}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.cardEyebrow}>{t.home.activePurchase}</Text>
            <Text style={styles.cardDate}>{formatDateTime(activePurchase.startedAt, language)}</Text>
          </View>
          <BudgetSummary purchase={activePurchase} compact />
          <PrimaryButton label={t.home.continuePurchase} iconName="cart-outline" onPress={continuePurchase} />
        </View>
      ) : null}

      <PrimaryButton
        label={t.home.newPurchase}
        iconName="add"
        onPress={openNewPurchaseScreen}
        style={styles.newPurchaseButton}
      />

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t.home.previousPurchases}</Text>
          <Text style={styles.sectionCounter}>{sortedHistory.length}</Text>
        </View>
        {sortedHistory.length === 0 ? (
          <Text style={styles.emptyText}>{t.home.noCompletedPurchases}</Text>
        ) : (
          <View style={styles.historyList}>
            {sortedHistory.map((purchase) => (
              <PurchaseHistoryCard
                key={purchase.id}
                purchase={purchase}
                onOpen={() => openPurchaseDetail(purchase)}
                onDelete={() => confirmDeletePurchase(purchase.id)}
              />
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );

  const renderStartPurchase = () => (
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.screenContent}>
      <PrimaryButton label={t.common.back} iconName="chevron-back" variant="ghost" onPress={() => setScreen('home')} />
      <View style={styles.startCard}>
        <Text style={styles.screenTitle}>{t.start.title}</Text>
        <Text style={styles.screenSubtitle}>{t.start.subtitle}</Text>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>{t.start.budgetLabel}</Text>
          <TextInput
            value={budgetInput}
            onChangeText={setBudgetInput}
            placeholder={t.start.budgetPlaceholder.replace('{{currency}}', selectedCurrency)}
            placeholderTextColor={theme.colors.textSecondary}
            keyboardType="decimal-pad"
            returnKeyType="done"
            style={styles.input}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>{t.start.currencyLabel}</Text>
          <View style={styles.currencyGrid}>
            {currencyValues.map((currency) => {
              const isSelected = selectedCurrency === currency;

              return (
                <Pressable
                  key={currency}
                  style={[styles.currencyOption, isSelected && styles.currencyOptionActive]}
                  onPress={() => setSelectedCurrency(currency)}
                >
                  <Ionicons
                    name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                    size={21}
                    color={isSelected ? theme.colors.primary : theme.colors.textSecondary}
                  />
                  <View style={styles.currencyCopy}>
                    <Text style={[styles.currencyCode, isSelected && styles.currencyCodeActive]}>{currency}</Text>
                    <Text style={styles.currencyName}>{getCurrencyLabel(currency)}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>

        <PrimaryButton label={t.start.startPurchase} iconName="wallet-outline" onPress={startPurchase} />
      </View>
    </ScrollView>
  );

  const renderActivePurchase = () => {
    if (!activePurchase) {
      return renderHome();
    }

    return (
      <FlatList
        data={activePurchase.products}
        keyExtractor={(item) => item.id}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.screenContent}
        ListHeaderComponent={
          <View style={styles.activeHeader}>
            <PrimaryButton label={t.common.back} iconName="chevron-back" variant="ghost" onPress={goBackToHome} />
            <AppHeader compact />

            <BudgetSummary purchase={activePurchase} />

            <ProductForm
              currency={activePurchase.currency}
              productName={productName}
              productPrice={productPrice}
              productQuantity={productQuantity}
              onChangeProductName={setProductName}
              onChangeProductPrice={setProductPrice}
              onChangeProductQuantity={setProductQuantity}
              onSubmit={addProduct}
            />

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t.common.products}</Text>
              <Text style={styles.sectionCounter}>{activePurchase.products.length}</Text>
            </View>
          </View>
        }
        ListEmptyComponent={<Text style={styles.emptyText}>{t.active.noProducts}</Text>}
        ListFooterComponent={
          <View style={styles.footerActions}>
            <PrimaryButton label={t.active.finishPurchase} iconName="checkmark-circle-outline" onPress={finishPurchase} />
            <PrimaryButton label={t.common.backHome} iconName="chevron-back" variant="secondary" onPress={goBackToHome} />
          </View>
        }
        renderItem={({ item }) => (
          <ProductItem product={item} currency={activePurchase.currency} onDelete={() => removeProduct(item.id)} />
        )}
      />
    );
  };

  const renderPurchaseDetail = () => {
    if (!selectedPurchase) {
      return renderHome();
    }

    const balance = getPurchaseBalance(selectedPurchase);
    const hasOverspent = balance < 0;

    return (
      <FlatList
        data={selectedPurchase.products}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.screenContent}
        ListHeaderComponent={
          <View>
            <PrimaryButton
              label={t.common.backHome}
              iconName="chevron-back"
              variant="ghost"
              onPress={() => setScreen('home')}
            />

            <View style={styles.detailHeader}>
              <Text style={styles.screenTitle}>{t.detail.title}</Text>
              <Text style={styles.screenSubtitle}>{formatDateTime(selectedPurchase.endedAt, language)}</Text>
            </View>

            <View style={styles.detailStats}>
              <BudgetSummary purchase={selectedPurchase} />
              <View style={styles.productsPill}>
                <Text style={styles.productsPillLabel}>{t.common.products}</Text>
                <Text style={styles.productsPillValue}>{selectedPurchase.products.length}</Text>
              </View>
              <Text style={[styles.balanceNote, hasOverspent ? styles.balanceDanger : styles.balancePositive]}>
                {hasOverspent ? t.detail.exceeded : t.detail.remaining}:{' '}
                {formatCurrency(Math.abs(balance), selectedPurchase.currency, language)}
              </Text>
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t.common.products}</Text>
              <Text style={styles.sectionCounter}>{selectedPurchase.products.length}</Text>
            </View>
          </View>
        }
        ListEmptyComponent={<Text style={styles.emptyText}>{t.detail.noProducts}</Text>}
        ListFooterComponent={
          <PrimaryButton
            label={t.detail.deletePurchase}
            iconName="trash-outline"
            variant="dangerOutline"
            onPress={() => confirmDeletePurchase(selectedPurchase.id)}
            style={styles.deletePurchaseButton}
          />
        }
        renderItem={({ item }) => <ProductItem product={item} currency={selectedPurchase.currency} />}
      />
    );
  };

  const renderCurrentScreen = () => {
    if (!isReady) {
      return (
        <View style={styles.loadingScreen}>
          <Text style={styles.loadingText}>{t.common.loading}</Text>
        </View>
      );
    }

    if (screen === 'start') {
      return renderStartPurchase();
    }

    if (screen === 'active') {
      return renderActivePurchase();
    }

    if (screen === 'detail') {
      return renderPurchaseDetail();
    }

    return renderHome();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style={isDark ? 'light' : 'dark'} backgroundColor={theme.colors.background} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={12}
        style={styles.keyboardView}
      >
        {renderCurrentScreen()}
      </KeyboardAvoidingView>
      <Modal
        visible={Boolean(confirmation)}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmation(null)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setConfirmation(null)}>
          <Pressable style={styles.modalCard} onPress={(event) => event.stopPropagation()}>
            <Text style={styles.modalTitle}>{confirmation?.title}</Text>
            {confirmation?.message ? <Text style={styles.modalSubtitle}>{confirmation.message}</Text> : null}
            <View style={styles.modalActions}>
              <PrimaryButton
                label={confirmation?.confirmLabel ?? ''}
                iconName={confirmation?.destructive ? 'warning-outline' : 'checkmark-outline'}
                variant={confirmation?.destructive ? 'dangerOutline' : 'primary'}
                onPress={confirmPendingAction}
              />
              <PrimaryButton
                label={t.common.cancel}
                variant="secondary"
                onPress={() => setConfirmation(null)}
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
      <SettingsModal visible={isSettingsVisible} onClose={() => setIsSettingsVisible(false)} />
    </SafeAreaView>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    keyboardView: {
      flex: 1,
    },
    screenContent: {
      width: '100%',
      maxWidth: layout.maxContentWidth,
      alignSelf: 'center',
      paddingHorizontal: layout.horizontalPadding,
      paddingTop: spacing.xl,
      paddingBottom: spacing.xxxl,
    },
    activeCard: {
      gap: spacing.md,
    },
    cardTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.md,
    },
    cardEyebrow: {
      color: theme.colors.primaryDark,
      fontSize: typography.small,
      fontWeight: '900',
      textTransform: 'uppercase',
    },
    cardDate: {
      flex: 1,
      color: theme.colors.textSecondary,
      fontSize: typography.small,
      fontWeight: '700',
      textAlign: 'right',
    },
    newPurchaseButton: {
      marginTop: spacing.lg,
    },
    section: {
      marginTop: spacing.xxl,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.md,
      marginTop: spacing.xl,
      marginBottom: spacing.md,
    },
    sectionTitle: {
      color: theme.colors.textPrimary,
      fontSize: typography.section,
      fontWeight: '900',
    },
    sectionCounter: {
      minWidth: 32,
      borderRadius: radius.pill,
      backgroundColor: theme.colors.surfaceSecondary,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      color: theme.colors.primaryDark,
      fontSize: typography.small,
      fontWeight: '900',
      textAlign: 'center',
    },
    historyList: {
      gap: spacing.md,
    },
    emptyText: {
      borderWidth: 1,
      borderStyle: 'dashed',
      borderColor: theme.colors.border,
      borderRadius: radius.lg,
      padding: spacing.lg,
      color: theme.colors.textSecondary,
      fontSize: typography.body,
      fontWeight: '600',
      textAlign: 'center',
    },
    startCard: {
      gap: spacing.lg,
      marginTop: spacing.xl,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: radius.xl,
      backgroundColor: theme.colors.surface,
      padding: spacing.xl,
    },
    screenTitle: {
      color: theme.colors.textPrimary,
      fontSize: 28,
      fontWeight: '900',
    },
    screenSubtitle: {
      color: theme.colors.textSecondary,
      fontSize: typography.body,
      fontWeight: '600',
      lineHeight: 22,
    },
    fieldGroup: {
      gap: spacing.sm,
    },
    label: {
      color: theme.colors.textPrimary,
      fontSize: typography.small,
      fontWeight: '800',
    },
    input: {
      minHeight: 54,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: radius.md,
      backgroundColor: theme.colors.inputBackground,
      paddingHorizontal: spacing.md,
      color: theme.colors.textPrimary,
      fontSize: 18,
      fontWeight: '700',
    },
    currencyGrid: {
      gap: spacing.sm,
    },
    currencyOption: {
      minHeight: 52,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: radius.md,
      backgroundColor: theme.colors.inputBackground,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    currencyOptionActive: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primarySoft,
    },
    currencyCopy: {
      flex: 1,
      gap: 2,
    },
    currencyCode: {
      color: theme.colors.textPrimary,
      fontSize: typography.body,
      fontWeight: '900',
    },
    currencyCodeActive: {
      color: theme.colors.primaryDark,
    },
    currencyName: {
      color: theme.colors.textSecondary,
      fontSize: typography.small,
      fontWeight: '700',
    },
    activeHeader: {
      gap: spacing.lg,
    },
    footerActions: {
      gap: spacing.md,
      marginTop: spacing.xl,
    },
    detailHeader: {
      gap: spacing.xs,
      marginTop: spacing.xl,
      marginBottom: spacing.lg,
    },
    detailStats: {
      gap: spacing.md,
    },
    productsPill: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: radius.lg,
      backgroundColor: theme.colors.surface,
      padding: spacing.lg,
    },
    productsPillLabel: {
      color: theme.colors.textSecondary,
      fontSize: typography.body,
      fontWeight: '700',
    },
    productsPillValue: {
      color: theme.colors.textPrimary,
      fontSize: 22,
      fontWeight: '900',
    },
    balanceNote: {
      fontSize: typography.body,
      fontWeight: '900',
    },
    balancePositive: {
      color: theme.colors.success,
    },
    balanceDanger: {
      color: theme.colors.primaryDark,
    },
    deletePurchaseButton: {
      marginTop: spacing.xl,
    },
    loadingScreen: {
      flex: 1,
      justifyContent: 'center',
      paddingHorizontal: spacing.xl,
      backgroundColor: theme.colors.background,
    },
    loadingText: {
      color: theme.colors.textPrimary,
      fontSize: typography.section,
      fontWeight: '900',
      textAlign: 'center',
    },
    modalOverlay: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(0, 0, 0, 0.42)',
      padding: spacing.lg,
    },
    modalCard: {
      width: '100%',
      maxWidth: layout.maxContentWidth,
      alignSelf: 'center',
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: radius.xl,
      backgroundColor: theme.colors.surface,
      padding: spacing.xl,
    },
    modalTitle: {
      color: theme.colors.textPrimary,
      fontSize: typography.section,
      fontWeight: '900',
    },
    modalSubtitle: {
      marginTop: spacing.xs,
      color: theme.colors.textSecondary,
      fontSize: typography.body,
      fontWeight: '600',
    },
    modalActions: {
      gap: spacing.sm,
      marginTop: spacing.lg,
    },
    settingsSectionTitle: {
      marginTop: spacing.lg,
      marginBottom: spacing.sm,
      color: theme.colors.textPrimary,
      fontSize: typography.body,
      fontWeight: '900',
    },
    optionGroup: {
      gap: spacing.sm,
    },
    settingsOption: {
      minHeight: 48,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: radius.md,
      backgroundColor: theme.colors.background,
      paddingHorizontal: spacing.md,
    },
    settingsOptionLabel: {
      color: theme.colors.textSecondary,
      fontSize: typography.body,
      fontWeight: '800',
    },
    settingsOptionLabelActive: {
      color: theme.colors.textPrimary,
    },
  });

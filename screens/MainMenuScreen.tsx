import { Ionicons } from '@expo/vector-icons';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SettingsModal } from '../components/SettingsModal';
import { useLanguage } from '../context/LanguageContext';
import { useAppTheme } from '../context/ThemeContext';
import { AppTheme, layout, radius, spacing, typography } from '../styles/theme';
import { useState } from 'react';

const logoSource = require('../assets/LOGO2FC2.webp');

interface MainMenuScreenProps {
  onOpenPurchases: () => void;
  onOpenFinancial: () => void;
}

export function MainMenuScreen({ onOpenPurchases, onOpenFinancial }: MainMenuScreenProps) {
  const { theme } = useAppTheme();
  const { t } = useLanguage();
  const [isSettingsVisible, setIsSettingsVisible] = useState(false);
  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Image source={logoSource} style={styles.logo} resizeMode="contain" />
          <Pressable style={styles.settingsButton} onPress={() => setIsSettingsVisible(true)} hitSlop={8}>
            <Ionicons name="settings-outline" size={21} color={theme.colors.textPrimary} />
          </Pressable>
        </View>

        <View style={styles.copy}>
          <Text style={styles.title}>2FC</Text>
          <Text style={styles.subtitle}>{t.menu.subtitle}</Text>
        </View>

        <View style={styles.actions}>
          <Pressable style={styles.moduleButton} onPress={onOpenPurchases}>
            <View style={styles.iconShell}>
              <Ionicons name="cart-outline" size={28} color="#FFFFFF" />
            </View>
            <Text style={styles.moduleTitle}>{t.menu.purchases}</Text>
            <Ionicons name="chevron-forward" size={22} color={theme.colors.textSecondary} />
          </Pressable>

          <Pressable style={styles.moduleButton} onPress={onOpenFinancial}>
            <View style={styles.iconShell}>
              <Ionicons name="wallet-outline" size={28} color="#FFFFFF" />
            </View>
            <Text style={styles.moduleTitle}>{t.menu.finances}</Text>
            <Ionicons name="chevron-forward" size={22} color={theme.colors.textSecondary} />
          </Pressable>
        </View>
      </ScrollView>
      <SettingsModal visible={isSettingsVisible} onClose={() => setIsSettingsVisible(false)} />
    </View>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    content: {
      width: '100%',
      maxWidth: layout.maxContentWidth,
      alignSelf: 'center',
      paddingHorizontal: layout.horizontalPadding,
      paddingTop: spacing.xxl,
      paddingBottom: spacing.xxxl,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    logo: {
      width: 86,
      height: 86,
    },
    settingsButton: {
      width: 42,
      height: 42,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: radius.pill,
      backgroundColor: theme.colors.surface,
    },
    copy: {
      marginTop: spacing.xl,
      gap: spacing.sm,
    },
    title: {
      color: theme.colors.textPrimary,
      fontSize: 34,
      fontWeight: '900',
    },
    subtitle: {
      color: theme.colors.textSecondary,
      fontSize: typography.subtitle,
      fontWeight: '700',
      lineHeight: 22,
    },
    actions: {
      gap: spacing.md,
      marginTop: spacing.xxxl,
    },
    moduleButton: {
      minHeight: 92,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: radius.xl,
      backgroundColor: theme.colors.surface,
      padding: spacing.lg,
    },
    iconShell: {
      width: 54,
      height: 54,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: radius.lg,
      backgroundColor: theme.colors.primary,
    },
    moduleTitle: {
      flex: 1,
      color: theme.colors.textPrimary,
      fontSize: 22,
      fontWeight: '900',
    },
  });

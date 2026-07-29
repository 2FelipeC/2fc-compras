import { Ionicons } from '@expo/vector-icons';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useLanguage } from '../context/LanguageContext';
import { useAppTheme } from '../context/ThemeContext';
import { AppTheme, radius, spacing, typography } from '../styles/theme';

const logoSource = require('../assets/LOGO2FC2.webp');

interface AppHeaderProps {
  compact?: boolean;
  onOpenSettings?: () => void;
}

export function AppHeader({ compact = false, onOpenSettings }: AppHeaderProps) {
  const { theme } = useAppTheme();
  const { t } = useLanguage();
  const styles = createStyles(theme);

  return (
    <View style={[styles.container, compact && styles.compactContainer]}>
      <Image source={logoSource} style={[styles.logo, compact && styles.compactLogo]} resizeMode="contain" />
      <View style={styles.copy}>
        <Text style={[styles.title, compact && styles.compactTitle]}>{t.app.title}</Text>
        <Text style={styles.subtitle}>{t.app.subtitle}</Text>
      </View>
      {onOpenSettings ? (
        <Pressable style={styles.settingsButton} onPress={onOpenSettings} hitSlop={8}>
          <Ionicons name="settings-outline" size={21} color={theme.colors.textPrimary} />
        </Pressable>
      ) : null}
    </View>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      marginBottom: spacing.xl,
    },
    compactContainer: {
      marginBottom: spacing.md,
    },
    logo: {
      width: 62,
      height: 62,
    },
    compactLogo: {
      width: 42,
      height: 42,
    },
    copy: {
      flex: 1,
    },
    title: {
      color: theme.colors.textPrimary,
      fontSize: typography.title,
      fontWeight: '900',
    },
    compactTitle: {
      fontSize: 24,
    },
    subtitle: {
      marginTop: spacing.xs,
      color: theme.colors.textSecondary,
      fontSize: typography.subtitle,
      fontWeight: '600',
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
  });

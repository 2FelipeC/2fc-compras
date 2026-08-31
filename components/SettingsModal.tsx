import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useLanguage } from '../context/LanguageContext';
import { useAppTheme } from '../context/ThemeContext';
import { Language } from '../i18n/translations';
import { AppTheme, layout, radius, spacing, ThemeMode, typography } from '../styles/theme';

const themeValues: ThemeMode[] = ['system', 'light', 'dark'];
const languageValues: Language[] = ['es', 'en'];

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
}

export function SettingsModal({ visible, onClose }: SettingsModalProps) {
  const { theme, themeMode, setThemeMode } = useAppTheme();
  const { language, setLanguage, t } = useLanguage();
  const styles = createStyles(theme);

  const getThemeLabel = (mode: ThemeMode) => {
    if (mode === 'light') {
      return t.settings.light;
    }

    if (mode === 'dark') {
      return t.settings.dark;
    }

    return t.settings.system;
  };

  const getLanguageLabel = (value: Language) => (value === 'es' ? t.settings.spanish : t.settings.english);

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.modalCard}>
          <Text style={styles.modalTitle}>{t.settings.title}</Text>
          <Text style={styles.modalSubtitle}>{t.settings.subtitle}</Text>

          <Text style={styles.settingsSectionTitle}>{t.settings.appearance}</Text>
          <View style={styles.optionGroup}>
            {themeValues.map((value) => {
              const isSelected = themeMode === value;

              return (
                <Pressable key={value} style={styles.settingsOption} onPress={() => setThemeMode(value)}>
                  <Ionicons
                    name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                    size={22}
                    color={isSelected ? theme.colors.primary : theme.colors.textSecondary}
                  />
                  <Text style={[styles.settingsOptionLabel, isSelected && styles.settingsOptionLabelActive]}>
                    {getThemeLabel(value)}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.settingsSectionTitle}>{t.settings.language}</Text>
          <View style={styles.optionGroup}>
            {languageValues.map((value) => {
              const isSelected = language === value;

              return (
                <Pressable key={value} style={styles.settingsOption} onPress={() => setLanguage(value)}>
                  <Ionicons
                    name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                    size={22}
                    color={isSelected ? theme.colors.primary : theme.colors.textSecondary}
                  />
                  <Text style={[styles.settingsOptionLabel, isSelected && styles.settingsOptionLabelActive]}>
                    {getLanguageLabel(value)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
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

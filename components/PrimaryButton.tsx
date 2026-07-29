import { Ionicons } from '@expo/vector-icons';
import { ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import { useAppTheme } from '../context/ThemeContext';
import { AppTheme, radius, spacing, typography } from '../styles/theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  iconName?: IconName;
  variant?: 'primary' | 'secondary' | 'dangerOutline' | 'ghost';
  style?: ViewStyle;
}

export function PrimaryButton({ label, onPress, iconName, variant = 'primary', style }: PrimaryButtonProps) {
  const { theme } = useAppTheme();
  const styles = createStyles(theme);
  const isPrimary = variant === 'primary';
  const isSecondary = variant === 'secondary';
  const isDangerOutline = variant === 'dangerOutline';
  const isGhost = variant === 'ghost';

  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        isPrimary && styles.primary,
        isSecondary && styles.secondary,
        isDangerOutline && styles.dangerOutline,
        isGhost && styles.ghost,
        pressed && styles.pressed,
        style,
      ]}
      onPress={onPress}
    >
      {iconName ? (
        <Ionicons
          name={iconName}
          size={18}
          color={isPrimary ? '#FFFFFF' : isDangerOutline ? theme.colors.primary : theme.colors.textPrimary}
        />
      ) : null}
      <Text
        style={[
          styles.label,
          isPrimary && styles.primaryLabel,
          isSecondary && styles.secondaryLabel,
          isDangerOutline && styles.dangerLabel,
          isGhost && styles.ghostLabel,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const createStyles = (theme: AppTheme) =>
StyleSheet.create({
  button: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
  },
  primary: {
    backgroundColor: theme.colors.primary,
  },
  secondary: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  dangerOutline: {
    borderWidth: 1,
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.surface,
  },
  ghost: {
    minHeight: 40,
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.surfaceSecondary,
    paddingHorizontal: spacing.md,
  },
  pressed: {
    opacity: 0.78,
  },
  label: {
    fontSize: typography.body,
    fontWeight: '800',
  },
  primaryLabel: {
    color: '#FFFFFF',
  },
  secondaryLabel: {
    color: theme.colors.textPrimary,
  },
  dangerLabel: {
    color: theme.colors.primary,
  },
  ghostLabel: {
    color: theme.colors.primaryDark,
  },
});

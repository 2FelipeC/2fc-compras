export type ThemeMode = 'system' | 'light' | 'dark';

export interface ThemeColors {
  primary: string;
  primaryDark: string;
  primarySoft: string;
  background: string;
  surface: string;
  surfaceSecondary: string;
  textPrimary: string;
  textSecondary: string;
  border: string;
  success: string;
  warning: string;
  danger: string;
  progressTrack: string;
  inputBackground: string;
}

export interface AppTheme {
  colors: ThemeColors;
}

export const lightTheme: AppTheme = {
  colors: {
    primary: '#D72638',
    primaryDark: '#A91525',
    primarySoft: '#FFF1F2',
    background: '#F7F7F8',
    surface: '#FFFFFF',
    surfaceSecondary: '#FFF1F2',
    textPrimary: '#18181B',
    textSecondary: '#71717A',
    border: '#E4E4E7',
    success: '#16A34A',
    warning: '#D97706',
    danger: '#D72638',
    progressTrack: '#E4E4E7',
    inputBackground: '#FFFFFF',
  },
};

export const darkTheme: AppTheme = {
  colors: {
    primary: '#EF3340',
    primaryDark: '#D72638',
    primarySoft: '#231719',
    background: '#0F0F10',
    surface: '#18181B',
    surfaceSecondary: '#231719',
    textPrimary: '#FAFAFA',
    textSecondary: '#A1A1AA',
    border: '#27272A',
    success: '#22C55E',
    warning: '#F59E0B',
    danger: '#EF4444',
    progressTrack: '#27272A',
    inputBackground: '#18181B',
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const radius = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 22,
  pill: 999,
};

export const typography = {
  title: 30,
  subtitle: 15,
  section: 18,
  body: 15,
  small: 13,
};

export const layout = {
  horizontalPadding: 16,
  maxContentWidth: 520,
};

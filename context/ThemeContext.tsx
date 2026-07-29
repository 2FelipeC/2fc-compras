import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { ColorSchemeName, useColorScheme } from 'react-native';
import { AppTheme, darkTheme, lightTheme, ThemeMode } from '../styles/theme';

const THEME_STORAGE_KEY = '@2fc-compras/theme';

interface ThemeContextValue {
  theme: AppTheme;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  isDark: boolean;
  systemColorScheme: ColorSchemeName;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

interface ThemeProviderProps {
  children: ReactNode;
}

const isThemeMode = (value: unknown): value is ThemeMode =>
  value === 'system' || value === 'light' || value === 'dark';

export function ThemeProvider({ children }: ThemeProviderProps) {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');

  useEffect(() => {
    const loadThemeMode = async () => {
      const storedThemeMode = await AsyncStorage.getItem(THEME_STORAGE_KEY);

      if (isThemeMode(storedThemeMode)) {
        setThemeModeState(storedThemeMode);
      }
    };

    void loadThemeMode();
  }, []);

  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
    void AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
  };

  const resolvedColorScheme = themeMode === 'system' ? systemColorScheme : themeMode;
  const isDark = resolvedColorScheme === 'dark';

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme: isDark ? darkTheme : lightTheme,
      themeMode,
      setThemeMode,
      isDark,
      systemColorScheme,
    }),
    [isDark, systemColorScheme, themeMode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useAppTheme must be used within ThemeProvider');
  }

  return context;
}

export { THEME_STORAGE_KEY };

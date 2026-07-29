import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { Language, translations } from '../i18n/translations';

const LANGUAGE_STORAGE_KEY = '@2fc-compras/language';

interface LanguageContextValue {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (typeof translations)[Language];
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

interface LanguageProviderProps {
  children: ReactNode;
}

const isLanguage = (value: unknown): value is Language => value === 'es' || value === 'en';

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguageState] = useState<Language>('es');

  useEffect(() => {
    const loadLanguage = async () => {
      const storedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);

      if (isLanguage(storedLanguage)) {
        setLanguageState(storedLanguage);
      }
    };

    void loadLanguage();
  }, []);

  const setLanguage = (nextLanguage: Language) => {
    setLanguageState(nextLanguage);
    void AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, nextLanguage);
  };

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      setLanguage,
      t: translations[language],
    }),
    [language],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }

  return context;
}

export { LANGUAGE_STORAGE_KEY };

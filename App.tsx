import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import { LanguageProvider } from './context/LanguageContext';
import { ThemeProvider, useAppTheme } from './context/ThemeContext';
import { FinancialModule } from './screens/financial/FinancialModule';
import { MainMenuScreen } from './screens/MainMenuScreen';
import { PurchasesModule } from './screens/purchases/PurchasesModule';

type AppModule = 'menu' | 'purchases' | 'financial';

function AppContent() {
  const { theme, isDark } = useAppTheme();
  const [activeModule, setActiveModule] = useState<AppModule>('menu');

  if (activeModule === 'purchases') {
    return <PurchasesModule onBackToMenu={() => setActiveModule('menu')} />;
  }

  if (activeModule === 'financial') {
    return <FinancialModule onBackToMenu={() => setActiveModule('menu')} />;
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} backgroundColor={theme.colors.background} />
      <MainMenuScreen
        onOpenPurchases={() => setActiveModule('purchases')}
        onOpenFinancial={() => setActiveModule('financial')}
      />
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AppContent />
      </LanguageProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
});

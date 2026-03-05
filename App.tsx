import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { I18nextProvider } from 'react-i18next';
import type { i18n as I18nType } from 'i18next';
import RootNavigator from './src/navigation/RootNavigator';
import theme from './src/theme/theme';
import { ThemeProvider } from './src/theme/ThemeProvider';
import { initI18n } from './src/i18n';

export default function App() {
  const [i18nInstance, setI18nInstance] = useState<I18nType | null>(null);

  useEffect(() => {
    let mounted = true;
    initI18n().then((instance) => {
      if (mounted) setI18nInstance(instance);
    });
    return () => {
      mounted = false;
    };
  }, []);

  if (!i18nInstance) {
    return (
      <SafeAreaProvider>
        <ThemeProvider value={theme}>
          <View
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: theme.colors.background,
            }}
          >
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        </ThemeProvider>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider value={theme}>
        <I18nextProvider i18n={i18nInstance}>
          <NavigationContainer>
            <StatusBar style="dark" />
            <RootNavigator />
          </NavigationContainer>
        </I18nextProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

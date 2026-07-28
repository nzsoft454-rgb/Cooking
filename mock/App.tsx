import 'react-native-gesture-handler';
import './src/i18n';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { I18nSync } from './src/i18n/I18nSync';
import { RootNavigator } from './src/navigation/RootNavigator';
import { AppProvider } from './src/store/AppContext';

export default function App() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <I18nSync />
        <StatusBar style="dark" />
        <RootNavigator />
      </AppProvider>
    </SafeAreaProvider>
  );
}

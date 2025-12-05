import { StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import React from 'react';
import AppNavigator from './src/navigation/AppNavigator';
import Toast from 'react-native-toast-message';

export default function App() {
  return (
    <SafeAreaProvider>
      <AppNavigator />
      <Toast />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});

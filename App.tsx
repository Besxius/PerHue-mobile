import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Image} from 'react-native';
import { SafeAreaFrameContext, SafeAreaProvider, SafeAreaView  } from 'react-native-safe-area-context';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from './src/components/navigator/AppNavigator';

export default function App() {
  return (
    // Bắt buộc phải bọc toàn bộ ứng dụng trong SafeAreaProvider
    <SafeAreaProvider>
      {/* Ở đây bạn thường đặt NavigationContainer hoặc các Providers cấp cao khác.
        Tất cả các màn hình bên trong sẽ có thể truy cập `useSafeAreaInsets()`
        */}
        {/* Ví dụ đơn giản, bạn sẽ thay thế bằng Stack/Tab Navigator của mình */}
        <AppNavigator />
    </SafeAreaProvider>
  ); 
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});

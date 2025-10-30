import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Image} from 'react-native';
import HomeScreen from './src/components/home/HomeScreen';
import { SafeAreaFrameContext, SafeAreaProvider, SafeAreaView  } from 'react-native-safe-area-context';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';

export default function App() {
  return (
    // Bắt buộc phải bọc toàn bộ ứng dụng trong SafeAreaProvider
    <SafeAreaProvider>
      {/* Ở đây bạn thường đặt NavigationContainer hoặc các Providers cấp cao khác.
        Tất cả các màn hình bên trong sẽ có thể truy cập `useSafeAreaInsets()`
        */}
      <NavigationContainer>
        {/* Ví dụ đơn giản, bạn sẽ thay thế bằng Stack/Tab Navigator của mình */}
        <HomeScreen />
      </NavigationContainer>
    </SafeAreaProvider>
  ); 
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});

import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TouchableOpacity, View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import HomeScreen from '../screens/HomeScreen';
import FavoriteScreen from '../screens/FavoriteScreen';
import HistoryScreen from '../screens/HistoryScreen';
import UserScreen from '../screens/UserScreen';
import PackageScreen from '../screens/PackageScreen';
import CustomTabBar from '../components/CustomTabBar';
import NotificationScreen from '../screens/NotificationScreen';
import ExpoCameraScreen from '../screens/ExpoCameraScreen';
import Feather from '@expo/vector-icons/Feather';
import { AuthProvider, useAuth } from '../screens/auth/AuthContext';
import SettingScreen from '../screens/SettingScreen';
import AuthNavigator from './AuthNavigator';
import { Camera } from 'expo-camera';
import CameraScreen from '../screens/CameraScreen';

// 1. Kiểu cho Bottom Tab Routes
export type TabRouteName = 'Home' | 'Favorite' | 'Camera' | 'History' | 'Menu';
export type TabName = 'home' | 'favorite' | 'camera' | 'history' | 'menu';

// 2. Kiểu cho ROOT Stack Routes
export type RootStackParamList = {
  Tabs: undefined;
  PackageScreen: undefined;
  NotificationScreen: undefined;
  Auth: undefined;
  WelcomeScreen: undefined;
  CameraScreen: undefined;
  UserScreen: undefined;
};


// --- NAVIGATORS ---
const Tab = createBottomTabNavigator<Record<TabRouteName, undefined>>();
const RootStack = createNativeStackNavigator<RootStackParamList>();

const mapRouteToTabName = (routeName: TabRouteName): TabName => {
  switch (routeName) {
    case 'Home': return 'home';
    case 'Favorite': return 'favorite';
    case 'Camera': return 'camera';
    case 'History': return 'history';
    case 'Menu': return 'menu';
    default: return 'home';
  }
}

const mapTabNameToRoute = (tabName: TabName): TabRouteName => {
  switch (tabName) {
    case 'home': return 'Home';
    case 'favorite': return 'Favorite';
    case 'camera': return 'Camera';
    case 'history': return 'History';
    case 'menu': return 'Menu';
    default: return 'Home';
  }
}

const CustomTab = ({ state, navigation }: any) => {
  const activeRouteName: TabRouteName = state.routes[state.index].name;

  if (activeRouteName === 'Camera') {
    return <View />;
  }

  const activeTab: TabName = mapRouteToTabName(activeRouteName);

  const handleTabPress = (tabName: TabName) => {
    const routeToNavigate: TabRouteName = mapTabNameToRoute(tabName);

    const route = state.routes.find((r: any) => r.name === routeToNavigate);

    if (route) {
      const event = navigation.emit({
        type: 'tabPress',
        target: route.key,
        canPreventDefault: true,
      });

      if (!event.defaultPrevented) {
        navigation.navigate(route.name);
      }
    }
  };

  return (
    <CustomTabBar
      activeTab={activeTab}
      onTabPress={handleTabPress}
    />
  );
};

// --- COMPONENT TAB NAVIGATOR CON ---
const TabNavigator = () => (
  <Tab.Navigator
    initialRouteName="Home"
    tabBar={(props) => <CustomTab {...props} />}
    screenOptions={{
      headerShown: false,
    }}
  >
    <Tab.Screen name="Home" component={HomeScreen} />
    <Tab.Screen name="Favorite" component={FavoriteScreen} />
    <Tab.Screen
      name="Camera"
      component={CameraScreen}
    // options={({ navigation }) => ({
    //   headerShown: true,
    //   title: '',
    //   headerTransparent: true,
    //   headerLeft: () => (
    //     <TouchableOpacity
    //       onPress={() => navigation.goBack()}
    //       style={{ marginLeft: 15 }}
    //     >
    //       <Feather name="x" size={30} color="white" />
    //     </TouchableOpacity>
    //   ),
    // })}
    />
    <Tab.Screen name="History" component={HistoryScreen} />
    <Tab.Screen name="Menu" component={SettingScreen} />
  </Tab.Navigator>
);



// --- COMPONENT ROOT NAVIGATOR CHA (CẬP NHẬT) ---
const RootNavigationStack = () => {
  const { isLoggedIn, isLoading } = useAuth();

  // 1. Hiển thị màn hình tải (Sử dụng trạng thái isLoading từ Context)
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4a90e2" />
        <Text style={{ marginTop: 10 }}>Đang kiểm tra đăng nhập...</Text>
      </View>
    );
  }

  // 2. Hiển thị các nhóm màn hình tùy thuộc vào trạng thái
  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      {isLoggedIn ? (
        // HIỂN THỊ MÀN HÌNH ỨNG DỤNG (ĐÃ ĐĂNG NHẬP)
        <>
          <RootStack.Screen
            name="Tabs"
            component={TabNavigator}
          />
          <RootStack.Screen
            name="PackageScreen"
            component={PackageScreen}
            options={{
              headerShown: true,
              title: 'Test packages'
            }}
          />
          <RootStack.Screen
            name="NotificationScreen"
            component={NotificationScreen}
            options={{
              headerShown: true,
              title: 'Notification center'
            }}
          />
          <RootStack.Screen
            name="UserScreen"
            component={UserScreen}
            options={{
              headerShown: true,
              title: 'User profile'
            }}
          />
        </>
      ) : (
        // HIỂN THỊ MÀN HÌNH XÁC THỰC (CHƯA ĐĂNG NHẬP)
        <RootStack.Screen
          name="Auth"
          component={AuthNavigator}
        />
      )}
    </RootStack.Navigator>
  );
};

// Bọc toàn bộ AppNavigator trong NavigationContainer VÀ AuthProvider
const AppNavigator = () => (
  <NavigationContainer>
    <AuthProvider>
      <RootNavigationStack />
    </AuthProvider>
  </NavigationContainer>
);

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  }
});

export default AppNavigator;
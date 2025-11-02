import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack'; // Import Stack
import { View } from 'react-native';

// Import màn hình
import HomeScreen from '../screen/HomeScreen';
import FavoriteScreen from '../screen/FavoriteScreen';
import CameraScreen from '../screen/CameraScreen';
import HistoryScreen from '../screen/HistoryScreen';
import UserScreen from '../screen/UserScreen';
import PackageScreen from '../screen/PackageScreen'; // <--- IMPORT MÀN HÌNH MỚI

import CustomTabBar from '../tab-bar/CustomTabBar';

// --- ĐỊNH NGHĨA KIỂU (TYPESCRIPT) ---

// 1. Kiểu cho Bottom Tab Routes
type TabRouteName = 'Home' | 'Favorite' | 'Camera' | 'History' | 'User';
type TabName = 'home' | 'favorite' | 'camera' | 'history' | 'user';

// 2. Kiểu cho ROOT Stack Routes
export type RootStackParamList = {
  Tabs: undefined; // Tên route chứa Tab Navigator
  PackageScreen: undefined; // Màn hình độc lập
  // Bạn có thể thêm các tham số ở đây nếu cần, ví dụ: PackageScreen: { packageId: string };
};

// --- NAVIGATORS ---
const Tab = createBottomTabNavigator<Record<TabRouteName, undefined>>();
const RootStack = createNativeStackNavigator<RootStackParamList>(); // Stack Navigator

// --- LOGIC CUSTOM TAB BAR (GIỮ NGUYÊN) ---

const mapRouteToTabName = (routeName: TabRouteName): TabName => {
  switch (routeName) {
    case 'Home': return 'home';
    case 'Favorite': return 'favorite';
    case 'Camera': return 'camera';
    case 'History': return 'history';
    case 'User': return 'user';
    default: return 'home';
  }
}

const mapTabNameToRoute = (tabName: TabName): TabRouteName => {
  switch (tabName) {
    case 'home': return 'Home';
    case 'favorite': return 'Favorite';
    case 'camera': return 'Camera';
    case 'history': return 'History';
    case 'user': return 'User';
    default: return 'Home';
  }
}

const CustomTab = ({ state, navigation }: any) => {
  const activeRouteName: TabRouteName = state.routes[state.index].name;

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
    <Tab.Screen name="Camera" component={CameraScreen} />
    <Tab.Screen name="History" component={HistoryScreen} />
    <Tab.Screen name="User" component={UserScreen} />
  </Tab.Navigator>
);

// --- COMPONENT ROOT NAVIGATOR CHA ---
const AppNavigator = () => {
  return (
    <NavigationContainer>
      <RootStack.Navigator
        initialRouteName="Tabs"
        screenOptions={{ headerShown: false }} // Ẩn header mặc định cho cả Stack
      >
        {/* Màn hình chứa Tab Bar */}
        <RootStack.Screen name="Tabs" component={TabNavigator} />

        {/* Màn hình độc lập, sẽ hiển thị trên Tab Bar */}
        <RootStack.Screen
          name="PackageScreen"
          component={PackageScreen}
          options={{
            headerShown: true, // Hiển thị Header cho màn hình này
            title: 'Test packages',
          }}
        />
      </RootStack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
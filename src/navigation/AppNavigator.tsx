import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack'; // Import Stack
import { TouchableOpacity, View, Text, ActivityIndicator, StyleSheet } from 'react-native';

// Import màn hình
import HomeScreen from '../screens/HomeScreen';
import FavoriteScreen from '../screens/FavoriteScreen';
import HistoryScreen from '../screens/HistoryScreen';
import UserScreen from '../screens/UserScreen';
import PackageScreen from '../screens/PackageScreen';

import CustomTabBar from '../components/CustomTabBar';
import NotificationScreen from '../screens/NotificationScreen';
import ExpoCameraScreen from '../screens/ExpoCameraScreen';
import Feather from '@expo/vector-icons/Feather';
import LoginScreen from '../screens/auth/LoginScreen';
import WelcomeScreen from '../screens/WelcomeScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';

// --- ĐỊNH NGHĨA KIỂU (TYPESCRIPT) ---

// 1. Kiểu cho Bottom Tab Routes
type TabRouteName = 'Home' | 'Favorite' | 'Camera' | 'History' | 'User';
type TabName = 'home' | 'favorite' | 'camera' | 'history' | 'user';

// 2. Kiểu cho ROOT Stack Routes
export type RootStackParamList = {
  Tabs: undefined;
  PackageScreen: undefined;
  NotificationScreen: undefined;
  LoginScreen: undefined;
  WelcomeScreen: undefined;
};

// --- NAVIGATORS ---
const Tab = createBottomTabNavigator<Record<TabRouteName, undefined>>();
const RootStack = createNativeStackNavigator<RootStackParamList>(); // Stack Navigator

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
      component={ExpoCameraScreen}
      options={({ navigation }) => ({
        headerShown: true,
        title: '',
        headerTransparent: true,
        headerLeft: () => (
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{ marginLeft: 15 }}
          >
            <Feather name="x" size={30} color="white" />
          </TouchableOpacity>
        ),
      })}
    />
    <Tab.Screen name="History" component={HistoryScreen} />
    <Tab.Screen name="User" component={UserScreen} />
  </Tab.Navigator>
);

const AuthStack = createNativeStackNavigator<
  Pick<RootStackParamList, 'WelcomeScreen' | 'LoginScreen'>
>();

const AuthNavigator = () => (
  <AuthStack.Navigator
    initialRouteName="WelcomeScreen" // 👈 Đặt WelcomeScreen làm màn hình đầu tiên của Auth
    screenOptions={{ headerShown: false }}
  >
    <AuthStack.Screen name="WelcomeScreen" component={WelcomeScreen} />
    <AuthStack.Screen name="LoginScreen" component={LoginScreen} />
    {/* Thêm màn hình Đăng ký/Quên mật khẩu nếu có */}
  </AuthStack.Navigator>
);

// --- COMPONENT ROOT NAVIGATOR CHA (CẬP NHẬT) ---
const AppNavigator = () => {
  // Giữ lại logic kiểm tra trạng thái đăng nhập
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        // --- GIẢ LẬP KIỂM TRA ĐĂNG NHẬP THỰC TẾ ---
        // Vẫn cần chờ một chút để trải nghiệm mượt mà
        await new Promise(resolve => setTimeout(resolve, 1500));
        const userToken = null; // Giả sử chưa đăng nhập

        if (userToken) {
          setIsLoggedIn(true);
        } else {
          setIsLoggedIn(false);
        }
        // ---------------------------------------------
      } catch (e) {
        console.error("Lỗi khi kiểm tra trạng thái đăng nhập:", e);
        setIsLoggedIn(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  // 3. Hiển thị màn hình tải
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4a90e2" />
        <Text style={{ marginTop: 10 }}>Đang kiểm tra đăng nhập...</Text>
      </View>
    );
  }

  // 4. Hiển thị các nhóm màn hình tùy thuộc vào trạng thái
  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {isLoggedIn ? (
          // HIỂN THỊ MÀN HÌNH ỨNG DỤNG (ĐÃ ĐĂNG NHẬP)
          <>
            <RootStack.Screen name="Tabs" component={TabNavigator} />
            <RootStack.Screen
              name="PackageScreen"
              component={PackageScreen}
              options={{ headerShown: true, title: 'Test packages' }}
            />
            <RootStack.Screen
              name="NotificationScreen"
              component={NotificationScreen}
              options={{ headerShown: true, title: 'Notification center' }}
            />
          </>
        ) : (
          // HIỂN THỊ MÀN HÌNH XÁC THỰC (CHƯA ĐĂNG NHẬP)
          // Màn hình đầu tiên trong AuthNavigator sẽ là WelcomeScreen
          <RootStack.Screen
            name="LoginScreen" // Đặt tên là LoginScreen nhưng component là AuthNavigator
            component={AuthNavigator}
          />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
};

// Style cho màn hình tải
const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  }
});

export default AppNavigator;
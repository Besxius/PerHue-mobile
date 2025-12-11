import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text, ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native';
import HomeScreen from '../screens/HomeScreen';
import HistoryScreen from '../screens/HistoryScreen';
import UserScreen from '../screens/UserScreen';
import PackageScreen from '../screens/PackageScreen';
import CustomTabBar from '../components/CustomTabBar';
import NotificationScreen from '../screens/NotificationScreen';
import { AuthProvider, useAuth } from '../screens/auth/AuthContext';
import SettingScreen from '../screens/SettingScreen';
import AuthNavigator from './AuthNavigator';
import CameraScreen from '../screens/CameraScreen';
import CapsuleScreen from '../screens/CapsuleScreen';
import ExpertDetailScreen from '../screens/ExpertDetailScreen';
import { ExpertInfo } from '../types/dataModels';
import ManualTestResultDetailScreen from '../screens/ManualTestResultDetailScreen';
import VerifyExpertScreen from '../screens/VerifyExpertScreen';
import AiTestResultDetailScreen from '../screens/AiTestResultDetailScreen';
import CreateExpertTestResponse from '../screens/CreateExpertTestResponse';
import MySubscriptionScreen from '../screens/MySubscriptionScreen';
import MyPaymentHistoryScreen from '../screens/MyPaymentHistoryScreen';
import TermAndPoliciesScreen from '../screens/TermAndPoliciesScreen';
import HelpAndSupportScreen from '../screens/HelpAndSupportScreen';
import ColorTestOnImageScreen from '../screens/ColorTestOnImageScreen';
import ExpertTestResponseDetailScreen from '../screens/ExpertTestResponseDetailScreen';
import MyExpertInformationScreen from '../screens/MyExpertInformationScreen';
import MySalaryScreen from '../screens/MySalaryScreen';

export type TabRouteName = 'Home' | 'Capsule' | 'Camera' | 'History' | 'Menu';
export type TabName = 'home' | 'capsule' | 'camera' | 'history' | 'menu';

export type RootStackParamList = {
  Tabs: undefined;
  PackageScreen: undefined;
  NotificationScreen: undefined;
  Auth: undefined;
  WelcomeScreen: undefined;
  CameraScreen: undefined;
  UserScreen: undefined;
  ExpertDetailScreen: { expert: ExpertInfo };
  VerifyExpertScreen: undefined;
  ManualTestResultDetailScreen: { id: number };
  CreateExpertTestResponse: { id: number },
  AiTestResultDetailScreen: { id: number };
  MySubscriptionScreen: undefined;
  MyPaymentHistoryScreen: undefined;
  TermAndPoliciesScreen: undefined;
  HelpAndSupportScreen: undefined;
  ExpertTestResponseDetailScreen: { id: number };
  MyExpertInformationScreen: undefined;
  ColorTestOnImageScreen: {
    imageUri: string;
    testRequestId?: number;
  };
  MySalaryScreen: undefined;
};


// --- NAVIGATORS ---
const Tab = createBottomTabNavigator<Record<TabRouteName, undefined>>();
// Cập nhật RootStack để sử dụng kiểu mới
const RootStack = createNativeStackNavigator<RootStackParamList>();

// --- Các hàm map route (Giữ nguyên) ---
const mapRouteToTabName = (routeName: TabRouteName): TabName => {
  switch (routeName) {
    case 'Home': return 'home';
    case 'Capsule': return 'capsule';
    case 'Camera': return 'camera';
    case 'History': return 'history';
    case 'Menu': return 'menu';
    default: return 'home';
  }
}

const mapTabNameToRoute = (tabName: TabName): TabRouteName => {
  switch (tabName) {
    case 'home': return 'Home';
    case 'capsule': return 'Capsule';
    case 'camera': return 'Camera';
    case 'history': return 'History';
    case 'menu': return 'Menu';
    default: return 'Home';
  }
}

const CustomTab = ({ state, navigation }: any) => {
  const activeRouteName: TabRouteName = state.routes[state.index].name as TabRouteName;

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

// --- COMPONENT TAB NAVIGATOR CON (Giữ nguyên) ---
const TabNavigator = () => (
  <Tab.Navigator
    initialRouteName="Home"
    tabBar={(props) => <CustomTab {...props} />}
    screenOptions={{
      headerShown: false,
    }}
  >
    <Tab.Screen name="Home" component={HomeScreen} />
    <Tab.Screen name="Capsule" component={CapsuleScreen} />
    <Tab.Screen
      name="Camera"
      component={CameraScreen}
    />
    <Tab.Screen name="History" component={HistoryScreen} />
    <Tab.Screen name="Menu" component={SettingScreen} />
  </Tab.Navigator>
);


// --- COMPONENT ROOT NAVIGATOR CHA (CẬP NHẬT) ---
const RootNavigationStack = () => {
  const { isLoggedIn, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4a90e2" />
        <Text style={{ marginTop: 10 }}>Đang kiểm tra đăng nhập...</Text>
      </View>
    );
  }

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
          <RootStack.Screen
            name="ExpertDetailScreen"
            component={ExpertDetailScreen}
            options={{
              headerShown: false,
            }}
          />
          <RootStack.Screen
            name="ManualTestResultDetailScreen"
            component={ManualTestResultDetailScreen}
            options={{
              headerShown: false,
              title: 'Manual Test Result'
            }}
          />
          <RootStack.Screen
            name="AiTestResultDetailScreen"
            component={AiTestResultDetailScreen}
            options={{
              headerShown: false,
              title: 'AI Test Result'
            }}
          />
          <RootStack.Screen
            name="CreateExpertTestResponse"
            component={CreateExpertTestResponse}
            options={{
              headerShown: false,
              title: '',
              headerTransparent: true,
            }}
          />
          <RootStack.Screen
            name="VerifyExpertScreen"
            component={VerifyExpertScreen}
            options={{
              headerShown: true,
              title: 'Register Expert information'
            }}
          />
          <RootStack.Screen
            name="MySubscriptionScreen"
            component={MySubscriptionScreen}
            options={{
              headerShown: true,
              title: 'My subscription'
            }}
          />
          <RootStack.Screen
            name="MyPaymentHistoryScreen"
            component={MyPaymentHistoryScreen}
            options={{
              headerShown: true,
              title: 'My Payment History'
            }}
          />
          <RootStack.Screen
            name="TermAndPoliciesScreen"
            component={TermAndPoliciesScreen}
            options={{
              headerShown: true,
              title: 'Terms of Service & Privacy Policy'
            }}
          />
          <RootStack.Screen
            name="HelpAndSupportScreen"
            component={HelpAndSupportScreen}
            options={{
              headerShown: true,
              title: 'Help & Support'
            }}
          />
          <RootStack.Screen
            name="ColorTestOnImageScreen"
            component={ColorTestOnImageScreen}
            options={{
              headerShown: false,
              title: 'Image Expert Color Test'
            }}
          />
          <RootStack.Screen
            name="ExpertTestResponseDetailScreen"
            component={ExpertTestResponseDetailScreen}
            options={{
              headerShown: false,
              title: 'Image Expert Color Test'
            }}
          />
          <RootStack.Screen
            name="MyExpertInformationScreen"
            component={MyExpertInformationScreen}
            options={{
              headerShown: false,
              title: ''
            }}
          />
          <RootStack.Screen
            name="MySalaryScreen"
            component={MySalaryScreen}
            options={{
              headerShown: false,
              title: ''
            }}
          />
        </>
      ) : (
        <RootStack.Screen
          name="Auth"
          component={AuthNavigator}
        />
      )}
    </RootStack.Navigator>
  );
};

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
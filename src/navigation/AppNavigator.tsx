import React, { useEffect, useState } from 'react';
import { createNavigationContainerRef, NavigationContainer, NavigatorScreenParams } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text, ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native';

// --- SCREENS ---
import HomeScreen from '../screens/HomeScreen';
import HistoryScreen from '../screens/HistoryScreen';
import UserScreen from '../screens/UserScreen';
import PackageScreen from '../screens/PackageScreen';
import NotificationScreen from '../screens/NotificationScreen';
import SettingScreen from '../screens/SettingScreen';
import CameraScreen from '../screens/CameraScreen';
import CapsuleScreen from '../screens/CapsuleScreen';
import ExpertDetailScreen from '../screens/ExpertDetailScreen';
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
import ExpertReviewDetailScreen from '../screens/ExpertReviewDetailScreen ';
import CustomTabBar from '../components/CustomTabBar';
import { AuthProvider, useAuth } from '../screens/auth/AuthContext';
import AuthNavigator from './AuthNavigator';
import { Color, ExpertInfo } from '../types/dataModels';
import { onMessageReceived, onNotificationOpenedApp } from '../services/fcmService';
import Toast from 'react-native-toast-message';
import NotificationSettingScreen from '../screens/NotificationSettingScreen';

export type TabRouteName = 'Home' | 'Capsule' | 'Camera' | 'History' | 'Menu';
export type TabName = 'home' | 'capsule' | 'camera' | 'history' | 'menu';

export type TabParamList = {
  Home: undefined;
  Capsule: undefined;
  Camera: undefined;
  History: {
    initialTab?: string
    initialStatus?: string;
  };
  Menu: undefined;
};

export type RootStackParamList = {
  Tabs: NavigatorScreenParams<TabParamList>;
  Auth: undefined;

  PackageScreen: undefined;
  NotificationScreen: undefined;
  WelcomeScreen: undefined;
  CameraScreen: undefined;
  UserScreen: undefined;

  ExpertDetailScreen: { expert: ExpertInfo };
  VerifyExpertScreen: undefined;
  ManualTestResultDetailScreen: { id: number };
  AiTestResultDetailScreen: { id: number };
  ExpertTestResponseDetailScreen: { id: number };
  ExpertReviewDetailScreen: { id: number };

  MySubscriptionScreen: undefined;
  MyPaymentHistoryScreen: undefined;
  TermAndPoliciesScreen: undefined;
  HelpAndSupportScreen: undefined;
  MyExpertInformationScreen: undefined;
  MySalaryScreen: undefined;
  NotificationSettingScreen: undefined;

  CreateExpertTestResponse: {
    id: number;
    initialBestColors?: Color[];
    initialWorstColors?: Color[];
    initialColorTypeId?: number;
    initialNote?: string;
  };

  ColorTestOnImageScreen: {
    imageUri: string;
    testRequestId: number;
    currentBestColors?: Color[];
    currentWorstColors?: Color[];
    colorTypeId?: number;
    currentNote?: string;
    fromScreen: 'CreateExpertTestResponse' | 'ExpertReviewDetailScreen';
  };
};


const Tab = createBottomTabNavigator<Record<TabRouteName, undefined>>();
const RootStack = createNativeStackNavigator<RootStackParamList>();

export const navigationRef = createNavigationContainerRef<RootStackParamList>();
export function navigate(name: keyof RootStackParamList, params?: any) {
  if (navigationRef.isReady()) {
    navigationRef.navigate(name, params);
  }
}

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
    <Tab.Screen name="Capsule" component={CapsuleScreen} />
    <Tab.Screen name="Camera" component={CameraScreen} />
    <Tab.Screen name="History" component={HistoryScreen} />
    <Tab.Screen name="Menu" component={SettingScreen} />
  </Tab.Navigator>
);


// --- COMPONENT ROOT NAVIGATOR CHA ---
const RootNavigationStack = () => {
  const { isLoggedIn, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4a90e2" />
        <Text style={{ marginTop: 10 }}>Checking login...</Text>
      </View>
    );
  }

  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      {isLoggedIn ? (
        // --- AUTHENTICATED STACK ---
        <>
          <RootStack.Screen
            name="Tabs"
            component={TabNavigator}
          />
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
          <RootStack.Screen
            name="UserScreen"
            component={UserScreen}
            options={{ headerShown: true, title: 'User profile' }}
          />
          <RootStack.Screen
            name="ExpertDetailScreen"
            component={ExpertDetailScreen}
          />
          <RootStack.Screen
            name="ManualTestResultDetailScreen"
            component={ManualTestResultDetailScreen}
            options={{ title: 'Manual Test Result' }}
          />
          <RootStack.Screen
            name="AiTestResultDetailScreen"
            component={AiTestResultDetailScreen}
            options={{ title: 'AI Test Result' }}
          />
          <RootStack.Screen
            name="CreateExpertTestResponse"
            component={CreateExpertTestResponse}
            options={{
              headerShown: false,
              headerTransparent: true,
            }}
          />
          <RootStack.Screen
            name="VerifyExpertScreen"
            component={VerifyExpertScreen}
            options={{ headerShown: true, title: 'Register Expert information' }}
          />
          <RootStack.Screen
            name="MySubscriptionScreen"
            component={MySubscriptionScreen}
            options={{ headerShown: true, title: 'My subscription' }}
          />
          <RootStack.Screen
            name="MyPaymentHistoryScreen"
            component={MyPaymentHistoryScreen}
            options={{ headerShown: true, title: 'My Payment History' }}
          />
          <RootStack.Screen
            name="TermAndPoliciesScreen"
            component={TermAndPoliciesScreen}
            options={{ headerShown: true, title: 'Terms of Service & Privacy Policy' }}
          />
          <RootStack.Screen
            name="HelpAndSupportScreen"
            component={HelpAndSupportScreen}
            options={{ headerShown: true, title: 'Help & Support' }}
          />
          <RootStack.Screen
            name="ColorTestOnImageScreen"
            component={ColorTestOnImageScreen}
            options={{ title: 'Image Expert Color Test' }}
          />
          <RootStack.Screen
            name="ExpertTestResponseDetailScreen"
            component={ExpertTestResponseDetailScreen}
          />
          <RootStack.Screen
            name="MyExpertInformationScreen"
            component={MyExpertInformationScreen}
          />
          <RootStack.Screen
            name="MySalaryScreen"
            component={MySalaryScreen}
          />
          <RootStack.Screen
            name="NotificationSettingScreen"
            component={NotificationSettingScreen}
            options={{ headerShown: false }}
          />
          <RootStack.Screen
            name="ExpertReviewDetailScreen"
            component={ExpertReviewDetailScreen}
          />
        </>
      ) : (
        // --- GUEST / AUTH STACK ---
        <RootStack.Screen
          name="Auth"
          component={AuthNavigator}
        />
      )}
    </RootStack.Navigator>
  );
};

const AppNavigator = () => {

  useEffect(() => {
    onNotificationOpenedApp();

    const unsubscribe = onMessageReceived((remoteMessage) => {
      const { title, body } = remoteMessage.notification || {};

      Toast.show({
        type: 'info',
        text1: title || 'New notification',
        text2: body || 'You have a new message.',
        position: 'top',
        visibilityTime: 5000,
        autoHide: true,
        topOffset: 50,
        onPress: () => {
          navigate('NotificationScreen');
          Toast.hide();
        }
      });
    });

    return () => {
      unsubscribe();
    };
  }, []);
  return (
    <NavigationContainer ref={navigationRef}>
      <AuthProvider>
        <RootNavigationStack />
      </AuthProvider>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  }
});

export default AppNavigator;
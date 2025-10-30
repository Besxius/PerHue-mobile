import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View } from 'react-native';
import HomeScreen from '../screen/HomeScreen';
import FavoriteScreen from '../screen/FavoriteScreen';
import CameraScreen from '../screen/CameraScreen';
import HistoryScreen from '../screen/HistoryScreen';
import UserScreen from '../screen/UserScreen';

import CustomTabBar from '../tab-bar/CustomTabBar';

type TabRouteName = 'Home' | 'Favorite' | 'Camera' | 'History' | 'User';

type TabName = 'home' | 'favorite' | 'camera' | 'history' | 'user';

const Tab = createBottomTabNavigator<Record<TabRouteName, undefined>>();

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

const AppNavigator = () => {
  return (
    <NavigationContainer>
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
    </NavigationContainer>
  );
};

export default AppNavigator;
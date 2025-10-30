import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather, Fontisto } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type TabName = 'home' | 'heart' | 'camera' | 'history' | 'user';

interface CustomTabBarProps {
  activeTab: TabName;
  onTabPress: (tab: TabName) => void;
}

const tabs: { name: TabName; icon: keyof typeof Fontisto.glyphMap }[] = [
  { name: 'home', icon: 'home' },
  { name: 'heart', icon: 'heart' },
  { name: 'camera', icon: 'camera' },
  { name: 'history', icon: 'history' },
  { name: 'user', icon: 'person' },
];

const CustomTabBar: React.FC<CustomTabBarProps> = ({ activeTab, onTabPress }) => {
  const insets = useSafeAreaInsets();
  
  const ACTIVE_COLOR = '#3B82F6'; 
  const INACTIVE_COLOR = '#888';

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      {tabs.map((tab) => {
        const isFocused = activeTab === tab.name;
        const color = isFocused ? ACTIVE_COLOR : INACTIVE_COLOR;

        return (
          <TouchableOpacity
            key={tab.name}
            style={styles.tabButton}
            onPress={() => onTabPress(tab.name)}
            activeOpacity={0.7}
          >
            <Fontisto name={tab.icon} size={24} color={color} />
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: 'white',
    height: 120,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 5,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 5,
  },
});

export default CustomTabBar;
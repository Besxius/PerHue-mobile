import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  StatusBar,
} from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, Feather, MaterialCommunityIcons, Fontisto } from '@expo/vector-icons';
import CustomTabBar from '../../tab-bar/CustomTabBar';

const logoIcon = require('../../assets/logo-icon-black.png');

const { width } = Dimensions.get('window');

const recentlyViewedImages = [
  'https://plus.unsplash.com/premium_photo-1752434963682-0cc26bb2d4f7?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=870',
  'https://images.unsplash.com/photo-1761646062286-cd2f3c8574dd?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=904',
  'https://plus.unsplash.com/premium_photo-1747852232208-ef9e129a65b6?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=774',
  'https://plus.unsplash.com/premium_photo-1698749257193-e881163207d6?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=774',
  'https://plus.unsplash.com/premium_photo-1694618623912-3d2288829cb5?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=774',
  'https://plus.unsplash.com/premium_photo-1694618623912-3d2288829cb5?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=774',
  'https://plus.unsplash.com/premium_photo-1694618623912-3d2288829cb5?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=774',
];
const colorTypeStyleVideos = [
  { uri: 'https://source.unsplash.com/random/400x600?shopping,girl,live', label: 'Live' },
  { uri: 'https://source.unsplash.com/random/400x600?pink,dress,girl', label: '' },
  { uri: 'https://source.unsplash.com/random/400x600?shopping,bags,girl', label: '' },
  { uri: 'https://source.unsplash.com/random/400x600?fashion,style,yellow', label: '' },
];

type TabName = 'home' | 'heart' | 'camera' | 'history' | 'user';

const HomeScreen: React.FC = () => {
  const insets = useSafeAreaInsets();

  const [activeTab, setActiveTab] = useState<TabName>('home');

  const handleTabPress = (tab: TabName) => {
    setActiveTab(tab);
    console.log(`Chuyển đến tab: ${tab}`);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 60 + insets.bottom + 20 }}
      >
        <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
          <View style={styles.profileContainer}>
            <Image source={logoIcon} style={styles.avatar} />
            <TouchableOpacity style={styles.activityButton}>
              <Text style={styles.activityButtonText}>My Activity</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.iconGroup}>
            <TouchableOpacity style={styles.iconButton}>
              <Ionicons name="notifications" size={30} color="black" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton}>
              <MaterialCommunityIcons name="package" size={30} color="black" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton}>
              <Fontisto name="player-settings" size={30} color="black" />
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.helloText}>Hello, Trongle!</Text>

        <TouchableOpacity style={styles.announcementCard}>
          <View>
            <Text style={styles.announcementTitle}>Announcement</Text>
            <Text style={styles.announcementBody} numberOfLines={2}>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas
              hendrerit luctus libero ac vulputate.
            </Text>
          </View>
          <Ionicons name="arrow-forward" size={24} color="white" style={styles.announcementArrow} />
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Recently expert viewed</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.recentlyViewedScroll}>
          {recentlyViewedImages.map((uri, index) => (
            <Image key={index} source={{ uri }} style={styles.recentlyViewedImage} />
          ))}
        </ScrollView>

        <Text style={styles.sectionTitle}>My Orders</Text>
        <View style={styles.orderTabs}>
          <TouchableOpacity style={styles.orderTabActive}>
            <Text style={styles.orderTabTextActive}>Sent</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.orderTabInactive}>
            <Text style={styles.orderTabTextInactive}>To Review</Text>
            <View style={styles.reviewDot} />
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Some color type style</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.colorStyleScroll}>
          {colorTypeStyleVideos.map((video, index) => (
            <TouchableOpacity key={index} style={styles.videoCard}>
              <Image source={{ uri: video.uri }} style={styles.videoThumbnail} />
              <View style={styles.playIconOverlay}>
                <Ionicons name="play-circle-outline" size={30} color="white" />
              </View>
              {video.label === 'Live' && (
                <View style={styles.liveBadge}>
                  <Text style={styles.liveBadgeText}>Live</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
        <View style={{ height: 30 }} />
      </ScrollView>

      <SafeAreaProvider>
        <CustomTabBar activeTab={activeTab} onTabPress={handleTabPress} />
      </SafeAreaProvider>
    </View>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 10,
  },
  activityButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  activityButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  iconGroup: {
    flexDirection: 'row',
  },
  iconButton: {
    marginLeft: 15,
  },
  helloText: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#333',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  announcementCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#444',
    borderRadius: 15,
    padding: 15,
    marginHorizontal: 20,
    marginBottom: 30,
  },
  announcementTitle: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 4,
  },
  announcementBody: {
    color: '#ccc',
    fontSize: 14,
    width: width - 120,
  },
  announcementArrow: {
    backgroundColor: '#3B82F6',
    borderRadius: 50,
    padding: 5,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  recentlyViewedScroll: {
    paddingLeft: 20,
    marginBottom: 30,
  },
  recentlyViewedImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  orderTabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  orderTabActive: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
  },
  orderTabTextActive: {
    color: 'white',
    fontWeight: 'bold',
  },
  orderTabInactive: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eee',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  orderTabTextInactive: {
    color: '#333',
    fontWeight: 'bold',
  },
  reviewDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'red',
    marginLeft: 5,
  },
  colorStyleScroll: {
    paddingLeft: 20,
  },
  videoCard: {
    width: width / 3 - 25,
    height: (width / 3 - 25) * 1.5,
    borderRadius: 15,
    marginRight: 15,
    overflow: 'hidden',
    position: 'relative',
  },
  videoThumbnail: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  playIconOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  liveBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'red',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 5,
  },
  liveBadgeText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
});
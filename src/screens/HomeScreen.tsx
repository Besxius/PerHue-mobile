import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import CustomHeader from '../components/CustomHeader';
import { RootStackParamList, TabName, TabRouteName } from '../navigation/AppNavigator';
import { CompositeScreenProps } from '@react-navigation/native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { ExpertInfo } from '../types/dataModels';
import { getExpertListRanked } from '../api/expertApi';

const { width } = Dimensions.get('window');

export type TabParamList = Record<TabRouteName, undefined>;
type HomeScreenProps = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'Home'>,
  NativeStackScreenProps<RootStackParamList>
>;

const DEFAULT_AVATAR_URI = 'https://images.unsplash.com/photo-1517841905240-472988babdf9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&ixlib=rb-4.0.3&q=80&w=400';
const DEFAULT_FALLBACK_URI = 'https://via.placeholder.com/400x600.png?text=No+Image';

const colorTypeStyleImages = [
  { uri: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&ixlib=rb-4.0.3&q=80&w=400', label: '' },
  { uri: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&ixlib=rb-4.0.3&q=80&w=400', label: '' },
  { uri: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&ixlib=rb-4.0.3&q=80&w=400', label: '' },
  { uri: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&ixlib=rb-4.0.3&q=80&w=400', label: '' },
];

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<TabName>('home');

  const [expertList, setExpertList] = useState<ExpertInfo[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchExperts = async () => {
      try {
        setIsLoading(true);
        const experts = await getExpertListRanked();
        setExpertList(experts);
        setError(null);
      } catch (e) {
        console.error('Error fetching ranked experts:', e);
        setError('Không thể tải danh sách chuyên gia. Vui lòng thử lại.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchExperts();
  }, []); // [] đảm bảo chỉ chạy một lần khi mount

  const handleTabPress = (tab: TabName) => {
    setActiveTab(tab);
    console.log(`Chuyển đến tab: ${tab}`);
  };

  const navigateToPackageScreen = () => {
    navigation.navigate('PackageScreen');
  };
  const navigateToNotificationScreen = () => {
    navigation.navigate("NotificationScreen");
  };

  const navigateToExpertDetail = (expert: ExpertInfo) => {
    // Sử dụng tên route 'ExpertDetailScreen' và truyền object expert qua params
    navigation.navigate('ExpertDetailScreen', { expert: expert });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 60 + insets.bottom + 20 }}
      >
        <CustomHeader
          onNavigateToPackage={navigateToPackageScreen}
          onNavigateToNotification={navigateToNotificationScreen}
        />

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

        {/* Hiển thị danh sách Famous Experts */}
        <Text style={styles.sectionTitle}>Famous Experts</Text>
        {isLoading ? (
          <ActivityIndicator size="large" color="#3B82F6" style={styles.loadingIndicator} />
        ) : error ? (
          <Text style={styles.errorText}>Lỗi: {error}</Text>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.recentlyViewedScroll}>
            {expertList.map((expert) => (
              <TouchableOpacity
                key={expert.id}
                style={styles.expertAvatarContainer}
                onPress={() => navigateToExpertDetail(expert)}
              >
                <Image
                  source={{
                    uri: expert.profilePicture || DEFAULT_AVATAR_URI
                  }}
                  style={styles.recentlyViewedImage}
                />
                <Text style={styles.expertName} numberOfLines={1}>{expert.nickname}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

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
          {colorTypeStyleImages.map((imageItem, index) => (
            <TouchableOpacity key={index} style={styles.videoCard}>
              <Image
                source={{ uri: imageItem.uri || DEFAULT_FALLBACK_URI }}
                style={styles.videoThumbnail}
              />
              {imageItem.label === 'Live' && (
                <View style={styles.liveBadge}>
                  <Text style={styles.liveBadgeText}>Live</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
        <View style={{ height: 30 }} />
      </ScrollView>

    </View>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
  loadingIndicator: {
    marginBottom: 30,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  recentlyViewedScroll: {
    paddingLeft: 20,
    marginBottom: 30,
    height: 120,
  },
  expertAvatarContainer: {
    width: 80,
    marginRight: 15,
    alignItems: 'center',
  },
  recentlyViewedImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 2,
    borderColor: '#3B82F6',
    marginBottom: 5,
  },
  expertName: {
    fontSize: 12,
    color: '#333',
    textAlign: 'center',
    fontWeight: '600',
    marginTop: 4,
    width: '100%',
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
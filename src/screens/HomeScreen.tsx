import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
  FlatList,
  NativeSyntheticEvent,
  NativeScrollEvent,
  ViewStyle,
  ImageSourcePropType,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useVideoPlayer, VideoView } from 'expo-video';

import CustomHeader from '../components/CustomHeader';
import { RootStackParamList, TabRouteName } from '../navigation/AppNavigator';
import { CompositeScreenProps } from '@react-navigation/native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { ExpertInfo } from '../types/dataModels';
import { getExpertListRanked } from '../api/expertApi';
import { useAuth } from './auth/AuthContext';

const { width } = Dimensions.get('window');
const DISPLAY_WIDTH = width - 20;
const BLUE_COLOR = '#3B82F6';

const PICTURES_GROUP_1 = [
  require('../assets/picture/1.png'),
  require('../assets/picture/2.png'),
  require('../assets/picture/3.png'),
  require('../assets/picture/4.png'),
];

const PICTURES_GROUP_2 = [
  require('../assets/picture/5.png'),
  require('../assets/picture/6.png'),
  require('../assets/picture/7.png'),
];

const VIDEOS = [
  require('../assets/video/radiant-skin.mp4'),
  require('../assets/video/status-colors.mp4'),
];

export type TabParamList = Record<TabRouteName, undefined>;
type HomeScreenProps = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'Home'>,
  NativeStackScreenProps<RootStackParamList>
>;

const DEFAULT_AVATAR_URI = 'https://images.unsplash.com/photo-1517841905240-472988babdf9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&ixlib=rb-4.0.3&q=80&w=400';

const DynamicImageItem = ({ source }: { source: ImageSourcePropType }) => {
  const { width: originalWidth, height: originalHeight } = Image.resolveAssetSource(source);
  const dynamicHeight = DISPLAY_WIDTH * (originalHeight / originalWidth);

  return (
    <View style={{ width: width, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{
        width: DISPLAY_WIDTH,
        height: dynamicHeight,
        borderRadius: 15,
        overflow: 'hidden',
        backgroundColor: '#f0f0f0'
      }}>
        <Image
          source={source}
          style={{ width: '100%', height: '100%' }}
          resizeMode="contain"
        />
      </View>
    </View>
  );
};

interface CarouselProps {
  data: any[];
}

const AutoScrollingCarousel: React.FC<CarouselProps> = ({ data }) => {
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (data.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => {
        const nextIndex = prevIndex === data.length - 1 ? 0 : prevIndex + 1;
        flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
        return nextIndex;
      });
    }, 3000);
    return () => clearInterval(interval);
  }, [data.length]);

  const onMomentumScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / width);
    setCurrentIndex(index);
  };

  return (
    <View style={{ marginBottom: 20 }}>
      <FlatList
        ref={flatListRef}
        data={data}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(_, index) => index.toString()}
        onMomentumScrollEnd={onMomentumScrollEnd}
        renderItem={({ item }) => <DynamicImageItem source={item} />}
      />
      <View style={styles.paginationContainer}>
        {data.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              { backgroundColor: index === currentIndex ? '#3B82F6' : '#E5E7EB' }
            ]}
          />
        ))}
      </View>
    </View>
  );
};

interface VideoPlayerProps {
  source: any;
  style?: ViewStyle;
}

const VideoPlayerItem: React.FC<VideoPlayerProps> = ({ source, style }) => {
  const player = useVideoPlayer(source, (player) => {
    player.loop = true;
    player.muted = true;
    player.play();
  });

  return (
    <View style={[styles.videoContainer, style]}>
      <VideoView
        style={styles.video}
        player={player}
        nativeControls={false}
        contentFit="cover"
      />
    </View>
  );
};

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { userName } = useAuth();

  const [expertList, setExpertList] = useState<ExpertInfo[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [refreshing, setRefreshing] = useState(false);

  const displayFirstName = useMemo(() => {
    if (userName) {
      return userName.split(' ')[0];
    }
    return 'User';
  }, [userName]);

  const fetchExperts = useCallback(async (isRefetch = false) => {
    if (!isRefetch) setIsLoading(true);
    setError(null);
    try {
      const experts = await getExpertListRanked();
      setExpertList(experts);
    } catch (e) {
      console.error('Error fetching experts:', e);
      setError('Không thể tải danh sách chuyên gia.');
    } finally {
      setIsLoading(false);
      if (isRefetch) setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchExperts();
  }, [fetchExperts]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      fetchExperts(true),
    ]);
  }, [fetchExperts]);

  const navigateToExpertDetail = (expert: ExpertInfo) => {
    navigation.navigate('ExpertDetailScreen', { expert: expert });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 60 + insets.bottom + 20 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[BLUE_COLOR]}
            tintColor={BLUE_COLOR}
            progressViewOffset={50}
          />
        }
      >
        <CustomHeader
          onNavigateToPackage={() => navigation.navigate('PackageScreen')}
          onNavigateToNotification={() => navigation.navigate("NotificationScreen")}
        />

        <View style={styles.welcomeContainer}>
          <View>
            <Text style={styles.greetingText}>Hello,</Text>
            <Text style={styles.userNameText}>{displayFirstName}</Text>
            <Text style={styles.subGreetingText}>Ready to find your best colors?</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('UserScreen')} style={styles.profileLinkButton}>
            <Ionicons name="arrow-forward-circle-outline" size={32} color="#000000ff" />
          </TouchableOpacity>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Featured Styles</Text>
          <Text style={styles.sectionSubtitle}>Discover the latest trends</Text>
        </View>
        <AutoScrollingCarousel data={PICTURES_GROUP_1} />

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Style Inspiration</Text>
        </View>
        <VideoPlayerItem
          source={VIDEOS[0]}
          style={{ height: 700 }}
        />

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Top Experts</Text>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>

        {isLoading && !refreshing ? (
          <ActivityIndicator size="large" color={BLUE_COLOR} style={styles.loadingIndicator} />
        ) : error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.recentlyViewedScroll}>
            {expertList.map((expert) => (
              <TouchableOpacity
                key={expert.id}
                style={styles.expertAvatarContainer}
                onPress={() => navigateToExpertDetail(expert)}
              >
                <View style={styles.avatarBorder}>
                  <Image
                    source={{ uri: expert.profilePicture || DEFAULT_AVATAR_URI }}
                    style={styles.recentlyViewedImage}
                  />
                </View>
                <Text style={styles.expertName} numberOfLines={1}>{expert.nickname}</Text>
                <Text style={styles.expertRole} numberOfLines={1}>{expert.specialization}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Trend Collection</Text>
        </View>
        <AutoScrollingCarousel data={PICTURES_GROUP_2} />

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>How colors affect to you?</Text>
        </View>
        <VideoPlayerItem
          source={VIDEOS[1]}
          style={{ height: 250 }}
        />

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
  welcomeContainer: {
    paddingHorizontal: 20,
    marginTop: 10,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greetingText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  userNameText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#333',
    letterSpacing: 0.5,
  },
  subGreetingText: {
    fontSize: 14,
    color: '#999',
    marginTop: 2,
  },
  profileLinkButton: {
    padding: 5,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    marginTop: 15,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
    fontWeight: '500',
  },
  seeAllText: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '600',
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
    marginBottom: 20,
    height: 140,
  },
  expertAvatarContainer: {
    width: 90,
    marginRight: 15,
    alignItems: 'center',
  },
  avatarBorder: {
    borderRadius: 40,
    borderWidth: 2,
    borderColor: '#3B82F6',
    padding: 2,
    marginBottom: 6,
  },
  recentlyViewedImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  expertName: {
    fontSize: 13,
    color: '#333',
    textAlign: 'center',
    fontWeight: '700',
    width: '100%',
  },
  expertRole: {
    fontSize: 11,
    color: '#888',
    textAlign: 'center',
    width: '100%',
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 3,
  },
  videoContainer: {
    width: DISPLAY_WIDTH,
    marginHorizontal: 10,
    borderRadius: 15,
    overflow: 'hidden',
    marginBottom: 20,
    backgroundColor: '#f5f5f5',
    height: 200,
  },
  video: {
    width: '100%',
    height: '100%',
  },
});
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    interpolate,
    Extrapolate,
} from 'react-native-reanimated';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Ionicons from '@expo/vector-icons/Ionicons';
import Toast from 'react-native-toast-message';
import { Notification } from '../types/dataModels';
import { getNotifications, markAllNotificationAsRead, markNotificationAsRead } from '../api/notificationApi';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { requestUserPermission, getFCMToken, onMessageReceived } from '../services/fcmService';

type NotificationScreenProps = NativeStackScreenProps<RootStackParamList, 'NotificationScreen'>;

const { width } = Dimensions.get('window');
const PADDING_HORIZONTAL = 16;
const CONTAINER_WIDTH = width - PADDING_HORIZONTAL * 2;
const TAB_GAP = 30;

type NotificationTab = 'currentMonth' | 'allTime';

const getIconProps = (type: string) => {
    switch (type) {
        case 'TestRequest': return { iconPlaceholder: '📝', iconBgColor: '#E6F7FF', groupName: 'TEST REQUESTS' };
        case 'TestResult': return { iconPlaceholder: '✅', iconBgColor: '#F0FFF0', groupName: 'TEST RESULTS' };
        case 'ReviewRequest': return { iconPlaceholder: '👀', iconBgColor: '#FFF0F5', groupName: 'REVIEW REQUESTS' };
        case 'ReviewResult': return { iconPlaceholder: '📋', iconBgColor: '#E6E6FA', groupName: 'REVIEW RESULTS' };
        case 'ResultUpdate': return { iconPlaceholder: '🔄', iconBgColor: '#F0F8FF', groupName: 'UPDATES' };
        case 'RatingReceived': return { iconPlaceholder: '⭐', iconBgColor: '#FFFACD', groupName: 'RATINGS' };
        case 'DeadlineWarning': return { iconPlaceholder: '⚠️', iconBgColor: '#FFF3E0', groupName: 'WARNINGS' };
        case 'Penalty': return { iconPlaceholder: '🚫', iconBgColor: '#FFEBEE', groupName: 'PENALTIES' };
        case 'Refund': return { iconPlaceholder: '💸', iconBgColor: '#F5F5DC', groupName: 'REFUNDS' };
        case 'System':
        case 'SystemUpdate': return { iconPlaceholder: '⚙️', iconBgColor: '#F7F7F7', groupName: 'SYSTEM' };
        default: return { iconPlaceholder: '🔔', iconBgColor: '#F7F7F7', groupName: 'GENERAL NOTIFICATIONS' };
    }
};
interface NotificationItemProps extends Notification {
    onReadPress: (notificationId: number) => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({ id, title, content, time, isRead, onReadPress, type }) => {
    const { iconPlaceholder, iconBgColor } = getIconProps(type);

    const formatTime = (isoTime: string) => {
        const date = new Date(isoTime);
        return date.toLocaleDateString() + ' • ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <TouchableOpacity
            style={[styles.notificationCard, isRead && styles.readCard]}
            onPress={() => onReadPress(id)}
            activeOpacity={isRead ? 0.8 : 0.6}
        >
            <View style={[styles.iconContainer, { backgroundColor: iconBgColor }]}>
                <Text style={styles.iconText}>{iconPlaceholder}</Text>
            </View>
            <View style={styles.textContainer}>
                <Text style={[styles.typeText, isRead && styles.readText]}>{title}</Text>
                <Text style={[styles.messageText, isRead && styles.readText]}>{content}</Text>
                <Text style={[styles.timeText, isRead && styles.readText]}>{formatTime(time)}</Text>
            </View>
        </TouchableOpacity>
    );
};

const groupNotificationsByType = (data: Notification[]) => {
    return data.reduce((acc, notification) => {
        const type = notification.type;
        const groupKey = type;
        if (!acc[groupKey]) {
            acc[groupKey] = [];
        }
        acc[groupKey].push(notification);
        return acc;
    }, {} as Record<string, Notification[]>);
};
interface TabContentProps {
    data: Notification[];
    isLoading: boolean;
    onNotificationPress: (id: number) => void;
    refreshing: boolean;
    onRefresh: () => void;
}

const TabContent: React.FC<TabContentProps> = ({ data, isLoading, onNotificationPress, refreshing, onRefresh }) => {
    const groupedData = useMemo(() => groupNotificationsByType(data), [data]);
    const notificationTypes = Object.keys(groupedData);

    return (
        <View style={styles.tabContent}>
            {isLoading ? (
                <View style={[styles.loadingContainer]}>
                    <ActivityIndicator size="large" color="#0000ff" />
                </View>
            ) : (
                <ScrollView
                    contentContainerStyle={data.length === 0 ? styles.emptyScrollContainer : styles.scrollContentContainer}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={['#4285F4']}
                            tintColor="#4285F4"
                        />
                    }
                >
                    {data.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>No notifications found.</Text>
                        </View>
                    ) : (
                        <>
                            {notificationTypes.map(type => (
                                <View key={type} style={styles.notificationGroup}>
                                    <Text style={styles.groupTitle}>{getIconProps(type).groupName}</Text>

                                    {groupedData[type].map(notification => (
                                        <NotificationItem
                                            key={notification.id}
                                            {...notification}
                                            onReadPress={onNotificationPress}
                                        />
                                    ))}
                                </View>
                            ))}
                            <View style={{ height: 40 }} />
                        </>
                    )}
                </ScrollView>
            )}
        </View>
    );
};

const NotificationScreen: React.FC<NotificationScreenProps> = ({ navigation }) => {
    const [activeTab, setActiveTab] = useState<NotificationTab>('currentMonth');
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [showUnreadOnly, setShowUnreadOnly] = useState(false);

    const translateX = useSharedValue(0);

    const fetchNotifications = useCallback(async (isBackgroundRefresh = false) => {
        if (!isBackgroundRefresh) {
            setIsLoading(true);
        }
        try {
            const data = await getNotifications();
            setNotifications(data.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()));
        } catch (e) {
            console.error(e);
            Toast.show({ type: 'error', text1: 'Load Failed', text2: 'Could not load notifications from API.', visibilityTime: 3000 });
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    useEffect(() => {
        const setupFCM = async () => {
            const hasPermission = await requestUserPermission();
            if (hasPermission) {
                await getFCMToken();
            }
        };

        setupFCM();

        const unsubscribe = onMessageReceived((remoteMessage) => {
            const notificationTitle = remoteMessage.notification?.title || 'New Notification';
            const notificationBody = remoteMessage.notification?.body || 'You have a new update.';

            Toast.show({
                type: 'info',
                text1: notificationTitle,
                text2: notificationBody,
                visibilityTime: 4000,
                onPress: () => {
                    handleTabPress('currentMonth');
                }
            });

            fetchNotifications(true);
        });

        return () => {
            unsubscribe();
        };
    }, [fetchNotifications]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchNotifications(true);
        setRefreshing(false);
    }, [fetchNotifications]);

    const getMonthStart = (date: Date) => {
        return new Date(date.getFullYear(), date.getMonth(), 1);
    };

    const currentMonthData = useMemo(() => {
        const currentMonthStart = getMonthStart(new Date());
        return notifications.filter(n => new Date(n.time) >= currentMonthStart);
    }, [notifications]);

    const allTimeData = notifications;

    const filteredCurrentMonth = currentMonthData.filter(n => showUnreadOnly ? !n.isRead : true);
    const filteredAllTime = allTimeData.filter(n => showUnreadOnly ? !n.isRead : true);

    const activeData = activeTab === 'currentMonth' ? filteredCurrentMonth : filteredAllTime;

    const handleNotificationPress = useCallback(async (notificationId: number) => {
        const notification = notifications.find(n => n.id === notificationId);

        if (!notification) return;

        const { type, testRequestId } = notification;

        // --- Logic Điều Hướng ---
        switch (type) {
            case 'TestRequest':
                if (testRequestId) navigation.navigate('CreateExpertTestResponse' as any, { id: testRequestId });
                break;
            case 'TestResult':
                if (testRequestId) navigation.navigate('ExpertDetailScreen' as any, { id: testRequestId });
                break;
            case 'ReviewRequest':
                if (testRequestId) navigation.navigate('ExpertReviewDetailScreen' as any, { id: testRequestId });
                break;
            case 'ReviewResult':
            case 'ResultUpdate':
                if (testRequestId) navigation.navigate('ExpertTestResponseDetailScreen' as any, { responseId: testRequestId });
                break;
            case 'RatingReceived':
                navigation.navigate('MySalaryScreen' as any);
                break;
            case 'DeadlineWarning':
                navigation.navigate('HistoryScreen' as any, { initialTab: 'Expert', filter: 'Pending' });
                break;
            case 'Penalty':
                navigation.navigate('HistoryScreen' as any, { initialTab: 'Expert', filter: 'Expired' });
                break;
            case 'Refund':
                navigation.navigate('MySubscriptionScreen' as any);
                break;
            case 'System':
                break;
            case 'SystemUpdate':
                break;
            default:
                console.log("Unknown notification type:", type);
                break;
        }

        if (!notification.isRead) {
            setNotifications(prev => prev.map(n =>
                n.id === notificationId ? { ...n, isRead: true } : n
            ));

            try {
                await markNotificationAsRead(notificationId);
            } catch (e) {
                setNotifications(prev => prev.map(n =>
                    n.id === notificationId ? { ...n, isRead: false } : n
                ));
                Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to mark as read.', visibilityTime: 3000 });
            }
        }
    }, [notifications, navigation]);

    const handleTabPress = (tab: NotificationTab) => {
        setActiveTab(tab);
        const index = tab === 'currentMonth' ? 0 : 1;
        translateX.value = withTiming(-index * (CONTAINER_WIDTH + TAB_GAP), { duration: 300 });
    };

    const animatedContentStyle = useAnimatedStyle(() => {
        return {
            width: (CONTAINER_WIDTH * 2) + TAB_GAP,
            flexDirection: 'row',
            gap: TAB_GAP,
            transform: [{ translateX: translateX.value }],
        };
    });

    const animatedIndicatorStyle = useAnimatedStyle(() => {
        const index = activeTab === 'currentMonth' ? 0 : 1;

        const indicatorTranslate = interpolate(
            translateX.value,
            [0, -CONTAINER_WIDTH],
            [0, (CONTAINER_WIDTH / 2) + 10],
            Extrapolate.CLAMP
        );

        return {
            transform: [{ translateX: indicatorTranslate }],
        };
    });

    const handleMarkAllRead = async () => {
        if (notifications.every(n => n.isRead)) {
            Toast.show({ type: 'info', text1: 'Info', text2: 'All notifications are already marked as read.', visibilityTime: 2000 });
            return;
        }

        try {
            await markAllNotificationAsRead();

            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setShowUnreadOnly(false);

            Toast.show({ type: 'success', text1: 'Success', text2: 'All notifications marked as read.', visibilityTime: 3000 });
        } catch (e) {
            Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to mark all as read.', visibilityTime: 3000 });
        }
    };

    return (
        <View style={styles.container}>

            {/* Thanh Tab - Tab Bar */}
            <View style={styles.tabBarContainer}>
                <View style={styles.tabBar}>
                    <TouchableOpacity
                        style={styles.tabButton}
                        onPress={() => handleTabPress('currentMonth')}
                    >
                        <Text style={activeTab === 'currentMonth' ? styles.activeTabText : styles.tabText}>Current Month</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.tabButton}
                        onPress={() => handleTabPress('allTime')}
                    >
                        <Text style={activeTab === 'allTime' ? styles.activeTabText : styles.tabText}>All Time</Text>
                    </TouchableOpacity>

                    {/* Thanh chỉ báo hoạt ảnh */}
                    <Animated.View style={[styles.tabIndicator, animatedIndicatorStyle]} />
                </View>
            </View>

            {/* Thanh điều khiển (Đọc tất cả và Lọc) */}
            <View style={styles.controlBar}>
                {/* Nút Đọc tất cả */}
                <TouchableOpacity onPress={handleMarkAllRead} style={styles.controlButton}>
                    <Ionicons name="checkmark-done-circle-outline" size={20} color="#000" />
                    <Text style={styles.controlText}>Read All</Text>
                </TouchableOpacity>

                {/* Nút Lọc chưa đọc */}
                <TouchableOpacity
                    onPress={() => setShowUnreadOnly(prev => !prev)}
                    style={[
                        styles.controlButton,
                        showUnreadOnly && styles.activeControlButton
                    ]}
                >
                    <FontAwesome
                        name={showUnreadOnly ? "filter" : "filter"}
                        size={20}
                        color={showUnreadOnly ? "#fff" : "#000"}
                    />
                    <Text style={[styles.controlText, showUnreadOnly && { color: '#fff' }]}>
                        {showUnreadOnly ? 'Unread' : 'Unread'}
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Vùng chứa nội dung tab */}
            <View style={styles.contentWrapper}>
                <Animated.View style={[styles.animatedContent, animatedContentStyle]}>

                    <TabContent
                        data={filteredCurrentMonth}
                        isLoading={isLoading}
                        onNotificationPress={handleNotificationPress}
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                    />

                    <TabContent
                        data={filteredAllTime}
                        isLoading={isLoading}
                        onNotificationPress={handleNotificationPress}
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                    />
                </Animated.View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        paddingTop: 10,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyScrollContainer: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 200,
    },
    emptyText: {
        fontSize: 16,
        color: '#888',
        marginTop: 20,
    },
    // --- Tab Bar Styles ---
    tabBarContainer: {
        paddingHorizontal: PADDING_HORIZONTAL,
        marginBottom: 10,
    },
    tabBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        backgroundColor: '#F7F7F7',
        borderRadius: 25,
        padding: 3,
        position: 'relative',
    },
    tabIndicator: {
        position: 'absolute',
        height: '100%',
        width: '50%',
        backgroundColor: '#fff',
        borderRadius: 25,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
    },
    tabButton: {
        flex: 1,
        paddingVertical: 10,
        paddingHorizontal: 15,
        alignItems: 'center',
        zIndex: 1,
    },
    tabText: {
        fontSize: 14,
        fontWeight: '400',
        color: '#888',
    },
    activeTabText: {
        fontWeight: '600',
        color: '#000',
    },
    notificationGroup: {
        marginBottom: 20,
    },
    groupTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#333',
        marginBottom: 10,
    },
    controlBar: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        paddingHorizontal: PADDING_HORIZONTAL,
        marginBottom: 20,
        gap: 10,
    },
    controlButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f0f0f0',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#ccc',
    },
    activeControlButton: {
        backgroundColor: '#000',
        borderColor: '#000',
    },
    controlText: {
        marginLeft: 5,
        fontSize: 13,
        fontWeight: '500',
        color: '#000',
    },
    // --- Animated Content Styles ---
    contentWrapper: {
        flex: 1,
        overflow: 'hidden',
        paddingHorizontal: PADDING_HORIZONTAL,
    },
    animatedContent: {
        flexDirection: 'row',
        gap: 0,
    },
    tabContent: {
        width: CONTAINER_WIDTH,
        flex: 1,
    },
    scrollContentContainer: {
        // ...
    },
    // --- Notification Card Styles ---
    notificationCard: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 15,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#eee',
    },
    readCard: {
        opacity: 0.6,
        backgroundColor: '#FAFAFA',
    },
    readText: {
        color: '#A0A0A0',
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    iconText: {
        fontSize: 24,
    },
    textContainer: {
        flex: 1,
    },
    typeText: {
        fontWeight: 'bold',
        fontSize: 16,
        marginBottom: 5,
    },
    messageText: {
        fontSize: 14,
        color: '#555',
        marginBottom: 8,
        lineHeight: 20,
    },
    timeText: {
        fontSize: 12,
        color: '#888',
    },
});

export default NotificationScreen;
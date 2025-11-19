import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, ScrollView } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    interpolate,
    Extrapolate,
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');
const PADDING_HORIZONTAL = 16;
const CONTAINER_WIDTH = width - PADDING_HORIZONTAL * 2;

// --- Dữ liệu mô phỏng ---
// Thêm nhiều mục hơn để đảm bảo cuộn được
const dailyNotifications = [
    { id: '1', type: 'Thank You, Mom!', message: "You're doing an amazing job today!...", time: 'Oct 22, 2025 • 10:30 AM', iconPlaceholder: '✨', iconBgColor: '#FFFBEA' },
    { id: '2', type: "Today's Health Tip", message: 'Remember to stay hydrated! Aim for 8-10 glasses...', time: 'Oct 22, 2025 • 8:30 AM', iconPlaceholder: '💖', iconBgColor: '#FFF0F5' },
    { id: '3', type: 'Nutrition Reminder', message: 'Include foods rich in iron and folate in your meals...', time: 'Oct 22, 2025 • 7:00 AM', iconPlaceholder: '🍏', iconBgColor: '#F0FFF0' },
    { id: '4', type: 'Medication Check', message: 'Time for your prenatal vitamin. Don\'t forget to log it.', time: 'Oct 22, 2025 • 6:30 AM', iconPlaceholder: '💊', iconBgColor: '#F2E6FF' },
    { id: '5', type: 'Sleep Goal', message: 'Aim for 7-9 hours of sleep tonight for optimal rest.', time: 'Oct 21, 2025 • 10:00 PM', iconPlaceholder: '😴', iconBgColor: '#E6F9FF' },
    { id: '6', type: 'Appointment', message: 'Confirm your next check-up with your doctor tomorrow.', time: 'Oct 21, 2025 • 4:00 PM', iconPlaceholder: '🏥', iconBgColor: '#FFE6E6' },
    { id: '7', type: 'Relax Time', message: 'Take 10 minutes for yourself. Try a short guided meditation.', time: 'Oct 21, 2025 • 2:00 PM', iconPlaceholder: '🧘', iconBgColor: '#E6FFE6' },
];

const monthlyUpdates = [
    { id: 'm1', type: 'Month 7 Milestone', message: 'Review your third-trimester checklist and appointments...', time: 'Oct 1, 2025 • 9:00 AM', iconPlaceholder: '🗓️', iconBgColor: '#E6F7FF' },
    { id: 'm2', type: 'Birth Plan Workshop', message: 'A reminder about the upcoming birth plan virtual session...', time: 'Sep 15, 2025 • 2:00 PM', iconPlaceholder: '👶', iconBgColor: '#FAF0E6' },
    { id: 'm3', type: 'Financial Planning', message: 'Start budgeting for post-delivery expenses and leave.', time: 'Sep 1, 2025 • 10:00 AM', iconPlaceholder: '💰', iconBgColor: '#FFFBEA' },
    { id: 'm4', type: 'Baby Shower Invite', message: 'RSVP for the baby shower on November 5th.', time: 'Aug 20, 2025 • 1:00 PM', iconPlaceholder: '🥳', iconBgColor: '#FFE6FF' },
    { id: 'm5', type: 'Reading List', message: 'Recommended books on newborn care and parenting.', time: 'Aug 1, 2025 • 11:00 AM', iconPlaceholder: '📚', iconBgColor: '#F0FFF0' },
];

// --- Component cho mỗi mục thông báo ---
const NotificationItem: React.FC<typeof dailyNotifications[0]> = ({ type, message, time, iconPlaceholder, iconBgColor }) => (
    <View style={styles.notificationCard}>
        <View style={[styles.iconContainer, { backgroundColor: iconBgColor }]}>
            <Text style={styles.iconText}>{iconPlaceholder}</Text>
        </View>
        <View style={styles.textContainer}>
            <Text style={styles.typeText}>{type}</Text>
            <Text style={styles.messageText}>{message.substring(0, 70) + '...'}</Text>
            <Text style={styles.timeText}>{time}</Text>
        </View>
    </View>
);

// --- Component hiển thị nội dung Tab (Dùng ScrollView) ---
interface TabContentProps {
    data: typeof dailyNotifications;
}

const TabContent: React.FC<TabContentProps> = ({ data }) => (
    <ScrollView
        style={styles.tabContent}
        contentContainerStyle={styles.scrollContentContainer}
        showsVerticalScrollIndicator={false}
    >
        {data.map(notification => (
            <NotificationItem key={notification.id} {...notification} />
        ))}
        <View style={{ height: 40 }} /> {/* Thêm khoảng cách đệm cuối */}
    </ScrollView>
);

// --- Component chính cho màn hình ---
const NotificationScreen: React.FC = () => {
    const [activeTabIndex, setActiveTabIndex] = useState(0);
    const translateX = useSharedValue(0);

    const handleTabPress = (index: number) => {
        setActiveTabIndex(index);
        translateX.value = withTiming(-index * CONTAINER_WIDTH, { duration: 300 });
    };

    const animatedContentStyle = useAnimatedStyle(() => {
        return {
            transform: [{ translateX: translateX.value }],
            width: CONTAINER_WIDTH * 2,
        };
    });

    const animatedIndicatorStyle = useAnimatedStyle(() => {
        const indicatorTranslate = interpolate(
            translateX.value,
            [0, -CONTAINER_WIDTH],
            [0, (CONTAINER_WIDTH / 2) + 10], // Vị trí cuối của indicator
            Extrapolate.CLAMP
        );

        return {
            transform: [{ translateX: indicatorTranslate }],
        };
    });

    return (
        <View style={styles.container}>
            {/* Thanh Tab - Tab Bar */}
            <View style={styles.tabBarContainer}>
                <View style={styles.tabBar}>
                    <TouchableOpacity
                        style={styles.tabButton}
                        onPress={() => handleTabPress(0)}
                    >
                        <Text style={activeTabIndex === 0 ? styles.activeTabText : styles.tabText}>Daily Notifications</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.tabButton}
                        onPress={() => handleTabPress(1)}
                    >
                        <Text style={activeTabIndex === 1 ? styles.activeTabText : styles.tabText}>Monthly Updates</Text>
                    </TouchableOpacity>

                    {/* Thanh chỉ báo hoạt ảnh */}
                    <Animated.View style={[styles.tabIndicator, animatedIndicatorStyle]} />
                </View>
            </View>

            {/* Vùng chứa nội dung tab */}
            <View style={styles.contentWrapper}>
                <Animated.View style={[styles.animatedContent, animatedContentStyle]}>
                    <TabContent data={dailyNotifications} />
                    <TabContent data={monthlyUpdates} />
                </Animated.View>
            </View>
        </View>
    );
};

// --- StyleSheet ---
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        paddingTop: 10,
    },
    // --- Tab Bar Styles ---
    tabBarContainer: {
        paddingHorizontal: PADDING_HORIZONTAL,
        marginBottom: 20,
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
    // --- Animated Content Styles ---
    contentWrapper: {
        flex: 1, // Chiếm hết phần còn lại của màn hình
        overflow: 'hidden',
        paddingHorizontal: PADDING_HORIZONTAL,
    },
    animatedContent: {
        flexDirection: 'row',
    },
    tabContent: {
        width: CONTAINER_WIDTH,
        flex: 1, // Rất quan trọng cho ScrollView
    },
    scrollContentContainer: {
        // Không cần paddingBottom nếu đã có View đệm cuối
    },
    // --- Notification Card Styles (Giữ nguyên) ---
    notificationCard: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 15,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#eee',
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
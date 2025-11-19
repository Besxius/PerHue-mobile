import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    StatusBar,
    Alert,
    SectionList,
    Platform
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, Feather, AntDesign, FontAwesome5 } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useAuth } from './auth/AuthContext';
import { unifiedLogout } from '../api/authApi';
import CustomHeader from '../components/CustomHeader';

// ⚠️ Kiểu props chính xác cho SettingScreen (nếu nó là tab 'Menu')
type SettingScreenProps = NativeStackScreenProps<RootStackParamList, 'Tabs'>;

// Định nghĩa kiểu cho mỗi mục cài đặt
interface SettingItem {
    id: string;
    icon: React.ComponentProps<typeof Ionicons>['name'] | React.ComponentProps<typeof MaterialCommunityIcons>['name'] | React.ComponentProps<typeof AntDesign>['name'] | React.ComponentProps<typeof Feather>['name'] | React.ComponentProps<typeof FontAwesome5>['name'];
    iconSet: 'Ionicons' | 'MaterialCommunityIcons' | 'Feather' | 'AntDesign' | 'FontAwesome5';
    label: string;
    action: 'navigate' | 'action' | 'logout';
    targetScreen?: keyof RootStackParamList | string;
}

// Dữ liệu cấu hình cho màn hình (Giữ nguyên)
const SETTINGS_DATA: { title: string; data: SettingItem[] }[] = [
    {
        title: 'Account',
        data: [
            { id: '1', icon: 'person-outline', iconSet: 'Ionicons', label: 'Edit profile', action: 'navigate', targetScreen: 'UserScreen' },
            { id: '2', icon: 'shield-lock-outline', iconSet: 'MaterialCommunityIcons', label: 'Security', action: 'navigate', targetScreen: 'Security' },
            { id: '3', icon: 'bell', iconSet: 'Feather', label: 'Notifications', action: 'navigate', targetScreen: 'Notifications' },
            { id: '4', icon: 'lock-closed-outline', iconSet: 'Ionicons', label: 'Privacy', action: 'navigate', targetScreen: 'Privacy' },
        ],
    },
    {
        title: 'Support & About',
        data: [
            { id: '5', icon: 'folder-outline', iconSet: 'Ionicons', label: 'My Subscribtion', action: 'navigate', targetScreen: 'MySubscription' },
            { id: '6', icon: 'help-circle-outline', iconSet: 'Ionicons', label: 'Help & Support', action: 'navigate', targetScreen: 'HelpAndSupport' },
            { id: '7', icon: 'shield', iconSet: 'Feather', label: 'Terms and Policies', action: 'navigate', targetScreen: 'TermsAndPolicies' },
        ],
    },
    {
        title: 'Cache & cellular',
        data: [
            { id: '8', icon: 'trash-can-outline', iconSet: 'MaterialCommunityIcons', label: 'Free up space', action: 'action', targetScreen: 'FreeUpSpace' },
            { id: '9', icon: 'trending-down', iconSet: 'Feather', label: 'Data Saver', action: 'action', targetScreen: 'DataSaver' },
        ],
    },
    {
        title: 'Actions',
        data: [
            { id: '10', icon: 'flag', iconSet: 'Feather', label: 'Report a problem', action: 'action', targetScreen: 'ReportProblem' },
            { id: '11', icon: 'account-plus-outline', iconSet: 'MaterialCommunityIcons', label: 'Add account', action: 'action', targetScreen: 'AddAccount' },
            { id: '12', icon: 'log-out-outline', iconSet: 'Ionicons', label: 'Log out', action: 'logout', targetScreen: 'LogOut' },
        ],
    },
];

// Hàm render icon (giúp gọi đúng icon set) - Giữ nguyên
const renderIcon = (item: SettingItem) => {
    const size = 24;
    const color = '#333';

    switch (item.iconSet) {
        case 'Ionicons':
            return <Ionicons name={item.icon as React.ComponentProps<typeof Ionicons>['name']} size={size} color={color} />;
        case 'MaterialCommunityIcons':
            return <MaterialCommunityIcons name={item.icon as React.ComponentProps<typeof MaterialCommunityIcons>['name']} size={size} color={color} />;
        case 'Feather':
            return <Feather name={item.icon as React.ComponentProps<typeof Feather>['name']} size={size} color={color} />;
        case 'AntDesign':
            return <AntDesign name={item.icon as React.ComponentProps<typeof AntDesign>['name']} size={size} color={color} />;
        case 'FontAwesome5':
            return <FontAwesome5 name={item.icon as React.ComponentProps<typeof FontAwesome5>['name']} size={size} color={color} />;
        default:
            return <Ionicons name="settings-outline" size={size} color={color} />;
    }
}

// Component chính
const SettingScreen: React.FC<any> = ({ navigation }) => {
    const insets = useSafeAreaInsets();
    const { setIsLoggedIn } = useAuth();

    const navigateToPackageScreen = () => {
        // Tên route phải khớp với tên bạn đã định nghĩa trong Navigator
        navigation.navigate('PackageScreen');
    };
    const navigateToNotificationScreen = () => {
        navigation.navigate("NotificationScreen");
    };

    // Logic xử lý đăng xuất/hành động/điều hướng (Giữ nguyên)
    const handlePress = (item: SettingItem) => {
        if (item.action === 'navigate' && item.targetScreen) {
            // Đảm bảo chỉ điều hướng đến các màn hình có tồn tại trong RootStackParamList
            if (navigation.canGoBack()) {
                navigation.navigate(item.targetScreen as keyof RootStackParamList);
            } else {
                console.warn(`Màn hình ${item.targetScreen} không tồn tại hoặc không thể điều hướng.`);
            }
        } else if (item.action === 'logout') {
            Alert.alert(
                'Đăng xuất',
                'Bạn có chắc chắn muốn đăng xuất?',
                [
                    { text: 'Hủy', style: 'cancel' },
                    {
                        text: 'Đăng xuất',
                        style: 'destructive',
                        onPress: async () => {
                            await unifiedLogout();
                            setIsLoggedIn(false);
                        },
                    },
                ]
            );
        } else {
            console.log(`Action: ${item.label} (${item.targetScreen})`);
            Alert.alert('Chức năng', `Bạn đã nhấn vào: ${item.label}`);
        }
    };

    // Hàm render item (Giữ nguyên)
    const renderItem = ({ item }: { item: SettingItem }) => (
        <TouchableOpacity
            style={styles.itemContainer}
            onPress={() => handlePress(item)}
        >
            <View style={styles.iconWrapper}>
                {renderIcon(item)}
            </View>
            <Text style={[styles.label, item.action === 'logout' && styles.logoutLabel]}>
                {item.label}
            </Text>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#f9f9f9" />

            {/* 💡 1. CHÈN CUSTOM HEADER */}
            <CustomHeader
                title='Settings'
                onNavigateToPackage={navigateToPackageScreen}
                onNavigateToNotification={navigateToNotificationScreen}
            />

            {/* 2. SECTION LIST */}
            <SectionList
                sections={SETTINGS_DATA}
                keyExtractor={item => item.id}
                renderItem={renderItem}
                showsVerticalScrollIndicator={false}
                // 💡 Đặt padding cho SectionList, không cần paddingBottom thủ công
                contentContainerStyle={[
                    styles.listContent,
                    { paddingBottom: insets.bottom + 100 } // Thêm insets.bottom cho vùng an toàn
                ]}

                // Render Section Header (Giữ nguyên)
                renderSectionHeader={({ section: { title } }) => (
                    <Text style={styles.sectionTitle}>{title}</Text>
                )}
            />
        </View>
    );
};

// --- Styles ---
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f9f9f9',
    },
    // 💡 HEADER MỚI (CHỨA insets.top padding)
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingBottom: 15,
        backgroundColor: '#f9f9f9',
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#eee',
    },
    backButton: {
        paddingRight: 15,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
    },
    listContent: {
        // Đã loại bỏ paddingBottom khỏi đây, đặt nó trong contentContainerStyle
        paddingHorizontal: 15,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#666',
        marginTop: 20,
        marginBottom: 10,
        paddingHorizontal: 5,
    },
    itemContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        paddingHorizontal: 5,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#eee',
        backgroundColor: 'white',
    },
    iconWrapper: {
        width: 30,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    label: {
        fontSize: 16,
        color: '#333',
        flex: 1,
    },
    logoutLabel: {
        color: 'red',
        fontWeight: '600',
    },
});

export default SettingScreen;
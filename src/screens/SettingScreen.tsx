import React, { useState, useEffect, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    StatusBar,
    Alert,
    SectionList,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, Feather, AntDesign, FontAwesome5 } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useAuth } from './auth/AuthContext';
import { unifiedLogout } from '../api/authApi';
import { getAuthRole } from '../api/apiClient'; // Import getAuthRole
import CustomHeader from '../components/CustomHeader';

type SettingScreenProps = NativeStackScreenProps<RootStackParamList, 'Tabs'>;

interface SettingItem {
    id: string;
    icon: any;
    iconSet: 'Ionicons' | 'MaterialCommunityIcons' | 'Feather' | 'AntDesign' | 'FontAwesome5';
    label: string;
    action: 'navigate' | 'action' | 'logout';
    targetScreen?: keyof RootStackParamList | string;
}

// Dữ liệu gốc
const BASE_SETTINGS_DATA: { title: string; data: SettingItem[] }[] = [
    {
        title: 'Account',
        data: [
            { id: '1', icon: 'person-outline', iconSet: 'Ionicons', label: 'Edit profile', action: 'navigate', targetScreen: 'UserScreen' },
            { id: '2', icon: 'signature', iconSet: 'AntDesign', label: 'Become Expert', action: 'navigate', targetScreen: 'VerifyExpertScreen' },
            { id: '3', icon: 'bell', iconSet: 'Feather', label: 'Notifications', action: 'navigate', targetScreen: 'NotificationScreen' },
            { id: '4', icon: 'albums-outline', iconSet: 'Ionicons', label: 'My Subscription', action: 'navigate', targetScreen: 'MySubscriptionScreen' },
            { id: '5', icon: 'card-outline', iconSet: 'Ionicons', label: 'My payment history', action: 'navigate', targetScreen: 'MyPaymentHistoryScreen' },
        ],
    },
    {
        title: 'Support & About',
        data: [
            { id: '6', icon: 'help-circle-outline', iconSet: 'Ionicons', label: 'Help & Support', action: 'navigate', targetScreen: 'HelpAndSupportScreen' },
            { id: '7', icon: 'shield', iconSet: 'Feather', label: 'Terms and Policies', action: 'navigate', targetScreen: 'TermAndPoliciesScreen' },
        ],
    },
    {
        title: 'Actions',
        data: [
            { id: '10', icon: 'log-out-outline', iconSet: 'Ionicons', label: 'Log out', action: 'logout', targetScreen: 'LogOut' },
        ],
    },
];

const renderIcon = (item: SettingItem) => {
    const size = 24;
    const color = '#333';

    switch (item.iconSet) {
        case 'Ionicons':
            return <Ionicons name={item.icon} size={size} color={color} />;
        case 'MaterialCommunityIcons':
            return <MaterialCommunityIcons name={item.icon} size={size} color={color} />;
        case 'Feather':
            return <Feather name={item.icon} size={size} color={color} />;
        case 'AntDesign':
            return <AntDesign name={item.icon} size={size} color={color} />;
        case 'FontAwesome5':
            return <FontAwesome5 name={item.icon} size={size} color={color} />;
        default:
            return <Ionicons name="settings-outline" size={size} color={color} />;
    }
}

const SettingScreen: React.FC<any> = ({ navigation }) => {
    const insets = useSafeAreaInsets();
    const { setIsLoggedIn } = useAuth();
    const [userRole, setUserRole] = useState<string | null>(null);

    // Lấy Role khi component mount
    useEffect(() => {
        const fetchRole = async () => {
            const role = await getAuthRole();
            setUserRole(role);
        };
        fetchRole();
    }, []);

    const navigateToPackageScreen = () => {
        navigation.navigate('PackageScreen');
    };
    const navigateToNotificationScreen = () => {
        navigation.navigate("NotificationScreen");
    };

    // Xử lý logic lọc menu dựa trên Role
    const settingsData = useMemo(() => {
        // Sao chép sâu dữ liệu gốc để không làm thay đổi biến global
        const data = JSON.parse(JSON.stringify(BASE_SETTINGS_DATA));
        const accountSection = data.find((section: any) => section.title === 'Account');

        if (accountSection) {
            if (userRole === 'Expert') {
                // 1. Loại bỏ các mục không cần thiết cho Expert
                accountSection.data = accountSection.data.filter((item: SettingItem) =>
                    item.label !== 'Become Expert' &&
                    item.label !== 'My Subscription' &&
                    item.label !== 'My payment history'
                );

                // 2. Thêm mục "My Expert Information"
                accountSection.data.splice(1, 0, {
                    id: 'expert-info',
                    icon: 'idcard', // Icon AntDesign
                    iconSet: 'AntDesign',
                    label: 'My Expert Information',
                    action: 'navigate',
                    targetScreen: 'MyExpertInformationScreen'
                });
            }
        }
        return data;
    }, [userRole]);

    const handlePress = (item: SettingItem) => {
        if (item.action === 'navigate' && item.targetScreen) {
            // @ts-ignore
            navigation.navigate(item.targetScreen);
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
            Alert.alert('Chức năng', `Bạn đã nhấn vào: ${item.label}`);
        }
    };

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
            {item.action === 'navigate' && (
                <Ionicons name="chevron-forward" size={20} color="#ccc" />
            )}
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#f9f9f9" />

            <CustomHeader
                title='Settings'
                onNavigateToPackage={navigateToPackageScreen}
                onNavigateToNotification={navigateToNotificationScreen}
            />

            <SectionList
                sections={settingsData}
                keyExtractor={item => item.id}
                renderItem={renderItem}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[
                    styles.listContent,
                    { paddingBottom: insets.bottom + 100 }
                ]}
                renderSectionHeader={({ section: { title } }) => (
                    <Text style={styles.sectionTitle}>{title}</Text>
                )}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f9f9f9',
    },
    listContent: {
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
        paddingHorizontal: 15,
        marginBottom: 8,
        borderRadius: 12,
        backgroundColor: 'white',
        // Shadow nhẹ
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
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
import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    ActivityIndicator,
    FlatList,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { UserSubscriptionInformation } from '../types/dataModels';
import {
    getActiveSubscriptions,
    getInactiveSubscriptions,
    getAllSubscriptions
} from '../api/dataApi';

const { width } = Dimensions.get('window');

type SubscriptionTab = 'Active' | 'Expired' | 'History';
type MySubscriptionScreenProps = NativeStackScreenProps<RootStackParamList, 'MySubscriptionScreen'>;

const SUBSCRIPTION_TABS: SubscriptionTab[] = ['Active', 'Expired', 'History'];

const formatDate = (dateString: string) => {
    try {
        const date = new Date(dateString);
        // Định dạng DD.MM.YY
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear().toString().slice(-2);
        return `${day}.${month}.${year}`;
    } catch {
        return 'N/A';
    }
};

interface SubscriptionCardProps {
    subscription: UserSubscriptionInformation;
}

const SubscriptionCard: React.FC<SubscriptionCardProps> = ({ subscription }) => {
    const packageName = subscription.servicePackage?.name || 'Gói dịch vụ không tên';
    const endDate = formatDate(subscription.endDate);
    const startDate = formatDate(subscription.startDate);
    const remainingUses = subscription.remainingUses;
    const isActive = subscription.status;

    const statusText = isActive ? 'Active' : 'Expired';
    const statusColor = isActive ? styles.activeButton : styles.expiredButton;

    const titleColor = isActive ? styles.packageNameActive : styles.packageNameExpired;

    return (
        <View style={styles.cardContainer}>
            <View style={styles.cardHeader}>
                <Text style={[styles.packageName, titleColor]}>{packageName}</Text>
                <Text style={styles.validUntilText}>
                    Valid Until <Text style={styles.validUntilDate}>{endDate}</Text>
                </Text>
            </View>

            <View style={styles.dashedLineContainer}>
                <View style={styles.dashedLine} />
            </View>

            <View style={styles.cardBody}>
                <View style={styles.usageInfo}>
                    <Ionicons name="time-outline" size={20} color="#333" />
                    <Text style={styles.remainingText}>
                        Remaining usages: <Text style={styles.remainingUsesValue}>{remainingUses}</Text>
                    </Text>
                </View>
                <Text style={styles.validFromText}>
                    Valid from {startDate}
                </Text>

                <View style={[styles.statusButton, statusColor]}>
                    <Text style={styles.statusButtonText}>{statusText}</Text>
                </View>
            </View>
        </View>
    );
};

const MySubscriptionScreen: React.FC<MySubscriptionScreenProps> = ({ navigation }) => {
    const insets = useSafeAreaInsets();
    const [activeTab, setActiveTab] = useState<SubscriptionTab>('Active');
    const [subscriptions, setSubscriptions] = useState<UserSubscriptionInformation[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async (tab: SubscriptionTab) => {
        setIsLoading(true);
        setError(null);
        let apiCall;

        switch (tab) {
            case 'Active':
                apiCall = getActiveSubscriptions();
                break;
            case 'Expired':
                apiCall = getInactiveSubscriptions();
                break;
            case 'History':
                apiCall = getAllSubscriptions();
                break;
            default:
                apiCall = getActiveSubscriptions();
        }

        try {
            const rawData = await apiCall;

            const data = Array.isArray(rawData) ? rawData : [];

            const processedData = data.map(sub => ({
                ...sub,
                remainingUses: sub.remainingUses || 0
            }));

            setSubscriptions(processedData);
        } catch (e: any) {
            console.error(`Error fetching ${tab} subscriptions:`, e);
            setError(e.message || `Lỗi khi tải dữ liệu ${tab}.`);
            setSubscriptions([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData(activeTab);
    }, [activeTab, fetchData]);

    const renderContent = () => {
        if (isLoading) {
            return <ActivityIndicator size="large" color="#3B82F6" style={styles.centerMessage} />;
        }

        if (error) {
            return (
                <Text style={[styles.centerMessage, styles.errorText]}>
                    {error}
                </Text>
            );
        }

        if (subscriptions.length === 0) {
            return (
                <Text style={styles.centerMessage}>
                    Không tìm thấy gói đăng ký nào trong mục này.
                </Text>
            );
        }

        return (
            <View style={styles.cardList}>
                {subscriptions.map((sub) => (
                    <SubscriptionCard key={`${sub.servicePackageId}-${sub.createAt}`} subscription={sub} />
                ))}
            </View>
        );
    };

    const renderTabItem = ({ item }: { item: SubscriptionTab }) => {
        const isActive = activeTab === item;
        return (
            <TouchableOpacity
                style={[
                    styles.tabButton,
                    isActive && styles.activeTabButton
                ]}
                onPress={() => setActiveTab(item)}
            >
                <Text style={isActive ? styles.activeTabText : styles.inactiveTabText}>
                    {item} subscription
                </Text>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <FlatList
                data={SUBSCRIPTION_TABS}
                renderItem={renderTabItem}
                keyExtractor={(item) => item}
                horizontal
                showsHorizontalScrollIndicator={false}
                style={[styles.tabBarScroll]}
                contentContainerStyle={styles.tabBarContent}
            />

            <ScrollView
                contentContainerStyle={[
                    styles.contentContainer,
                    { paddingBottom: styles.contentContainer.paddingBottom + insets.bottom }
                ]}
            >
                {renderContent()}
            </ScrollView>
        </View>
    );
};

export default MySubscriptionScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    contentContainer: {
        paddingTop: 20,
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    centerMessage: {
        textAlign: 'center',
        marginTop: 50,
        fontSize: 16,
        color: '#555',
    },
    errorText: {
        color: 'red',
        fontWeight: 'bold',
    },

    // --- FlatList Tab Styles ---
    tabBarScroll: {
        flexGrow: 0,
        height: 60,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    tabBarContent: {
        paddingHorizontal: 15,
        paddingVertical: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    tabButton: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
        marginRight: 10,
    },
    activeTabButton: {
        backgroundColor: '#E6EEFF',
    },
    activeTabText: {
        color: '#3B82F6',
        fontWeight: 'bold',
    },
    inactiveTabText: {
        color: '#666',
        fontWeight: 'bold',
    },

    // --- Card Styles ---
    cardList: {
        gap: 20,
    },
    cardContainer: {
        backgroundColor: '#fff',
        borderRadius: 15,
        borderWidth: 1,
        borderColor: '#ddd',
        padding: 15,
        overflow: 'hidden',
        position: 'relative',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 3,
    },

    cardHeader: {
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    packageName: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    packageNameActive: {
        color: '#3B82F6',
    },
    packageNameExpired: {
        color: '#EA4335',
    },
    validUntilText: {
        fontSize: 14,
        color: '#666',
    },
    validUntilDate: {
        fontWeight: 'bold',
        color: '#333',
    },

    dashedLineContainer: {
        marginVertical: 5,
        paddingHorizontal: 0,
    },
    dashedLine: {
        borderBottomWidth: 1,
        borderStyle: 'dashed',
        borderColor: '#ccc',
    },

    cardBody: {
        marginTop: 10,
    },
    usageInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 5,
    },
    remainingText: {
        fontSize: 16,
        color: '#333',
        marginLeft: 5,
        fontWeight: '500',
    },
    remainingUsesValue: {
        fontWeight: 'bold',
    },
    validFromText: {
        fontSize: 14,
        color: '#999',
        marginBottom: 15,
    },
    statusButton: {
        position: 'absolute',
        bottom: 5,
        right: 5,
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 10,
    },
    activeButton: {
        backgroundColor: '#3B82F6',
    },
    expiredButton: {
        backgroundColor: 'red',
    },
    statusButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 14,
    },
});
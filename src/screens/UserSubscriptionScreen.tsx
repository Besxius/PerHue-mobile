import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    Alert,
    SafeAreaView,
    TouchableOpacity,
    Dimensions,
    Button
} from 'react-native';

// Giả định các imports cần thiết từ files của bạn
import { UserSubscriptionInformation, ServicePackage } from '../types/dataModels';
import { getUserSubscriptionInformations } from '../api/userApi';
// Giả định UserInfo và ServicePackage đã được định nghĩa trong dataModels

// --- Utilities ---
const { width } = Dimensions.get('window');

// Hàm format ngày (để hiển thị theo format DD.MM.YY)
const formatDate = (isoString: string): string => {
    try {
        const date = new Date(isoString);
        if (isNaN(date.getTime())) return 'N/A';

        // Sử dụng toLocaleDateString để đảm bảo định dạng locale
        return date.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: '2-digit',
        }).replace(/\//g, '.'); // Chuyển đổi / thành .
    } catch {
        return 'N/A';
    }
};

// --- Component: SubscriptionCard (Giao diện thẻ) ---

interface SubscriptionCardProps {
    subscription: UserSubscriptionInformation;
}

const SubscriptionCard: React.FC<SubscriptionCardProps> = ({ subscription }) => {
    const packageName = subscription.servicePackage.name || 'Unknown Package';
    const isValid = subscription.status;
    const remainingText = subscription.remainingUses > 0
        ? `Remaining usages: ${subscription.remainingUses}`
        : 'Remaining'; // Nếu remainingUses là 0, hiển thị "Remaining" như ảnh

    // Nếu duration trong ServicePackage không phải là số 0, thì hiển thị số lần dùng
    // Ngược lại, nếu remainingUses là 0, có thể là gói không giới hạn số lần dùng, 
    // hoặc gói đã hết hạn. Ta dựa vào status và remainingUses.
    const remainingDisplay = subscription.servicePackage.uses > 0
        ? `Remaining usages: ${subscription.remainingUses}`
        : 'Remaining'; // Giả định "Remaining" tương ứng với gói không giới hạn lượt dùng

    const buttonStyle = isValid ? styles.activeButton : styles.expiredButton;
    const buttonText = isValid ? 'Active' : 'Expired';
    const validUntilDate = formatDate(subscription.endDate);
    const validFromDate = formatDate(subscription.startDate);

    // Đặt tên gói dựa trên tên trong servicePackage
    const packageTitle = subscription.servicePackage.name;

    // Kiểm tra nếu remainingUses là 0 và status là false thì là hết hạn
    const showExpired = !isValid && subscription.remainingUses === 0;

    return (
        <View style={styles.cardContainer}>
            {/* Header: Tên gói và Ngày hết hạn */}
            <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{packageTitle}</Text>
                <Text style={styles.validUntilText}>Valid Until {validUntilDate}</Text>
            </View>
            <View style={styles.dashedLine} />

            {/* Content: Số lượt dùng và Ngày bắt đầu */}
            <View style={styles.cardContent}>
                <View style={styles.usagesInfo}>
                    <Text style={styles.usagesIcon}>&#9788;</Text>
                    <Text style={styles.remainingText}>
                        {remainingDisplay}
                    </Text>
                </View>
                <TouchableOpacity
                    style={[styles.statusButton, showExpired ? styles.expiredButton : styles.activeButton]}
                    disabled={true}
                >
                    <Text style={styles.statusButtonText}>
                        {showExpired ? 'Expired' : 'Active'}
                    </Text>
                </TouchableOpacity>
            </View>
            <Text style={styles.validFromText}>Valid from {validFromDate}</Text>
        </View>
    );
};


// --- Custom Hook: useSubscriptionData ---

interface SubscriptionState {
    subscriptions: UserSubscriptionInformation[];
    loading: boolean;
    error: string | null;
}

const useSubscriptionData = (): SubscriptionState => {
    const [state, setState] = useState<SubscriptionState>({
        subscriptions: [],
        loading: true,
        error: null,
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                setState(prev => ({ ...prev, loading: true, error: null }));
                const data = await getUserSubscriptionInformations();
                setState({ subscriptions: data, loading: false, error: null });
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'Failed to fetch subscriptions.';
                setState({ subscriptions: [], loading: false, error: errorMessage });
                console.error("Subscription API Error:", errorMessage);
            }
        };

        fetchData();
    }, []);

    return state;
};


// --- Main Screen Component ---

const UserSubscriptionScreen: React.FC = () => {
    const { subscriptions, loading, error } = useSubscriptionData();
    const [activeTab, setActiveTab] = useState<'Active' | 'History'>('Active');

    // Lọc dữ liệu dựa trên tab đang chọn
    const activeSubscriptions = subscriptions.filter(sub => sub.status);
    const historySubscriptions = subscriptions; // History hiển thị tất cả

    // Lựa chọn danh sách hiển thị
    const displayList = activeTab === 'Active' ? activeSubscriptions : historySubscriptions;

    // --- Render Content ---
    const renderContent = () => {
        if (loading) {
            return (
                <View style={styles.centerContent}>
                    <ActivityIndicator size="large" color="#007AFF" />
                    <Text style={styles.loadingText}>Loading subscriptions...</Text>
                </View>
            );
        }

        if (error) {
            return (
                <View style={styles.centerContent}>
                    <Text style={styles.errorText}>Error: {error}</Text>
                    <Button title="Try Again" onPress={() => {/* Logic reload */ }} />
                </View>
            );
        }

        if (displayList.length === 0) {
            return (
                <View style={styles.centerContent}>
                    <Text style={styles.noDataText}>No subscriptions found in this tab.</Text>
                </View>
            );
        }

        return (
            <ScrollView style={styles.listContainer}>
                {displayList.map((sub, index) => (
                    <SubscriptionCard key={index} subscription={sub} />
                ))}
                <View style={{ height: 30 }} />
            </ScrollView>
        );
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <Text style={styles.screenTitle}>My Subscriptions</Text>

                {/* --- Tab Selector --- */}
                <View style={styles.tabContainer}>
                    <TouchableOpacity
                        style={[styles.tabButton, activeTab === 'Active' && styles.activeTabButton]}
                        onPress={() => setActiveTab('Active')}
                    >
                        <Text style={[styles.tabText, activeTab === 'Active' && styles.activeTabText]}>
                            Active subscription
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tabButton, activeTab === 'History' && styles.activeTabButton]}
                        onPress={() => setActiveTab('History')}
                    >
                        <Text style={[styles.tabText, activeTab === 'History' && styles.activeTabText]}>
                            History subscription
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* --- List Content --- */}
                {renderContent()}
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#f0f4f7',
    },
    container: {
        flex: 1,
        paddingHorizontal: 15,
    },
    screenTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        marginTop: 10,
        marginBottom: 20,
        textAlign: 'center',
    },
    // --- Tab Styles ---
    tabContainer: {
        flexDirection: 'row',
        marginBottom: 20,
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 5,
        elevation: 1,
    },
    tabButton: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 8,
        alignItems: 'center',
    },
    activeTabButton: {
        backgroundColor: '#E6EEFF', // Màu nền tab active (màu nhạt hơn màu Active button)
    },
    tabText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#888',
    },
    activeTabText: {
        color: '#007AFF', // Màu chữ tab active
        fontWeight: 'bold',
    },
    // --- List Content Styles ---
    listContainer: {
        flex: 1,
    },
    centerContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
        color: '#007AFF',
    },
    errorText: {
        color: 'red',
        fontSize: 16,
    },
    noDataText: {
        color: '#555',
        fontSize: 16,
    },
    // --- Card Styles ---
    cardContainer: {
        backgroundColor: '#fff',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#ddd',
        marginBottom: 15,
        overflow: 'hidden',
        position: 'relative',
        paddingHorizontal: 15,
        paddingVertical: 10,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 5,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1a73e8', // Màu xanh đậm cho tiêu đề
    },
    validUntilText: {
        fontSize: 12,
        color: '#666',
    },
    dashedLine: {
        borderStyle: 'dashed',
        borderWidth: 1,
        borderColor: '#ccc',
        marginVertical: 5,
    },
    cardContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 5,
        marginBottom: 5,
    },
    usagesInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    usagesIcon: {
        fontSize: 18,
        marginRight: 8,
        color: '#1a73e8',
    },
    remainingText: {
        fontSize: 14,
        color: '#333',
        fontWeight: '600',
    },
    validFromText: {
        fontSize: 12,
        color: '#666',
        marginTop: 5,
    },
    statusButton: {
        paddingVertical: 5,
        paddingHorizontal: 15,
        borderRadius: 20,
        minWidth: 80,
        alignItems: 'center',
        justifyContent: 'center',
    },
    activeButton: {
        backgroundColor: '#4285F4', // Màu xanh Google
    },
    expiredButton: {
        backgroundColor: '#EA4335', // Màu đỏ Google
    },
    statusButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 12,
    },
});

export default UserSubscriptionScreen;
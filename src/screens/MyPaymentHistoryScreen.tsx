import React, { FC, useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    ActivityIndicator,
    Alert,
    FlatList,
    TouchableOpacity,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { UserPayment, PaymentLog } from '../types/dataModels';
import { getAllPayments } from '../api/dataApi';

type MyPaymentHistoryScreenProps = NativeStackScreenProps<RootStackParamList, 'MyPaymentHistoryScreen'>;

const BLUE_COLOR = '#4C7BE2';

// Hàm định dạng số tiền VND
const formatCurrency = (amount: number): string => {
    return `${amount.toLocaleString('vi-VN')}₫`;
};

// Hàm định dạng ngày tháng
const formatDate = (dateString: string): string => {
    try {
        return new Date(dateString).toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    } catch {
        return dateString;
    }
};

interface PaymentCardProps {
    payment: UserPayment;
}

const PaymentCard: FC<PaymentCardProps> = ({ payment }) => {
    // Lấy trạng thái mới nhất từ log cuối cùng
    const latestLog = payment.paymentLogs?.[payment.paymentLogs.length - 1];
    const status = latestLog?.newStatus || 'Unknown';

    // Tùy chỉnh hiển thị trạng thái và màu sắc
    const isSuccess = status.toLowerCase().includes('success') || status.toLowerCase().includes('completed');
    const statusStyle = isSuccess ? styles.statusSuccess : styles.statusFailed;

    return (
        <View style={styles.cardContainer}>
            {/* Header: Số tiền và Trạng thái */}
            <View style={styles.cardHeader}>
                <Text style={styles.amountText}>{formatCurrency(payment.amount)}</Text>
                <View style={[styles.statusBadge, statusStyle]}>
                    <Text style={styles.statusText}>{status}</Text>
                </View>
            </View>

            {/* Chi tiết giao dịch */}
            <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Order Code:</Text>
                <Text style={styles.detailValue}>{payment.orderCode}</Text>
            </View>
            <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Description:</Text>
                <Text style={styles.detailValue} numberOfLines={1}>{payment.description}</Text>
            </View>
            <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Created At:</Text>
                <Text style={styles.detailValue}>{formatDate(payment.createdAt)}</Text>
            </View>

            {/* Log cuối cùng */}
            {latestLog && (
                <View style={styles.logContainer}>
                    <Ionicons name="information-circle-outline" size={16} color="#666" />
                    <Text style={styles.logMessage} numberOfLines={1}>
                        {latestLog.message || `Status updated from ${latestLog.oldStatus} to ${latestLog.newStatus}.`}
                    </Text>
                </View>
            )}
        </View>
    );
};

const MyPaymentHistoryScreen: FC<MyPaymentHistoryScreenProps> = ({ navigation }) => {
    const insets = useSafeAreaInsets();
    const [payments, setPayments] = useState<UserPayment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchPayments = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await getAllPayments();
            setPayments(data);
        } catch (e: any) {
            console.error('Error fetching payments:', e);
            setError(e.message || 'Failed to load payment history.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPayments();
    }, [fetchPayments]);

    const renderItem = ({ item }: { item: UserPayment }) => <PaymentCard payment={item} />;

    return (
        <View style={[styles.container]}>
            {isLoading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={BLUE_COLOR} />
                    <Text style={styles.loadingText}>Loading payment history...</Text>
                </View>
            ) : error ? (
                <View style={[styles.center, styles.errorBox]}>
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity onPress={fetchPayments} style={styles.retryButton}>
                        <Text style={styles.retryButtonText}>Try Again</Text>
                    </TouchableOpacity>
                </View>
            ) : payments.length === 0 ? (
                <View style={styles.center}>
                    <Text style={styles.noDataText}>You have no payment records yet.</Text>
                </View>
            ) : (
                <FlatList
                    data={payments}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={[styles.listContainer, { paddingBottom: insets.bottom + 20 }]}
                    showsVerticalScrollIndicator={false}
                />
            )}
        </View>
    );
};

export default MyPaymentHistoryScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    listContainer: {
        paddingHorizontal: 15,
        paddingTop: 15,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
        color: '#666',
    },
    errorBox: {
        padding: 20,
    },
    errorText: {
        color: 'red',
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 15,
    },
    retryButton: {
        backgroundColor: BLUE_COLOR,
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderRadius: 8,
    },
    retryButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    noDataText: {
        fontSize: 16,
        color: '#888',
    },

    // --- Card Styles ---
    cardContainer: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 15,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        paddingBottom: 10,
        marginBottom: 10,
    },
    amountText: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 15,
    },
    statusSuccess: {
        backgroundColor: '#D4EDDA',
    },
    statusFailed: {
        backgroundColor: '#F8D7DA',
    },
    statusText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#155724',
    },
    detailRow: {
        flexDirection: 'row',
        marginBottom: 5,
    },
    detailLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#555',
        width: 100,
    },
    detailValue: {
        fontSize: 14,
        color: '#333',
        flexShrink: 1,
    },
    logContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 10,
        backgroundColor: '#f9f9f9',
        padding: 8,
        borderRadius: 5,
    },
    logMessage: {
        fontSize: 12,
        color: '#666',
        marginLeft: 5,
        flexShrink: 1,
    }
});
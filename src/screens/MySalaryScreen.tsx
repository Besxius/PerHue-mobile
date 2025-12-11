import React, { FC, useState, useEffect, useCallback, useMemo } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    ActivityIndicator,
    TouchableOpacity,
    Dimensions,
    FlatList,
    Alert,
    RefreshControl, // 👈 1. IMPORT RefreshControl
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../navigation/AppNavigator';
import { ExpertSalaryResponse, ExpertSalaryDetail } from '../types/dataModels';
import { getExpertSalary } from '../api/expertApi';
import Toast from 'react-native-toast-message';

type MySalaryScreenProps = NativeStackScreenProps<RootStackParamList, 'MySalaryScreen'>;

const { width } = Dimensions.get('window');
const BLUE_COLOR = '#4C7BE2';
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1); // [1, 2, ..., 12]
const MONTH_NAMES = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

// ... (Các hàm Helper giữ nguyên: formatCurrency, getMonthDates, getCurrentYearAndMonth, RatingStars)
const formatCurrency = (amount: number): string => {
    if (amount === 0) return '0 VND';
    return `${amount.toLocaleString('en-US')} VND`;
};

const getMonthDates = (year: number, month: number) => {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    endDate.setHours(23, 59, 59, 999);
    return { startDate, endDate };
};

const getCurrentYearAndMonth = () => {
    const now = new Date();
    return {
        year: now.getFullYear(),
        month: now.getMonth() + 1,
    };
};

const RatingStars: FC<{ rating: number }> = ({ rating }) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating - fullStars >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    const renderStar = (name: keyof typeof Ionicons.glyphMap, index: number) => (
        <Ionicons key={index} name={name} size={14} color="#FFC300" style={styles.star} />
    );

    return (
        <View style={styles.starContainer}>
            {Array.from({ length: fullStars }, (_, i) => renderStar('star', i))}
            {hasHalfStar && renderStar('star-half', fullStars)}
            {Array.from({ length: emptyStars }, (_, i) => renderStar('star-outline', fullStars + (hasHalfStar ? 1 : 0) + i))}
        </View>
    );
};

// --- MAIN SCREEN ---

const MySalaryScreen: FC<MySalaryScreenProps> = ({ navigation }) => {
    const insets = useSafeAreaInsets();
    const { year: currentYear, month: currentMonth } = getCurrentYearAndMonth();

    const [activeYear, setActiveYear] = useState(currentYear);
    const [activeMonth, setActiveMonth] = useState(currentMonth);

    const [salaryData, setSalaryData] = useState<ExpertSalaryResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // 👈 2. State Refreshing
    const [refreshing, setRefreshing] = useState(false);

    const years = useMemo(() => {
        const startYear = 2024;
        const endYear = new Date().getFullYear();
        const yearList = [];
        const finalEndYear = endYear < startYear ? startYear : endYear;
        for (let y = startYear; y <= finalEndYear; y++) {
            yearList.push(y);
        }
        return yearList;
    }, []);

    const fetchSalaryData = useCallback(async (year: number, month: number) => {
        // Nếu không phải đang refresh (kéo xuống), thì hiện loading indicator chính
        if (!refreshing) setIsLoading(true);
        setError(null);

        const { startDate, endDate } = getMonthDates(year, month);
        console.log(`Fetching salary from ${startDate.toISOString()} to ${endDate.toISOString()}`);

        try {
            const data = await getExpertSalary(startDate, endDate);
            setSalaryData(data);
        } catch (e: any) {
            console.error('Error fetching salary:', e);
            setError(e.message || 'Unable to load salary data.');
            setSalaryData(null);
        } finally {
            setIsLoading(false);
            setRefreshing(false); // Tắt trạng thái refreshing
        }
    }, [refreshing]); // Thêm refreshing vào dependency nếu cần, nhưng thường thì không cần thiết ở đây nếu dùng biến local, tuy nhiên để an toàn với logic state

    useEffect(() => {
        fetchSalaryData(activeYear, activeMonth);
    }, [activeYear, activeMonth]); // Bỏ fetchSalaryData khỏi dependency để tránh loop nếu không dùng useCallback chuẩn, nhưng ở đây đã dùng useCallback

    // 👈 3. Hàm xử lý Refresh
    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchSalaryData(activeYear, activeMonth);
    }, [activeYear, activeMonth]); // Phụ thuộc vào năm/tháng đang chọn

    const renderMonthTab = ({ item: month }: { item: number }) => {
        const isActive = month === activeMonth;
        const monthName = MONTH_NAMES[month - 1];

        return (
            <TouchableOpacity
                key={month}
                style={[
                    styles.monthTab,
                    isActive && styles.activeMonthTab
                ]}
                onPress={() => setActiveMonth(month)}
                disabled={isLoading}
            >
                <Text style={isActive ? styles.activeMonthText : styles.monthText}>
                    {monthName}
                </Text>
            </TouchableOpacity>
        );
    };

    const currentMonthName = MONTH_NAMES[activeMonth - 1];

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            {/* Header */}
            <View style={styles.headerBar}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
                    <Ionicons name="arrow-back" size={28} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>My Expert Salary</Text>
                <View style={styles.headerButton} />
            </View>

            {/* Year Picker */}
            <View style={styles.yearPickerContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.yearListContent}>
                    {years.map(year => (
                        <TouchableOpacity
                            key={year}
                            style={[
                                styles.yearButton,
                                activeYear === year && styles.activeYearButton
                            ]}
                            onPress={() => setActiveYear(year)}
                            disabled={isLoading}
                        >
                            <Text style={activeYear === year ? styles.activeYearText : styles.yearText}>
                                {year}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Month Tabs */}
            <FlatList
                data={MONTHS}
                renderItem={renderMonthTab}
                keyExtractor={(item) => item.toString()}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.monthTabsContainer}
                style={styles.monthTabsScroll}
            />

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                // 👈 4. Thêm RefreshControl vào ScrollView
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={[BLUE_COLOR]} // Màu loading cho Android
                        tintColor={BLUE_COLOR} // Màu loading cho iOS
                    />
                }
            >

                {isLoading && !refreshing ? ( // Chỉ hiện loading giữa màn hình khi KHÔNG phải đang vuốt refresh
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={BLUE_COLOR} />
                        <Text style={styles.loadingText}>Loading data for {currentMonthName}...</Text>
                    </View>
                ) : error ? (
                    <View style={styles.loadingContainer}>
                        <Text style={styles.errorText}>Error: {error}</Text>
                        <TouchableOpacity onPress={() => fetchSalaryData(activeYear, activeMonth)} style={styles.retryButton}>
                            <Text style={styles.retryButtonText}>Retry</Text>
                        </TouchableOpacity>
                    </View>
                ) : salaryData ? (
                    <>
                        {/* 1. Tổng quan Lương */}
                        <View style={styles.summaryCard}>
                            <Text style={styles.summaryTitle}>Total Salary for {currentMonthName} {activeYear}</Text>
                            <Text style={styles.totalSalaryText}>{formatCurrency(salaryData.totalSalary)}</Text>

                            <View style={styles.divider} />

                            <View style={styles.statRow}>
                                <Text style={styles.statLabel}>Total Requests Completed:</Text>
                                <Text style={styles.statValue}>{salaryData.totalRequests}</Text>
                            </View>

                            <View style={styles.statRow}>
                                <Text style={styles.statLabel}>Average Rating:</Text>
                                <View style={styles.statValue}>
                                    <Text style={styles.averageRatingText}>
                                        {salaryData.totalRequests > 0 ? salaryData.averageRating.toFixed(2) : 'N/A'}
                                    </Text>
                                    {salaryData.totalRequests > 0 && <RatingStars rating={salaryData.averageRating} />}
                                </View>
                            </View>
                        </View>

                        {/* 2. Chi tiết Rating */}
                        <Text style={styles.detailSectionTitle}>
                            Rating Details ({salaryData.details.length})
                        </Text>

                        {salaryData.details.length > 0 ? (
                            <View>
                                {salaryData.details.map((item) => (
                                    <View key={item.testResponseId} style={styles.detailCard}>
                                        <View style={styles.detailRow}>
                                            <Text style={styles.detailLabel}>Request ID:</Text>
                                            <Text style={styles.detailValue}>#{item.testResponseId}</Text>
                                        </View>
                                        <View style={styles.detailRow}>
                                            <Text style={styles.detailLabel}>Completed Date:</Text>
                                            <Text style={styles.detailValue}>
                                                {new Date(item.completedDate).toLocaleDateString('en-GB')}
                                            </Text>
                                        </View>
                                        <View style={styles.detailRow}>
                                            <Text style={styles.detailLabel}>Rating:</Text>
                                            <View style={styles.detailValue}>
                                                <RatingStars rating={item.rating} />
                                            </View>
                                        </View>
                                        <View style={[styles.detailRow, { borderTopWidth: 1, borderTopColor: '#f0f0f0', paddingTop: 5, marginTop: 5 }]}>
                                            <Text style={styles.detailLabel}>Amount Received:</Text>
                                            <Text style={[styles.detailValue, styles.amountValue]}>{formatCurrency(item.amount)}</Text>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        ) : (
                            <Text style={styles.noDataText}>
                                No completed transactions in {currentMonthName} {activeYear}.
                            </Text>
                        )}
                    </>
                ) : (
                    <Text style={styles.noDataText}>
                        No salary data found. Please select another month/year.
                    </Text>
                )}
                <View style={{ height: insets.bottom + 20 }} />
            </ScrollView>
        </View>
    );
};

export default MySalaryScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    headerBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 15,
        paddingVertical: 10,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    headerButton: {
        width: 40,
        alignItems: 'flex-start',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        flex: 1,
        textAlign: 'center',
    },
    scrollContent: {
        paddingHorizontal: 15,
        paddingTop: 15,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 200,
    },
    loadingText: {
        marginTop: 10,
        color: '#666',
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
        textAlign: 'center',
        color: '#888',
        fontStyle: 'italic',
        marginTop: 30,
        fontSize: 16,
    },
    // --- Year Picker ---
    yearPickerContainer: {
        paddingVertical: 10,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    yearListContent: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 10
    },
    yearButton: {
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 20,
        marginHorizontal: 5,
    },
    activeYearButton: {
        backgroundColor: BLUE_COLOR,
    },
    yearText: {
        fontSize: 16,
        color: '#666',
        fontWeight: '500',
    },
    activeYearText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    // --- Month Tabs ---
    monthTabsScroll: {
        flexGrow: 0,
        maxHeight: 55,
    },
    monthTabsContainer: {
        paddingHorizontal: 10,
        paddingVertical: 10,
        alignItems: 'center',
    },
    monthTab: {
        paddingHorizontal: 18,
        paddingVertical: 6,
        borderRadius: 20,
        marginHorizontal: 5,
        backgroundColor: '#fff',
    },
    activeMonthTab: {
        backgroundColor: '#000',
    },
    monthText: {
        color: '#333',
        fontWeight: '500',
    },
    activeMonthText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    // --- Summary Card ---
    summaryCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        marginBottom: 20,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        borderLeftWidth: 5,
        borderLeftColor: BLUE_COLOR,
    },
    summaryTitle: {
        fontSize: 16,
        color: BLUE_COLOR,
        fontWeight: '600',
        marginBottom: 5,
    },
    totalSalaryText: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
    },
    divider: {
        height: 1,
        backgroundColor: '#f0f0f0',
        marginVertical: 10,
    },
    statRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 5,
    },
    statLabel: {
        fontSize: 14,
        color: '#666',
    },
    statValue: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    averageRatingText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginRight: 5,
    },
    starContainer: {
        flexDirection: 'row',
        gap: 2,
    },
    star: {
        // Style cho icon sao
    },
    // --- Detail Section ---
    detailSectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
        marginTop: 10,
    },
    detailCard: {
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 15,
        marginBottom: 10,
        borderLeftWidth: 3,
        borderLeftColor: '#ccc',
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 3,
    },
    detailLabel: {
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
    },
    detailValue: {
        fontSize: 14,
        color: '#333',
    } as any,
    amountValue: {
        fontWeight: 'bold',
        color: '#28a745', // Màu xanh lá cho thu nhập
    },
});
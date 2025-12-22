import React, { FC, useCallback, useState, useEffect } from "react";
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    SectionList,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from 'react-native-toast-message';
import CustomHeader from '../components/CustomHeader';
import HistoryItem from "../components/HistoryItem";
import { getAiTestResults, getExpertTestResults, getManualTestResults } from "../api/userApi";
import {
    ExpertRequest,
    ManualTestResult,
    ReviewTestRequest,
    AiTestResponse,
    ExpertTestResponse,
    ExpertCompletedRequest
} from "../types/dataModels";
import { CompositeScreenProps } from "@react-navigation/native";
import { TabParamList } from "./HomeScreen";
import { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/AppNavigator";
// [1] IMPORT CÁC HÀM API MỚI
import {
    getExpertPendingRequests,
    getExpertCompletedRequests,
    getExpertExpiredRequests,
    getExpertPendingReviews,
    getExpertCompletedReviews,
    getExpertExpiredReviews
} from "../api/expertApi";
import { getColorType } from "../api/capsulePaletteApi";
import { BaseHistoryItem, ImageSource } from "../types";
import { useAuth } from "./auth/AuthContext";

// --- TYPES & INTERFACES ---

type HistoryScreenProps = CompositeScreenProps<
    BottomTabScreenProps<TabParamList, 'History'>,
    NativeStackScreenProps<RootStackParamList>
>;

type MainTabType = 'MyTest' | 'Test Request' | 'Review Request' | 'Manual Test' | 'AI Test' | 'Expert Suggestion';
type StatusType = 'Pending' | 'Completed' | 'Expired';

interface MainTabConfig {
    name: string;
    key: MainTabType;
}

interface SectionData {
    title: string;
    data: BaseHistoryItem[];
}

// --- TRANSFORMERS ---

const transformManualTestResult = (result: ManualTestResult): BaseHistoryItem => {
    const imageSource: ImageSource[] = result.picture ? [{ uri: result.picture }] : [];
    const subtitle = `ColorType: ${result.colorTypeName || 'Unknown'}`;
    return {
        id: result.id,
        title: `#${result.id} - Manual Test`,
        subTitle: subtitle,
        date: new Date(result.createdDate).toLocaleDateString('vi-VN'),
        status: 'Completed',
        imageSources: imageSource,
        buttonText: 'View Detail',
        isOrder: false,
        extraInfo: `Suggested Color: ${result.suggestedColor}`,
        isExpert: false,
        originalDate: new Date(result.createdDate)
    };
};

const transformAiTestResult = (response: AiTestResponse): BaseHistoryItem => {
    const id = response.id;
    const imageSource: ImageSource[] = response.imageUrl ? [{ uri: response.imageUrl }] : [];
    const resultModel = response.newAiTestResultResponseModel;
    const suggestedColors = resultModel?.suggestedColor || 'N/A';
    const colorTypeId = resultModel?.colorTypeId;
    const colorTypeName = response.colorTypeName || 'Unknown';

    return {
        id: id,
        title: `#${id} - AI Test`,
        subTitle: `ColorType: ${colorTypeName}`,
        date: new Date(response.createdDate).toLocaleDateString('vi-VN'),
        status: response.colorTypeId ? 'Completed' : 'Failed',
        imageSources: imageSource,
        buttonText: 'View Detail',
        isOrder: false,
        extraInfo: `Suggested: ${suggestedColors}`,
        isExpert: false,
        originalDate: new Date(response.createdDate)
    };
};

const transformExpertTestResult = (response: ExpertTestResponse): BaseHistoryItem => {
    const id = response.id;
    const pictureUrl = response.pictures?.[0]?.source;
    const imageSource: ImageSource[] = pictureUrl ? [{ uri: pictureUrl }] : [];

    return {
        id: id,
        title: `#${id} - Expert Suggestion`,
        subTitle: '',
        date: new Date(response.createdDate).toLocaleDateString('vi-VN'),
        status: response.status || 'N/A',
        imageSources: imageSource,
        buttonText: 'View Detail',
        isOrder: true,
        extraInfo: `Status: ${response.status}`,
        isExpert: false,
        originalDate: new Date(response.createdDate)
    };
};

// [TRANSFORMER] Cho Pending Requests
const transformExpertRequest = (request: ExpertRequest): BaseHistoryItem => {
    const id = request.id;
    const pictureUrl = request.pictures?.[0]?.source;
    const imageSource: ImageSource[] = pictureUrl ? [{ uri: pictureUrl }] : [];
    return {
        id: id,
        title: `#${id} - ${request.typeOfTest || 'Client Request'}`,
        subTitle: `User ID: ${request.userAccountId}`,
        date: new Date(request.createdDate).toLocaleDateString('vi-VN'),
        status: request.status || 'Pending',
        imageSources: imageSource,
        buttonText: 'Response Now',
        isOrder: true,
        extraInfo: `User ID: ${request.userAccountId}`,
        isExpert: true,
        originalDate: new Date(request.createdDate)
    };
};

// [2] [TRANSFORMER MỚI] Cho Completed/Expired Requests (Sử dụng ExpertCompletedRequest)
const transformExpertCompletedRequest = (item: ExpertCompletedRequest): BaseHistoryItem => {
    const id = item.id;
    const pictureUrl = item.pictures?.[0]?.source;
    const imageSource: ImageSource[] = pictureUrl ? [{ uri: pictureUrl }] : [];
    // Sử dụng expertStatus nếu có, fallback về status
    const statusText = item.expertStatus || item.status;

    return {
        id: id,
        title: `#${id} - ${item.typeOfTest || 'Client Test'}`,
        subTitle: `Status: ${statusText}`,
        date: new Date(item.createdDate).toLocaleDateString('vi-VN'),
        status: statusText,
        imageSources: imageSource,
        buttonText: 'View Detail',
        isOrder: true,
        extraInfo: `Expert Status: ${statusText}`,
        isExpert: true,
        originalDate: new Date(item.createdDate)
    };
};

// [TRANSFORMER] Cho Review (Dùng chung cho Pending/Completed/Expired vì cấu trúc giống nhau)
const transformReviewRequest = (reviewReq: ReviewTestRequest): BaseHistoryItem => {
    const id = reviewReq.testRequest.id;
    const pictureUrl = reviewReq.testRequest.pictures?.[0]?.source;
    const imageSource: ImageSource[] = pictureUrl ? [{ uri: pictureUrl }] : [];
    const responseCount = reviewReq.previousResponses?.length || 0;

    // Map status hiển thị cho thân thiện
    const rawStatus = reviewReq.testRequest.status;
    let status = rawStatus;
    let buttonText = 'View Detail';

    if (rawStatus === 'Reviewing') status = 'Pending';
    else if (rawStatus === 'Pending') {
        status = 'Pending';
        buttonText = 'Review Now';
    } else if (rawStatus === 'Completed') {
        status = 'Completed';
    } else if (rawStatus === 'Expired') {
        status = 'Expired';
    }

    return {
        id: id,
        title: `#${id} - Review Request`,
        subTitle: `Prev responses: ${responseCount}`,
        date: new Date(reviewReq.testRequest.createdDate).toLocaleDateString('en-US'),
        status: status,
        imageSources: imageSource,
        buttonText: buttonText,
        isOrder: true,
        extraInfo: `Client ID: ${reviewReq.testRequest.userAccountId}`,
        isExpert: true,
        originalDate: new Date(reviewReq.testRequest.createdDate)
    };
};

// --- HELPER: GROUP BY MONTH ---
const groupDataByMonth = (items: BaseHistoryItem[]): SectionData[] => {
    const groups: { [key: string]: BaseHistoryItem[] } = {};

    items.forEach(item => {
        const dateObj = item.originalDate ? new Date(item.originalDate) : new Date();
        if (isNaN(dateObj.getTime())) return;

        const monthYear = dateObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

        if (!groups[monthYear]) {
            groups[monthYear] = [];
        }
        groups[monthYear].push(item);
    });

    const sections = Object.keys(groups).map(key => ({
        title: key,
        data: groups[key].sort((a, b) => {
            const timeA = a.originalDate ? new Date(a.originalDate).getTime() : 0;
            const timeB = b.originalDate ? new Date(b.originalDate).getTime() : 0;
            return timeB - timeA;
        })
    }));

    return sections.sort((a, b) => {
        const timeA = a.data[0]?.originalDate ? new Date(a.data[0].originalDate).getTime() : 0;
        const timeB = b.data[0]?.originalDate ? new Date(b.data[0].originalDate).getTime() : 0;
        return timeB - timeA;
    });
};

// --- CONFIG ---
const EXPERT_MAIN_TABS: MainTabConfig[] = [
    { name: 'My Test', key: 'MyTest' },
    { name: 'Test Request', key: 'Test Request' },
    { name: 'Review Request', key: 'Review Request' },
];

const USER_MAIN_TABS: MainTabConfig[] = [
    { name: 'Manual Test', key: 'Manual Test' },
    { name: 'AI Test', key: 'AI Test' },
    { name: 'Expert Suggestion', key: 'Expert Suggestion' },
];

const STATUS_TABS: StatusType[] = ['Pending', 'Completed', 'Expired'];

const HistoryScreen: FC<HistoryScreenProps> = ({ navigation, route }) => {
    const insets = useSafeAreaInsets();
    const { userRole } = useAuth();

    const [activeMainTab, setActiveMainTab] = useState<MainTabType>(
        userRole === 'Expert' ? 'Test Request' : 'Manual Test'
    );
    const [activeStatus, setActiveStatus] = useState<StatusType>('Pending');
    const [sectionData, setSectionData] = useState<SectionData[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        const params = route.params as any;
        if (params) {
            if (params.initialTab) {
                const config = userRole === 'Expert' ? EXPERT_MAIN_TABS : USER_MAIN_TABS;
                if (config.some(t => t.key === params.initialTab)) {
                    setActiveMainTab(params.initialTab);
                }
            }
            if (params.initialStatus && userRole === 'Expert') {
                if (STATUS_TABS.includes(params.initialStatus)) {
                    setActiveStatus(params.initialStatus);
                }
            }
        }
    }, [route.params, userRole]);

    // [3] FETCH LOGIC CẬP NHẬT MỚI
    const fetchData = useCallback(async (isRefresh = false) => {
        if (!isRefresh) setIsLoading(true);
        let rawItems: BaseHistoryItem[] = [];

        try {
            if (userRole === 'Expert') {
                // === LOGIC CHO EXPERT ===

                // 1. MyTest: Kết quả test cá nhân của Expert (nếu có)
                if (activeMainTab === 'MyTest') {
                    const results = await getManualTestResults();
                    rawItems = results.map(transformManualTestResult);
                }

                // 2. Test Request: Lấy dữ liệu theo Status bằng API riêng
                else if (activeMainTab === 'Test Request') {
                    if (activeStatus === 'Pending') {
                        // Gọi API Pending
                        const results = await getExpertPendingRequests(); // Hoặc getRequests()
                        rawItems = results.map(transformExpertRequest);
                    } else if (activeStatus === 'Completed') {
                        // Gọi API Completed
                        const results = await getExpertCompletedRequests();
                        rawItems = results.map(transformExpertCompletedRequest);
                    } else if (activeStatus === 'Expired') {
                        // Gọi API Expired
                        const results = await getExpertExpiredRequests();
                        rawItems = results.map(transformExpertCompletedRequest);
                    }
                }

                // 3. Review Request: Lấy dữ liệu theo Status bằng API riêng
                else if (activeMainTab === 'Review Request') {
                    if (activeStatus === 'Pending') {
                        // Gọi API Review Pending
                        const results = await getExpertPendingReviews();
                        rawItems = results.map(transformReviewRequest);
                    } else if (activeStatus === 'Completed') {
                        // Gọi API Review Completed
                        const results = await getExpertCompletedReviews();
                        rawItems = results.map(transformReviewRequest);
                    } else if (activeStatus === 'Expired') {
                        // Gọi API Review Expired
                        const results = await getExpertExpiredReviews();
                        rawItems = results.map(transformReviewRequest);
                    }
                }
            } else {
                // === LOGIC CHO USER THƯỜNG ===
                if (activeMainTab === 'Manual Test') {
                    const results = await getManualTestResults();
                    rawItems = results.map(transformManualTestResult);
                }
                else if (activeMainTab === 'AI Test') {
                    const results = await getAiTestResults();
                    rawItems = results.map(transformAiTestResult);
                }
                else if (activeMainTab === 'Expert Suggestion') {
                    const results = await getExpertTestResults();
                    rawItems = results.map(transformExpertTestResult);
                }
            }

            // Group dữ liệu theo tháng
            const grouped = groupDataByMonth(rawItems);
            setSectionData(grouped);

        } catch (error) {
            console.error('Fetch error:', error);
            Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to load data' });
            setSectionData([]);
        } finally {
            setIsLoading(false);
            if (isRefresh) setRefreshing(false);
        }
    }, [userRole, activeMainTab, activeStatus]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchData(true);
    }, [fetchData]);

    const handleItemAction = useCallback((item: BaseHistoryItem) => {
        // [Expert Actions]
        if (userRole === 'Expert') {
            // Test Request -> Luôn mở CreateExpertTestResponse để làm bài hoặc xem lại
            if (activeMainTab === 'Test Request') {
                navigation.navigate('CreateExpertTestResponse' as any, { id: item.id });
                return;
            }
            // Review Request -> Luôn mở ExpertReviewDetailScreen
            if (activeMainTab === 'Review Request') {
                navigation.navigate('ExpertReviewDetailScreen' as any, { id: item.id });
                return;
            }
        }

        // [User & Common Actions]
        if (activeMainTab === 'Manual Test' || (userRole === 'Expert' && activeMainTab === 'MyTest')) {
            navigation.navigate('ManualTestResultDetailScreen', { id: item.id });
            return;
        }

        if (activeMainTab === 'AI Test') {
            navigation.navigate('AiTestResultDetailScreen', { id: item.id });
            return;
        }

        if (activeMainTab === 'Expert Suggestion') {
            navigation.navigate('ExpertTestResponseDetailScreen', { id: item.id });
            return;
        }

    }, [userRole, activeMainTab, navigation]);

    // --- RENDER FUNCTIONS ---
    const renderSectionHeader = ({ section: { title } }: { section: SectionData }) => (
        <View style={styles.sectionHeader}>
            <Text style={styles.sectionHeaderText}>{title}</Text>
        </View>
    );

    const visibleTabs = userRole === 'Expert' ? EXPERT_MAIN_TABS : USER_MAIN_TABS;

    return (
        <View style={styles.container}>
            <CustomHeader
                title={userRole === 'Expert' ? "Expert Dashboard" : "My History"}
                onNavigateToPackage={() => navigation.navigate('PackageScreen')}
                onNavigateToNotification={() => navigation.navigate('NotificationScreen')}
            />

            <View style={styles.mainTabContainer}>
                {visibleTabs.map(tab => {
                    const isActive = activeMainTab === tab.key;
                    return (
                        <TouchableOpacity
                            key={tab.key}
                            style={[styles.mainTabBtn, isActive && styles.activeMainTabBtn]}
                            onPress={() => setActiveMainTab(tab.key)}
                        >
                            <Text
                                style={[styles.mainTabText, isActive && styles.activeMainTabText]}
                                numberOfLines={1}
                                adjustsFontSizeToFit
                            >
                                {tab.name}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>

            {userRole === 'Expert' && (activeMainTab === 'Test Request' || activeMainTab === 'Review Request') && (
                <View style={styles.statusTabContainer}>
                    {STATUS_TABS.map(status => {
                        const isActive = activeStatus === status;
                        return (
                            <TouchableOpacity
                                key={status}
                                style={[styles.statusTabBtn, isActive && styles.activeStatusTabBtn]}
                                onPress={() => setActiveStatus(status)}
                            >
                                <Text style={[styles.statusTabText, isActive && styles.activeStatusTabText]}>
                                    {status}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            )}

            {isLoading && !refreshing ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#4C7BE2" />
                    <Text style={{ marginTop: 10 }}>Loading data...</Text>
                </View>
            ) : (
                <SectionList
                    sections={sectionData}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={({ item }) => (
                        <HistoryItem item={item} onPressAction={handleItemAction} />
                    )}
                    renderSectionHeader={renderSectionHeader}
                    contentContainerStyle={styles.listContent}
                    stickySectionHeadersEnabled={false}
                    ListEmptyComponent={
                        <Text style={styles.emptyText}>No data found for this period.</Text>
                    }
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4C7BE2" />
                    }
                    ListFooterComponent={<View style={{ height: insets.bottom + 100 }} />}
                />
            )}
        </View>
    );
};

export default HistoryScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    mainTabContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        backgroundColor: '#fff',
        paddingVertical: 10,
        paddingHorizontal: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        gap: 8,
    },
    mainTabBtn: {
        flex: 1,
        paddingVertical: 10,
        paddingHorizontal: 4,
        borderRadius: 20,
        backgroundColor: '#f0f2f5',
        alignItems: 'center',
        justifyContent: 'center',
    },
    activeMainTabBtn: {
        backgroundColor: '#4C7BE2',
    },
    mainTabText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#666',
        textAlign: 'center',
    },
    activeMainTabText: {
        color: '#fff',
    },
    statusTabContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 10,
        paddingHorizontal: 10,
        backgroundColor: '#fff',
        marginBottom: 5,
    },
    statusTabBtn: {
        flex: 1,
        paddingVertical: 8,
        marginHorizontal: 4,
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
        alignItems: 'center',
    },
    activeStatusTabBtn: {
        borderBottomColor: '#4C7BE2',
    },
    statusTabText: {
        fontSize: 13,
        color: '#888',
        fontWeight: '500',
    },
    activeStatusTabText: {
        color: '#4C7BE2',
        fontWeight: 'bold',
    },
    sectionHeader: {
        paddingVertical: 10,
        paddingHorizontal: 0,
        marginTop: 5,
        backgroundColor: '#f8f9fa',
    },
    sectionHeaderText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    listContent: {
        paddingBottom: 20,
        paddingHorizontal: 16,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 50,
        color: '#999',
        fontSize: 14,
    },
});
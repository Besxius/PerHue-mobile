import React, { FC, useCallback, useState, useEffect, useMemo } from "react";
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    FlatList,
    ListRenderItem,
    ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from 'react-native-toast-message';
import CustomHeader from '../components/CustomHeader';
import HistoryItem from "../components/HistoryItem";
import { getAuthRole } from '../api/apiClient'; // Giả định apiClient được đặt trong thư mục api
import { getAiTestResults, getExpertTestResults, getManualTestResults } from "../api/userApi";
import { AiTestResponse, ExpertRequest, ExpertRequestHistoryItem, ExpertTestResponse, ManualTestResult, ReviewTestRequest } from "../types/dataModels";
import { CompositeScreenProps } from "@react-navigation/native";
import { TabParamList } from "./HomeScreen";
import { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/AppNavigator";
import { getRequestHistory, getRequests, getReviewRequests } from "../api/expertApi";
import { BaseHistoryItem, ImageSource } from "../types";
export type RoleInfo = { name: string };

interface TabConfig {
    name: string;
    apiFetcher: () => Promise<any[]>;
}

type HistoryScreenProps = CompositeScreenProps<
    BottomTabScreenProps<TabParamList, 'History'>,
    NativeStackScreenProps<RootStackParamList>
>;

const useUserRole = () => {
    const [userRole, setUserRole] = useState<'Expert' | 'User' | null>(null);
    const [isLoadingUser, setIsLoadingUser] = useState(true);

    useEffect(() => {
        const loadRole = async () => {
            try {
                const role = await getAuthRole();
                console.log("DEBUG: Role retrieved from storage:", role);

                if (role === 'Expert') {
                    setUserRole('Expert');
                } else if (role === 'User') {
                    setUserRole('User')
                } else {
                    console.warn("DEBUG: Invalid role found, defaulting to User.");
                    setUserRole('User');
                }
            } catch (e) {
                console.error("Failed to load user role from storage:", e);
                setUserRole('User');
            } finally {
                setIsLoadingUser(false);
            }
        };
        loadRole();
    }, []);

    return { userRole, isLoadingUser };
};

const transformManualTestResult = (result: ManualTestResult): BaseHistoryItem => {
    const imageSource: ImageSource[] = result.picture ? [{ uri: result.picture }] : [];

    const subtitle = `ColorType: ${result.colorType?.name || 'Unknown'}`;

    return {
        id: result.id,
        title: `#${result.id} - ${result.type || 'Manual Test'}`,
        subTitle: subtitle,
        date: new Date(result.createdDate).toLocaleDateString('vi-VN'),
        status: 'Completed',
        imageSources: imageSource,
        buttonText: 'View Detail',
        isOrder: false,
        extraInfo: `Suggested Color: ${result.suggestedColor}`,
        isExpert: false
    };
};

const transformAiTestResult = (response: AiTestResponse): BaseHistoryItem => {
    const id = response.testRequestId;

    const imageSource: ImageSource[] = [];

    const suggestedColors = response.result?.suggestedColor?.join(', ') || 'N/A';

    const subtitle = `ColorType: ${response.result?.colorType || 'Unknown'}`;

    return {
        id: id,
        title: `#${id} - ${response.typeOfTest || 'AI Test'}`,
        subTitle: subtitle,
        date: new Date(response.createdDate).toLocaleDateString('vi-VN'),
        status: response.status || 'N/A',
        imageSources: imageSource,
        buttonText: 'View Detail',
        isOrder: false,
        extraInfo: `Suggested: ${suggestedColors}`,
        isExpert: false
    };
};

const transformExpertTestResult = (response: ExpertTestResponse): BaseHistoryItem => {
    const id = response.id;

    const pictureUrl = response.pictures?.[0]?.source;
    const imageSource: ImageSource[] = pictureUrl ? [{ uri: pictureUrl }] : [];

    const subTitle = ``;

    return {
        id: id,
        title: `#${id} - ${'Expert Suggestion'}`,
        subTitle: subTitle,
        date: new Date(response.createdDate).toLocaleDateString('vi-VN'),
        status: response.status || 'N/A',
        imageSources: imageSource,
        buttonText: response.status === 'Pending' ? 'View Detail' : 'View Detail',
        isOrder: true,
        extraInfo: `Status: ${response.status}`,
        isExpert: false
    };
};

const transformExpertRequest = (request: ExpertRequest): BaseHistoryItem => {
    const id = request.id;

    const pictureUrl = request.pictures?.[0]?.source;
    const imageSource: ImageSource[] = pictureUrl ? [{ uri: pictureUrl }] : [];

    const subTitle = ``;

    const buttonText = request.status === 'Pending' ? 'Response Now' : 'View Detail';

    return {
        id: id,
        title: `#${id} - ${request.typeOfTest || 'Client Request'}`,
        subTitle: subTitle,
        date: new Date(request.createdDate).toLocaleDateString('vi-VN'),
        status: request.status || 'N/A',
        imageSources: imageSource,
        buttonText: buttonText,
        isOrder: true,
        extraInfo: `User ID: ${request.userAccountId}`,
        isExpert: true
    };
};

const transformReviewRequest = (reviewReq: ReviewTestRequest): BaseHistoryItem => {
    // Sử dụng ID của Test Request thực tế
    const id = reviewReq.testRequest.id;

    // Lấy ảnh từ request ban đầu
    const pictureUrl = reviewReq.testRequest.pictures?.[0]?.source;
    const imageSource: ImageSource[] = pictureUrl ? [{ uri: pictureUrl }] : [];

    // Tính toán số lượng phản hồi trước đó
    const responseCount = reviewReq.previousResponses?.length || 0;
    const isReviewed = responseCount > 0;

    // Trạng thái: Dựa trên status của request, hoặc số lần đã trả lời
    let status = reviewReq.testRequest.status;
    let buttonText = 'View Detail';

    if (status === 'Pending') {
        buttonText = 'Review Now'; // Cần xem xét/trả lời
    } else if (status === 'Completed') {
        status = isReviewed ? 'Reviewed' : 'Completed';
    }

    const subTitle = `Has ${responseCount} previous response(s)`;

    return {
        id: id,
        title: `#${id} - Review for ${reviewReq.testRequest.typeOfTest || 'Client Test'}`,
        subTitle: subTitle,
        date: new Date(reviewReq.testRequest.createdDate).toLocaleDateString('vi-VN'),
        status: status,
        imageSources: imageSource,
        buttonText: buttonText,
        isOrder: true,
        extraInfo: `Client ID: ${reviewReq.testRequest.userAccountId}`,
        isExpert: true
    };
};

const transformExpertHistory = (historyItem: ExpertRequestHistoryItem): BaseHistoryItem => {
    const id = historyItem.id;

    const pictureUrl = historyItem.pictures?.[0]?.source;
    const imageSource: ImageSource[] = pictureUrl ? [{ uri: pictureUrl }] : [];

    const statusText = historyItem.expertStatus || historyItem.status;
    const assignmentDate = new Date(historyItem.assignmentDate).toLocaleDateString('vi-VN');
    const subTitle = `Assigned: ${assignmentDate}`;

    const buttonText = 'View Detail';

    const isExpert = true;

    return {
        id: id,
        title: `#${id} - ${historyItem.typeOfTest || 'Client Test'}`,
        subTitle: subTitle,
        date: new Date(historyItem.createdDate).toLocaleDateString('vi-VN'),
        status: statusText,
        imageSources: imageSource,
        buttonText: buttonText,
        isOrder: true,
        extraInfo: `Expert Status: ${statusText}`,
        isExpert: isExpert,
    };
};

const filterHistory = async (statusFilter: string) => {
    const results = await getRequestHistory();

    const filtered = results.filter(item =>
        (item.expertStatus && item.expertStatus.toLowerCase() === statusFilter.toLowerCase()) ||
        (item.status && item.status.toLowerCase() === statusFilter.toLowerCase())
    );
    return filtered.map(transformExpertHistory);
};

const EXPERT_TABS: TabConfig[] = [
    {
        name: 'Requests',
        apiFetcher: async () => {
            const results = await getRequests();
            return results.map(transformExpertRequest);
        }
    },
    {
        name: 'Review',
        apiFetcher: async () => {
            const results = await getReviewRequests();
            return results.map(transformReviewRequest);
        }
    },
    {
        name: 'Completed',
        apiFetcher: () => filterHistory('completed'),
    },
    {
        name: 'Expired',
        apiFetcher: () => filterHistory('expired'),
    },
    {
        name: 'History',
        apiFetcher: async () => {
            const results = await getRequestHistory();
            return results.map(transformExpertHistory);
        }
    },
];

const USER_TABS: TabConfig[] = [
    {
        name: 'Manual Test',
        apiFetcher: async () => {
            const results = await getManualTestResults();
            return results.map(transformManualTestResult);
        }
    },
    {
        name: 'AI Test',
        apiFetcher: async () => {
            const results = await getAiTestResults();
            return results.map(transformAiTestResult);
        }
    },
    {
        name: 'Expert Suggestion',
        apiFetcher: async () => {
            const results = await getExpertTestResults();
            return results.map(transformExpertTestResult);
        }
    },
];


// ======================================================================
// 4. COMPONENT CHÍNH HISTORY SCREEN
// ======================================================================
const HistoryScreen: FC<HistoryScreenProps> = ({ navigation }) => {
    const insets = useSafeAreaInsets();
    const { userRole, isLoadingUser } = useUserRole();

    const currentTabs = useMemo(() => {
        if (userRole === 'Expert') {
            return EXPERT_TABS;
        }
        return USER_TABS;
    }, [userRole]);

    const [activeTab, setActiveTab] = useState<TabConfig | null>(null);
    const [historyData, setHistoryData] = useState<BaseHistoryItem[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(false);

    // 1. Cập nhật tab mặc định khi vai trò hoặc tabs thay đổi
    useEffect(() => {
        if (currentTabs.length > 0 && !activeTab) {
            setActiveTab(currentTabs[0]);
        } else if (activeTab && !currentTabs.some(tab => tab.name === activeTab.name)) {
            setActiveTab(currentTabs[0]);
        }
    }, [currentTabs, activeTab]);


    // --- Logic Tải Dữ liệu Lịch sử ---
    const loadHistoryData = useCallback(async (fetcher: () => Promise<any[]>, tabName: string) => {
        setIsLoadingData(true);
        try {
            // Fetcher giờ đã trả về BaseHistoryItem[]
            const data = await fetcher();
            setHistoryData(data as BaseHistoryItem[]);
        } catch (error) {
            console.error(`Failed to load data for tab ${tabName}:`, error);
            setHistoryData([]);
            Toast.show({ type: 'error', text1: 'API Error', text2: `Unable to load data for ${tabName}` });
        } finally {
            setIsLoadingData(false);
        }
    }, []);

    // 2. Gọi API khi tab hoạt động thay đổi
    useEffect(() => {
        if (activeTab?.apiFetcher) {
            loadHistoryData(activeTab.apiFetcher, activeTab.name);
        }
    }, [activeTab, loadHistoryData]);


    const handleNavigate = useCallback((screen: keyof RootStackParamList) => {
        navigation.navigate(screen as any);
    }, [navigation]);

    const handleItemAction = useCallback((item: BaseHistoryItem) => {
        if (userRole === 'Expert') {
            if (activeTab?.name === 'Requests') {
                if (item.buttonText === 'Response Now') {
                    navigation.navigate('CreateExpertTestResponse' as any, { id: item.id });
                    return;
                }
            }

            if (activeTab?.name === 'Review') {
                navigation.navigate('ExpertReviewDetailScreen' as any, { id: item.id });
                return;
            }

            if (['History', 'Completed', 'Expired'].includes(activeTab?.name || '')) {
                navigation.navigate('CreateExpertTestResponse' as any, { id: item.id });
                return;
            }
        }

        if (activeTab?.name === 'Manual Test' && item.buttonText === 'View Detail') {
            navigation.navigate('ManualTestResultDetailScreen', { id: item.id });
            return;
        }

        if (activeTab?.name === 'AI Test' && item.buttonText === 'View Detail') {
            navigation.navigate('AiTestResultDetailScreen', { id: item.id });
            return;
        }

        if (activeTab?.name === 'Expert Suggestion') {
            navigation.navigate('ExpertTestResponseDetailScreen', { id: item.id });
            return;
        }

        console.log(`Default action for tab ${activeTab?.name}`);
    }, [activeTab, navigation, userRole]);


    const renderHistoryItem: ListRenderItem<BaseHistoryItem> = useCallback(({ item }) => {
        return <HistoryItem item={item} onPressAction={handleItemAction} />;
    }, [handleItemAction]);

    const keyExtractor = useCallback((item: BaseHistoryItem) => item.id.toString(), []);

    const renderCategoryTab: ListRenderItem<TabConfig> = useCallback(({ item: tab }) => {
        const isActive = activeTab?.name === tab.name;
        return (
            <TouchableOpacity
                key={tab.name}
                style={[
                    styles.tabButton,
                    isActive && styles.activeTab
                ]}
                onPress={() => setActiveTab(tab)}
            >
                <Text style={[
                    styles.tabText,
                    isActive && styles.activeTabText
                ]}>
                    {tab.name}
                </Text>
            </TouchableOpacity>
        );
    }, [activeTab]);

    const categoryKeyExtractor = useCallback((item: TabConfig) => item.name, []);

    // Nếu đang tải vai trò người dùng, hiển thị loading toàn màn hình
    if (isLoadingUser) {
        return <View style={[styles.container, styles.loadingOverlay]}><ActivityIndicator size="large" color="#4C7BE2" /></View>;
    }

    if (!activeTab) {
        return <View style={[styles.container, styles.loadingOverlay]}><Text style={styles.loadingText}>Configuring...</Text></View>;
    }


    return (
        <View style={styles.container}>
            {/* 1. CUSTOM HEADER */}
            <CustomHeader
                title={userRole === 'Expert' ? "Expert Requests" : "My History"}
                onNavigateToPackage={() => handleNavigate('PackageScreen')}
                onNavigateToNotification={() => handleNavigate('NotificationScreen')}
            />

            {/* 2. CATEGORY TABS (Dựa trên Role) */}
            <FlatList
                data={currentTabs}
                renderItem={renderCategoryTab}
                keyExtractor={categoryKeyExtractor}
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.tabScrollView}
                contentContainerStyle={styles.tabBar}
            />

            {/* 3. LIST OF HISTORY ITEMS */}
            {isLoadingData ? (
                <View style={styles.loadingListContainer}>
                    <ActivityIndicator size="large" color="#4C7BE2" />
                    <Text style={styles.loadingText}>Loading {activeTab.name}...</Text>
                </View>
            ) : (
                <FlatList
                    data={historyData}
                    renderItem={renderHistoryItem}
                    keyExtractor={keyExtractor}
                    style={styles.flatList}
                    contentContainerStyle={styles.listContainer}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={<Text style={styles.emptyListText}>No {activeTab.name} items found.</Text>}
                    ListFooterComponent={<View style={{ height: 20 + insets.bottom }} />}
                />
            )}
        </View>
    );
}

export default HistoryScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    loadingOverlay: {
        justifyContent: 'center',
        alignItems: 'center',
        flex: 1,
    },
    loadingListContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#666',
    },
    emptyListText: {
        textAlign: 'center',
        marginTop: 50,
        fontSize: 16,
        color: '#888',
    },
    // --- Tabs Styles ---
    tabScrollView: {
        height: 60,
        flexGrow: 0,
    },
    tabBar: {
        paddingHorizontal: 15,
        paddingVertical: 10,
        backgroundColor: '#fff',
        alignItems: 'center',
    },
    tabButton: {
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 10,
        backgroundColor: '#f0f0f0',
    },
    activeTab: {
        backgroundColor: '#4C7BE2',
    },
    tabText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#666',
    },
    activeTabText: {
        color: '#fff',
        fontWeight: '600',
    },

    // --- List Styles ---
    flatList: {
        flex: 1,
        paddingBottom: 20,
    },
    listContainer: {
        paddingHorizontal: 15,
        paddingBottom: 100,
    },
    itemContainer: {
        flexDirection: 'row',
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        alignItems: 'center',
    },

    // --- History Item/Image Grid Styles (Giữ lại từ code gốc) ---
    imageGrid: { width: 80, height: 80, marginRight: 15, flexDirection: 'row', flexWrap: 'wrap', overflow: 'hidden', borderRadius: 8, },
    gridImage: { width: '50%', height: '50%', },
    fullImage: { width: '100%', height: '100%', borderRadius: 8, },
    itemContent: { flex: 1, },
    itemTitle: { fontSize: 14, color: '#333', fontWeight: '500', },
    itemNumber: { fontWeight: 'bold', },
    itemMethod: { fontSize: 16, fontWeight: '600', marginTop: 2, },
    statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 5, },
    itemStatus: { fontSize: 14, fontWeight: '500', marginRight: 8, },
    processingStatus: { color: '#888', },
    completedStatus: { color: '#333', },
    checkIconContainer: { backgroundColor: '#4C7BE2', width: 16, height: 16, borderRadius: 8, justifyContent: 'center', alignItems: 'center', },
    checkIcon: { color: '#fff', fontSize: 10, lineHeight: 12, fontWeight: 'bold', },
    itemActions: { marginLeft: 10, alignItems: 'flex-end', },
    responseCount: { fontSize: 14, color: '#666', marginBottom: 8, },
    actionButton: { paddingHorizontal: 15, paddingVertical: 10, borderRadius: 25, minWidth: 90, alignItems: 'center', justifyContent: 'center', },
    trackButton: { backgroundColor: '#4C7BE2', },
    reviewButton: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#4C7BE2', },
    buttonText: { fontSize: 14, fontWeight: '600', },
    trackButtonText: { color: '#fff', },
    reviewButtonText: { color: '#4C7BE2', }
});
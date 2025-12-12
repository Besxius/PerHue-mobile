import React, { FC, useCallback, useState, useEffect, useMemo } from "react";
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    FlatList,
    ListRenderItem,
    ActivityIndicator,
    RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from 'react-native-toast-message';
import CustomHeader from '../components/CustomHeader';
import HistoryItem from "../components/HistoryItem";
import { getAiTestResults, getExpertTestResults, getManualTestResults } from "../api/userApi";
import { AiTestResponse, ExpertRequest, ExpertRequestHistoryItem, ExpertTestResponse, ManualTestResult, ReviewTestRequest } from "../types/dataModels";
import { CompositeScreenProps } from "@react-navigation/native";
import { TabParamList } from "./HomeScreen";
import { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/AppNavigator";
import { getRequestHistory, getRequests, getReviewRequests } from "../api/expertApi";
import { BaseHistoryItem, ImageSource } from "../types";
import { getColorType } from "../api/capsulePaletteApi";
import { useAuth } from "./auth/AuthContext";

export type RoleInfo = { name: string };

interface TabConfig {
    name: string;
    apiFetcher: () => Promise<any[]>;
}

type HistoryScreenProps = CompositeScreenProps<
    BottomTabScreenProps<TabParamList, 'History'>,
    NativeStackScreenProps<RootStackParamList>
>;

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

const transformAiTestResult = (response: AiTestResponse, colorMap: Record<number, string>): BaseHistoryItem => {
    const id = response.id;
    const imageSource: ImageSource[] = response.imageUrl ? [{ uri: response.imageUrl }] : [];
    const resultModel = response.newAiTestResultResponseModel;
    const suggestedColors = resultModel?.suggestedColor || 'N/A';
    const colorTypeId = resultModel?.colorTypeId;
    const colorTypeName = (colorTypeId && colorMap[colorTypeId]) ? colorMap[colorTypeId] : 'Unknown';
    const subtitle = `ColorType: ${colorTypeName}`;
    const dateStr = response.createdDate
        ? new Date(response.createdDate).toLocaleDateString('vi-VN')
        : 'N/A';

    return {
        id: id,
        title: `#${id} - ${response.typeOfTest || 'AI Test'}`,
        subTitle: subtitle,
        date: dateStr,
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
    const id = reviewReq.testRequest.id;
    const pictureUrl = reviewReq.testRequest.pictures?.[0]?.source;
    const imageSource: ImageSource[] = pictureUrl ? [{ uri: pictureUrl }] : [];
    const responseCount = reviewReq.previousResponses?.length || 0;
    const isReviewed = responseCount > 0;

    // Status gốc từ API
    const rawStatus = reviewReq.testRequest.status;
    let status = rawStatus;
    let buttonText = 'View Detail';

    // [CẬP NHẬT] Xử lý trạng thái để nút không bị disable
    // Nếu trạng thái là 'Reviewing', map sang 'PendingReview' để HistoryItem nhận diện là active
    if (rawStatus === 'Reviewing') {
        status = 'PendingReview';
    } else if (rawStatus === 'Pending') {
        buttonText = 'Review Now';
    } else if (rawStatus === 'Completed') {
        status = isReviewed ? 'Reviewed' : 'Completed';
    }

    const subTitle = `Has ${responseCount} previous response(s)`;

    return {
        id: id,
        title: `#${id} - Review for ${reviewReq.testRequest.typeOfTest || 'Client Test'}`,
        subTitle: subTitle,
        date: new Date(reviewReq.testRequest.createdDate).toLocaleDateString('vi-VN'),
        status: status, // Sử dụng status đã map
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
            const [results, colorTypes] = await Promise.all([
                getAiTestResults(),
                getColorType()
            ]);
            const colorMap: Record<number, string> = {};
            if (colorTypes && Array.isArray(colorTypes)) {
                colorTypes.forEach(type => {
                    colorMap[type.id] = type.name;
                });
            }
            return results.map(item => transformAiTestResult(item, colorMap));
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

const HistoryScreen: FC<HistoryScreenProps> = ({ navigation, route }) => {
    const insets = useSafeAreaInsets();
    const { userRole } = useAuth();

    const currentTabs = useMemo(() => {
        if (userRole === 'Expert') {
            return EXPERT_TABS;
        }
        return USER_TABS;
    }, [userRole]);

    const [activeTab, setActiveTab] = useState<TabConfig | null>(null);
    const [historyData, setHistoryData] = useState<BaseHistoryItem[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(false);

    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        const params = route.params as any;

        if (params?.initialTab && currentTabs.length > 0) {
            const targetTab = currentTabs.find(tab => tab.name === params.initialTab);
            if (targetTab) {
                console.log(`Switching to tab: ${targetTab.name}`);
                setActiveTab(targetTab);
                navigation.setParams({ initialTab: undefined } as any);
                return;
            }
        }

        if (currentTabs.length > 0 && !activeTab) {
            setActiveTab(currentTabs[0]);
        } else if (activeTab && !currentTabs.some(tab => tab.name === activeTab.name)) {
            setActiveTab(currentTabs[0]);
        }
    }, [currentTabs, route.params]);

    const loadHistoryData = useCallback(async (fetcher: () => Promise<any[]>, tabName: string, isRefetch = false) => {
        if (!isRefetch) setIsLoadingData(true);

        try {
            const data = await fetcher();
            setHistoryData(data as BaseHistoryItem[]);
        } catch (error) {
            console.error(`Failed to load data for tab ${tabName}:`, error);
            setHistoryData([]);
            Toast.show({ type: 'error', text1: 'API Error', text2: `Unable to load data for ${tabName}` });
        } finally {
            setIsLoadingData(false);
            if (isRefetch) setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        if (activeTab?.apiFetcher) {
            loadHistoryData(activeTab.apiFetcher, activeTab.name);
        }
    }, [activeTab, loadHistoryData]);

    const onRefresh = useCallback(() => {
        if (activeTab?.apiFetcher) {
            setRefreshing(true);
            loadHistoryData(activeTab.apiFetcher, activeTab.name, true);
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
            // [CẬP NHẬT] Xử lý sự kiện cho tab Review
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
    }, [activeTab, navigation, userRole]);

    const renderHistoryItem: ListRenderItem<BaseHistoryItem> = useCallback(({ item }) => {
        return <HistoryItem item={item} onPressAction={handleItemAction} />;
    }, [handleItemAction]);

    const keyExtractor = useCallback((item: BaseHistoryItem) => {
        return (item?.id != null) ? item.id.toString() : `fallback-${Math.random()}`;
    }, []);

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

    if (!activeTab) {
        return <View style={[styles.container, styles.loadingOverlay]}><Text style={styles.loadingText}>Configuring...</Text></View>;
    }

    return (
        <View style={styles.container}>
            <CustomHeader
                title={userRole === 'Expert' ? "Expert Requests" : "My History"}
                onNavigateToPackage={() => handleNavigate('PackageScreen')}
                onNavigateToNotification={() => handleNavigate('NotificationScreen')}
            />

            <FlatList
                data={currentTabs}
                renderItem={renderCategoryTab}
                keyExtractor={categoryKeyExtractor}
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.tabScrollView}
                contentContainerStyle={styles.tabBar}
            />

            {isLoadingData && !refreshing ? (
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
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={['#4C7BE2']}
                            tintColor={'#4C7BE2'}
                            progressViewOffset={50}
                        />
                    }
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
    flatList: {
        flex: 1,
        paddingBottom: 20,
    },
    listContainer: {
        paddingHorizontal: 15,
        paddingBottom: 100,
    },
});
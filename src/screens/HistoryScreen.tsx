import React, { FC, useCallback, useState } from "react";
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    Image,
    FlatList,
    ListRenderItem
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// 💡 Import CustomHeader (Giả định đường dẫn và đã import thành công)
// ⚠️ Bạn cần thay thế đường dẫn thực tế của CustomHeader
import CustomHeader from '../components/CustomHeader';
import HistoryItem from "../components/HistoryItem";

// --- Định nghĩa Kiểu (Types) ---
// Giả định UserInfo và RoleInfo đã được định nghĩa
export type RoleInfo = { name: string };
export type UserInfo = {
    id: number;
    email: string;
    username: string;
    fullname: string;
    phone: string;
    gender: boolean;
    dob: string;
    isactive: boolean;
    profilepicture: string;
    roleId: number;
    role: RoleInfo;
};

interface ImageSource { uri: string; }

interface HistoryItemType {
    id: number;
    type: "Request" | "Order";
    number: string;
    method: string;
    status: "Processing" | "Completed";
    responses: number;
    buttonText: string;
    isOrder: boolean;
    imageSources: ImageSource[];
}

// ... (MOCK_DATA và CATEGORIES giữ nguyên)
const CATEGORIES = ['All', 'AI Test', 'Expert', 'Manual', 'Consult', 'Review'];
const MOCK_DATA: HistoryItemType[] = [
    { id: 1, type: "Request", number: "#92287157", method: "AI Test", status: "Processing", responses: 0, buttonText: "Track", isOrder: false, imageSources: [{ uri: 'https://via.placeholder.com/60/FFC0CB/000000?text=A' }, { uri: 'https://via.placeholder.com/60/ADD8E6/000000?text=B' }] },
    { id: 2, type: "Request", number: "#92287157", method: "Expert Suggestion", status: "Processing", responses: 0, buttonText: "Track", isOrder: false, imageSources: [{ uri: 'https://via.placeholder.com/60/4682B4/000000?text=A' }, { uri: 'https://via.placeholder.com/60/DDA0DD/000000?text=B' }] },
    { id: 3, type: "Request", number: "#92287157", method: "Expert Suggestion", status: "Completed", responses: 3, buttonText: "Review", isOrder: false, imageSources: [{ uri: 'https://via.placeholder.com/60/8FBC8F/000000?text=A' }, { uri: 'https://via.placeholder.com/60/CD5C5C/000000?text=B' }] },
    { id: 4, type: "Order", number: "#92287157", method: "Manual Test", status: "Completed", responses: 0, buttonText: "Review", isOrder: true, imageSources: [{ uri: 'https://via.placeholder.com/60/BC8F8F/000000?text=A' }, { uri: 'https://via.placeholder.com/60/A0522D/000000?text=B' }] },
    { id: 5, type: "Order", number: "#92287157", method: "AI Test", status: "Completed", responses: 1, buttonText: "Review", isOrder: true, imageSources: [{ uri: 'https://via.placeholder.com/60/D8BFD8/000000?text=A' }, { uri: 'https://via.placeholder.com/60/E6E6FA/000000?text=B' }] },
    { id: 6, type: "Request", number: "#92287158", method: "AI Test", status: "Processing", responses: 0, buttonText: "Track", isOrder: false, imageSources: [{ uri: 'https://via.placeholder.com/60/FFC0CB/000000?text=E' }] },
    { id: 7, type: "Order", number: "#92287159", method: "Manual Test", status: "Completed", responses: 2, buttonText: "Review", isOrder: true, imageSources: [{ uri: 'https://via.placeholder.com/60/D8BFD8/000000?text=F' }, { uri: 'https://via.placeholder.com/60/E6E6FA/000000?text=G' }] },
];
// ... (Component HistoryItem giữ nguyên)

// ======================================================================
// 4. COMPONENT CHÍNH HISTORY SCREEN (Cập nhật)
// ======================================================================
const HistoryScreen: FC = () => {
    const insets = useSafeAreaInsets();
    const [activeCategory, setActiveCategory] = useState(CATEGORIES[0]);

    // 💡 GIẢ ĐỊNH HÀM ĐIỀU HƯỚNG VÀ USER INFO
    // Trong ứng dụng thực tế, các hàm này sẽ sử dụng navigation.navigate
    const handleNavigate = useCallback((screen: string) => {
        console.log(`Navigating to ${screen}`);
        // navigation.navigate(screen); 
    }, []);

    const handleItemAction = useCallback((item: HistoryItemType) => {
        // Xử lý logic điều hướng hoặc API dựa trên item.buttonText
        console.log(`Action: ${item.buttonText} triggered for ID: ${item.id}`);
    }, []);

    const renderHistoryItem: ListRenderItem<HistoryItemType> = useCallback(({ item }) => {
        return <HistoryItem item={item} onPressAction={handleItemAction} />;
    }, [handleItemAction]);

    const keyExtractor = useCallback((item: HistoryItemType) => item.id.toString(), []);

    // 💡 Hàm render item cho FlatList Ngang (Category Tabs)
    const renderCategoryTab: ListRenderItem<string> = useCallback(({ item: cat }) => {
        const isActive = activeCategory === cat;
        return (
            <TouchableOpacity
                key={cat}
                style={[
                    styles.tabButton,
                    isActive && styles.activeTab
                ]}
                onPress={() => setActiveCategory(cat)}
            >
                <Text style={[
                    styles.tabText,
                    isActive && styles.activeTabText
                ]}>
                    {cat}
                </Text>
            </TouchableOpacity>
        );
    }, [activeCategory]);

    const categoryKeyExtractor = useCallback((item: string) => item, []);

    return (
        <View style={styles.container}>
            {/* 💡 1. CHÈN CUSTOM HEADER VÀO ĐẦU */}
            {/* Giả định CustomHeader tự tải userInfo */}
            <CustomHeader
                title="History result"
                onNavigateToPackage={() => handleNavigate('PackageScreen')}
                onNavigateToNotification={() => handleNavigate('NotificationScreen')}
            // onNavigateToSettings={() => handleNavigate('SettingScreen')}
            />

            {/* Header/Category Tabs - FLATLIST NGANG */}
            <FlatList
                data={CATEGORIES}
                renderItem={renderCategoryTab}
                keyExtractor={categoryKeyExtractor}
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.tabScrollView}
                contentContainerStyle={styles.tabBar}
            />

            {/* List of History Items - FLATLIST DỌC */}
            <FlatList
                data={MOCK_DATA}
                renderItem={renderHistoryItem}
                keyExtractor={keyExtractor}
                style={styles.flatList}
                contentContainerStyle={styles.listContainer}
                showsVerticalScrollIndicator={false}
                ListFooterComponent={<View style={{ height: 20 + insets.bottom }} />}
            />
        </View>
    );
}

export default HistoryScreen;

// ======================================================================
// 5. STYLES (Cập nhật container)
// ======================================================================
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        // 💡 Loại bỏ paddingTop: insets.top khỏi container vì CustomHeader đã tự xử lý.
    },
    // ... (Các styles khác giữ nguyên)

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

    // --- Image Grid Styles ---
    imageGrid: {
        width: 80,
        height: 80,
        marginRight: 15,
        flexDirection: 'row',
        flexWrap: 'wrap',
        overflow: 'hidden',
        borderRadius: 8,
    },
    gridImage: {
        width: '50%',
        height: '50%',
    },
    fullImage: {
        width: '100%',
        height: '100%',
        borderRadius: 8,
    },

    // --- Content Styles ---
    itemContent: {
        flex: 1,
    },
    itemTitle: {
        fontSize: 14,
        color: '#333',
        fontWeight: '500',
    },
    itemNumber: {
        fontWeight: 'bold',
    },
    itemMethod: {
        fontSize: 16,
        fontWeight: '600',
        marginTop: 2,
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 5,
    },
    itemStatus: {
        fontSize: 14,
        fontWeight: '500',
        marginRight: 8,
    },
    processingStatus: {
        color: '#888',
    },
    completedStatus: {
        color: '#333',
    },
    checkIconContainer: {
        backgroundColor: '#4C7BE2',
        width: 16,
        height: 16,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkIcon: {
        color: '#fff',
        fontSize: 10,
        lineHeight: 12,
        fontWeight: 'bold',
    },

    // --- Actions Styles ---
    itemActions: {
        marginLeft: 10,
        alignItems: 'flex-end',
    },
    responseCount: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8,
    },
    actionButton: {
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderRadius: 25,
        minWidth: 90,
        alignItems: 'center',
        justifyContent: 'center',
    },
    trackButton: {
        backgroundColor: '#4C7BE2',
    },
    reviewButton: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#4C7BE2',
    },
    buttonText: {
        fontSize: 14,
        fontWeight: '600',
    },
    trackButtonText: {
        color: '#fff',
    },
    reviewButtonText: {
        color: '#4C7BE2',
    }
});
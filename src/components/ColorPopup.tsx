import React, { useMemo, useState, useEffect, useCallback } from "react";
import {
    Modal,
    ScrollView,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
    Text,
    StyleSheet,
    Dimensions,
    Alert,
    ActivityIndicator,
    FlatList
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Color, ColorType } from "../types/dataModels";

// --- Kết thúc Mock ---

// Định nghĩa giao diện TabItem
interface TabItem extends ColorType {
    isAll?: boolean;
}

// Cập nhật Props để làm cho các trường tùy chọn và nullable
interface ColorPopupProps {
    showColorPicker: boolean;
    setShowColorPicker: (visible: boolean) => void;

    // Nguồn dữ liệu tất cả màu
    allColorFilters: Color[];

    selectedColorInfo: Color;
    handleColorSelect: (color: Color) => void;
    onDeleteColor?: (colorId: number) => void;
    canDelete?: boolean;
    title?: string;

    // NEW: Kiểm soát việc hiển thị tab
    showTabs?: boolean;

    // Hàm API thực tế (nullable)
    getColorTypeApi?: () => Promise<ColorType[]>;
    getColorsByTypeApi?: (id: number) => Promise<Color[]>;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const ALL_TAB_ID = 0;

const ColorPopup: React.FC<ColorPopupProps> = ({
    showColorPicker,
    setShowColorPicker,
    allColorFilters,
    selectedColorInfo,
    handleColorSelect,
    onDeleteColor,
    canDelete = false,
    title = "SELECT COLOR FILTER",
    showTabs = false, // Mặc định là false
    getColorTypeApi,
    getColorsByTypeApi,
}) => {
    const [searchText, setSearchText] = useState('');
    const [showColorNames, setShowColorNames] = useState(false);

    // --- State cho Tabs và Data Load ---
    const [colorTypeTabs, setColorTypeTabs] = useState<TabItem[]>([]);
    const [activeTabId, setActiveTabId] = useState<number>(ALL_TAB_ID);
    const [currentFilteredList, setCurrentFilteredList] = useState<Color[]>(allColorFilters);
    const [isLoadingColors, setIsLoadingColors] = useState(false);
    // ----------------------------------

    // Kiểm tra tính hợp lệ của Tab/API
    const isTabEnabled = showTabs && getColorTypeApi && getColorsByTypeApi;

    // 1. Load Color Types khi component mount (chỉ 1 lần)
    useEffect(() => {
        if (!isTabEnabled) return;

        const loadTypes = async () => {
            try {
                const types = await getColorTypeApi!();
                const allTabs: TabItem[] = [
                    { id: ALL_TAB_ID, name: 'All', isAll: true },
                    ...types
                ];
                setColorTypeTabs(allTabs);
            } catch (error) {
                console.error("Failed to load color types:", error);
            }
        };

        if (colorTypeTabs.length === 0) {
            loadTypes();
        }
    }, [isTabEnabled, getColorTypeApi]);


    // 2. Load Colors theo Type khi tab thay đổi
    const loadColorsForType = useCallback(async (typeId: number) => {
        if (!isTabEnabled) return;

        setActiveTabId(typeId);
        setSearchText('');

        if (typeId === ALL_TAB_ID) {
            setCurrentFilteredList(allColorFilters);
            return;
        }

        setIsLoadingColors(true);
        try {
            const colors = await getColorsByTypeApi!(typeId);
            setCurrentFilteredList(colors);
        } catch (error) {
            console.error(`Failed to load colors for type ${typeId}:`, error);
            Alert.alert("Lỗi tải màu", "Không thể tải danh sách màu cho loại này.");
            setCurrentFilteredList([]);
        } finally {
            setIsLoadingColors(false);
        }
    }, [isTabEnabled, allColorFilters, getColorsByTypeApi]);

    // --- Khởi tạo và đồng bộ khi Popup mở ---
    useEffect(() => {
        if (showColorPicker) {
            // Khi mở, luôn bắt đầu với allColorFilters nếu Tab không được bật
            // Hoặc đồng bộ list hiện tại với allColorFilters nếu đang ở tab All
            if (!isTabEnabled || activeTabId === ALL_TAB_ID) {
                setCurrentFilteredList(allColorFilters);
            }
        }
    }, [showColorPicker, isTabEnabled, allColorFilters]);


    // 3. Lọc màu dựa trên Search Text VÀ Tab đã chọn
    const finalFilteredColors = useMemo(() => {
        if (!searchText) {
            return currentFilteredList;
        }
        const lowerCaseSearch = searchText.toLowerCase();
        return currentFilteredList.filter(color =>
            color.name.toLowerCase().includes(lowerCaseSearch) ||
            color.hexCode.toLowerCase().includes(lowerCaseSearch)
        );
    }, [currentFilteredList, searchText]);
    // --------------------------------------------

    const handleLongPress = (color: Color) => {
        if (!canDelete || !onDeleteColor) return;

        Alert.alert(
            "Xác nhận xóa màu",
            `Bạn có chắc chắn muốn xóa màu "${color.name}" khỏi danh sách đã lưu không?`,
            [
                {
                    text: "Hủy",
                    style: "cancel"
                },
                {
                    text: "Xóa",
                    style: "destructive",
                    onPress: () => {
                        onDeleteColor(color.id);
                        // Cập nhật UI ngay sau khi xóa (chỉ cần cập nhật list hiện tại)
                        setCurrentFilteredList(prev => prev.filter(c => c.id !== color.id));
                    }
                }
            ]
        );
    };

    const renderTabItem = ({ item }: { item: TabItem }) => (
        <TouchableOpacity
            style={[
                styles.tabButton,
                activeTabId === item.id && styles.tabButtonActive
            ]}
            onPress={() => loadColorsForType(item.id)}
            disabled={isLoadingColors}
        >
            <Text style={activeTabId === item.id ? styles.tabTextActive : styles.tabText}>
                {item.name}
            </Text>
        </TouchableOpacity>
    );

    const renderColorItem = (color: Color) => {
        const isSelected = color.id === selectedColorInfo.id && color.hexCode === selectedColorInfo.hexCode;
        return (
            <View key={color.id} style={styles.colorItemWrapper}>
                <TouchableOpacity
                    style={[
                        styles.colorFilterCircle,
                        { backgroundColor: color.hexCode },
                        isSelected && styles.activeColorFilter,
                        showColorNames && styles.colorFilterCircleSmall,
                        canDelete && styles.deletableColorItem,
                    ]}
                    onPress={() => handleColorSelect(color)}
                    onLongPress={canDelete ? () => handleLongPress(color) : undefined}
                    delayLongPress={500}
                >
                    {isSelected && <Ionicons name="checkmark" size={24} color="white" />}
                </TouchableOpacity>

                {canDelete && (
                    <TouchableOpacity
                        style={styles.deleteIconOverlay}
                        onPress={() => handleLongPress(color)} // Trigger deletion alert
                    >
                        <Ionicons name="close" size={14} color="red" />
                    </TouchableOpacity>
                )}

                {showColorNames && (
                    <Text style={styles.colorNameText} numberOfLines={1}>
                        {color.name}
                    </Text>
                )}
            </View>
        );
    };

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={showColorPicker}
            onRequestClose={() => setShowColorPicker(false)}
        >
            <TouchableWithoutFeedback onPress={() => setShowColorPicker(false)}>
                <View style={styles.modalOverlay}>
                    <TouchableWithoutFeedback>
                        <View style={styles.colorPickerPopupContainer}>
                            <View style={styles.modalHandle} />
                            <Text style={styles.colorPickerTitle}>{title}</Text>

                            {/* Render Tabs bằng FlatList */}
                            {isTabEnabled && colorTypeTabs.length > 0 && (
                                <View style={styles.tabsContainer}>
                                    <FlatList
                                        data={colorTypeTabs}
                                        renderItem={renderTabItem}
                                        keyExtractor={(item) => item.id.toString()}
                                        horizontal
                                        showsHorizontalScrollIndicator={false}
                                        contentContainerStyle={styles.tabsScrollContent}
                                    />
                                    {isLoadingColors && (
                                        <View style={styles.tabLoadingOverlay}>
                                            <ActivityIndicator size="small" color="#fff" />
                                        </View>
                                    )}
                                </View>
                            )}

                            <View style={styles.headerControlsContainer}>
                                <View style={styles.searchContainer}>
                                    <Ionicons name="search" size={20} color="gray" style={{ marginLeft: 10 }} />
                                    <TextInput
                                        style={styles.searchInput}
                                        placeholder="Search colors (name or hex code)..."
                                        placeholderTextColor="gray"
                                        value={searchText}
                                        onChangeText={setSearchText}
                                    />
                                    {searchText.length > 0 && (
                                        <TouchableOpacity onPress={() => setSearchText('')} style={{ marginRight: 10 }}>
                                            <Ionicons name="close-circle" size={20} color="gray" />
                                        </TouchableOpacity>
                                    )}
                                </View>

                                <TouchableOpacity
                                    style={[styles.toggleButton, showColorNames && styles.toggleButtonActive]}
                                    onPress={() => setShowColorNames(prev => !prev)}
                                >
                                    {showColorNames ? (
                                        <Ionicons name="list" size={20} color="white" />
                                    ) : (
                                        <Ionicons name="grid" size={20} color="white" />
                                    )}
                                </TouchableOpacity>
                            </View>

                            <ScrollView contentContainerStyle={styles.popupScrollContainerVertical}>

                                {isLoadingColors && !searchText ? (
                                    <View style={styles.loadingArea}>
                                        <ActivityIndicator size="large" color="#007AFF" />
                                        <Text style={styles.loadingText}>Loading colors...</Text>
                                    </View>
                                ) : (
                                    <View style={styles.colorGridContainer}>
                                        {finalFilteredColors.map(renderColorItem)}

                                        {finalFilteredColors.length === 0 && (
                                            <Text style={styles.noResultText}>No matching colors found.</Text>
                                        )}
                                    </View>
                                )}
                            </ScrollView>

                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
    },
    colorPickerPopupContainer: {
        backgroundColor: '#000',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingTop: 10,
        paddingBottom: 20,
        width: screenWidth,
        alignItems: 'center',
        height: screenHeight * 0.7,
    },
    modalHandle: {
        width: 40,
        height: 5,
        backgroundColor: 'rgba(255, 255, 255, 0.5)',
        borderRadius: 3,
        marginBottom: 10,
    },
    colorPickerTitle: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 10,
    },

    // --- Tab Styles ---
    tabsContainer: {
        width: screenWidth,
        height: 40,
        marginBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#1E1E1E',
        position: 'relative',
        justifyContent: 'center',
    },
    tabsScrollContent: {
        paddingHorizontal: 15,
        alignItems: 'center',
    },
    tabButton: {
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 20,
        marginHorizontal: 4,
    },
    tabButtonActive: {
        backgroundColor: '#007AFF',
    },
    tabText: {
        color: 'rgba(255, 255, 255, 0.7)',
        fontWeight: '600',
    },
    tabTextActive: {
        color: 'white',
        fontWeight: 'bold',
    },
    tabLoadingOverlay: {
        position: 'absolute',
        right: 0,
        top: 0,
        bottom: 0,
        justifyContent: 'center',
        paddingHorizontal: 10,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: 1,
    },
    // ------------------

    headerControlsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        width: screenWidth,
        paddingHorizontal: 20,
        marginBottom: 15,
    },
    searchContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1E1E1E',
        borderRadius: 10,
        marginRight: 10,
    },
    searchInput: {
        flex: 1,
        height: 40,
        color: 'white',
        fontSize: 16,
        paddingHorizontal: 10,
    },
    toggleButton: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        padding: 10,
        borderRadius: 10,
    },
    toggleButtonActive: {
        backgroundColor: '#007AFF',
    },
    noResultText: {
        color: 'gray',
        marginTop: 20,
        fontSize: 16,
        textAlign: 'center',
        width: '100%',
    },
    popupScrollContainerVertical: {
        paddingHorizontal: 0,
        alignItems: 'center',
        paddingBottom: 10,
        width: screenWidth,
    },
    loadingArea: {
        minHeight: 150,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        color: '#007AFF',
        marginTop: 10,
    },
    colorGridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        width: screenWidth,
        justifyContent: 'flex-start',
        paddingVertical: 10,
        paddingHorizontal: 20,
    },
    colorItemWrapper: {
        width: (screenWidth - 40) / 6,
        alignItems: 'center',
        marginBottom: 10,
        position: 'relative',
    },
    colorFilterCircle: {
        width: (screenWidth - 40) / 6 - 6,
        height: (screenWidth - 40) / 6 - 6,
        borderRadius: ((screenWidth - 40) / 6 - 6) / 2,
        borderWidth: 2,
        borderColor: 'transparent',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    colorFilterCircleSmall: {
        width: 40,
        height: 40,
        borderRadius: 20,
    },
    activeColorFilter: {
        borderColor: 'white',
    },
    deletableColorItem: {
        borderWidth: 1,
        borderColor: 'rgba(255, 0, 0, 0.5)',
    },
    deleteIconOverlay: {
        position: 'absolute',
        top: 0,
        right: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        borderRadius: 10,
        padding: 2,
        zIndex: 10,
    },
    colorNameText: {
        color: 'white',
        fontSize: 10,
        textAlign: 'center',
        marginTop: 4,
        width: '100%',
    },
});

export default ColorPopup;
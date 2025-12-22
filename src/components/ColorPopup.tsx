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
    FlatList,
    KeyboardAvoidingView,
    Platform,
    ToastAndroid,
} from "react-native";
import Toast from 'react-native-toast-message';
import { Ionicons } from "@expo/vector-icons";
import { Color, ColorType } from "../types/dataModels";
import * as Clipboard from 'expo-clipboard';
interface TabItem extends ColorType {
    isAll?: boolean;
}

interface ColorPopupProps {
    showColorPicker: boolean;
    setShowColorPicker: (visible: boolean) => void;
    allColorFilters: Color[];
    selectedColorInfo: Color;

    handleColorSelect: (color: Color) => void;
    onDeleteColor?: (colorId: number) => void;
    onImportColors?: (colors: Color[]) => void;

    canDelete?: boolean;
    title?: string;
    showTabs?: boolean;
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
    onImportColors,
    canDelete = false,
    title = "SELECT COLOR FILTER",
    showTabs = false,
    getColorTypeApi,
    getColorsByTypeApi,
}) => {
    const [searchText, setSearchText] = useState('');
    const [showColorNames, setShowColorNames] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const [importText, setImportText] = useState('');

    const [colorTypeTabs, setColorTypeTabs] = useState<TabItem[]>([]);
    const [activeTabId, setActiveTabId] = useState<number>(ALL_TAB_ID);
    const [currentFilteredList, setCurrentFilteredList] = useState<Color[]>(allColorFilters);
    const [isLoadingColors, setIsLoadingColors] = useState(false);

    const isTabEnabled = showTabs && getColorTypeApi && getColorsByTypeApi;

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

    useEffect(() => {
        if (showColorPicker) {
            if (!isTabEnabled || activeTabId === ALL_TAB_ID) {
                setCurrentFilteredList(allColorFilters);
            }
        }
    }, [showColorPicker, isTabEnabled, allColorFilters]);


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
                        setCurrentFilteredList(prev => prev.filter(c => c.id !== color.id));
                    }
                }
            ]
        );
    };

    const handleCopyColor = async (color: Color) => {
        await Clipboard.setStringAsync(color.hexCode);

        if (Platform.OS === 'android') {
            ToastAndroid.show(`Copied ${color.hexCode} to clipboard!`, ToastAndroid.SHORT);
        } else {
            Alert.alert("Copied", `Color code ${color.hexCode} copied!`);
        }
    };

    const handleProcessImport = () => {
        if (!importText.trim()) {
            setShowImportModal(false);
            return;
        }

        const rawColors = importText.split(',');
        const validColors: Color[] = [];

        const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;

        rawColors.forEach((item, index) => {
            let hex = item.trim();
            if (!hex.startsWith('#') && (hex.length === 3 || hex.length === 6)) {
                hex = '#' + hex;
            }

            if (hexRegex.test(hex)) {
                validColors.push({
                    id: Date.now() + index + Math.random(),
                    name: hex.toUpperCase(),
                    hexCode: hex.toUpperCase()
                });
            }
        });

        if (validColors.length > 0 && onImportColors) {
            onImportColors(validColors);
            setImportText('');
            setShowImportModal(false);
        } else {
            Alert.alert("Lỗi", "Không tìm thấy mã màu hợp lệ. Vui lòng nhập dạng #FFFFFF,#000000");
        }
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

                <TouchableOpacity
                    style={styles.actionIconOverlay}
                    onPress={() => handleCopyColor(color)}
                >
                    <Ionicons name="copy-outline" size={12} color="#999" />
                </TouchableOpacity>

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

                                {onImportColors && (
                                    <TouchableOpacity
                                        style={styles.toggleButton}
                                        onPress={() => setShowImportModal(true)}
                                    >
                                        <Ionicons name="download-outline" size={20} color="white" />
                                    </TouchableOpacity>
                                )}

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
                            <Modal
                                animationType="fade"
                                transparent={true}
                                visible={showImportModal}
                                onRequestClose={() => setShowImportModal(false)}
                            >
                                <KeyboardAvoidingView
                                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                                    style={styles.importModalOverlay}
                                    keyboardVerticalOffset={Platform.OS === 'ios' ? 20 : 0}
                                >
                                    <View style={styles.importModalContainer}>
                                        <Text style={styles.importModalTitle}>Import Colors</Text>
                                        <Text style={styles.importModalDesc}>
                                            Enter hex codes separated by commas (e.g. #FF0000, #00FF00)
                                        </Text>
                                        <TextInput
                                            style={styles.importInput}
                                            placeholder="#FFFFFF, #000000..."
                                            placeholderTextColor="#888"
                                            multiline
                                            value={importText}
                                            onChangeText={setImportText}
                                        />
                                        <View style={styles.importButtonRow}>
                                            <TouchableOpacity
                                                style={[styles.importBtn, styles.cancelBtn]}
                                                onPress={() => setShowImportModal(false)}
                                            >
                                                <Text style={styles.importBtnText}>Cancel</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={[styles.importBtn, styles.confirmBtn]}
                                                onPress={handleProcessImport}
                                            >
                                                <Text style={styles.importBtnText}>Import</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </KeyboardAvoidingView>
                            </Modal>
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
        backgroundColor: '#333',
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
    importModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    importModalContainer: {
        width: '85%',
        backgroundColor: '#2C2C2C',
        borderRadius: 15,
        padding: 20,
        alignItems: 'center',
    },
    importModalTitle: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    importModalDesc: {
        color: '#BBB',
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 15,
    },
    importInput: {
        width: '100%',
        height: 100,
        backgroundColor: '#1E1E1E',
        borderRadius: 10,
        padding: 10,
        color: 'white',
        textAlignVertical: 'top',
        marginBottom: 20,
    },
    importButtonRow: {
        flexDirection: 'row',
        width: '100%',
        justifyContent: 'space-between',
    },
    importBtn: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    cancelBtn: {
        backgroundColor: '#444',
        marginRight: 10,
    },
    confirmBtn: {
        backgroundColor: '#007AFF',
        marginLeft: 10,
    },
    importBtnText: {
        color: 'white',
        fontWeight: 'bold',
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
        overflow: 'hidden',
    },
    toggleButton: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        padding: 10,
        borderRadius: 10,
        marginLeft: 10,
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
    actionIconOverlay: {
        position: 'absolute',
        top: 0,
        right: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 10,
        padding: 4,
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
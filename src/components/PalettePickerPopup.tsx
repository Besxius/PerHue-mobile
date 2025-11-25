import React, { useMemo, useState, useRef, useCallback } from "react";
import { Color } from "../types/dataModels";
import { Modal, ScrollView, TextInput, TouchableOpacity, TouchableWithoutFeedback, View, Text, StyleSheet, Dimensions, FlatList } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import CapsulePalette from "./CapsulePalette";

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// --- HÀM CHUYỂN ĐỔI HỆ MÀU (Cần cho Detail View) ---
const hexToRgb = (hexCode: string) => {
    const hex = hexCode.startsWith('#') ? hexCode.slice(1) : hexCode;
    if (hex.length === 6) {
        const bigint = parseInt(hex, 16);
        return {
            r: (bigint >> 16) & 255,
            g: (bigint >> 8) & 255,
            b: bigint & 255,
        };
    }
    return { r: 0, g: 0, b: 0 };
};

const hexToCmyk = (hexCode: string) => {
    const { r, g, b } = hexToRgb(hexCode);
    const r_prime = r / 255;
    const g_prime = g / 255;
    const b_prime = b / 255;

    const k = 1 - Math.max(r_prime, g_prime, b_prime);

    if (k === 1) {
        return { c: 0, m: 0, y: 0, k: 100 };
    }

    const c = ((1 - r_prime - k) / (1 - k)) * 100;
    const m = ((1 - g_prime - k) / (1 - k)) * 100;
    const y = ((1 - b_prime - k) / (1 - k)) * 100;

    return {
        c: Math.round(c),
        m: Math.round(m),
        y: Math.round(y),
        k: Math.round(k * 100),
    };
};

// --- Định nghĩa cấu trúc Palette (Giữ nguyên) ---
type DetailedColor = {
    id: number;
    name: string;
    hexCode: string;
};

type ColorType = {
    id: number;
    name: SeasonTab;
};

type SeasonTab = 'Cool Winter' | 'Deep Winter' | 'Clear Winter' |
    'Cool Summer' | 'Soft Summer' | 'Light Summer' |
    'Warm Autumn' | 'Soft Autumn' | 'Deep Autumn' |
    'Warm Spring' | 'Light Spring' | 'Clear Spring';

type Palette = {
    id: number;
    colorTypeId: number;
    colorType: ColorType;
    colors: DetailedColor[];
};

const SEASON_TABS: SeasonTab[] = [
    'Cool Winter', 'Deep Winter', 'Clear Winter',
    'Cool Summer', 'Soft Summer', 'Light Summer',
    'Warm Autumn', 'Soft Autumn', 'Deep Autumn',
    'Warm Spring', 'Light Spring', 'Clear Spring',
];

// Mock Palettes (Giữ nguyên)
const mockPalettes: Palette[] = [
    { "id": 1, "colorTypeId": 1, "colorType": { "id": 1, "name": "Cool Winter" }, "colors": [{ "id": 1, "name": "Fresh Guacamole", "hexCode": "#AEBE89" }, { "id": 2, "name": "Aloe Cream", "hexCode": "#DAE3BB" }, { "id": 3, "name": "White Lace", "hexCode": "#FFF7EC" }, { "id": 4, "name": "Brook Green", "hexCode": "#A8EAD5" }] },
    { "id": 2, "colorTypeId": 5, "colorType": { "id": 5, "name": "Soft Summer" }, "colors": [{ "id": 5, "name": "Earthy Cane", "hexCode": "#C5B08B" }, { "id": 6, "name": "Caraway Seeds", "hexCode": "#DED5BC" }, { "id": 7, "name": "Swan White", "hexCode": "#F8F3E6" }, { "id": 8, "name": "Frosty Pine", "hexCode": "#C6CEBE" }] },
    { "id": 3, "colorTypeId": 2, "colorType": { "id": 2, "name": "Deep Winter" }, "colors": [{ "id": 9, "name": "Aurora Red", "hexCode": "#850121" }, { "id": 10, "name": "Incarnadine", "hexCode": "#B1002A" }, { "id": 11, "name": "Sizzling Sunset", "hexCode": "#EC7A49" }, { "id": 12, "name": "Dark Scarlet Red", "hexCode": "#800733" }] },
    { "id": 4, "colorTypeId": 3, "colorType": { "id": 3, "name": "Clear Winter" }, "colors": [{ "id": 13, "name": "Frozen Wave", "hexCode": "#52A7CC" }, { "id": 14, "name": "Gossamer Pink", "hexCode": "#FBC7C3" }, { "id": 15, "name": "Rustic Cream", "hexCode": "#F6EFE3" }, { "id": 16, "name": "Rich Honey", "hexCode": "#FABB7C" }] },
    { "id": 5, "colorTypeId": 2, "colorType": { "id": 2, "name": "Deep Winter" }, "colors": [{ "id": 17, "name": "Christmas Eve", "hexCode": "#15192F" }, { "id": 18, "name": "Christmas Red", "hexCode": "#B11E31" }, { "id": 19, "name": "Christmas Vanilla", "hexCode": "#FAF2D1" }, { "id": 20, "name": "Cake", "hexCode": "#096344" }] },
    { "id": 6, "colorTypeId": 5, "colorType": { "id": 5, "name": "Soft Summer" }, "colors": [{ "id": 21, "name": "Christmas Tree", "hexCode": "#FCC4C9" }, { "id": 22, "name": "Crystal Rose", "hexCode": "#FDF6F0" }, { "id": 23, "name": "Backlight", "hexCode": "#F8E2CF" }, { "id": 24, "name": "Sandy Beach", "hexCode": "#F5C6AA" }] },
    { "id": 7, "colorTypeId": 1, "colorType": { "id": 1, "name": "Cool Winter" }, "colors": [{ "id": 25, "name": "Desert Sand", "hexCode": "#415A80" }, { "id": 26, "name": "Deep Azure", "hexCode": "#A5D4DC" }, { "id": 27, "name": "Midwinter Mist", "hexCode": "#F2F4F8" }, { "id": 28, "name": "Snowbelt", "hexCode": "#D7E2E9" }] },
    { "id": 8, "colorTypeId": 1, "colorType": { "id": 1, "name": "Cool Winter" }, "colors": [{ "id": 29, "name": "Early Frost", "hexCode": "#A9A9C4" }, { "id": 30, "name": "Cosmic Sky", "hexCode": "#D0D1E1" }, { "id": 31, "name": "Hailstorm", "hexCode": "#EBECEF" }, { "id": 32, "name": "Bright Grey", "hexCode": "#908DB9" }] },
    { "id": 9, "colorTypeId": 7, "colorType": { "id": 7, "name": "Warm Autumn" }, "colors": [{ "id": 14, "name": "Gossamer Pink", "hexCode": "#FBC7C3" }, { "id": 15, "name": "Rustic Cream", "hexCode": "#F6EFE3" }, { "id": 16, "name": "Rich Honey", "hexCode": "#FABB7C" }, { "id": 33, "name": "Purple Amethyst", "hexCode": "#E0A39C" }] },
    { "id": 10, "colorTypeId": 4, "colorType": { "id": 4, "name": "Cool Summer" }, "colors": [{ "id": 34, "name": "Berrie Popsicle", "hexCode": "#D4A6D1" }, { "id": 35, "name": "Pink Frosting", "hexCode": "#F7D9E1" }, { "id": 36, "name": "Soft Breeze", "hexCode": "#FBF8F6" }, { "id": 37, "name": "Nordic Breeze", "hexCode": "#D3DDE6" }] },
    { "id": 11, "colorTypeId": 12, "colorType": { "id": 12, "name": "Clear Spring" }, "colors": [{ "id": 38, "name": "Emerald Wave", "hexCode": "#52ADA2" }, { "id": 40, "name": "Stem Green", "hexCode": "#F7F8F3" }, { "id": 41, "name": "Wormwood Green", "hexCode": "#AADE87" }, { "id": 42, "name": "Missing", "hexCode": "#000000" }] },
    { "id": 12, "colorTypeId": 4, "colorType": { "id": 4, "name": "Cool Summer" }, "colors": [{ "id": 42, "name": "Snowflake", "hexCode": "#9DB09C" }, { "id": 43, "name": "Wayward Willow", "hexCode": "#EEF0F0" }, { "id": 44, "name": "Hazel Gaze", "hexCode": "#D6D9D0" }, { "id": 45, "name": "Glacial Green", "hexCode": "#B7BDB0" }] },
    { "id": 13, "colorTypeId": 7, "colorType": { "id": 7, "name": "Warm Autumn" }, "colors": [{ "id": 46, "name": "Lychee Pulp", "hexCode": "#6EB5A5" }, { "id": 47, "name": "Caramelized Pears", "hexCode": "#F9F4DB" }, { "id": 48, "name": "Vintage Red", "hexCode": "#E7D6AC" }, { "id": 49, "name": "Hurricane Haze", "hexCode": "#A13842" }] },
    { "id": 14, "colorTypeId": 5, "colorType": { "id": 5, "name": "Soft Summer" }, "colors": [{ "id": 50, "name": "Alpine Frost", "hexCode": "#BDBBAD" }, { "id": 51, "name": "Milk Grass", "hexCode": "#E0DED2" }, { "id": 52, "name": "Winter Frost", "hexCode": "#FAF8F0" }, { "id": 53, "name": "Missing", "hexCode": "#000000" }] },
    { "id": 15, "colorTypeId": 5, "colorType": { "id": 5, "name": "Soft Summer" }, "colors": [{ "id": 50, "name": "Alpine Frost", "hexCode": "#BDBBAD" }, { "id": 51, "name": "Milk Grass", "hexCode": "#E0DED2" }, { "id": 52, "name": "Winter Frost", "hexCode": "#FAF8F0" }, { "id": 53, "name": "Missing", "hexCode": "#000000" }] },
];

type PaletteDisplay = Palette;


interface PalettePickerPopupProps {
    showPalettePicker: boolean;
    setShowPalettePicker: (visible: boolean) => void;
    colorFilters: Color[];
    handleColorSelect: (color: Color) => void;
}

// --- Component hiển thị chi tiết Palette ---
interface PaletteDetailViewProps {
    palette: Palette;
    onBack: () => void;
    onSelectColor: (color: Color) => void;
}

const PaletteDetailView: React.FC<PaletteDetailViewProps> = ({ palette, onBack, onSelectColor }) => {
    return (
        // Đã xóa paddingBottom ở đây vì nó đã được xử lý trong popupContainer.
        <View style={detailStyles.detailContainer}>
            <View style={detailStyles.detailHeader}>
                <TouchableOpacity onPress={onBack} style={detailStyles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="white" />
                </TouchableOpacity>
                <Text style={detailStyles.detailTitle}>{palette.colorType.name.toUpperCase()} PALETTE</Text>
            </View>

            <ScrollView style={detailStyles.detailScroll} contentContainerStyle={detailStyles.detailContent}>
                {palette.colors.map((colorItem, index) => {
                    const rgb = hexToRgb(colorItem.hexCode);
                    const cmyk = hexToCmyk(colorItem.hexCode);

                    const colorToReturn: Color = {
                        id: colorItem.id,
                        name: colorItem.name,
                        hexCode: colorItem.hexCode
                    };

                    return (
                        <TouchableOpacity
                            key={colorItem.id}
                            style={detailStyles.colorRow}
                            onPress={() => onSelectColor(colorToReturn)}
                        >
                            <View style={[detailStyles.colorSwatch, { backgroundColor: colorItem.hexCode }]} />
                            <View style={detailStyles.colorInfo}>
                                <Text style={detailStyles.colorName}>{colorItem.name}</Text>
                                <View style={detailStyles.colorCodesContainer}>
                                    <Text style={detailStyles.colorCode}>
                                        <Text style={detailStyles.codeLabel}>HEX:</Text> {colorItem.hexCode.toUpperCase()}
                                    </Text>
                                    <Text style={detailStyles.colorCode}>
                                        <Text style={detailStyles.codeLabel}>RGB:</Text> {rgb.r}, {rgb.g}, {rgb.b}
                                    </Text>
                                    <Text style={detailStyles.colorCode}>
                                        <Text style={detailStyles.codeLabel}>CMYK:</Text> {cmyk.c}, {cmyk.m}, {cmyk.y}, {cmyk.k}
                                    </Text>
                                </View>
                            </View>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>
        </View>
    );
};
// --- Hết Component Detail View ---

const PalettePickerPopup: React.FC<PalettePickerPopupProps> = ({
    showPalettePicker,
    setShowPalettePicker,
    handleColorSelect,
}) => {
    const [searchText, setSearchText] = useState('');
    const [selectedTab, setSelectedTab] = useState<SeasonTab>('Cool Winter');
    const [selectedPaletteId, setSelectedPaletteId] = useState<number | null>(null);
    const [detailedPalette, setDetailedPalette] = useState<Palette | null>(null);

    const tabListRef = useRef<FlatList<SeasonTab>>(null);

    // --- Tính toán chiều cao tối thiểu cho ScrollView ---
    const MAX_MODAL_HEIGHT = screenHeight * 0.7;
    // Tinh chỉnh ước tính để đảm bảo tabs hiển thị.
    const FIXED_HEADER_ESTIMATED_HEIGHT =
        10 + // paddingTop của popupContainer
        5 + // modalHandle height
        10 + // modalHandle marginBottom
        26 + // palettePickerTitle height
        10 + // palettePickerTitle marginBottom
        40 + // searchInput height (từ headerControlsContainer)
        15 + // headerControlsContainer marginBottom
        38 + // tabItem height
        15 + // tabListContainer marginBottom
        20; // paddingBottom của popupContainer

    const SCROLLVIEW_MIN_HEIGHT = MAX_MODAL_HEIGHT - FIXED_HEADER_ESTIMATED_HEIGHT;
    // ----------------------------------------------------

    // 1. Nhóm và Lọc Palettes theo Tab
    const filteredPalettes = useMemo<PaletteDisplay[]>(() => {
        let listBySeason = mockPalettes.filter(p => p.colorType.name === selectedTab);

        if (!searchText) {
            return listBySeason;
        }
        const lowerCaseSearch = searchText.toLowerCase();

        return listBySeason.filter(palette => {
            const idMatch = palette.id.toString().includes(lowerCaseSearch);
            const colorMatch = palette.colors.some(c =>
                c.name.toLowerCase().includes(lowerCaseSearch) ||
                c.hexCode.toLowerCase().includes(lowerCaseSearch)
            );

            return idMatch || colorMatch;
        });
    }, [selectedTab, searchText]);

    // Cuộn tới tab đang chọn
    const handleTabSelect = (tab: SeasonTab, index: number) => {
        setSelectedTab(tab);
        setDetailedPalette(null);
        setTimeout(() => {
            tabListRef.current?.scrollToIndex({ index: index, animated: true, viewPosition: 0.5 });
        }, 0);
    };

    // Mở Detail View
    const handlePaletteSelectForDetail = (palette: PaletteDisplay) => {
        setDetailedPalette(palette);
    };

    // Xử lý chọn màu từ Detail View
    const handleRepresentativeColorSelect = (color: Color) => {
        handleColorSelect(color);
        setShowPalettePicker(false);
    }

    // Render Item cho FlatList ngang (Tabs)
    const renderTabItem = ({ item, index }: { item: SeasonTab, index: number }) => {
        const isActive = item === selectedTab;
        return (
            <TouchableOpacity
                style={[paletteStyles.tabItem, isActive && paletteStyles.activeTabItem]}
                onPress={() => handleTabSelect(item, index)}
            >
                <Text style={[paletteStyles.tabText, isActive && paletteStyles.activeTabText]}>
                    {item}
                </Text>
            </TouchableOpacity>
        );
    };

    // --- RENDER HÀM CHÍNH ---

    const renderGridView = () => (
        <View style={paletteStyles.gridViewContainer}>
            <View style={paletteStyles.headerControlsContainer}>
                <View style={paletteStyles.searchContainer}>
                    <Ionicons name="search" size={20} color="gray" style={{ marginLeft: 10 }} />
                    <TextInput
                        style={paletteStyles.searchInput}
                        placeholder="Tìm kiếm palette màu..."
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
            </View>

            <FlatList
                ref={tabListRef}
                data={SEASON_TABS}
                renderItem={renderTabItem}
                keyExtractor={(item) => item}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={paletteStyles.tabListContainer}
                getItemLayout={(data, index) => ({
                    length: 140,
                    offset: 140 * index,
                    index,
                })}
            />

            <ScrollView
                style={{ minHeight: SCROLLVIEW_MIN_HEIGHT, width: screenWidth }}
                contentContainerStyle={paletteStyles.popupScrollContainerVertical}
            >
                <View style={paletteStyles.paletteGridContainer}>
                    {filteredPalettes.map((palette) => {
                        const isSelected = selectedPaletteId === palette.id;

                        const hexCodes: [string, string, string, string] = [
                            palette.colors[0]?.hexCode || '#000000',
                            palette.colors[1]?.hexCode || '#000000',
                            palette.colors[2]?.hexCode || '#000000',
                            palette.colors[3]?.hexCode || '#000000',
                        ];

                        return (
                            <CapsulePalette
                                key={palette.id}
                                colors={hexCodes}
                                isSelected={isSelected}
                                onSelect={() => handlePaletteSelectForDetail(palette)}
                            />
                        );
                    })}
                </View>
                {filteredPalettes.length === 0 && (
                    <Text style={paletteStyles.noResultText}>Không tìm thấy palette màu phù hợp trong mùa {selectedTab}.</Text>
                )}
            </ScrollView>
        </View>
    );

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={showPalettePicker}
            onRequestClose={() => setShowPalettePicker(false)}
        >
            <TouchableWithoutFeedback onPress={() => {
                if (detailedPalette) {
                    setDetailedPalette(null);
                } else {
                    setShowPalettePicker(false);
                }
            }}>
                <View style={paletteStyles.modalOverlay}>
                    <TouchableWithoutFeedback>
                        {/* 🌟 Đã cập nhật: Sử dụng flex: 1 cho phép Popup Container chiếm maxHeight */}
                        <View style={paletteStyles.palettePickerPopupContainer}>
                            <View style={paletteStyles.modalHandle} />

                            {/* NỘI DUNG CHÍNH (TITLE + GRID/DETAIL) */}
                            <View style={paletteStyles.mainContentWrapper}>
                                {detailedPalette ? (
                                    <PaletteDetailView
                                        palette={detailedPalette}
                                        onBack={() => setDetailedPalette(null)}
                                        onSelectColor={handleRepresentativeColorSelect}
                                    />
                                ) : (
                                    <>
                                        <Text style={paletteStyles.palettePickerTitle}>CHỌN PALETTE MÀU</Text>
                                        {renderGridView()}
                                    </>
                                )}
                            </View>
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
};

const HORIZONTAL_PADDING = 20;

const detailStyles = StyleSheet.create({
    detailContainer: {
        width: screenWidth,
        flex: 1, // Chiếm toàn bộ không gian còn lại
        paddingBottom: 0, // Padding Bottom đã được xử lý bởi Modal Container
    },
    detailHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 15,
        position: 'relative',
        height: 30,
    },
    backButton: {
        position: 'absolute',
        left: HORIZONTAL_PADDING,
        padding: 5,
    },
    detailTitle: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    detailScroll: {
        flex: 1,
        width: '100%',
    },
    detailContent: {
        paddingHorizontal: HORIZONTAL_PADDING,
        paddingVertical: 10,
        paddingBottom: 10, // Thêm padding cuối ScrollView
    },
    colorRow: {
        flexDirection: 'row',
        backgroundColor: '#1E1E1E',
        borderRadius: 10,
        marginBottom: 15,
        padding: 15,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    colorSwatch: {
        width: 50,
        height: 50,
        borderRadius: 8,
        marginRight: 15,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    colorInfo: {
        flex: 1,
    },
    colorName: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    colorCodesContainer: {
        flexDirection: 'column',
    },
    colorCode: {
        color: 'lightgray',
        fontSize: 12,
        marginTop: 2,
    },
    codeLabel: {
        fontWeight: 'bold',
        color: 'gray',
        marginRight: 5,
    },
});


const paletteStyles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
    },
    palettePickerPopupContainer: {
        backgroundColor: '#000',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingTop: 10,
        // Đặt paddingBottom = 0 ở đây và chuyển 20px vào mainContentWrapper/ScrollView
        width: screenWidth,
        alignItems: 'center',
        maxHeight: screenHeight * 0.7,
        // 🌟 Thêm flex: 1 để container này có thể tự điều chỉnh theo nội dung của Modal
        flex: 1,
        overflow: 'hidden',
    },
    modalHandle: {
        width: 40,
        height: 5,
        backgroundColor: 'rgba(255, 255, 255, 0.5)',
        borderRadius: 3,
        marginBottom: 10,
    },
    // 🌟 Wrapper MỚI chứa mọi thứ trừ modalHandle
    mainContentWrapper: {
        flex: 1,
        width: '100%',
        alignItems: 'center',
        paddingBottom: 20, // Padding cuối cùng của Modal được đặt ở đây
    },
    palettePickerTitle: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 10,
    },

    // --- Grid View Container (MỚI) ---
    gridViewContainer: {
        flex: 1,
        width: '100%',
    },

    // --- Tabs (FlatList Ngang) ---
    tabListContainer: {
        paddingHorizontal: HORIZONTAL_PADDING,
        marginBottom: 15,
        alignItems: 'center',
        height: 50 // Giữ height cho FlatList
    },
    tabItem: {
        paddingVertical: 8,
        paddingHorizontal: 15,
        borderRadius: 20,
        backgroundColor: '#1E1E1E',
        marginRight: 10,
        borderWidth: 1,
        borderColor: 'transparent',
        height: 38,
        justifyContent: 'center',
    },
    activeTabItem: {
        backgroundColor: '#4285F4',
        borderColor: '#4285F4',
    },
    tabText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '600',
    },
    activeTabText: {
        color: 'white',
        fontWeight: 'bold',
    },

    // --- Search Input ---
    headerControlsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        width: screenWidth,
        paddingHorizontal: HORIZONTAL_PADDING,
        marginBottom: 15,
    },
    searchContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1E1E1E',
        borderRadius: 10,
    },
    searchInput: {
        flex: 1,
        height: 40,
        color: 'white',
        fontSize: 16,
        paddingHorizontal: 10,
    },
    noResultText: {
        color: 'gray',
        marginTop: 20,
        fontSize: 16,
        textAlign: 'center',
        paddingHorizontal: 20,
    },

    // --- Palette Grid (Content Container Style) ---
    popupScrollContainerVertical: {
        alignItems: 'center',
        paddingBottom: 10,
        width: screenWidth,
        flexGrow: 1,
    },
    paletteGridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        width: screenWidth - 2 * HORIZONTAL_PADDING,
        justifyContent: 'space-between',
        paddingVertical: 10,
        paddingHorizontal: 0,
    },
});

export default PalettePickerPopup;
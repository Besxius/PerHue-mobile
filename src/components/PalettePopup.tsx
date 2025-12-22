import React, { useMemo, useState, useRef, useCallback, useEffect } from "react";
import { CapsulePaletteModel, Color, ColorType } from "../types/dataModels";
import { Modal, ScrollView, TextInput, TouchableOpacity, TouchableWithoutFeedback, View, Text, StyleSheet, Dimensions, FlatList, Alert, Platform, ToastAndroid } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from 'expo-clipboard';
import CapsulePalette from "./CapsulePalette";

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const hexToRgb = (hexCode: string) => {
    const hex = hexCode.startsWith('#') ? hexCode.slice(1) : hexCode;
    if (hex.length === 6) {
        const bigint = parseInt(hex, 16);
        return { r: (bigint >> 16) & 255, g: (bigint >> 8) & 255, b: bigint & 255 };
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

interface PalettePopupProps {
    showPalettePicker: boolean;
    setShowPalettePicker: (visible: boolean) => void;
    colorFilters: Color[];
    handleColorSelect: (color: Color) => void;
    colorTypes: ColorType[];
    palettesBySeason: CapsulePaletteModel[];
    isLoading: boolean;
    selectedTabName: string;
    loadPalettesByTypeId: (colorTypeId: number, seasonName: string) => Promise<void>;
    setSelectedTabName: (tabName: string) => void;
}

interface PaletteDetailViewProps {
    palette: CapsulePaletteModel;
    onBack: () => void;
    onSelectColor: (color: Color) => void;
}

const PaletteDetailView: React.FC<PaletteDetailViewProps> = ({ palette, onBack, onSelectColor }) => {

    const handleCopy = async (hexCode: string) => {
        await Clipboard.setStringAsync(hexCode);

        if (Platform.OS === 'android') {
            ToastAndroid.show(`Copied ${hexCode} to clipboard!`, ToastAndroid.SHORT);
        } else {
            Alert.alert("Copied", `Color code ${hexCode} copied!`);
        }
    };

    return (
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
                    const hexCodeUpper = colorItem.hexCode.toUpperCase();

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
                                        <Text style={detailStyles.codeLabel}>HEX:</Text> {hexCodeUpper}
                                    </Text>
                                    <Text style={detailStyles.colorCode}>
                                        <Text style={detailStyles.codeLabel}>RGB:</Text> {rgb.r}, {rgb.g}, {rgb.b}
                                    </Text>
                                    <Text style={detailStyles.colorCode}>
                                        <Text style={detailStyles.codeLabel}>CMYK:</Text> {cmyk.c}, {cmyk.m}, {cmyk.y}, {cmyk.k}
                                    </Text>
                                </View>
                            </View>

                            <TouchableOpacity
                                style={detailStyles.copyButton}
                                onPress={(e) => {
                                    e.stopPropagation();
                                    handleCopy(colorItem.hexCode);
                                }}
                            >
                                <Ionicons name="copy-outline" size={24} color="gray" />
                            </TouchableOpacity>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>
        </View>
    );
};

const PalettePopup: React.FC<PalettePopupProps> = ({
    showPalettePicker,
    setShowPalettePicker,
    handleColorSelect,
    colorTypes,
    palettesBySeason,
    isLoading,
    selectedTabName,
    loadPalettesByTypeId,
    setSelectedTabName,
}) => {

    const [searchText, setSearchText] = useState('');
    const [detailedPalette, setDetailedPalette] = useState<CapsulePaletteModel | null>(null);

    const tabListRef = useRef<FlatList<ColorType>>(null);

    const MAX_MODAL_HEIGHT = screenHeight * 0.7;
    const FIXED_HEADER_ESTIMATED_HEIGHT = 10 + 5 + 10 + 26 + 10 + 40 + 15 + 38 + 15 + 20;
    const SCROLLVIEW_MIN_HEIGHT = MAX_MODAL_HEIGHT - FIXED_HEADER_ESTIMATED_HEIGHT;

    const filteredPalettes = useMemo<CapsulePaletteModel[]>(() => {
        if (!searchText) {
            return palettesBySeason;
        }
        const lowerCaseSearch = searchText.toLowerCase();

        return palettesBySeason.filter(palette => {
            const colorMatch = palette.colors.some(c =>
                c.name.toLowerCase().includes(lowerCaseSearch) ||
                c.hexCode.toLowerCase().includes(lowerCaseSearch)
            );
            return colorMatch;
        });
    }, [palettesBySeason, searchText]);

    const handleTabSelect = (tabName: string, index: number) => {
        const type = colorTypes.find(t => t.name === tabName);
        if (!type) return;

        setSelectedTabName(tabName);
        setDetailedPalette(null);

        loadPalettesByTypeId(type.id, tabName);

        setTimeout(() => {
            tabListRef.current?.scrollToIndex({ index: index, animated: true, viewPosition: 0.5 });
        }, 0);
    };

    const handlePaletteSelectForDetail = (palette: CapsulePaletteModel) => {
        setDetailedPalette(palette);
    };

    const handleRepresentativeColorSelect = (color: Color) => {
        handleColorSelect(color);
        setShowPalettePicker(false);
    }

    const renderTabItem = ({ item, index }: { item: ColorType, index: number }) => {
        const isActive = item.name === selectedTabName;
        return (
            <TouchableOpacity
                key={item.id}
                style={[paletteStyles.tabItem, isActive && paletteStyles.activeTabItem]}
                // 🌟 Truyền item.name (string) vào handleTabSelect
                onPress={() => handleTabSelect(item.name, index)}
            >
                <Text style={[paletteStyles.tabText, isActive && paletteStyles.activeTabText]}>
                    {item.name}
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

            {/* FlatList Tabs (Sử dụng colorTypes từ props) */}
            <FlatList
                ref={tabListRef}
                data={colorTypes}
                renderItem={renderTabItem}
                keyExtractor={(item) => item.id.toString()} // 🌟 Dùng ID làm key
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
                {/* HIỂN THỊ LOADING */}
                {isLoading ? (
                    <Text style={paletteStyles.noResultText}>Đang tải palette màu...</Text>
                ) : (
                    <View style={paletteStyles.paletteGridContainer}>
                        {filteredPalettes.map((palette) => {
                            const isSelected = detailedPalette?.id === palette.id;

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
                )}

                {/* HIỂN THỊ NO RESULT */}
                {!isLoading && filteredPalettes.length === 0 && (
                    <Text style={paletteStyles.noResultText}>Không tìm thấy palette màu phù hợp trong mùa {selectedTabName}.</Text>
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
                        <View style={paletteStyles.palettePickerPopupContainer}>
                            <View style={paletteStyles.modalHandle} />

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

// --- STYLES (Giữ nguyên) ---
const HORIZONTAL_PADDING = 20;

const detailStyles = StyleSheet.create({
    detailContainer: {
        width: screenWidth,
        flex: 1,
        paddingBottom: 0,
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
        flex: 1, width: '100%',
    },
    detailContent: {
        paddingHorizontal: HORIZONTAL_PADDING,
        paddingVertical: 10,
        paddingBottom: 10,
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
        marginRight: 10,
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
    copyButton: {
        padding: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 5,
    }
});


const paletteStyles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
    },
    palettePickerPopupContainer: {
        backgroundColor: '#333',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingTop: 10,
        width: screenWidth,
        alignItems: 'center',
        maxHeight: screenHeight * 0.7,
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
    mainContentWrapper: {
        flex: 1,
        width: '100%',
        alignItems: 'center',
        paddingBottom: 20,
    },
    palettePickerTitle: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 10,
    },

    gridViewContainer: {
        flex: 1,
        width: '100%',
    },

    tabListContainer: {
        paddingHorizontal: HORIZONTAL_PADDING,
        marginBottom: 15,
        alignItems: 'center',
        height: 50
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

export default PalettePopup;
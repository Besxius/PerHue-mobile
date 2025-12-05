import { useMemo, useState } from "react";
import { Color } from "../types/dataModels";
import { Modal, ScrollView, TextInput, TouchableOpacity, TouchableWithoutFeedback, View, Text, StyleSheet, Dimensions, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface ColorPopupProps {
    showColorPicker: boolean;
    setShowColorPicker: (visible: boolean) => void;
    colorFilters: Color[];
    selectedColorInfo: Color;
    handleColorSelect: (color: Color) => void;
    onDeleteColor?: (colorId: number) => void;
    canDelete?: boolean;
    title?: string;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const ColorPopup: React.FC<ColorPopupProps> = ({
    showColorPicker,
    setShowColorPicker,
    colorFilters,
    selectedColorInfo,
    handleColorSelect,
    onDeleteColor,
    canDelete = false,
    title = "SELECT COLOR FILTER",
}) => {
    const [searchText, setSearchText] = useState('');
    const [showColorNames, setShowColorNames] = useState(false);

    const filteredColors = useMemo(() => {
        if (!searchText) {
            return colorFilters;
        }
        const lowerCaseSearch = searchText.toLowerCase();
        return colorFilters.filter(color =>
            color.name.toLowerCase().includes(lowerCaseSearch) ||
            color.hexCode.toLowerCase().includes(lowerCaseSearch)
        );
    }, [colorFilters, searchText]);

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
                    }
                }
            ]
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
                                <View style={styles.colorGridContainer}>
                                    {filteredColors.map((color) => {
                                        const isSelected = color.id === selectedColorInfo.id;
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
                                                        onPress={canDelete ? () => handleLongPress(color) : undefined}
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
                                    })}
                                </View>
                                {filteredColors.length === 0 && (
                                    <Text style={styles.noResultText}>No matching colors found.</Text>
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
        maxHeight: screenHeight * 0.7, // Limit height for scrolling
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

    // Container for search bar and toggle button
    headerControlsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        width: screenWidth,
        paddingHorizontal: 20,
        marginBottom: 15,
    },

    // Styles for search bar
    searchContainer: {
        flex: 1, // Take up most space
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1E1E1E', // Darker background
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

    // Styles for Toggle Button
    toggleButton: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        padding: 10,
        borderRadius: 10,
    },
    toggleButtonActive: {
        backgroundColor: '#007AFF', // Blue when active
    },

    noResultText: {
        color: 'gray',
        marginTop: 20,
        fontSize: 16,
    },

    // ScrollView allows vertical scrolling
    popupScrollContainerVertical: {
        paddingHorizontal: 0,
        alignItems: 'center',
        paddingBottom: 10,
        width: screenWidth,
    },

    // Container for color grid (Flex Wrap)
    colorGridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        width: screenWidth, // Take full width
        justifyContent: 'flex-start', // Reset to flex-start to evenly distribute item wrappers
        paddingVertical: 10,
        paddingHorizontal: 20,
    },
    // Wrapper View to hold ColorCircle and ColorName Text
    colorItemWrapper: {
        // Occupy 1/6 of the main container width
        width: (screenWidth - 40) / 6,
        alignItems: 'center',
        marginBottom: 10,
    },

    // Color circle (Ensure 6 columns fit)
    colorFilterCircle: {
        // Default size
        width: (screenWidth - 40) / 6 - 6,
        height: (screenWidth - 40) / 6 - 6,
        borderRadius: ((screenWidth - 40) / 6 - 6) / 2,
        // Use margin in wrapper to evenly space 6 columns, no need for marginHorizontal
        borderWidth: 2,
        borderColor: 'transparent',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    // Smaller size when names are shown
    colorFilterCircleSmall: {
        width: 40,
        height: 40,
        borderRadius: 20,
    },
    activeColorFilter: {
        borderColor: 'white',
    },

    deletableColorItem: {
        // Viền màu đỏ nhạt khi có thể xóa, báo hiệu long-press functionality
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

    // Styles for color name
    colorNameText: {
        color: 'white',
        fontSize: 10,
        textAlign: 'center',
        marginTop: 4,
        width: '100%', // Take full width of wrapper
    },
});

export default ColorPopup;
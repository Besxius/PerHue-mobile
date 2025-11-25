import { useMemo, useState } from "react";
import { Color } from "../types/dataModels";
import { Modal, ScrollView, TextInput, TouchableOpacity, TouchableWithoutFeedback, View, Text, StyleSheet, Dimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface ColorPickerPopupProps {
    showColorPicker: boolean;
    setShowColorPicker: (visible: boolean) => void;
    colorFilters: Color[];
    selectedColorInfo: Color;
    handleColorSelect: (color: Color) => void;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const ColorPickerPopup: React.FC<ColorPickerPopupProps> = ({
    showColorPicker,
    setShowColorPicker,
    colorFilters,
    selectedColorInfo,
    handleColorSelect,
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
                            <Text style={styles.colorPickerTitle}>CHỌN MÀU LỌC</Text>

                            <View style={styles.headerControlsContainer}>
                                <View style={styles.searchContainer}>
                                    <Ionicons name="search" size={20} color="gray" style={{ marginLeft: 10 }} />
                                    <TextInput
                                        style={styles.searchInput}
                                        placeholder="Tìm kiếm màu (tên hoặc mã hex)..."
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
                                                    ]}
                                                    onPress={() => handleColorSelect(color)}
                                                >
                                                    {isSelected && <Ionicons name="checkmark" size={24} color="white" />}
                                                </TouchableOpacity>
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
                                    <Text style={styles.noResultText}>Không tìm thấy màu phù hợp.</Text>
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
        maxHeight: screenHeight * 0.7, // Giới hạn chiều cao cho phép cuộn
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

    // Container cho thanh tìm kiếm và nút toggle
    headerControlsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        width: screenWidth,
        paddingHorizontal: 20,
        marginBottom: 15,
    },

    // Styles mới cho thanh tìm kiếm
    searchContainer: {
        flex: 1, // Chiếm hầu hết không gian
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1E1E1E', // Nền tối hơn
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

    // Styles mới cho Nút Toggle
    toggleButton: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        padding: 10,
        borderRadius: 10,
    },
    toggleButtonActive: {
        backgroundColor: '#007AFF', // Màu xanh lam khi active
    },

    noResultText: {
        color: 'gray',
        marginTop: 20,
        fontSize: 16,
    },

    // ScrollView cho phép cuộn dọc
    popupScrollContainerVertical: {
        paddingHorizontal: 0,
        alignItems: 'center',
        paddingBottom: 10,
        width: screenWidth,
    },

    // Container cho lưới màu (Flex Wrap)
    colorGridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        width: screenWidth, // Chiếm toàn bộ chiều rộng
        justifyContent: 'flex-start', // Quay lại flex-start để căn đều các item wrapper
        paddingVertical: 10,
        paddingHorizontal: 20,
    },
    // View bọc để giữ ColorCircle và ColorName Text
    colorItemWrapper: {
        // Chiếm 1/6 chiều rộng của container chính
        width: (screenWidth - 40) / 6,
        alignItems: 'center',
        marginBottom: 10,
    },

    // Vòng màu (Đảm bảo 6 cột vừa khít)
    colorFilterCircle: {
        // Kích thước mặc định
        width: (screenWidth - 40) / 6 - 6,
        height: (screenWidth - 40) / 6 - 6,
        borderRadius: ((screenWidth - 40) / 6 - 6) / 2,
        // Dùng margin trong wrapper để căn đều 6 cột, nhưng không cần marginHorizontal
        borderWidth: 2,
        borderColor: 'transparent',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    // Kích thước nhỏ hơn khi hiển thị tên
    colorFilterCircleSmall: {
        width: 40,
        height: 40,
        borderRadius: 20,
    },
    activeColorFilter: {
        borderColor: 'white',
    },

    // Styles mới cho tên màu
    colorNameText: {
        color: 'white',
        fontSize: 10,
        textAlign: 'center',
        marginTop: 4,
        width: '100%', // Chiếm toàn bộ chiều rộng của wrapper
    },
});

export default ColorPickerPopup;
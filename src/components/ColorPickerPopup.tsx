import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    TextInput,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    TouchableWithoutFeedback,
    Animated,
} from "react-native";
import ColorWheel from 'react-native-wheel-color-picker';
import React, { useState, useEffect, useMemo, useRef } from "react";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Entypo } from "@expo/vector-icons";
import { Color } from "../types/dataModels";

const { height: screenHeight } = Dimensions.get('window');

const SAVED_COLORS_DEFAULT_HEX = [
    '#FF4500', '#FFA500', '#FFD700', '#8A2BE2', '#F08080', '#A9A9A9', '#90EE90', '#191970',
    '#000000', '#556B2F', '#4682B4', '#20B2AA', '#A0522D', '#7B68EE', '#B8860B', '#333333',
];

export interface ColorPickerPopupProps {
    isVisible: boolean;
    onClose: () => void;
    onColorSelected: (color: Color) => void;
    initialColorHex: string;
    colorFilters?: Color[];
    colorTitle?: string;
}

type ColorFormat = 'HEX' | 'RGB' | 'CMYK';
const COLOR_FORMATS: ColorFormat[] = ['HEX', 'RGB', 'CMYK'];

const hexToRgb = (hexCode: string) => {
    const hex = hexCode.startsWith('#') ? hexCode.slice(1) : hexCode;
    const safeHex = hex.length === 3 ? hex.split('').map(char => char + char).join('') : hex;

    if (safeHex.length === 6) {
        const bigint = parseInt(safeHex, 16);
        return {
            r: (bigint >> 16) & 255,
            g: (bigint >> 8) & 255,
            b: bigint & 255,
        };
    }
    return { r: 0, g: 0, b: 0 };
};

const rgbToCmyk = (r: number, g: number, b: number) => {
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

// -------------------------------------------------------------
// *************** COMPONENT CHÍNH *****************************
// -------------------------------------------------------------

const ColorPickerPopup: React.FC<ColorPickerPopupProps> = ({
    isVisible,
    onClose,
    onColorSelected,
    initialColorHex,
    colorFilters,
    colorTitle
}) => {
    const insets = useSafeAreaInsets();
    const MODAL_HEIGHT = screenHeight * 0.8;
    const TARGET_Y = screenHeight - MODAL_HEIGHT;

    const initialHex = useMemo(() => {
        return initialColorHex && initialColorHex.startsWith('#') && initialColorHex.length >= 4
            ? initialColorHex.toUpperCase()
            : '#2622A5';
    }, [initialColorHex]);

    // 1. Animation Hooks
    const slideAnim = useRef(new Animated.Value(screenHeight)).current;
    const [shouldRender, setShouldRender] = useState(isVisible);

    // 2. State Hooks
    const [selectedHex, setSelectedHex] = useState(initialHex);
    const [hexInput, setHexInput] = useState(initialHex.replace('#', ''));
    const [colorFormat, setColorFormat] = useState<ColorFormat>('HEX');
    const [isDropdownVisible, setIsDropdownVisible] = useState(false);

    // 3. Memo Hooks: Danh sách màu hiển thị (sử dụng colorFilters hoặc default)
    const displayColorHexes = useMemo(() => {
        if (colorFilters && colorFilters.length > 0) {
            return colorFilters.map(c => c.hexCode.toUpperCase());
        }
        return SAVED_COLORS_DEFAULT_HEX;
    }, [colorFilters]);

    const colorValues = useMemo(() => {
        const rgb = hexToRgb(selectedHex);
        const cmyk = rgbToCmyk(rgb.r, rgb.g, rgb.b);
        return { rgb, cmyk };
    }, [selectedHex]);

    // 4. useEffect cho Animation
    useEffect(() => {
        if (isVisible) {
            setShouldRender(true);
            Animated.timing(slideAnim, {
                toValue: TARGET_Y,
                duration: 300,
                useNativeDriver: true,
            }).start();
        } else {
            Animated.timing(slideAnim, {
                toValue: screenHeight,
                duration: 300,
                useNativeDriver: true,
            }).start(() => {
                setShouldRender(false);
            });
        }
    }, [isVisible, slideAnim, TARGET_Y]);

    // 5. useEffect cho Reset State (khi Modal được mở)
    useEffect(() => {
        if (isVisible) {
            setSelectedHex(initialHex);
            setHexInput(initialHex.replace('#', ''));
            setColorFormat('HEX');
            setIsDropdownVisible(false);
        }
    }, [isVisible, initialHex]);

    // *************** KẾT THÚC VÙNG KHAI BÁO HOOKS ***************

    // Ngăn chặn render nếu animation trượt xuống đã hoàn tất
    if (!shouldRender) return null;

    // --- LOGIC VÀ HÀM ---

    const onColorChangeComplete = (color: string) => {
        const newHex = color.toUpperCase();
        setSelectedHex(newHex);
        setHexInput(newHex.replace('#', ''));
    };

    const handleHexInputChange = (text: string) => {
        const cleanedText = text.toUpperCase().replace(/[^0-9A-F]/g, '');
        setHexInput(cleanedText);

        if (cleanedText.length === 6) {
            const fullHex = `#${cleanedText}`;
            setSelectedHex(fullHex);
        }
    };

    const handleFormatSelect = (format: ColorFormat) => {
        setColorFormat(format);
        setIsDropdownVisible(false);
    }

    // Xử lý khi nhấn OK (trả về Color object đầy đủ)
    const handleOk = () => {
        const finalHexCode = selectedHex.toUpperCase();
        let finalSelectedColor: Color | undefined;

        // 1. Kiểm tra xem màu được chọn có tồn tại trong colorFilters không (nếu có)
        if (colorFilters && colorFilters.length > 0) {
            finalSelectedColor = colorFilters.find(
                c => c.hexCode.toUpperCase() === finalHexCode
            );
        }

        // 2. Nếu không tìm thấy, tạo một object Color mới (dùng HEX làm tên và ID tạm)
        if (!finalSelectedColor) {
            finalSelectedColor = {
                id: Date.now(),
                name: finalHexCode,
                hexCode: finalHexCode
            };
        }

        onColorSelected(finalSelectedColor);
    };

    /**
     * Component hiển thị 1 ô input giá trị màu
     */
    const ColorInputDisplay = () => {
        if (colorFormat === 'HEX') {
            return (
                <>
                    <Text style={colorPickerToolStyles.hexSymbol}>#</Text>
                    <TextInput
                        style={colorPickerToolStyles.hexInput}
                        value={hexInput}
                        onChangeText={handleHexInputChange}
                        maxLength={6}
                        autoCapitalize="characters"
                        placeholder="2622A5"
                        placeholderTextColor="#AAAAAA"
                    />
                </>
            );
        }

        const valueString = colorFormat === 'RGB'
            ? `rgb(${colorValues.rgb.r}, ${colorValues.rgb.g}, ${colorValues.rgb.b})`
            : `(${colorValues.cmyk.c}, ${colorValues.cmyk.m}, ${colorValues.cmyk.y}, ${colorValues.cmyk.k})`;

        return (
            <Text style={colorPickerToolStyles.hexInputDisplay}>
                {valueString}
            </Text>
        );
    };

    /**
     * Component Dropdown Menu
     */
    const FormatDropdown = () => (
        <View style={colorPickerToolStyles.dropdownMenu}>
            {COLOR_FORMATS.map((format) => (
                <TouchableOpacity
                    key={format}
                    style={[
                        colorPickerToolStyles.dropdownItem,
                        colorFormat === format && colorPickerToolStyles.activeDropdownItem
                    ]}
                    onPress={() => handleFormatSelect(format)}
                >
                    <Text style={colorPickerToolStyles.dropdownText}>{format}</Text>
                </TouchableOpacity>
            ))}
        </View>
    );

    return (
        <TouchableWithoutFeedback onPress={onClose}>
            <View style={colorPickerToolStyles.modalOverlay}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={colorPickerToolStyles.keyboardAvoidingView}
                >
                    <Animated.View
                        style={[
                            colorPickerToolStyles.modalContent,
                            {
                                transform: [{ translateY: slideAnim }]
                            }
                        ]}
                    >
                        {/* Bọc nội dung bên trong để chặn sự kiện nhấn (tránh đóng modal) */}
                        <TouchableOpacity activeOpacity={1} onPress={() => { }}
                            style={[
                                colorPickerToolStyles.modalContentInner,
                                { paddingTop: insets.top + 15, paddingBottom: insets.bottom + 15 }
                            ]}
                        >
                            {/* --- Color Picker Wheel --- */}
                            <View style={colorPickerToolStyles.colorPickerContainer}>
                                <ColorWheel
                                    color={selectedHex}
                                    onColorChange={onColorChangeComplete}
                                    onColorChangeComplete={onColorChangeComplete}
                                    thumbSize={25}
                                    sliderSize={20}
                                    gapSize={15}
                                />
                            </View>

                            {/* --- Input Hex/RGB/CMYK và Dropdown Container --- */}
                            <View style={colorPickerToolStyles.inputContainer}>
                                <View style={colorPickerToolStyles.hexInputRow}>
                                    {/* Nút Dropdown */}
                                    <TouchableOpacity
                                        style={colorPickerToolStyles.dropdownPlaceholder}
                                        onPress={() => setIsDropdownVisible(!isDropdownVisible)}
                                    >
                                        <View style={colorPickerToolStyles.dropdownContent}>
                                            <Text style={colorPickerToolStyles.buttonText}>{colorFormat}</Text>
                                            <Entypo name="chevron-down" size={16} color="white" style={colorPickerToolStyles.dropdownIcon} />
                                        </View>
                                    </TouchableOpacity>

                                    {/* Input hiển thị theo định dạng */}
                                    <ColorInputDisplay />
                                </View>

                                {/* Dropdown Menu */}
                                {isDropdownVisible && <FormatDropdown />}
                            </View>

                            {/* --- Saved Colors (Color Filters) --- */}
                            <View style={colorPickerToolStyles.savedColorsSection}>
                                <Text style={colorPickerToolStyles.savedColorsTitle}>
                                    {colorTitle
                                        ? colorTitle
                                        : (colorFilters && colorFilters.length > 0
                                            ? "PerHue Color"
                                            : "Suggest Colors"
                                        )
                                    }
                                </Text>
                                <ScrollView
                                    horizontal
                                    showsHorizontalScrollIndicator={false}
                                    contentContainerStyle={colorPickerToolStyles.savedColorsRow}
                                >
                                    {displayColorHexes.map((colorHex, index) => (
                                        <TouchableOpacity
                                            key={index}
                                            style={[
                                                colorPickerToolStyles.savedColorSwatch,
                                                { backgroundColor: colorHex },
                                                selectedHex.toUpperCase() === colorHex.toUpperCase() && colorPickerToolStyles.activeSwatch
                                            ]}
                                            onPress={() => onColorChangeComplete(colorHex)}
                                        />
                                    ))}
                                </ScrollView>
                            </View>

                            {/* --- Action Buttons --- */}
                            <View style={colorPickerToolStyles.actionRow}>
                                <TouchableOpacity
                                    style={[colorPickerToolStyles.button, { backgroundColor: '#FF6347' }]}
                                    onPress={onClose}
                                >
                                    <Text style={colorPickerToolStyles.buttonText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[colorPickerToolStyles.button, { backgroundColor: '#4CAF50' }]}
                                    onPress={handleOk}
                                >
                                    <Text style={colorPickerToolStyles.buttonText}>OK</Text>
                                </TouchableOpacity>
                            </View>
                        </TouchableOpacity>
                    </Animated.View>
                </KeyboardAvoidingView>
            </View>
        </TouchableWithoutFeedback>
    );
};

// -------------------------------------------------------------
// *************** STYLE SHEET *********************************
// -------------------------------------------------------------

const colorPickerToolStyles = StyleSheet.create({
    modalOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        zIndex: 10,
        flex: 1,
    },
    keyboardAvoidingView: {
        flex: 1,
    },
    modalContent: {
        width: '100%',
        height: screenHeight * 0.8,
        backgroundColor: '#333',
        borderTopLeftRadius: 15,
        borderTopRightRadius: 15,
        position: 'absolute',
        left: 0,
        right: 0,
    },
    modalContentInner: {
        flex: 1,
        alignItems: 'flex-start',
        justifyContent: 'flex-start',
        width: '100%',
        paddingHorizontal: 20,
    },
    actionRow: {
        flexDirection: 'row',
        marginTop: 20,
        justifyContent: 'space-around',
        width: '100%',
    },
    button: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
        minWidth: 100,
        alignItems: 'center',
    },
    buttonText: {
        color: 'white',
        fontWeight: 'bold',
    },

    // --- Color Picker ---
    colorPickerContainer: {
        width: '100%',
        height: 400,
        paddingHorizontal: 5,
        marginTop: 5,
        alignSelf: 'center', // Căn giữa nếu muốn đặt width cố định
    },

    // Input & Dropdown Container
    inputContainer: {
        width: '100%',
        position: 'relative',
        marginTop: 10,
        zIndex: 50,
    },

    // Hex Input Row
    hexInputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#444',
        borderRadius: 8,
        padding: 5,
        width: '100%',
        zIndex: 50,
    },

    // Dropdown Button styles
    dropdownPlaceholder: {
        backgroundColor: '#555',
        paddingVertical: 8,
        paddingHorizontal: 15,
        borderRadius: 5,
        marginRight: 10,
    },
    dropdownContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 2,
    },
    dropdownIcon: {
        marginLeft: 5,
    },

    hexSymbol: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
        marginRight: 2,
    },
    hexInput: {
        flex: 1,
        color: 'white',
        fontSize: 16,
        padding: 5,
        height: 40,
        fontWeight: 'bold',
    },
    hexInputDisplay: {
        flex: 1,
        color: 'white',
        fontSize: 14,
        padding: 5,
        height: 40,
        fontWeight: '600',
        lineHeight: 30,
        paddingLeft: 10,
    },

    // Dropdown Menu
    dropdownMenu: {
        position: 'absolute',
        top: 50,
        left: 0,
        width: 100,
        backgroundColor: '#555',
        borderRadius: 8,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#777',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        zIndex: 100,
    },
    dropdownItem: {
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#666',
    },
    activeDropdownItem: {
        backgroundColor: '#777',
    },
    dropdownText: {
        color: 'white',
        fontWeight: '600',
    },


    // Saved Colors
    savedColorsSection: {
        width: '100%',
        marginTop: 15,
    },
    savedColorsTitle: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 10,
    },
    savedColorsRow: {
        paddingVertical: 5,
        paddingRight: 20,
    },
    savedColorSwatch: {
        width: 35,
        height: 35,
        borderRadius: 17.5,
        marginRight: 10,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    activeSwatch: {
        borderWidth: 3,
        borderColor: 'white',
    }
});

export default ColorPickerPopup;
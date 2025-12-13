import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, PanResponder, Dimensions, Animated, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
    Canvas,
    Image as SkiaImage,
    useImage,
    useCanvasRef,
} from '@shopify/react-native-skia';
import { Entypo, Ionicons } from '@expo/vector-icons';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export type AttributeColor = 'Skin' | 'Hair' | 'Eyes' | 'Lips';
export type SelectedColors = Record<AttributeColor, { name: string, hex: string }>;

interface ColorPickerOverlayProps {
    imageUri: string;
    onClose: () => void;
    onDone: (colors: SelectedColors) => void;
    initialColors: SelectedColors | null;
}

const DEFAULT_COLOR_HEX = '#FFFFFF';
export const DEFAULT_SELECTED_COLORS: SelectedColors = {
    Skin: { name: 'Skin', hex: DEFAULT_COLOR_HEX },
    Hair: { name: 'Hair', hex: DEFAULT_COLOR_HEX },
    Eyes: { name: 'Eyes', hex: DEFAULT_COLOR_HEX },
    Lips: { name: 'Lips', hex: DEFAULT_COLOR_HEX },
};
const PICKER_SIZE = 60;
const PICKER_RADIUS = PICKER_SIZE / 2;
const INITIAL_X = screenWidth / 2;
const INITIAL_Y = screenHeight / 2;

const ColorPickerOverlay: React.FC<ColorPickerOverlayProps> = ({ imageUri, onClose, onDone, initialColors }) => {
    const insets = useSafeAreaInsets();

    const loadedSkiaImage = useImage(imageUri);
    const canvasRef = useCanvasRef();

    const [selectedColors, setSelectedColors] = useState<SelectedColors>(DEFAULT_SELECTED_COLORS);
    const [activeAttribute, setActiveAttribute] = useState<AttributeColor>('Skin');
    const [currentPixelHex, setCurrentPixelHex] = useState<string>('#FFFFFF');

    useEffect(() => {
        if (initialColors) {
            setSelectedColors(initialColors);
            const firstUnselected = Object.keys(initialColors).find(
                key => initialColors[key as AttributeColor].hex === DEFAULT_COLOR_HEX
            ) as AttributeColor | undefined;

            if (firstUnselected) {
                setActiveAttribute(firstUnselected);
            } else {
                setActiveAttribute('Skin');
            }
        } else {
            setSelectedColors(DEFAULT_SELECTED_COLORS);
            setActiveAttribute('Skin');
        }
    }, [initialColors]);

    const pickerTranslateX = useRef(new Animated.Value(INITIAL_X)).current;
    const pickerTranslateY = useRef(new Animated.Value(INITIAL_Y)).current;

    const currentPositionRef = useRef({ x: INITIAL_X, y: INITIAL_Y });

    const initialTouchPosRef = useRef({ x: INITIAL_X, y: INITIAL_Y });

    // 3.1. Animated Listener để cập nhật Ref
    useEffect(() => {
        const xListenerId = pickerTranslateX.addListener(({ value }) => {
            currentPositionRef.current.x = value;
        });

        const yListenerId = pickerTranslateY.addListener(({ value }) => {
            currentPositionRef.current.y = value;
        });

        return () => {
            pickerTranslateX.removeListener(xListenerId);
            pickerTranslateY.removeListener(yListenerId);
        };
    }, [pickerTranslateX, pickerTranslateY]);

    // 3.2. Tính toán tỷ lệ và độ dịch chuyển (scale & offset) của ảnh
    const { scale, xOffset, yOffset } = useMemo(() => {
        if (!loadedSkiaImage) return { scale: 1, xOffset: 0, yOffset: 0 };

        const imageWidth = loadedSkiaImage.width();
        const imageHeight = loadedSkiaImage.height();

        // 1. Tính toán tỷ lệ co giãn (Scaling Factor)
        const scaleX = screenWidth / imageWidth;
        const scaleY = screenHeight / imageHeight;

        // Chế độ "cover" sử dụng tỷ lệ lớn hơn để lấp đầy canvas
        const finalScale = Math.max(scaleX, scaleY);

        // 2. Tính toán độ dịch chuyển (Offset)
        // Khi dùng "cover", ảnh sẽ được dịch chuyển vào giữa
        const offsetX = (screenWidth - imageWidth * finalScale) / 2;
        const offsetY = (screenHeight - imageHeight * finalScale) / 2;

        return { scale: finalScale, xOffset: offsetX, yOffset: offsetY };
    }, [loadedSkiaImage]);

    // 4. Function to Read Pixel Color (Đã tính Ánh xạ Tọa độ)
    const readColorAtPosition = useCallback((x: number, y: number): string => {
        if (!loadedSkiaImage || !canvasRef.current || scale === 0) {
            return '#FFFFFF';
        }

        // Ánh xạ tọa độ màn hình (x, y) về tọa độ pixel ảnh gốc
        // Bước 1: Loại bỏ Offset
        const xNoOffset = x - xOffset;
        const yNoOffset = y - yOffset;

        // Bước 2: Chia cho Scale để có tọa độ ảnh gốc (pixel index)
        const mappedX = Math.round(xNoOffset / scale);
        const mappedY = Math.round(yNoOffset / scale);

        // Đảm bảo tọa độ nằm trong giới hạn ảnh gốc
        if (mappedX < 0 || mappedX >= loadedSkiaImage.width() || mappedY < 0 || mappedY >= loadedSkiaImage.height()) {
            // Trả về màu mặc định hoặc màu nền nếu điểm nằm ngoài ảnh gốc (do "cover" crop)
            return '#FFFFFF';
        }

        // Lấy dữ liệu màu RGB từ một pixel (dùng tọa độ đã ánh xạ)
        const pixelData = loadedSkiaImage.readPixels(mappedX, mappedY);

        if (pixelData) {
            const [r, g, b, a] = pixelData;
            // Nếu alpha = 0 (trong suốt hoàn toàn), trả về màu khác (hoặc màu mặc định của nền)
            if (a === 0) {
                return '#121212'; // Màu nền đen/xám nếu pixel trong suốt
            }

            // Chuyển đổi RGB sang Hex.
            const hex = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`;
            return hex;
        }

        // Trả về màu mặc định nếu không đọc được
        return '#FFFFFF';
    }, [loadedSkiaImage, scale, xOffset, yOffset]);

    // 5. PanResponder for Dragging the Picker
    const panResponder = useMemo(() => {
        // Giới hạn tọa độ tâm vòng chọn nằm trong màn hình
        const minCoordX = PICKER_RADIUS;
        const minCoordY = PICKER_RADIUS + insets.top; // Giới hạn trên dựa trên insets.top
        const maxX = screenWidth - PICKER_RADIUS;
        const maxY = screenHeight - PICKER_RADIUS - insets.bottom; // Giới hạn dưới dựa trên insets.bottom

        return PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,

            onPanResponderGrant: (evt, gestureState) => {
                // Lưu lại tọa độ TÂM tuyệt đối hiện tại khi bắt đầu kéo
                initialTouchPosRef.current.x = currentPositionRef.current.x;
                initialTouchPosRef.current.y = currentPositionRef.current.y;
                setCurrentPixelHex('#FFFFFF');
            },

            onPanResponderMove: (evt, gestureState) => {
                // Tính toán TỌA ĐỘ TÂM mới
                const attemptedX = initialTouchPosRef.current.x + gestureState.dx;
                const attemptedY = initialTouchPosRef.current.y + gestureState.dy;

                // GIỚI HẠN VỊ TRÍ TÂM 
                const limitedX = Math.max(minCoordX, Math.min(maxX, attemptedX));
                const limitedY = Math.max(minCoordY, Math.min(maxY, attemptedY)); // SỬ DỤNG minCoordY & maxY

                // Cập nhật Animated Value
                pickerTranslateX.setValue(limitedX);
                pickerTranslateY.setValue(limitedY);

                // Lấy màu tại VỊ TRÍ TÂM ĐÃ GIỚI HẠN (limitedX, limitedY)
                const newHex = readColorAtPosition(limitedX, limitedY);

                // CẬP NHẬT MÀU VÒNG TRÒN (Eyedropper)
                setCurrentPixelHex(newHex);

                // CẬP NHẬT MÀU Ô THUỘC TÍNH
                setSelectedColors(prev => {
                    const newColors = { ...prev };
                    newColors[activeAttribute] = { ...prev[activeAttribute], hex: newHex };
                    return newColors;
                });
            },

            onPanResponderRelease: (evt, gestureState) => {
                // Đảm bảo màu cuối cùng được set
                if (currentPixelHex === '#FFFFFF') {
                    const finalX = currentPositionRef.current.x;
                    const finalY = currentPositionRef.current.y;
                    const finalHex = readColorAtPosition(finalX, finalY);
                    setCurrentPixelHex(finalHex);

                    setSelectedColors(prev => {
                        const newColors = { ...prev };
                        newColors[activeAttribute] = { ...prev[activeAttribute], hex: finalHex };
                        return newColors;
                    });
                }
            },
        });
    }, [activeAttribute, readColorAtPosition, insets.top, insets.bottom]);

    const handleDone = () => {
        const unselectedAttributes = Object.keys(selectedColors).filter(
            key => selectedColors[key as AttributeColor].hex === DEFAULT_COLOR_HEX
        ) as AttributeColor[];

        if (unselectedAttributes.length > 0) {
            Alert.alert(
                'Missing Color Selections',
                `Please select a color for the following attributes: ${unselectedAttributes.join(', ')}.`,
                [{ text: 'OK' }]
            );
            setActiveAttribute(unselectedAttributes[0]);
            return;
        }

        onDone(selectedColors);
    };

    // 6. UI Components
    const renderColorBlock = (attribute: AttributeColor) => {
        const isActive = attribute === activeAttribute;

        return (
            <TouchableOpacity
                key={attribute}
                style={[
                    styles.colorBlockWrapper,
                    isActive ? styles.activeColorBlock : styles.inactiveColorBlock
                ]}
                onPress={() => setActiveAttribute(attribute)}
            >
                <View
                    style={[
                        styles.colorSquare,
                        { backgroundColor: selectedColors[attribute].hex }
                    ]}
                />
                <Text style={styles.colorLabel}>{attribute}</Text>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.overlayContainer}>
            {loadedSkiaImage ? (
                <Canvas style={styles.canvas} ref={canvasRef}>
                    <SkiaImage
                        image={loadedSkiaImage}
                        x={xOffset}
                        y={yOffset}
                        width={loadedSkiaImage.width() * scale}
                        height={loadedSkiaImage.height() * scale}
                        fit="fill"
                    />
                </Canvas>
            ) : (
                <View style={styles.loadingContainer}>
                    <Text style={{ color: 'white' }}>Loading Image...</Text>
                </View>
            )}

            {/* Vòng Eyedropper di chuyển */}
            <Animated.View
                style={[
                    styles.pickerContainer,
                    {
                        transform: [
                            { translateX: Animated.subtract(pickerTranslateX, PICKER_RADIUS) },
                            { translateY: Animated.subtract(pickerTranslateY, PICKER_RADIUS) },
                        ],
                        borderColor: currentPixelHex,
                        borderWidth: 10,
                        backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    },
                ]}
                {...panResponder.panHandlers}
            >
                <View style={styles.pickerInnerRing}>
                    <Entypo name="hair-cross" size={24} color='gray' />
                </View>
            </Animated.View>

            <View style={[styles.paletteContainer, { bottom: 150 + insets.bottom }]}>
                {Object.keys(DEFAULT_SELECTED_COLORS).map(key =>
                    renderColorBlock(key as AttributeColor)
                )}
            </View>

            <TouchableOpacity style={[styles.closeButton, { top: insets.top + 10 }]} onPress={onClose}>
                <Ionicons name="close" size={36} color="white" />
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.doneButton, { bottom: insets.bottom + 70 }]}
                onPress={handleDone}
            >
                <Text style={styles.doneText}>DONE</Text>
            </TouchableOpacity>

        </View>
    );
};

const styles = StyleSheet.create({
    overlayContainer: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 10,
        backgroundColor: 'black',
    },
    canvas: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'black',
    },

    // --- Picker Styles (Eyedropper) ---
    pickerContainer: {
        position: 'absolute',
        width: PICKER_SIZE,
        height: PICKER_SIZE,
        borderRadius: PICKER_RADIUS,
        borderWidth: 2,
        borderColor: 'white',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 5,
        opacity: 1,
    },
    pickerInnerRing: {
        width: '100%',
        height: '100%',
        borderRadius: PICKER_RADIUS,
        justifyContent: 'center',
        alignItems: 'center',
    },

    // --- Palette Styles ---
    paletteContainer: {
        position: 'absolute',
        // bottom: 150, // Đã chuyển sang inline style
        right: 20,
        backgroundColor: 'rgba(65, 53, 53, 0.6)',
        borderRadius: 10,
        padding: 10,
    },
    colorBlockWrapper: {
        flexDirection: 'column',
        alignItems: 'center',
        marginBottom: 10,
        padding: 5,
        borderRadius: 5,
    },
    inactiveColorBlock: {
        opacity: 0.7,
        borderWidth: 0,
    },
    activeColorBlock: {
        borderWidth: 2,
        borderColor: 'white',
        opacity: 1,
    },
    colorSquare: {
        width: 40,
        height: 40,
        borderRadius: 5,
        borderWidth: 2,
        borderColor: 'white',
        marginBottom: 5,
    },
    colorLabel: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
    },

    // --- Control Buttons ---
    closeButton: {
        position: 'absolute',
        // top: 30, // Đã chuyển sang inline style
        left: 15,
        padding: 5,
        zIndex: 11,
    },
    doneButton: {
        position: 'absolute',
        right: 20,
        backgroundColor: '#0095F6',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 25,
        zIndex: 11,
    },
    doneText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    }
});

export default ColorPickerOverlay;
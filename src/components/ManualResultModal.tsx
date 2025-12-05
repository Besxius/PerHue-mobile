// components/ManualResultModal.tsx
import React, { useMemo, useState } from 'react';
import {
    Modal,
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    ScrollView,
    Image
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ManualColorTestResponse, Color, CapsulePalette as CapsulePaletteType } from '../types/dataModels';
// Đảm bảo import CapsulePaletteType nếu cần (tên tránh trùng với component)

// IMPORT COMPONENT CAPSULE PALETTE (tên CapsulePalette đã được cung cấp)
import CapsulePalette from './CapsulePalette';
import { CapsulePaletteProps } from './CapsulePalette';

const { height: screenHeight, width: screenWidth } = Dimensions.get('window');

// LƯU Ý: Đây là component CapsulePalette đã được bạn cung cấp, 
// nhưng để dùng được ở đây, nó cần phải được export đúng cách.
// Giả định component CapsulePalette đã được đặt trong './CapsulePalette'.

interface ManualResultModalProps {
    isVisible: boolean;
    onClose: () => void;
    resultData: ManualColorTestResponse | null;
    onNavigateToDetail: () => void;
    currentPhotoUri: string | null;
}

// Giả định một đối tượng Color tối thiểu để hiển thị nếu hexCode tồn tại nhưng không có trong list colors
const createMinimalColor = (hex: string, name: string): Color => ({
    id: 0,
    name: name,
    hexCode: hex,
});


const ManualResultModal: React.FC<ManualResultModalProps> = ({
    isVisible,
    onClose,
    resultData,
    onNavigateToDetail,
    currentPhotoUri
}) => {
    if (!resultData) return null;

    const colorTypeName = resultData.colorType?.name || 'ANALYSIS RESULT';
    const colorBlocks = resultData.colors || [];

    // Xử lý chuỗi Hex Code cho Chosen và Suggested Colors
    const chosenColorsArray = resultData.chosenColor ? resultData.chosenColor.split(',').map(c => c.trim()) : [];
    const suggestedColorsArray = resultData.suggestedColor ? resultData.suggestedColor.split(',').map(c => c.trim()) : [];

    // TÌM KIẾM CHI TIẾT CÁC MÀU ĐÃ CHỌN/ĐỀ XUẤT (để lấy tên nếu có)
    const getDetailedColors = (hexArray: string[]) => {
        return hexArray.map(hex =>
            resultData.colors.find(c => c.hexCode.toUpperCase() === hex.toUpperCase())
            || createMinimalColor(hex, "N/A")
        );
    };

    const chosenDetailedColors = getDetailedColors(chosenColorsArray);
    const suggestedDetailedColors = getDetailedColors(suggestedColorsArray);

    // State tạm thời để quản lý việc chọn Palette trong Modal (chỉ để làm nổi bật)
    const [selectedPaletteId, setSelectedPaletteId] = useState<number | null>(null);


    // Hàm render khối màu nhỏ (sử dụng cho Chosen/Suggested)
    const renderColorSummaryBlock = (color: Color) => (
        <View key={color.hexCode} style={modalStyles.summaryBlockItem}>
            <View style={[modalStyles.summaryBlockColor, { backgroundColor: color.hexCode }]} />
            <Text style={modalStyles.summaryBlockText}>{color.hexCode.toUpperCase()}</Text>
        </View>
    );

    // Hàm render các dải màu (palette) sử dụng CapsulePalette
    const renderCapsulePalettes = () => (
        <View style={modalStyles.paletteGrid}>
            {resultData.capsulePalettes.map((palette) => {
                // Lấy 4 mã hex đầu tiên, nếu ít hơn 4, lặp lại màu cuối hoặc dùng màu mặc định
                const paletteHexes: string[] = palette.colors.map(c => c.hexCode);
                const colorsForComponent: [string, string, string, string] = [
                    paletteHexes[0] || '#CCCCCC',
                    paletteHexes[1] || paletteHexes[0] || '#CCCCCC',
                    paletteHexes[2] || paletteHexes[1] || paletteHexes[0] || '#CCCCCC',
                    paletteHexes[3] || paletteHexes[2] || paletteHexes[1] || paletteHexes[0] || '#CCCCCC',
                ];

                return (
                    <View key={palette.id} style={modalStyles.paletteCardWrapper}>
                        <CapsulePalette
                            colors={colorsForComponent as [string, string, string, string]}
                            isSelected={selectedPaletteId === palette.id}
                            onSelect={() => setSelectedPaletteId(palette.id)}
                        />
                        {/* <Text style={modalStyles.paletteNameText}>{palette.name || `Palette #${palette.id}`}</Text> */}
                    </View>
                );
            })}
        </View>
    );


    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={isVisible}
            onRequestClose={onClose}
        >
            <TouchableOpacity
                style={modalStyles.overlay}
                activeOpacity={1}
                onPress={onClose}
            >
                <View style={modalStyles.container} onStartShouldSetResponder={() => true}>

                    {/* Header */}
                    <View style={modalStyles.header}>
                        <Text style={modalStyles.colorTypeName}>{colorTypeName.toUpperCase()}</Text>
                        <TouchableOpacity onPress={onClose} style={modalStyles.closeButton}>
                            <Ionicons name="close-circle-outline" size={30} color="#fff" />
                        </TouchableOpacity>
                    </View>

                    {/* Content */}
                    <ScrollView contentContainerStyle={modalStyles.content}>

                        {/* 1. Image Thumbnail */}
                        <Text style={modalStyles.subtitle}>CAPTURED IMAGE:</Text>
                        {currentPhotoUri && (
                            <View style={modalStyles.imageWrapperFull}>
                                <Image
                                    source={{ uri: currentPhotoUri }}
                                    style={modalStyles.imageThumbnailFull}
                                />
                            </View>
                        )}

                        {/* 2. Chosen & Suggested Colors */}
                        <Text style={modalStyles.subtitle}>KEY COLORS:</Text>

                        <View style={modalStyles.keyColorsSection}>
                            <View style={modalStyles.colorSummaryRow}>
                                <Text style={modalStyles.keyColorTitle}>CHOSEN COLOR(S):</Text>
                                <View style={modalStyles.colorBlocksSummary}>
                                    {chosenDetailedColors.map(renderColorSummaryBlock)}
                                </View>
                            </View>

                            <View style={modalStyles.colorSummaryRow}>
                                <Text style={modalStyles.keyColorTitle}>SUGGESTED COLOR(S):</Text>
                                <View style={modalStyles.colorBlocksSummary}>
                                    {suggestedDetailedColors.map(renderColorSummaryBlock)}
                                </View>
                            </View>
                        </View>


                        {/* 3. Tested Color Blocks (Saved Colors) */}
                        <Text style={modalStyles.subtitle}>TESTED COLORS:</Text>
                        {colorBlocks.length > 0 ? (
                            <View style={modalStyles.colorBlocksContainer}>
                                {colorBlocks.map((color: Color) => (
                                    <View
                                        key={color.id}
                                        style={[modalStyles.colorBlock, { backgroundColor: color.hexCode }]}
                                    />
                                ))}
                            </View>
                        ) : (
                            <Text style={modalStyles.noColorText}>
                                No colors found in the result.
                            </Text>
                        )}

                        {/* 4. Capsule Palettes */}
                        <Text style={modalStyles.subtitle}>CAPSULE PALETTES:</Text>
                        {resultData.capsulePalettes && resultData.capsulePalettes.length > 0 ? (
                            renderCapsulePalettes()
                        ) : (
                            <Text style={modalStyles.noColorText}>No matching palettes found.</Text>
                        )}


                        {/* 5. Navigate Button */}
                        <TouchableOpacity style={modalStyles.detailButton} onPress={onNavigateToDetail}>
                            <Text style={modalStyles.detailButtonText}>
                                VIEW DETAILED ANALYSIS
                            </Text>
                            <Ionicons name="arrow-forward-circle-outline" size={20} color="#fff" style={{ marginLeft: 5 }} />
                        </TouchableOpacity>
                    </ScrollView>
                </View>
            </TouchableOpacity>
        </Modal>
    );
};

// =========================================================
// STYLES
// =========================================================
const modalStyles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    container: {
        backgroundColor: '#1E1E1E',
        width: '100%',
        maxHeight: screenHeight * 0.9, // Tăng chiều cao tối đa để chứa nhiều thông tin
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingBottom: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 15,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#333',
    },
    colorTypeName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFD700', // Màu vàng nổi bật
        textAlign: 'center',
    },
    closeButton: {
        padding: 5,
        position: 'absolute',
        right: 15,
        top: 15,
    },
    content: {
        padding: 20,
    },
    subtitle: {
        fontSize: 16,
        color: '#fff',
        marginBottom: 10,
        marginTop: 15,
        fontWeight: '700',
    },

    // --- Image Section ---
    imageWrapperFull: {
        width: '100%',
        height: screenWidth * 0.6, // Tỷ lệ 3:5
        borderRadius: 10,
        overflow: 'hidden',
        marginBottom: 10,
    },
    imageThumbnailFull: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },

    // --- Key Colors Section ---
    keyColorsSection: {
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#333',
        borderRadius: 10,
        padding: 10,
        backgroundColor: '#2C2C2E',
    },
    colorSummaryRow: {
        marginBottom: 10,
    },
    keyColorTitle: {
        color: '#A0A0A0',
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 5,
    },
    colorBlocksSummary: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    summaryBlockItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 10,
        paddingVertical: 3,
        paddingHorizontal: 5,
        borderRadius: 5,
        backgroundColor: '#1E1E1E',
        marginBottom: 5,
    },
    summaryBlockColor: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: 'white',
        marginRight: 5,
    },
    summaryBlockText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '600',
    },

    // --- Tested Colors (Old Saved Colors) ---
    colorBlocksContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 20,
        justifyContent: 'flex-start',
    },
    colorBlock: {
        width: 40, // Giảm kích thước Tested Color
        height: 40,
        borderRadius: 8,
        margin: 5,
        borderWidth: 2,
        borderColor: '#fff',
        elevation: 5,
    },
    noColorText: {
        color: '#aaa',
        fontStyle: 'italic',
        marginTop: 5,
        marginBottom: 10,
    },

    // --- Palettes ---
    paletteGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    paletteCardWrapper: {
        width: screenWidth / 2 - 30, // Đảm bảo khớp với CARD_WIDTH trong CapsulePalette
        alignItems: 'center',
        marginBottom: 15,
    },
    paletteNameText: {
        color: '#fff',
        fontSize: 12,
        marginTop: 5,
        textAlign: 'center',
    },

    // --- Navigation Button ---
    detailButton: {
        backgroundColor: '#0095F6',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 20,
        flexDirection: 'row',
        justifyContent: 'center',
    },
    detailButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
});

export default ManualResultModal;
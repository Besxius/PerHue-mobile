// components/AiResultModal.tsx
import React from 'react';
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
import { AiColorTestResponse } from '../types/dataModels';
// Giả sử AiColorTestResponse đã được import đúng

const { height: screenHeight, width: screenWidth } = Dimensions.get('window');

// Interface cho các màu tối thiểu để render
interface DisplayColor {
    hexCode: string;
    name: string;
}

interface AiResultModalProps {
    isVisible: boolean;
    onClose: () => void;
    resultData: AiColorTestResponse | null;
    currentPhotoUri: string | null;
    onNavigateToDetail: () => void;
    // Thêm hàm này nếu bạn muốn điều hướng đến AiResultDetail (tương tự như Manual)
}

const createDisplayColor = (hex: string): DisplayColor => ({
    hexCode: hex.trim(),
    name: hex.trim().toUpperCase(),
});


const AiTestResultModal: React.FC<AiResultModalProps> = ({
    isVisible,
    onClose,
    resultData,
    currentPhotoUri,
    onNavigateToDetail
}) => {
    if (!resultData) return null;

    // Phân tách chuỗi mã màu thành mảng các Hex Code
    const suggestedHexes = resultData.suggestedColor
        ? resultData.suggestedColor.split(',').map(createDisplayColor)
        : [];

    const avoidedHexes = resultData.avoidedColor
        ? resultData.avoidedColor.split(',').map(createDisplayColor)
        : [];

    // Giả định tên loại màu (ví dụ: Spring, Winter) nếu có trong resultData hoặc API
    // (Vì interface bạn cung cấp không có tên loại màu, tôi dùng ID tạm thời)
    const colorTypeName = `AI TEST RESULT (Type ID: ${resultData.colorTypeId})`;

    // Hàm render khối màu nhỏ
    const renderColorSummaryBlock = (color: DisplayColor) => (
        <View key={color.hexCode} style={modalStyles.summaryBlockItem}>
            <View style={[modalStyles.summaryBlockColor, { backgroundColor: color.hexCode }]} />
            <Text style={modalStyles.summaryBlockText}>{color.name}</Text>
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

                        {/* 1. Captured Image */}
                        <Text style={modalStyles.subtitle}>CAPTURED IMAGE:</Text>
                        {currentPhotoUri && (
                            <View style={modalStyles.imageWrapperFull}>
                                <Image
                                    source={{ uri: currentPhotoUri }}
                                    style={modalStyles.imageThumbnailFull}
                                />
                            </View>
                        )}

                        {/* 2. Suggested Colors */}
                        <Text style={modalStyles.subtitle}>SUGGESTED COLORS:</Text>
                        <View style={modalStyles.keyColorsSection}>
                            {suggestedHexes.length > 0 ? (
                                <View style={modalStyles.colorBlocksSummary}>
                                    {suggestedHexes.map(renderColorSummaryBlock)}
                                </View>
                            ) : (
                                <Text style={modalStyles.noColorText}>No colors suggested.</Text>
                            )}
                        </View>

                        {/* 3. Avoided Colors */}
                        <Text style={modalStyles.subtitle}>AVOIDED COLORS:</Text>
                        <View style={modalStyles.keyColorsSection}>
                            {avoidedHexes.length > 0 ? (
                                <View style={modalStyles.colorBlocksSummary}>
                                    {avoidedHexes.map(renderColorSummaryBlock)}
                                </View>
                            ) : (
                                <Text style={modalStyles.noColorText}>No colors to avoid were returned.</Text>
                            )}
                        </View>

                        {/* 4. Note / Result Message */}
                        <Text style={modalStyles.subtitle}>EXPERT NOTE:</Text>
                        <Text style={modalStyles.noteText}>{resultData.note || "No detailed note provided."}</Text>
                        <Text style={modalStyles.noteDate}>Date: {new Date(resultData.date).toLocaleDateString()}</Text>

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
        maxHeight: screenHeight * 0.9,
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
        fontSize: 22,
        fontWeight: 'bold',
        color: '#7AC943', // Màu xanh lá cho AI
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
        height: screenWidth * 0.6,
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
    colorBlocksSummary: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    summaryBlockItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 10,
        paddingVertical: 3,
        paddingHorizontal: 8,
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
    noteText: {
        color: '#E0E0E0',
        fontSize: 14,
        marginBottom: 10,
    },
    noteDate: {
        color: '#A0A0A0',
        fontSize: 12,
        fontStyle: 'italic',
        textAlign: 'right',
    },
    noColorText: {
        color: '#aaa',
        fontStyle: 'italic',
        marginTop: 5,
        marginBottom: 5,
    },

    // --- Navigation Button ---
    detailButton: {
        backgroundColor: '#7AC943', // Màu xanh nổi bật
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 20,
        flexDirection: 'row',
        justifyContent: 'center',
    },
    detailButtonText: {
        color: '#1E1E1E',
        fontSize: 18,
        fontWeight: 'bold',
    },
});

export default AiTestResultModal;
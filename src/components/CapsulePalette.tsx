import React from 'react';
import { View, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';

const { width } = Dimensions.get('window');

// Điều chỉnh kích thước thẻ để dễ sắp xếp bên trong
const CARD_WIDTH = width / 2 - 30;
const CARD_HEIGHT = CARD_WIDTH * 1.05; // Cao hơn rộng một chút

// 1. Định nghĩa Kiểu (Interface) cho Props (Giữ nguyên 4 màu)
export interface CapsulePaletteProps {
    colors: [string, string, string, string]; // Yêu cầu 4 mã màu đầu vào
    isSelected: boolean;
    onSelect: () => void;
}

// 2. Component CapsulePalette
const CapsulePalette: React.FC<CapsulePaletteProps> = ({
    colors,
    isSelected,
    onSelect
}) => {
    const [color1, color2, color3, color4] = colors;

    return (
        <TouchableOpacity
            style={[
                paletteStyles.card,
                isSelected && paletteStyles.cardSelected // Viền nổi bật khi được chọn
            ]}
            onPress={onSelect}
        >
            <View style={paletteStyles.boxContainer}>

                {/* Phần trên: 3 Cột Dọc */}
                <View style={paletteStyles.topSection}>

                    <View style={paletteStyles.column1}>
                        <View style={paletteStyles.column11}>
                            <View style={paletteStyles.capsuleSmall}>
                                <View style={[paletteStyles.capsule, paletteStyles.capsuleWide, { backgroundColor: color1 }]} />
                            </View>

                            <View style={paletteStyles.capsuleSmall}>
                                <View style={[paletteStyles.capsule, paletteStyles.capsuleWide, { backgroundColor: color2 }]} />
                            </View>

                            <View style={paletteStyles.capsuleSmall}>
                                <View style={[paletteStyles.capsule, paletteStyles.capsuleWide, { backgroundColor: color3 }]} />
                            </View>
                        </View>

                        <View style={paletteStyles.column12}>
                            <View style={[paletteStyles.capsule, paletteStyles.capsuleWide, { backgroundColor: color4 }]} />
                        </View>
                    </View>

                    <View style={paletteStyles.column2}>
                        <View style={[paletteStyles.capsule, paletteStyles.capsuleSquare, { backgroundColor: color1 }]} />
                        <View style={[paletteStyles.capsule, paletteStyles.capsuleSquare, { backgroundColor: color2, marginTop: 10 }]} />
                        <View style={[paletteStyles.capsule, paletteStyles.capsuleSquare, { backgroundColor: color3, marginTop: 10 }]} />
                        <View style={[paletteStyles.capsule, paletteStyles.capsuleSquare, { backgroundColor: color4, marginTop: 10 }]} />
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );
};

export default CapsulePalette;

// 3. Styles
const paletteStyles = StyleSheet.create({
    card: {
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        backgroundColor: '#fff',
        borderRadius: 15,
        borderWidth: 1,
        borderColor: '#ddd',
        padding: 10,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    cardSelected: {
        borderColor: '#4285F4',
        borderWidth: 2,
    },
    boxContainer: {
        flex: 1,
        flexDirection: 'column', // Chia thành topSection và bottomSection
        padding: 5,
        justifyContent: 'space-between',
    },

    // --- Phần trên (Cột dọc) ---
    topSection: {
        flex: 1, // Chiếm phần lớn không gian
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    // Cột dọc cơ bản (Sử dụng tỷ lệ 1:1:1:1 cho 4 cột)
    column1: {
        width: '73%',
        justifyContent: 'space-between',
    },

    column2: {
        width: '22%'
    },

    column11: {
        flex: 1,
        flexDirection: 'row',
        height: '75%',
        marginBottom: 5,
        justifyContent: 'space-between',
    },

    column12: {
        paddingTop: 5,
        height: '22%',
    },

    capsuleSmall: {
        width: '30%',
    },

    capsule: {
        borderRadius: 10,
    },
    capsuleLong: {
        flex: 1,
    },
    capsuleSquare: {
        width: '100%',
        aspectRatio: 1, // Luôn là hình vuông
        height: undefined,
    },
    capsuleWide: {
        flex: 1, // Chiếm phần còn lại của chiều ngang
        height: '100%',
    },
    capsuleEndSquare: {
        width: CARD_HEIGHT * 0.25, // Chiều rộng bằng chiều cao của bottomSection
        height: '100%',
    }
});
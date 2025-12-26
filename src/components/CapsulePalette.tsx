import React from 'react';
import { View, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';

const { width } = Dimensions.get('window');

const CARD_WIDTH = width / 2 - 30;
const CARD_HEIGHT = CARD_WIDTH * 1.05;

// 1. Định nghĩa Kiểu (Interface) cho Props (Giữ nguyên 4 màu)
export interface CapsulePaletteProps {
    colors: [string, string, string, string];
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
                isSelected && paletteStyles.cardSelected
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
        flexDirection: 'column',
        padding: 5,
        justifyContent: 'space-between',
    },

    // --- Phần trên (Cột dọc) ---
    topSection: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
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
        aspectRatio: 1,
        height: undefined,
    },
    capsuleWide: {
        flex: 1,
        height: '100%',
    },
    capsuleEndSquare: {
        width: CARD_HEIGHT * 0.25,
        height: '100%',
    }
});
// components/ManualResultModal.tsx
import React, { useRef, useEffect, useState } from 'react';
import {
    Modal,
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    ScrollView,
    Image,
    Animated,
    PanResponder,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { ManualColorTestResponse, Color } from '../types/dataModels';
import CapsulePalette from './CapsulePalette';

const { height: screenHeight, width: screenWidth } = Dimensions.get('window');
const BLUE_COLOR = '#4C7BE2';

interface ManualResultModalProps {
    isVisible: boolean;
    onClose: () => void;
    resultData: ManualColorTestResponse | null;
    currentPhotoUri: string | null;
}

const getContrastTextColor = (hex: string) => {
    const cleanHex = hex.replace('#', '');
    if (cleanHex.length !== 6) return '#FFFFFF';
    const r = parseInt(cleanHex.substr(0, 2), 16);
    const g = parseInt(cleanHex.substr(2, 2), 16);
    const b = parseInt(cleanHex.substr(4, 2), 16);
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return (yiq >= 128) ? '#000000' : '#FFFFFF';
};

const createMinimalColor = (hex: string, name: string): Color => ({
    id: 0,
    name: name,
    hexCode: hex,
});

const ManualResultModal: React.FC<ManualResultModalProps> = ({
    isVisible,
    onClose,
    resultData,
    currentPhotoUri
}) => {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

    const panY = useRef(new Animated.Value(0)).current;
    const [selectedPaletteId, setSelectedPaletteId] = useState<number | null>(null);

    useEffect(() => {
        if (isVisible) {
            panY.setValue(0);
        }
    }, [isVisible]);

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderMove: (e, gestureState) => {
                if (gestureState.dy > 0) {
                    panY.setValue(gestureState.dy);
                }
            },
            onPanResponderRelease: (e, gestureState) => {
                if (gestureState.dy > 150) {
                    onClose();
                } else {
                    Animated.spring(panY, {
                        toValue: 0,
                        useNativeDriver: false,
                        bounciness: 10
                    }).start();
                }
            },
        })
    ).current;

    const handleNavigateToDetail = () => {
        if (resultData?.id) {
            onClose();
            navigation.navigate('ManualTestResultDetailScreen', { id: resultData.id });
        }
    };

    if (!resultData) return null;

    const colorTypeName = resultData.colorType?.name || 'Unknown';
    const chosenColorsArray = resultData.chosenColor ? resultData.chosenColor.split(',').map(c => c.trim()) : [];
    const suggestedColorsArray = resultData.suggestedColor ? resultData.suggestedColor.split(',').map(c => c.trim()) : [];

    const getDetailedColors = (hexArray: string[]) => {
        return hexArray.map(hex =>
            resultData.colors.find(c => c.hexCode.toUpperCase() === hex.toUpperCase())
            || createMinimalColor(hex, "N/A")
        );
    };

    const chosenDetailedColors = getDetailedColors(chosenColorsArray);
    const suggestedDetailedColors = getDetailedColors(suggestedColorsArray);

    const renderColorSummaryBlock = (color: Color) => (
        <View key={color.hexCode} style={[modalStyles.colorBox, { backgroundColor: color.hexCode }]}>
            <Text style={[modalStyles.colorHexText, { color: getContrastTextColor(color.hexCode) }]}>
                {color.hexCode.toUpperCase()}
            </Text>
        </View>
    );

    const renderCapsulePalettes = () => (
        <View style={modalStyles.paletteGrid}>
            {resultData.capsulePalettes.map((palette) => {
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
                            colors={colorsForComponent}
                            isSelected={selectedPaletteId === palette.id}
                            onSelect={() => setSelectedPaletteId(palette.id)}
                        />
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
            <View style={modalStyles.overlay}>
                <TouchableOpacity
                    style={StyleSheet.absoluteFill}
                    activeOpacity={1}
                    onPress={onClose}
                />

                <Animated.View
                    style={[
                        modalStyles.container,
                        { transform: [{ translateY: panY }] }
                    ]}
                >
                    <View
                        style={modalStyles.header}
                        {...panResponder.panHandlers}
                    >
                        <View style={modalStyles.dragHandle} />
                        <TouchableOpacity onPress={onClose} style={modalStyles.closeButton}>
                            <Ionicons name="close-circle" size={30} color="#e0e0e0" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView
                        contentContainerStyle={modalStyles.content}
                        showsVerticalScrollIndicator={false}
                        bounces={false}
                    >
                        <View style={modalStyles.badgeContainer}>
                            <Text style={modalStyles.resultLabel}>Your Color Type:</Text>
                            <View style={modalStyles.badge}>
                                <Text style={modalStyles.badgeText}>{colorTypeName}</Text>
                            </View>
                        </View>

                        <Text style={modalStyles.subtitle}>CAPTURED IMAGE</Text>
                        {currentPhotoUri && (
                            <View style={modalStyles.imageWrapperFull}>
                                <Image
                                    source={{ uri: currentPhotoUri }}
                                    style={modalStyles.imageThumbnailFull}
                                />
                            </View>
                        )}

                        <Text style={modalStyles.subtitle}>KEY COLORS</Text>
                        <View style={modalStyles.keyColorsSection}>
                            <Text style={modalStyles.keyColorTitle}>CHOSEN COLORS</Text>
                            <View style={[modalStyles.colorBlocksSummary, { marginBottom: 15 }]}>
                                {chosenDetailedColors.map(renderColorSummaryBlock)}
                            </View>

                            <Text style={modalStyles.keyColorTitle}>SUGGESTED COLORS</Text>
                            <View style={modalStyles.colorBlocksSummary}>
                                {suggestedDetailedColors.map(renderColorSummaryBlock)}
                            </View>
                        </View>

                        <Text style={modalStyles.subtitle}>CAPSULE PALETTES</Text>
                        {resultData.capsulePalettes && resultData.capsulePalettes.length > 0 ? (
                            renderCapsulePalettes()
                        ) : (
                            <Text style={modalStyles.noColorText}>No matching palettes found.</Text>
                        )}

                        <TouchableOpacity style={modalStyles.detailButton} onPress={handleNavigateToDetail}>
                            <Text style={modalStyles.detailButtonText}>
                                VIEW DETAILED ANALYSIS
                            </Text>
                            <Ionicons name="arrow-forward-circle" size={24} color="#fff" style={{ marginLeft: 8 }} />
                        </TouchableOpacity>

                        <View style={{ height: 40 }} />
                    </ScrollView>
                </Animated.View>
            </View>
        </Modal>
    );
};

const modalStyles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    container: {
        backgroundColor: '#FFFFFF',
        width: '100%',
        height: screenHeight * 0.9,
        borderTopLeftRadius: 25,
        borderTopRightRadius: 25,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 10,
        overflow: 'hidden',
    },
    header: {
        width: '100%',
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFFFFF',
        zIndex: 1,
    },
    dragHandle: {
        width: 60,
        height: 6,
        backgroundColor: '#E0E0E0',
        borderRadius: 3,
        marginTop: 10,
    },
    closeButton: {
        position: 'absolute',
        right: 15,
        top: 10,
    },
    badgeContainer: {
        alignItems: 'center',
        marginVertical: 15,
    },
    resultLabel: {
        fontSize: 14,
        color: '#666',
        marginBottom: 5,
        fontWeight: '600',
    },
    badge: {
        backgroundColor: '#E3F2FD',
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 20,
    },
    badgeText: {
        color: BLUE_COLOR,
        fontWeight: 'bold',
        fontSize: 18,
    },
    content: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    subtitle: {
        fontSize: 14,
        color: '#888',
        marginBottom: 8,
        marginTop: 20,
        fontWeight: '700',
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
    imageWrapperFull: {
        width: '100%',
        height: 500,
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: '#F5F5F5',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    imageThumbnailFull: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    keyColorsSection: {
        backgroundColor: '#FAFAFA',
        padding: 15,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#EEEEEE',
    },
    keyColorTitle: {
        color: '#555',
        fontSize: 12,
        fontWeight: '700',
        marginBottom: 8,
    },
    colorBlocksSummary: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    colorBox: {
        width: 50,
        height: 50,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 1,
        elevation: 2,
    },
    colorHexText: {
        fontSize: 9,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    noColorText: {
        color: '#999',
        fontStyle: 'italic',
        fontSize: 14,
    },
    paletteGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    paletteCardWrapper: {
        width: '48%',
        alignItems: 'center',
        marginBottom: 15,
    },
    detailButton: {
        backgroundColor: '#0095F6',
        paddingVertical: 16,
        borderRadius: 30,
        alignItems: 'center',
        marginTop: 30,
        flexDirection: 'row',
        justifyContent: 'center',
        shadowColor: "#0095F6",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    detailButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
});

export default ManualResultModal;
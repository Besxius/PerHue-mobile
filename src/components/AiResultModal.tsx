// components/AiResultModal.tsx
import React, { useRef, useEffect } from 'react';
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
import { AiColorTestResponse } from '../types/dataModels';

const { height: screenHeight, width: screenWidth } = Dimensions.get('window');
const BLUE_COLOR = '#4C7BE2';

interface DisplayColor {
    hexCode: string;
    name: string;
}

interface AiResultModalProps {
    isVisible: boolean;
    onClose: () => void;
    resultData: AiColorTestResponse | null;
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

const createDisplayColor = (hex: string): DisplayColor => ({
    hexCode: hex.trim(),
    name: hex.trim().toUpperCase(),
});

const AiTestResultModal: React.FC<AiResultModalProps> = ({
    isVisible,
    onClose,
    resultData,
    currentPhotoUri,
}) => {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

    const panY = useRef(new Animated.Value(0)).current;

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
            navigation.navigate('AiTestResultDetailScreen', { id: resultData.id });
        }
    };

    if (!resultData) return null;

    const suggestedHexes = resultData.suggestedColor
        ? resultData.suggestedColor.split(',').map(createDisplayColor)
        : [];

    const avoidedHexes = resultData.avoidedColor
        ? resultData.avoidedColor.split(',').map(createDisplayColor)
        : [];

    const colorTypeName = `Color Type ID: ${resultData.colorTypeId}`;

    const renderColorSummaryBlock = (color: DisplayColor) => (
        <View key={color.hexCode} style={[modalStyles.colorBox, { backgroundColor: color.hexCode }]}>
            <Text style={[modalStyles.colorHexText, { color: getContrastTextColor(color.hexCode) }]}>
                {color.hexCode.toUpperCase()}
            </Text>
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
                            <Text style={modalStyles.resultLabel}>AI SUGGESTED TYPE:</Text>
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

                        <Text style={modalStyles.subtitle}>SUGGESTED COLORS</Text>
                        <View style={modalStyles.keyColorsSection}>
                            {suggestedHexes.length > 0 ? (
                                <View style={modalStyles.colorBlocksSummary}>
                                    {suggestedHexes.map(renderColorSummaryBlock)}
                                </View>
                            ) : (
                                <Text style={modalStyles.noColorText}>No colors suggested.</Text>
                            )}
                        </View>

                        <Text style={modalStyles.subtitle}>AVOIDED COLORS</Text>
                        <View style={modalStyles.keyColorsSection}>
                            {avoidedHexes.length > 0 ? (
                                <View style={modalStyles.colorBlocksSummary}>
                                    {avoidedHexes.map(renderColorSummaryBlock)}
                                </View>
                            ) : (
                                <Text style={modalStyles.noColorText}>No colors to avoid were returned.</Text>
                            )}
                        </View>

                        <View style={modalStyles.noteContainer}>
                            <Text style={modalStyles.subtitle}>EXPERT NOTE</Text>
                            <Text style={modalStyles.noteText}>{resultData.note || "No detailed note provided."}</Text>
                            <Text style={modalStyles.noteDate}>Date: {new Date(resultData.date).toLocaleDateString()}</Text>
                        </View>

                        {/* [CẬP NHẬT] Nút điều hướng */}
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
        color: '#2E7D32',
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
        flexDirection: 'row',
        flexWrap: 'wrap',
        backgroundColor: '#FAFAFA',
        padding: 15,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#EEEEEE',
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
    noteContainer: {
        marginTop: 10,
    },
    noteText: {
        color: '#444',
        fontSize: 15,
        lineHeight: 22,
        backgroundColor: '#F0F9F0',
        padding: 15,
        borderRadius: 12,
        overflow: 'hidden',
    },
    noteDate: {
        color: '#999',
        fontSize: 12,
        fontStyle: 'italic',
        textAlign: 'right',
        marginTop: 5,
    },
    noColorText: {
        color: '#999',
        fontStyle: 'italic',
        fontSize: 14,
    },
    detailButton: {
        backgroundColor: '#2E7D32',
        paddingVertical: 16,
        borderRadius: 30,
        alignItems: 'center',
        marginTop: 30,
        flexDirection: 'row',
        justifyContent: 'center',
        shadowColor: "#2E7D32",
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

export default AiTestResultModal;
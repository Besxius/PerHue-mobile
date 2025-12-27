import React, { FC, useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    ActivityIndicator,
    Image,
    Dimensions,
    Alert,
    TouchableOpacity,
    Platform,
    ToastAndroid,
    Modal,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { getAiTestResultById } from '../api/userApi';
import { AiTestResponse, CapsulePaletteModel, Color } from '../types/dataModels';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CapsulePalette from '../components/CapsulePalette';
import { getColorTypeById } from '../api/capsulePaletteApi';
import * as Clipboard from 'expo-clipboard';
import PaletteDetailModal from '../components/PaletteDetailModal';
import ImageView from "react-native-image-viewing";

type AiTestDetailScreenProps = NativeStackScreenProps<
    RootStackParamList,
    'AiTestResultDetailScreen'
>;

const { width } = Dimensions.get('window');
const BLUE_COLOR = '#4C7BE2';

const getContrastTextColor = (hex: string) => {
    if (!hex) return '#000';
    const cleanHex = hex.replace('#', '').trim();
    if (cleanHex.length !== 6) return '#FFFFFF';
    const r = parseInt(cleanHex.substr(0, 2), 16);
    const g = parseInt(cleanHex.substr(2, 2), 16);
    const b = parseInt(cleanHex.substr(4, 2), 16);
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return (yiq >= 128) ? '#000000' : '#FFFFFF';
};

const ColorBoxDisplay: React.FC<{ colors: Color[], title: string }> = ({ colors, title }) => {
    if (!colors || colors.length === 0) {
        return (
            <View style={styles.card}>
                <Text style={styles.cardTitle}>{title}</Text>
                <Text style={styles.noDataText}>No colors data available.</Text>
            </View>
        );
    }

    const handleCopy = async (hexCode: string) => {
        await Clipboard.setStringAsync(hexCode);

        if (Platform.OS === 'android') {
            ToastAndroid.show(`Copied list hexcodes to clipboard!`, ToastAndroid.SHORT);
        } else {
            Alert.alert("Copied", `Color list hexcodes copied!`);
        }
    };

    return (
        <View style={styles.card}>
            <View style={styles.rowBetween}>
                <Text style={styles.cardTitle}>{title} ({colors.length})</Text>
                <TouchableOpacity
                    style={styles.copyButton}
                    onPress={(e) => {
                        e.stopPropagation();
                        handleCopy(colors.map(c => c.hexCode).join(', '));
                    }}
                >
                    <Ionicons name="copy-outline" size={24} color="gray" />
                </TouchableOpacity>
            </View>
            <View style={styles.colorGrid}>
                {colors.map((colorItem, index) => (
                    <View key={`suggested-color-${index}`} style={[styles.colorBox, { backgroundColor: colorItem.hexCode }]}>
                        <Text style={[styles.colorHexText, { color: getContrastTextColor(colorItem.hexCode) }]}>
                            {colorItem.hexCode.toUpperCase()}
                        </Text>
                        {colorItem.name && colorItem.name !== colorItem.hexCode && (
                            <Text style={[styles.colorNameText, { color: getContrastTextColor(colorItem.hexCode) }]} numberOfLines={1}>
                                {colorItem.name}
                            </Text>
                        )}
                    </View>
                ))}
            </View>
        </View>
    );
};

const AiTestResultDetailScreen: FC<AiTestDetailScreenProps> = ({ route, navigation }) => {
    const id = route.params.id;
    const insets = useSafeAreaInsets();

    const [resultData, setResultData] = useState<AiTestResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedCapsuleId, setSelectedCapsuleId] = useState<number | null>(null);
    const [colorTypeName, setColorTypeName] = useState<string>('Undetermined');
    const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);

    const [isModalVisible, setIsModalVisible] = useState(false);
    const [selectedDetailPalette, setSelectedDetailPalette] = useState<CapsulePaletteModel | null>(null);

    const fetchResult = useCallback(async () => {
        if (!id) {
            setError('Missing test ID.');
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);
        try {
            const data = await getAiTestResultById(id);
            setResultData(data);

            if (data.newAiTestResultResponseModel?.colorTypeId) {
                try {
                    const typeData = await getColorTypeById(data.newAiTestResultResponseModel.colorTypeId);
                    setColorTypeName(typeData.name);
                } catch (e) {
                    console.error("Failed to load Color Type Name:", e);
                    setColorTypeName('Unknown Type');
                }
            }

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
            setError(errorMessage);
            Alert.alert('Data loading error', errorMessage);
        } finally {
            setIsLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchResult();
    }, [fetchResult]);

    const handlePalettePress = (palette: CapsulePaletteModel) => {
        setSelectedDetailPalette(palette);
        setSelectedCapsuleId(palette.id);
        setIsModalVisible(true);
    };

    useEffect(() => {
        const unsubscribe = navigation.addListener('beforeRemove', (e) => {
            const actionType = e.data.action.type;

            if (actionType === 'GO_BACK' || actionType === 'POP') {
                e.preventDefault();

                navigation.navigate('Tabs', {
                    screen: 'History',
                    params: {
                        initialTab: 'AI Test'
                    }
                });
            }
        });

        return unsubscribe;
    }, [navigation]);

    const handleGoBack = () => {
        navigation.navigate('Tabs' as any, {
            screen: 'History',
            params: { initialTab: 'AI Test' }
        });
    };

    if (isLoading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color={BLUE_COLOR} />
                <Text style={styles.loadingText}>Loading AI test result...</Text>
            </View>
        );
    }

    if (error || !resultData) {
        return (
            <View style={[styles.centered, styles.errorBox]}>
                <Text style={styles.errorText}>An error occurred: {error || 'No data found'}</Text>
                <TouchableOpacity onPress={handleGoBack} style={styles.backButtonCenter}>
                    <Text style={styles.backButtonText}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const model = resultData.newAiTestResultResponseModel;
    const imageUrl = resultData.imageUrl;
    const suggestedPalettes = model?.suggestedCapsulePalletesBySystem || [];

    const suggestedColorString = model?.suggestedColor || '';
    const suggestedColorsFromString: Color[] = suggestedColorString
        .split(',')
        .map(c => c.trim())
        .filter(c => c.length > 0)
        .map((hex, index) => ({
            id: index,
            name: '',
            hexCode: hex
        }));

    const suggestedColorsBySystem: Color[] = model?.suggestedColorsBySystem || [];

    const avoidedColorString = model?.avoidedColor || '';
    const avoidedColorsList: Color[] = avoidedColorString
        .split(',')
        .map(c => c.trim())
        .filter(c => c.length > 0)
        .map((hex, index) => ({
            id: index,
            name: '',
            hexCode: hex
        }));

    const renderGeneratedImages = () => {
        const images = resultData?.newAiTestResultResponseModel?.generatedImagesList;

        if (!images || images.length === 0) return null;

        return (
            <View style={styles.generatedImagesContainer}>
                <Text style={styles.sectionTitle}>AI Generated Styles</Text>

                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.imagesScrollContent}
                >
                    {images.map((img, index) => (
                        <TouchableOpacity
                            key={img.aiImageId || index}
                            style={styles.imageWrapper}
                            activeOpacity={0.8}
                            onPress={() => setSelectedImageUrl(img.aiImageLink)}
                        >
                            <Image
                                source={{ uri: img.aiImageLink }}
                                style={styles.generatedImage}
                                resizeMode="cover"
                            />
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>
        );
    };

    const renderImageModal = () => {
        const imagesToShow = selectedImageUrl ? [{ uri: selectedImageUrl }] : [];
        return (
            <ImageView
                images={imagesToShow}
                imageIndex={0}
                visible={!!selectedImageUrl}
                onRequestClose={() => setSelectedImageUrl(null)}
                swipeToCloseEnabled={true}
                doubleTapToZoomEnabled={true}
                HeaderComponent={() => (
                    <View style={[styles.imageHeader, { paddingTop: insets.top + 10 }]}>
                        <TouchableOpacity
                            style={styles.closeButtonArea}
                            onPress={() => setSelectedImageUrl(null)}
                            hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                        >
                            <Ionicons name="close-circle" size={36} color="#fff" />
                        </TouchableOpacity>
                    </View>
                )}
                FooterComponent={() => (
                    <View style={[styles.imageFooter, { paddingBottom: insets.bottom + 20 }]}>
                        <Text style={styles.imageFooterText}>Swipe up to close</Text>
                    </View>
                )}
            />
        );
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <View style={styles.headerBar}>
                <TouchableOpacity onPress={handleGoBack} style={styles.headerButton}>
                    <Ionicons name="arrow-back" size={28} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>AI Test Result #{resultData.id}</Text>
                <View style={styles.headerButton} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.summaryCard}>
                    <View style={styles.rowBetween}>
                        <Text style={styles.label}>Date:</Text>
                        <Text style={styles.value}>
                            {new Date(resultData.createdDate).toLocaleDateString('vi-VN')}
                        </Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.resultRow}>
                        <Text style={styles.resultLabel}>AI Suggested Color Type:</Text>
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>{colorTypeName}</Text>
                        </View>
                    </View>
                </View>

                {imageUrl ? (
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Analyzed Image</Text>
                        <View style={styles.imageWrapper}>
                            <Image
                                source={{ uri: imageUrl }}
                                style={styles.resultImage}
                                resizeMode="contain"
                            />
                        </View>
                    </View>
                ) : null}

                <ColorBoxDisplay
                    colors={suggestedColorsFromString}
                    title="Suggested Colors"
                />

                <ColorBoxDisplay
                    colors={suggestedColorsBySystem}
                    title="Suggested Colors Of System"
                />

                <ColorBoxDisplay
                    colors={avoidedColorsList}
                    title="Avoided Colors"
                />

                {renderGeneratedImages()}

                {suggestedPalettes.length > 0 && (
                    <View style={styles.sectionContainer}>
                        <Text style={styles.sectionHeader}>Suggested Capsule Palettes ({suggestedPalettes.length})</Text>
                        <View style={styles.capsuleGrid}>
                            {suggestedPalettes.map(palette => {
                                if (!palette.colors || palette.colors.length < 4) return null;
                                const hexCodes = palette.colors.slice(0, 4).map(c => c.hexCode);

                                return (
                                    <View key={palette.id} style={styles.capsuleItemWrapper}>
                                        <CapsulePalette
                                            colors={hexCodes as [string, string, string, string]}
                                            isSelected={selectedCapsuleId === palette.id}
                                            onSelect={() => handlePalettePress(palette)}
                                        />
                                        {/* <Text style={styles.paletteName} numberOfLines={1}>{` ${palette.colorType.name} Palette`}</Text> */}
                                    </View>
                                );
                            })}
                        </View>
                    </View>
                )}

                {model?.note && (
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Note</Text>
                        <Text style={styles.noteText}>{model.note}</Text>
                    </View>
                )}

                <View style={{ height: 50 }} />
            </ScrollView>

            <PaletteDetailModal
                isVisible={isModalVisible}
                palette={selectedDetailPalette}
                onClose={() => setIsModalVisible(false)}
            />
            {renderImageModal()}
        </View>
    );
};

export default AiTestResultDetailScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    headerBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 15,
        paddingVertical: 10,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    headerButton: {
        width: 40,
        alignItems: 'flex-start',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        flex: 1,
        textAlign: 'center',
    },
    scrollContent: {
        padding: 15,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    errorBox: {
        padding: 20,
    },
    errorText: {
        color: 'red',
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 20,
    },
    loadingText: {
        marginTop: 10,
        color: '#666',
    },
    backButtonCenter: {
        padding: 10,
        backgroundColor: '#eee',
        borderRadius: 8,
    },
    backButtonText: {
        color: '#333',
        fontWeight: '600',
    },
    summaryCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 15,
        marginBottom: 15,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 15,
        marginBottom: 15,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
    },
    rowBetween: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    label: {
        fontSize: 14,
        color: '#666',
    },
    value: {
        fontSize: 14,
        fontWeight: '500',
        color: '#333',
    },
    divider: {
        height: 1,
        backgroundColor: '#f0f0f0',
        marginVertical: 10,
    },
    resultRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    resultLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    badge: {
        backgroundColor: '#E3F2FD',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    badgeText: {
        color: BLUE_COLOR,
        fontWeight: 'bold',
        fontSize: 16,
    },
    resultImage: {
        width: '100%',
        height: 500,
        borderRadius: 8,
    },
    colorGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    colorBox: {
        width: 60,
        height: 60,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 1.00,
        elevation: 1,
    },
    colorHexText: {
        fontSize: 10,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    colorNameText: {
        fontSize: 8,
        textAlign: 'center',
        marginTop: 2,
        paddingHorizontal: 2,
    },
    noDataText: {
        color: '#888',
        fontStyle: 'italic',
    },
    sectionContainer: {
        marginTop: 10,
    },
    sectionHeader: {
        fontSize: 18,
        fontWeight: 'bold',
        color: BLUE_COLOR,
        marginBottom: 15,
    },
    capsuleGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    capsuleItemWrapper: {
        width: '48%',
        marginBottom: 15,
        alignItems: 'center',
    },
    noteText: {
        fontSize: 14,
        color: '#555',
        lineHeight: 20,
    },
    copyButton: {
        padding: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 5,
    },
    paletteName: {
        marginTop: 5,
        fontSize: 12,
        color: '#555',
        fontWeight: '500',
    },
    generatedImagesContainer: {
        marginTop: 20,
        marginBottom: 10,
        paddingHorizontal: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 12,
    },
    imagesScrollContent: {
        paddingRight: 16,
    },
    imageWrapper: {
        marginRight: 12,
        borderRadius: 12,
        overflow: 'hidden',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        backgroundColor: '#fff',
    },
    generatedImage: {
        width: 150,
        height: 200,
        borderRadius: 12,
    },
    modalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.95)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    fullScreenImage: {
        width: width,
        height: '80%',
    },
    imageHeader: {
        width: '100%',
        alignItems: 'flex-end',
        paddingHorizontal: 20,
        zIndex: 9999, // Đảm bảo nổi lên trên
    },
    closeButtonArea: {
        padding: 5,
        backgroundColor: 'rgba(0,0,0,0.3)', // Nền mờ nhẹ để dễ nhìn nút hơn
        borderRadius: 20,
    },
    closeButton: {
        position: 'absolute',
        right: 20,
        zIndex: 999,
        // top sẽ được set dynamic theo insets
    },
    imageFooter: {
        width: width,
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20
    },
    imageFooterText: {
        color: '#fff',
        fontSize: 14,
        opacity: 0.8
    }
});
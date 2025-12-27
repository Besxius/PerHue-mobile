import React, { useState, useEffect, useCallback } from 'react';
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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import CapsulePalette from '../components/CapsulePalette';
import { CapsulePaletteModel, ManualTestResult } from '../types/dataModels';
import { getManualTestResultById } from '../api/userApi';
import { RootStackParamList } from '../navigation/AppNavigator';
import * as Clipboard from 'expo-clipboard';
import PaletteDetailModal from '../components/PaletteDetailModal';

type Props = NativeStackScreenProps<RootStackParamList, 'ManualTestResultDetailScreen'>;

const { width } = Dimensions.get('window');
const BLUE_COLOR = '#4C7BE2';

const getContrastTextColor = (hex: string) => {
    const cleanHex = hex.replace('#', '');
    if (cleanHex.length !== 6) return '#FFFFFF';

    const r = parseInt(cleanHex.substr(0, 2), 16);
    const g = parseInt(cleanHex.substr(2, 2), 16);
    const b = parseInt(cleanHex.substr(4, 2), 16);
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return (yiq >= 128) ? '#000000' : '#FFFFFF';
};

// Helper Component: Color Box Display
const ColorBoxDisplay: React.FC<{ colorsString: string, title: string }> = ({ colorsString, title }) => {
    const colorCodes = colorsString ? colorsString.split(',').map(c => c.trim()).filter(c => c.length > 0) : [];

    if (colorCodes.length === 0) return null;

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
                <Text style={styles.cardTitle}>{title} ({colorCodes.length})</Text>
                <TouchableOpacity
                    style={styles.copyButton}
                    onPress={(e) => {
                        e.stopPropagation();
                        handleCopy(colorsString);
                    }}
                >
                    <Ionicons name="copy-outline" size={24} color="gray" />
                </TouchableOpacity>
            </View>
            <View style={styles.colorGrid}>
                {colorCodes.map((hex, index) => (
                    <View key={index} style={[styles.colorBox, { backgroundColor: hex }]}>
                        {/* Áp dụng màu chữ tương phản */}
                        <Text style={[styles.colorHexText, { color: getContrastTextColor(hex) }]}>
                            {hex.toUpperCase()}
                        </Text>
                    </View>
                ))}
            </View>
        </View>
    );
};

const ManualTestResultDetailScreen: React.FC<Props> = ({ route, navigation }) => {
    const { id } = route.params;
    const insets = useSafeAreaInsets();

    const [result, setResult] = useState<ManualTestResult | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedCapsuleId, setSelectedCapsuleId] = useState<number | null>(null);

    const [isModalVisible, setIsModalVisible] = useState(false);
    const [selectedDetailPalette, setSelectedDetailPalette] = useState<CapsulePaletteModel | null>(null);

    const fetchResult = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await getManualTestResultById(id);
            setResult(data);
            // if (data.capsulePalettes && data.capsulePalettes.length > 0) {
            //     setSelectedCapsuleId(data.capsulePalettes[0].id);
            // }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error while loading data.';
            setError(errorMessage);
            Alert.alert("Data Loading Error", errorMessage);
        } finally {
            setIsLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchResult();
    }, [fetchResult]);

    useEffect(() => {
        const unsubscribe = navigation.addListener('beforeRemove', (e) => {
            const actionType = e.data.action.type;

            if (actionType === 'GO_BACK' || actionType === 'POP') {
                e.preventDefault();

                navigation.navigate('Tabs', {
                    screen: 'History',
                    params: {
                        initialTab: 'Manual Test'
                    }
                });
            }
        });

        return unsubscribe;
    }, [navigation]);

    const handlePalettePress = (palette: CapsulePaletteModel) => {
        setSelectedDetailPalette(palette);
        setSelectedCapsuleId(palette.id);
        setIsModalVisible(true);
    };

    const handleGoBack = () => {
        navigation.navigate('Tabs' as any, {
            screen: 'History',
            params: { initialTab: 'Manual Test' }
        });
    };

    if (isLoading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color={BLUE_COLOR} />
                <Text style={styles.loadingText}>Loading result...</Text>
            </View>
        );
    }

    if (error || !result) {
        return (
            <View style={styles.centered}>
                <Text style={styles.errorText}>Error: {error}</Text>
                <TouchableOpacity onPress={handleGoBack} style={styles.backButtonCenter}>
                    <Text style={styles.backButtonText}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const colorType = result.colorTypeName || 'Undetermined';
    const profilePictureUri = result.picture;
    const validCapsulePalettes = result.capsulePalettes;

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            {/* Custom Header */}
            <View style={styles.headerBar}>
                <TouchableOpacity onPress={handleGoBack} style={styles.headerButton}>
                    <Ionicons name="arrow-back" size={28} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Test Result #{result.id}</Text>
                <View style={styles.headerButton} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* 1. Result Summary */}
                <View style={styles.summaryCard}>
                    <View style={styles.rowBetween}>
                        <Text style={styles.label}>Time:</Text>
                        <Text style={styles.value}>
                            {new Date(result.createdDate).toLocaleString('vi-VN')}
                        </Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.resultRow}>
                        <Text style={styles.resultLabel}>Your Color Type:</Text>
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>{colorType}</Text>
                        </View>
                    </View>
                </View>

                {/* 2. Uploaded Image */}
                {profilePictureUri && (
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Analyzed Image</Text>
                        <View style={styles.imageWrapper}>
                            <Image
                                source={{ uri: profilePictureUri }}
                                style={styles.resultImage}
                                resizeMode="contain"
                            />
                        </View>
                    </View>
                )}

                {/* 3. Chosen & Suggested Colors */}
                <ColorBoxDisplay
                    colorsString={result.chosenColor}
                    title="Chosen Colors"
                />

                <ColorBoxDisplay
                    colorsString={result.suggestedColor}
                    title="Suggested Colors"
                />

                {/* 4. Capsule Palettes */}
                <View style={styles.sectionContainer}>
                    <Text style={styles.sectionHeader}>Suggested Capsule Palettes ({validCapsulePalettes.length})</Text>
                    {validCapsulePalettes.length > 0 ? (
                        <View style={styles.capsuleGrid}>
                            {validCapsulePalettes.map((palette) => {
                                const colorsArray = palette.colors.slice(0, 4).map(c => c.hexCode);
                                if (colorsArray.length < 4) return null;

                                return (
                                    <View key={palette.id} style={styles.capsuleItemWrapper}>
                                        <CapsulePalette
                                            colors={colorsArray as [string, string, string, string]}
                                            isSelected={palette.id === selectedCapsuleId}
                                            onSelect={() => handlePalettePress(palette)}
                                        />
                                        {/* <Text style={styles.paletteName} numberOfLines={1}>{` ${palette.colorType.name} Palette`}</Text> */}
                                    </View>
                                );
                            })}
                        </View>
                    ) : (
                        <Text style={styles.noDataText}>No matching palettes found.</Text>
                    )}
                </View>

                <View style={{ height: 30 }} />
            </ScrollView>

            <PaletteDetailModal
                isVisible={isModalVisible}
                palette={selectedDetailPalette}
                onClose={() => setIsModalVisible(false)}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    // Header Styles
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
    // Content Styles
    scrollContent: {
        padding: 15,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    capsuleItemWrapper: {
        width: '48%',
        marginBottom: 15,
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
        color: '#666',
    },
    errorText: {
        color: 'red',
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 20,
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
    paletteName: {
        fontSize: 12,
        color: '#555',
        fontWeight: '500',
    },
    // Cards
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

    // Rows & Typography
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

    // Image
    imageWrapper: {
        alignItems: 'center',
        backgroundColor: '#f9f9f9',
        borderRadius: 8,
        overflow: 'hidden',
    },
    resultImage: {
        width: '100%',
        height: 500,
        borderRadius: 8,
    },

    // Colors Grid
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
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.1,
        shadowRadius: 1.00,
        elevation: 1,
    },
    colorHexText: {
        fontSize: 10,
        fontWeight: 'bold',
        // Màu chữ sẽ được override bởi inline style từ hàm getContrastTextColor
    },

    // Capsule Section
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
    noDataText: {
        textAlign: 'center',
        color: '#888',
        fontStyle: 'italic',
        marginTop: 10,
    },
    copyButton: {
        padding: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 5,
    }
});

export default ManualTestResultDetailScreen;
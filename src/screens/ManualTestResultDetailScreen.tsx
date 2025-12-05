import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, Image, Dimensions, Alert, Platform } from 'react-native';
import CapsulePalette from '../components/CapsulePalette';
import { ManualTestResult } from '../types/dataModels';
import { getManualTestResultById } from '../api/userApi';

type ManualTestResultDetailRouteProp = {
    params: {
        id: number;
    };
};

interface ManualTestResultDetailScreenProps {
    route: ManualTestResultDetailRouteProp;
}

const { width } = Dimensions.get('window');

const ColorBoxDisplay: React.FC<{ colorsString: string, title: string }> = ({ colorsString, title }) => {
    const colorCodes = colorsString ? colorsString.split(',').map(c => c.trim()).filter(c => c.length > 0) : [];

    if (colorCodes.length === 0) {
        return (
            <View style={styles.colorSection}>
                <Text style={styles.sectionTitle}>{title}</Text>
                <Text style={styles.noDataText}>Không có dữ liệu màu.</Text>
            </View>
        );
    }

    return (
        <View style={styles.colorSection}>
            <Text style={styles.sectionTitle}>{title} ({colorCodes.length} màu)</Text>
            <View style={styles.colorContainer}>
                {colorCodes.map((hex, index) => (
                    <View key={index} style={[styles.colorBox, { backgroundColor: hex }]}>
                        <Text style={styles.colorHexText}>{hex}</Text>
                    </View>
                ))}
            </View>
        </View>
    );
};

// Component chính
const ManualTestResultDetailScreen: React.FC<ManualTestResultDetailScreenProps> = ({ route }) => {
    const { id } = route.params;

    const [result, setResult] = useState<ManualTestResult | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedCapsuleId, setSelectedCapsuleId] = useState<number | null>(null);

    const fetchResult = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await getManualTestResultById(id);
            setResult(data);
            if (data.capsulePalettes && data.capsulePalettes.length > 0) {
                setSelectedCapsuleId(data.capsulePalettes[0].id);
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error while loading data.';
            setError(errorMessage);
            Alert.alert("Data loading error", errorMessage);
        } finally {
            setIsLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchResult();
    }, [fetchResult]);

    if (isLoading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#4285F4" />
                <Text>Loading result details...</Text>
            </View>
        );
    }

    if (error || !result) {
        return (
            <View style={styles.centered}>
                <Text style={styles.errorText}>An error occurred: {error}</Text>
                <Text style={styles.errorText}>ID: {id}</Text>
            </View>
        );
    }

    // 4. Logic Xử lý Dữ liệu
    const colorType = result.colorType?.name || 'Undetermined';
    const profilePictureUri = result.picture;

    const validCapsulePalettes = result.capsulePalettes
        .map(palette => {
            const colorsArray = palette.colors
                .slice(0, 4)
                .map(c => c.hexCode);

            if (colorsArray.length === 4) {
                return {
                    id: palette.id,
                    colors: colorsArray as [string, string, string, string],
                };
            }
            return null;
        })
        .filter((palette): palette is { id: number, colors: [string, string, string, string] } => palette !== null);


    return (
        <ScrollView style={styles.container}>

            <View style={styles.header}>
                <Text style={styles.title}>Test Result #{result.id}</Text>
                <Text style={styles.userInfoText}>Send date: {new Date(result.createdDate).toLocaleDateString()}</Text>
                <View style={styles.colorTypeBadge}>
                    <Text style={styles.colorTypeText}>Color Type: </Text>
                    <Text style={styles.colorTypeLarge}>{colorType}</Text>
                </View>
            </View>

            {/* 2. Thông tin cơ bản */}
            {/* <View style={styles.infoSection}>
            </View> */}

            <View style={styles.divider} />

            {/* 3. Hình ảnh (Nếu có) */}
            {profilePictureUri && (
                <View style={styles.imageContainer}>
                    <Text style={styles.sectionTitle}>Your picture</Text>
                    <Image
                        source={{ uri: profilePictureUri }}
                        style={styles.picture}
                        resizeMode="contain"
                    />
                </View>
            )}

            <View style={styles.divider} />

            {/* 4. ChosenColor và SuggestedColor (Hiển thị ô vuông màu) */}
            <ColorBoxDisplay
                colorsString={result.chosenColor}
                title="Màu Đã Chọn (Chosen Colors)"
            />

            <ColorBoxDisplay
                colorsString={result.suggestedColor}
                title="Màu Gợi Ý (Suggested Colors)"
            />

            <View style={styles.divider} />

            {/* 5. Capsule Palettes */}
            <View style={styles.capsuleSection}>
                <Text style={styles.sectionTitle}>Các Capsule Palettes ({validCapsulePalettes.length} hợp lệ)</Text>
                {validCapsulePalettes.length > 0 ? (
                    <View style={styles.capsuleGrid}>
                        {validCapsulePalettes.map((palette) => (
                            <CapsulePalette
                                key={palette.id}
                                colors={palette.colors}
                                isSelected={palette.id === selectedCapsuleId}
                                onSelect={() => setSelectedCapsuleId(palette.id)}
                            />
                        ))}
                    </View>
                ) : (
                    <Text style={styles.noDataText}>Không tìm thấy Capsule Palette hợp lệ nào (phải có 4 màu).</Text>
                )}
            </View>

            <View style={{ height: 50 }} />

        </ScrollView>
    );
};

export default ManualTestResultDetailScreen;

// 5. Stylesheets
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        padding: 15,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorText: {
        color: 'red',
        marginTop: 10,
        textAlign: 'center',
    },
    noDataText: {
        color: '#666',
        textAlign: 'center',
        padding: 10,
        backgroundColor: '#eee',
        borderRadius: 5,
        marginTop: 10,
    },

    // Header
    header: {
        alignItems: 'center',
        marginBottom: 20,
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
    },
    colorTypeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 10,
        paddingHorizontal: 15,
        paddingVertical: 5,
        backgroundColor: '#e6f0ff', // Light blue background
        borderRadius: 20,
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
            android: { elevation: 2 },
        }),
    },
    colorTypeText: {
        fontSize: 16,
        color: '#4285F4',
        fontWeight: '500',
    },
    colorTypeLarge: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1a73e8', // Stronger blue
    },

    // General Sections
    divider: {
        height: 1,
        backgroundColor: '#eee',
        marginVertical: 15,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#555',
        marginBottom: 10,
    },
    infoSection: {
        marginBottom: 15,
    },
    userInfoText: {
        fontSize: 14,
        color: '#666',
        lineHeight: 22,
    },

    // Image
    imageContainer: {
        alignItems: 'center',
        marginBottom: 15,
    },
    picture: {
        width: width - 30,
        height: 300,
        borderRadius: 10,
        backgroundColor: '#ccc',
    },

    // Colors
    colorSection: {
        marginBottom: 15,
    },
    colorContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10, // Khoảng cách giữa các box
    },
    colorBox: {
        width: 60,
        height: 60,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ddd',
        justifyContent: 'flex-end',
        alignItems: 'center',
        paddingBottom: 2,
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
            android: { elevation: 2 },
        }),
    },
    colorHexText: {
        fontSize: 10,
        color: '#fff',
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },

    // Capsules
    capsuleSection: {
        marginBottom: 20,
    },
    capsuleGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
});
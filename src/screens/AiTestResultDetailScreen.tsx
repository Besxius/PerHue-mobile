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
    Platform,
    TouchableOpacity,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { getAiTestResultById } from '../api/userApi';
import { AiTestResponse } from '../types/dataModels';

type AiTestDetailScreenProps = NativeStackScreenProps<
    RootStackParamList,
    'AiTestResultDetailScreen'
>;

// Lấy kích thước màn hình
const { width } = Dimensions.get('window');
const BLUE_COLOR = '#4C7BE2';


// =========================================================
// 1. Component Hỗ trợ: Hiển thị Palettes Màu
// =========================================================

// Component để hiển thị ô vuông màu từ MẢNG mã màu
const ColorBoxDisplay: React.FC<{ colorsArray: string[], title: string }> = ({ colorsArray, title }) => {
    // Lọc các chuỗi rỗng và null
    const colorCodes = colorsArray ? colorsArray.filter(c => c && c.length > 0) : [];

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


// =========================================================
// 2. Component Chính
// =========================================================
const AiTestResultDetailScreen: FC<AiTestDetailScreenProps> = ({ route }) => {
    // Lấy ID từ tham số điều hướng
    const id = route.params.id;

    // --- State quản lý dữ liệu và trạng thái tải ---
    const [resultData, setResultData] = useState<AiTestResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // --- Hàm tải dữ liệu chi tiết ---
    const fetchResult = useCallback(async () => {
        if (!id) {
            setError('Missing test ID.');
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);
        try {
            // Gọi API
            const data = await getAiTestResultById(id);
            setResultData(data);
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


    // --- Render Content ---

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
                <Text style={styles.errorText}>Test ID: {id}</Text>
                <TouchableOpacity onPress={fetchResult} style={styles.retryButton}>
                    <Text style={styles.retryButtonText}>Thử lại</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // Dữ liệu đã tải thành công
    const result = resultData.result;
    const colorType = result.colorType || 'Undetermined';
    const imageUrl = resultData.imageUrl;

    return (
        // Sử dụng View làm container chính và áp dụng padding top nếu cần cho iOS
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollViewContent}>

                {/* 1. Tiêu đề và ColorType */}
                <View style={styles.header}>
                    <Text style={styles.title}>AI Test Result #{resultData.testRequestId}</Text>
                    <Text style={styles.userInfoText}>Send date: {new Date(resultData.createdDate).toLocaleDateString()}</Text>
                    <View style={styles.colorTypeBadge}>
                        <Text style={styles.colorTypeText}>Color Type: </Text>
                        <Text style={styles.colorTypeLarge}>{colorType}</Text>
                    </View>
                </View>

                <View style={styles.divider} />

                {/* 2. Hình ảnh (Nếu có) */}
                {imageUrl ? (
                    <View style={styles.imageContainer}>
                        <Text style={styles.sectionTitle}>Image Used for Analysis</Text>
                        <Image
                            source={{ uri: imageUrl }}
                            style={styles.picture}
                            resizeMode="contain"
                        />
                    </View>
                ) : (
                    <Text style={styles.noImageText}>No image URL found for this test.</Text>
                )}

                <View style={styles.divider} />

                {/* 3. SuggestedColor và AvoidedColor */}
                <ColorBoxDisplay
                    colorsArray={result.suggestedColor}
                    title="Suggested Colors"
                />

                <ColorBoxDisplay
                    colorsArray={result.avoidedColor}
                    title="Avoided Colors"
                />

                <View style={{ height: 50 }} />

            </ScrollView>
        </View>
    );
};

export default AiTestResultDetailScreen;

// =========================================================
// 3. Stylesheets
// =========================================================
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        // Thêm padding cho iOS để tránh thanh trạng thái
        paddingTop: Platform.OS === 'ios' ? 40 : 0,
    },
    scrollViewContent: {
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
    loadingText: {
        marginTop: 10,
        color: '#666',
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
    userInfoText: {
        fontSize: 14,
        color: '#666',
        lineHeight: 22,
    },
    colorTypeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 10,
        paddingHorizontal: 15,
        paddingVertical: 5,
        backgroundColor: '#e6f0ff',
        borderRadius: 20,
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
            android: { elevation: 2 },
        }),
    },
    colorTypeText: {
        fontSize: 16,
        color: BLUE_COLOR,
        fontWeight: '500',
    },
    colorTypeLarge: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1a73e8',
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

    // Image
    imageContainer: {
        alignItems: 'center',
        marginBottom: 15,
        padding: 10,
        backgroundColor: '#fff',
        borderRadius: 10,
        elevation: 1,
    },
    picture: {
        width: width - 50,
        height: 300,
        borderRadius: 10,
        backgroundColor: '#ccc',
    },

    // Colors
    colorSection: {
        marginBottom: 15,
        padding: 15,
        backgroundColor: '#fff',
        borderRadius: 10,
        elevation: 1,
    },
    colorContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
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
    retryButton: {
        backgroundColor: BLUE_COLOR,
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderRadius: 8,
        marginTop: 20,
    },
    retryButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    // Fix lỗi: Thêm noImageText vào styles
    noImageText: {
        fontSize: 16,
        color: '#888',
        textAlign: 'center',
        padding: 10,
    },
});
import React, { FC, useState, useEffect, useCallback, useMemo } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    ActivityIndicator,
    TouchableOpacity,
    Image,
    Dimensions,
    FlatList,
    Alert,
    Modal,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, AntDesign, MaterialIcons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { ExpertTestResponse, Color, ExpertTestDetailResponse } from '../types/dataModels';
import { getExpertTestResultsById, rateExpertTest, sendReviewRequest } from '../api/userApi';
import { RootStackParamList } from '../navigation/AppNavigator';

type DetailScreenProps = NativeStackScreenProps<
    RootStackParamList,
    'ExpertTestResponseDetailScreen'
>;

const { width } = Dimensions.get('window');
const BLUE_COLOR = '#4C7BE2';
const DANGER_COLOR = '#F44336';
const SUCCESS_COLOR = '#4CAF50';
const WARNING_COLOR = '#FFC107';
const CARD_MARGIN = 15;

// --- Helper Functions ---
const getContrastTextColor = (hex: string) => {
    const r = parseInt(hex.substr(1, 2), 16);
    const g = parseInt(hex.substr(3, 2), 16);
    const b = parseInt(hex.substr(5, 2), 16);
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return (yiq >= 128) ? '#000000' : '#FFFFFF';
};

// --- Components ---

interface ColorDetailDisplayProps {
    skinColor: string;
    hairColor: string;
    eyesColor: string;
    lipsColor: string;
}

const ColorDetailDisplay: FC<ColorDetailDisplayProps> = ({ skinColor, hairColor, eyesColor, lipsColor }) => {
    const colorData = useMemo(() => ([
        { label: 'Skin Color', hex: skinColor, available: !!skinColor },
        { label: 'Hair Color', hex: hairColor, available: !!hairColor },
        { label: 'Eyes Color', hex: eyesColor, available: !!eyesColor },
        { label: 'Lips Color', hex: lipsColor, available: !!lipsColor },
    ].filter(data => data.available)), [skinColor, hairColor, eyesColor, lipsColor]);

    if (colorData.length === 0) return null;

    return (
        <View style={styles.colorDisplayContainer}>
            <Text style={styles.cardSectionTitle}>Client's Color Profile</Text>
            {colorData.map((data, index) => (
                <View key={index} style={styles.colorRow}>
                    <Text style={styles.colorLabel}>{data.label}:</Text>
                    <View style={styles.colorBoxWrapper}>
                        <View style={[styles.colorChip, { backgroundColor: data.hex }]} />
                        <Text style={styles.colorHex}>{data.hex}</Text>
                    </View>
                </View>
            ))}
        </View>
    );
};

interface ColorSwatchDisplayProps {
    colors: Color[];
    title: string;
    colorType: 'best' | 'worst';
}

const ColorSwatchDisplay: FC<ColorSwatchDisplayProps> = ({ colors, title, colorType }) => {
    if (colors.length === 0) return null;

    return (
        <View style={styles.swatchSection}>
            <Text style={styles.swatchTitle}>{title}</Text>
            <View style={styles.swatchGrid}>
                {colors.map((color, index) => (
                    <View key={index} style={[styles.colorSquareBox, { backgroundColor: color.hexCode }]}>
                        <Text style={[styles.colorSquareText, { color: getContrastTextColor(color.hexCode) }]}>
                            {color.hexCode}
                        </Text>
                    </View>
                ))}
            </View>
        </View>
    );
};

interface InteractiveStarRatingProps {
    rating: number | null;
    onRate: (score: number) => void;
    disabled?: boolean;
}

const InteractiveStarRating: FC<InteractiveStarRatingProps> = ({ rating, onRate, disabled }) => {
    const currentRating = rating || 0;
    const stars = [1, 2, 3, 4, 5];

    return (
        <View style={styles.starContainer}>
            {stars.map((star) => (
                <TouchableOpacity
                    key={star}
                    onPress={() => !disabled && onRate(star)}
                    disabled={disabled}
                    style={styles.starButton}
                >
                    <Ionicons
                        name={star <= currentRating ? "star" : "star-outline"}
                        size={32}
                        color="#FFC300"
                    />
                </TouchableOpacity>
            ))}
        </View>
    );
};

// [CẬP NHẬT] Similarity Score Card với nút Request Review
interface SimilarityScoreCardProps {
    score: number;
    onRequestReview: () => void;
    isRequesting: boolean;
    isReviewRequested: boolean; // Trạng thái đã gửi yêu cầu hay chưa (có thể check từ API nếu có field)
}

const SimilarityScoreCard: FC<SimilarityScoreCardProps> = ({ score, onRequestReview, isRequesting, isReviewRequested }) => {
    const percentage = Math.min(Math.max(score, 0), 100);

    let reliabilityLevel = 'Low';
    let progressColor = DANGER_COLOR;
    let showRecommendation = true;

    if (percentage > 85) {
        reliabilityLevel = 'High';
        progressColor = SUCCESS_COLOR;
        showRecommendation = false;
    } else if (percentage >= 70) {
        reliabilityLevel = 'Medium';
        progressColor = WARNING_COLOR;
        showRecommendation = false;
    }

    return (
        <View style={styles.scoreCard}>
            <View style={styles.scoreHeader}>
                <MaterialIcons name="analytics" size={24} color={BLUE_COLOR} />
                <Text style={styles.scoreTitle}>Expert Consensus</Text>
            </View>

            <View style={styles.scoreContent}>
                <Text style={styles.scoreValue}>{percentage.toFixed(1)}%</Text>
                <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.scoreDescription}>Reliability Level</Text>
                    <Text style={[styles.reliabilityText, { color: progressColor }]}>{reliabilityLevel}</Text>
                </View>
            </View>

            <View style={styles.progressBarContainer}>
                <View style={[styles.progressBarFill, { width: `${percentage}%`, backgroundColor: progressColor }]} />
            </View>

            {/* Hiển thị recommend nếu reliability thấp */}
            {showRecommendation && (
                <View style={styles.recommendationContainer}>
                    <View style={styles.recommendationHeader}>
                        <Ionicons name="alert-circle-outline" size={20} color={DANGER_COLOR} />
                        <Text style={styles.recommendationTitle}>Recommendation</Text>
                    </View>
                    <Text style={styles.recommendationText}>
                        The consensus score is low, indicating varied opinions among experts. You can request a re-evaluation for better accuracy.
                    </Text>

                    {!isReviewRequested ? (
                        <TouchableOpacity
                            style={styles.requestReviewButton}
                            onPress={onRequestReview}
                            disabled={isRequesting}
                        >
                            {isRequesting ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <Text style={styles.requestReviewButtonText}>Request Review</Text>
                            )}
                        </TouchableOpacity>
                    ) : (
                        <View style={styles.reviewSentContainer}>
                            <Ionicons name="checkmark-circle" size={18} color={SUCCESS_COLOR} />
                            <Text style={styles.reviewSentText}>Review Requested</Text>
                        </View>
                    )}
                </View>
            )}
        </View>
    );
};

// [MỚI] Modal thông báo thành công
const SuccessModal: FC<{ visible: boolean; onClose: () => void }> = ({ visible, onClose }) => (
    <Modal
        animationType="fade"
        transparent={true}
        visible={visible}
        onRequestClose={onClose}
    >
        <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
                <View style={styles.modalIconContainer}>
                    <Ionicons name="checkmark-circle" size={50} color={SUCCESS_COLOR} />
                </View>
                <Text style={styles.modalTitle}>Success!</Text>
                <Text style={styles.modalMessage}>
                    Your review request has been sent. We will forward your request to another expert for review. Please wait 2-3 days for the result.
                </Text>
                <TouchableOpacity style={styles.modalButton} onPress={onClose}>
                    <Text style={styles.modalButtonText}>OK</Text>
                </TouchableOpacity>
            </View>
        </View>
    </Modal>
);

// --- Màn Hình Chi Tiết Phản Hồi ---

const ExpertTestResponseDetailScreen: React.FC<DetailScreenProps> = ({ route, navigation }) => {
    const insets = useSafeAreaInsets();
    const testRequestId = route.params.id;

    const [data, setData] = useState<ExpertTestDetailResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [ratingLoadingMap, setRatingLoadingMap] = useState<Record<number, boolean>>({});

    // State cho tính năng Review
    const [isRequestingReview, setIsRequestingReview] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    // Giả lập trạng thái đã gửi (trong thực tế nên lấy từ API nếu có field status)
    const [isReviewRequested, setIsReviewRequested] = useState(false);

    const hexStringToColorList = useCallback((hexString: string): Color[] => {
        if (!hexString) return [];
        const hexCodes = hexString.split(',').map(h => h.trim());

        return hexCodes.map((hex, index) => ({
            id: index + 1,
            name: hex.toUpperCase(),
            hexCode: hex,
        }));
    }, []);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await getExpertTestResultsById(testRequestId);
            setData(result);
            data?.isSentReview ? setIsReviewRequested(true) : setIsReviewRequested(false);
            // Kiểm tra trạng thái nếu cần (ví dụ: result.testRequest.status === 'ReviewRequested')
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
            setError(`Failed to load details: ${errorMessage}`);
            Toast.show({ type: 'error', text1: 'Loading Error', text2: errorMessage });
        } finally {
            setIsLoading(false);
        }
    }, [testRequestId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleRating = async (responseId: number, score: number) => {
        setRatingLoadingMap(prev => ({ ...prev, [responseId]: true }));

        try {
            await rateExpertTest(responseId, score);

            if (data) {
                const updatedResponses = data.responses.map(res =>
                    res.id === responseId ? { ...res, rating: score } : res
                );
                setData({ ...data, responses: updatedResponses });
            }

            Toast.show({
                type: 'success',
                text1: 'Rated Successfully',
                text2: `You rated this response ${score} stars!`,
            });

        } catch (err: any) {
            Toast.show({
                type: 'error',
                text1: 'Rating Failed',
                text2: err.message || 'Could not submit rating.',
            });
        } finally {
            setRatingLoadingMap(prev => ({ ...prev, [responseId]: false }));
        }
    };

    const handleSendReview = async () => {
        setIsRequestingReview(true);
        try {
            await sendReviewRequest(testRequestId);
            setIsReviewRequested(true);
            setShowSuccessModal(true);
        } catch (err: any) {
            Alert.alert("Request Failed", err.message || "Could not send review request.");
        } finally {
            setIsRequestingReview(false);
        }
    };

    if (isLoading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color={BLUE_COLOR} />
                <Text style={styles.loadingText}>Loading expert test details...</Text>
            </View>
        );
    }

    if (error || !data || !data.testRequest) {
        return (
            <View style={[styles.centered, styles.errorBox]}>
                <Text style={styles.errorText}>{error || 'Test request data is missing.'}</Text>
                <TouchableOpacity onPress={fetchData} style={styles.retryButton}>
                    <Text style={styles.retryButtonText}>Try Again</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const { testRequest, responses, responsesSimilarityScore } = data;
    const clientPictureUri = testRequest.pictures?.[0]?.source;

    const renderResponseItem = ({ item, index }: { item: ExpertTestResponse, index: number }) => {
        const bestColors = hexStringToColorList(item.bestColor || '');
        const worstColors = hexStringToColorList(item.worstColor || '');
        const isRating = ratingLoadingMap[item.id] || false;

        let cardBackgroundColor = '#fff';
        let typeLabel = 'Normal Response';
        let typeColor = BLUE_COLOR;

        if (item.type === 'AI') {
            cardBackgroundColor = '#E8F5E9';
            typeLabel = 'AI Response';
            typeColor = '#2E7D32';
        } else if (item.type === 'Review') {
            cardBackgroundColor = '#FFF9C4';
            typeLabel = 'Review Response';
            typeColor = '#F57F17';
        }

        return (
            <View style={[styles.responseCard, { backgroundColor: cardBackgroundColor }]}>
                <View style={styles.responseHeaderRow}>
                    <View>
                        <Text style={styles.responseTitle}>
                            <Ionicons name="ribbon-outline" size={20} color={typeColor} /> Response #{index + 1}
                        </Text>
                        <Text style={{ fontSize: 12, color: typeColor, fontWeight: 'bold', marginLeft: 24, marginTop: 2 }}>
                            {typeLabel}
                        </Text>
                    </View>
                    <Text style={styles.dateText}>
                        {new Date(item.createdDate).toLocaleDateString()}
                    </Text>
                </View>

                <View style={styles.resultSummary}>
                    <View style={styles.resultChip}>
                        <Text style={styles.resultChipText}>Color Type: </Text>
                        <Text style={[styles.resultChipText, styles.colorTypeResult]}>
                            {item.colorTypeName || 'N/A'}
                        </Text>
                    </View>
                </View>

                <View style={styles.noteContainer}>
                    <Text style={styles.noteLabel}>Expert Note:</Text>
                    <Text style={styles.noteText}>{item.note || 'No note provided.'}</Text>
                </View>

                <View style={styles.colorResultsContainer}>
                    <ColorSwatchDisplay
                        colors={bestColors}
                        title="BEST COLORS"
                        colorType="best"
                    />
                    <ColorSwatchDisplay
                        colors={worstColors}
                        title="WORST COLORS"
                        colorType="worst"
                    />
                </View>

                {item.type !== 'AI' && (
                    <View style={styles.ratingSection}>
                        <Text style={styles.ratingTitle}>Rate this analysis:</Text>
                        {isRating ? (
                            <ActivityIndicator size="small" color="#FFC300" style={{ marginVertical: 10 }} />
                        ) : (
                            <InteractiveStarRating
                                rating={item.rating}
                                onRate={(score) => handleRating(item.id, score)}
                            />
                        )}
                    </View>
                )}
            </View>
        );
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={28} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle} numberOfLines={1}>Request Detail #{testRequest.id}</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollViewContent} showsVerticalScrollIndicator={false}>

                {/* --- 1. Client Request Details --- */}
                <View style={styles.clientInfoCard}>
                    <Text style={styles.sectionHeader}>Client Request</Text>

                    {clientPictureUri && (
                        <View style={styles.clientImageContainer}>
                            <Image
                                source={{ uri: clientPictureUri }}
                                style={styles.clientImage}
                                resizeMode="contain"
                            />
                        </View>
                    )}

                    <ColorDetailDisplay
                        skinColor={testRequest.skinColor}
                        hairColor={testRequest.hairColor}
                        eyesColor={testRequest.eyesColor}
                        lipsColor={testRequest.lipsColor}
                    />
                    <Text style={styles.dateTimeText}>
                        Request Date: {new Date(testRequest.createdDate).toLocaleString()}
                    </Text>
                    <Text style={styles.statusText}>
                        Status: <Text style={styles.statusChip}>{testRequest.status || 'N/A'}</Text>
                    </Text>
                </View>

                {/* --- 2. Similarity Score & Recommendation --- */}
                {responsesSimilarityScore !== null && responsesSimilarityScore !== undefined && responses.length > 1 && (
                    <SimilarityScoreCard
                        score={responsesSimilarityScore}
                        onRequestReview={handleSendReview}
                        isRequesting={isRequestingReview}
                        isReviewRequested={isReviewRequested}
                    />
                )}

                {/* --- 3. Expert Responses History --- */}
                <Text style={styles.sectionHeader}>Expert Responses ({responses.length})</Text>

                {responses.length > 0 ? (
                    <FlatList
                        data={responses}
                        renderItem={renderResponseItem}
                        keyExtractor={(item) => item.id.toString()}
                        scrollEnabled={false}
                        ItemSeparatorComponent={() => <View style={styles.separator} />}
                    />
                ) : (
                    <View style={styles.emptyResponseContainer}>
                        <AntDesign name="inbox" size={40} color="#999" />
                        <Text style={styles.emptyResponseText}>No expert responses yet.</Text>
                    </View>
                )}
                <View style={{ height: insets.bottom + 20 }} />
            </ScrollView>

            <SuccessModal
                visible={showSuccessModal}
                onClose={() => setShowSuccessModal(false)}
            />
        </View>
    );
};

// --- Styles ---

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: CARD_MARGIN,
        paddingVertical: 10,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    backButton: {
        padding: 5,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        flex: 1,
        textAlign: 'center',
    },
    scrollViewContent: {
        padding: CARD_MARGIN,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    loadingText: {
        marginTop: 10,
        color: '#666',
    },
    errorBox: {
        padding: 20,
    },
    errorText: {
        color: DANGER_COLOR,
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 15,
    },
    retryButton: {
        backgroundColor: BLUE_COLOR,
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderRadius: 8,
    },
    retryButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    sectionHeader: {
        fontSize: 18,
        fontWeight: 'bold',
        color: BLUE_COLOR,
        marginBottom: 10,
        marginTop: 5,
    },
    // Client Info Card Styles
    clientInfoCard: {
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 10,
        marginBottom: 20,
        borderLeftWidth: 5,
        borderLeftColor: BLUE_COLOR,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    clientImageContainer: {
        width: '100%',
        height: 500,
        borderRadius: 8,
        marginBottom: 10,
        backgroundColor: '#eee',
        overflow: 'hidden',
    },
    clientImage: {
        width: '100%',
        height: '100%',
        borderRadius: 8,
    },
    cardSectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#555',
        marginBottom: 8,
        paddingTop: 5,
    },
    colorDisplayContainer: {
        marginTop: 10,
        marginBottom: 15,
        borderTopWidth: 1,
        borderTopColor: '#eee',
        paddingTop: 10,
    },
    colorRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 5,
        borderBottomWidth: 1,
        borderBottomColor: '#f8f8f8',
    },
    colorLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#555',
        flex: 1,
    },
    colorBoxWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    colorChip: {
        width: 25,
        height: 25,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: '#ddd',
        marginRight: 10,
    },
    colorHex: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
    },
    statusText: {
        fontSize: 14,
        fontWeight: '600',
        marginTop: 5,
        textAlign: 'right',
    },
    statusChip: {
        // backgroundColor: '#FFEB3B',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        fontWeight: 'bold',
        color: SUCCESS_COLOR,
    },
    // Response Card Styles
    responseCard: {
        padding: 15,
        borderRadius: 15,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
    },
    responseHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
        paddingBottom: 8,
    },
    responseTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    dateText: {
        fontSize: 12,
        color: '#999',
    },
    resultSummary: {
        flexDirection: 'row',
        marginBottom: 10,
    },
    resultChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.6)',
        borderRadius: 5,
        paddingHorizontal: 10,
        paddingVertical: 5,
    },
    resultChipText: {
        fontSize: 14,
        color: '#333',
        fontWeight: '500',
    },
    colorTypeResult: {
        fontWeight: 'bold',
        color: BLUE_COLOR,
        marginLeft: 5,
    },
    noteContainer: {
        backgroundColor: 'rgba(255,255,255,0.5)',
        padding: 10,
        borderRadius: 8,
        marginBottom: 15,
        borderLeftWidth: 3,
        borderLeftColor: '#ccc',
    },
    noteLabel: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#555',
        marginBottom: 4,
    },
    noteText: {
        fontSize: 14,
        color: '#333',
        lineHeight: 20,
        fontStyle: 'italic',
    },
    colorResultsContainer: {
        flexDirection: 'column',
        gap: 15,
        marginBottom: 15,
    },
    swatchSection: {
        marginBottom: 5,
    },
    swatchTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 8,
        color: '#555',
        textTransform: 'uppercase',
    },
    swatchGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    colorSquareBox: {
        width: 60,
        height: 60,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.1)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 1,
        elevation: 1,
    },
    colorSquareText: {
        fontSize: 10,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    ratingSection: {
        alignItems: 'center',
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.05)',
    },
    ratingTitle: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8,
        fontWeight: '600',
    },
    starContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 5,
    },
    starButton: {
        padding: 2,
    },
    separator: {
        height: 10,
    },
    emptyResponseContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 30,
        backgroundColor: '#fff',
        borderRadius: 10,
    },
    emptyResponseText: {
        color: '#999',
        marginTop: 10,
        fontSize: 16,
    },
    dateTimeText: {
        fontSize: 12,
        color: '#888',
        marginTop: 8,
        textAlign: 'right',
    },
    // --- Score Card Styles ---
    scoreCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 15,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
        borderTopWidth: 4,
        borderTopColor: '#FFC107',
    },
    scoreHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    scoreTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginLeft: 8,
    },
    scoreContent: {
        flexDirection: 'row',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    scoreValue: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
    },
    scoreDescription: {
        fontSize: 12,
        color: '#666',
        fontStyle: 'italic',
    },
    reliabilityText: {
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'right',
    },
    progressBarContainer: {
        height: 8,
        backgroundColor: '#eee',
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 4,
    },
    // --- Recommendation Section ---
    recommendationContainer: {
        marginTop: 15,
        paddingTop: 15,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    recommendationHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    recommendationTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: DANGER_COLOR,
        marginLeft: 5,
    },
    recommendationText: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
        marginBottom: 12,
    },
    requestReviewButton: {
        backgroundColor: BLUE_COLOR,
        paddingVertical: 10,
        borderRadius: 8,
        alignItems: 'center',
    },
    requestReviewButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    },
    reviewSentContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#E8F5E9',
        paddingVertical: 8,
        borderRadius: 8,
    },
    reviewSentText: {
        color: SUCCESS_COLOR,
        fontWeight: 'bold',
        marginLeft: 5,
    },
    // --- Modal Styles ---
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContainer: {
        width: '80%',
        backgroundColor: '#fff',
        borderRadius: 15,
        padding: 25,
        alignItems: 'center',
        elevation: 5,
    },
    modalIconContainer: {
        marginBottom: 15,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
    },
    modalMessage: {
        fontSize: 15,
        color: '#666',
        textAlign: 'center',
        marginBottom: 25,
        lineHeight: 22,
    },
    modalButton: {
        backgroundColor: BLUE_COLOR,
        paddingVertical: 10,
        paddingHorizontal: 30,
        borderRadius: 25,
        width: '100%',
        alignItems: 'center',
    },
    modalButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default ExpertTestResponseDetailScreen;
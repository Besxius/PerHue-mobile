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
    Alert,
    TextInput,
    Modal,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { RootStackParamList } from '../navigation/AppNavigator';
import {
    ReviewTestRequest,
    Color,
    VoteForReviewRequest
} from '../types/dataModels';
import { getReviewRequestById, sendVoteForReview } from '../api/expertApi';
import CustomConfirmModal, { AlertConfig } from '../components/CustomConfirmModal';

type Props = NativeStackScreenProps<RootStackParamList, 'ExpertReviewDetailScreen'>;

const { width } = Dimensions.get('window');
const BLUE_COLOR = '#4C7BE2';
const SUCCESS_COLOR = '#4CAF50';
const WARNING_COLOR = '#FFC107';
const DANGER_COLOR = '#F44336';

// --- Helper Functions ---
const getContrastTextColor = (hex: string) => {
    const cleanHex = hex.replace('#', '');
    if (cleanHex.length !== 6) return '#FFFFFF';
    const r = parseInt(cleanHex.substr(0, 2), 16);
    const g = parseInt(cleanHex.substr(2, 2), 16);
    const b = parseInt(cleanHex.substr(4, 2), 16);
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return (yiq >= 128) ? '#000000' : '#FFFFFF';
};

const hexStringToColorList = (hexString: string): Color[] => {
    if (!hexString) return [];
    const hexCodes = hexString.split(',').map(h => h.trim());
    return hexCodes.map((hex, index) => ({
        id: index + 1,
        name: hex.toUpperCase(),
        hexCode: hex,
    }));
};

// --- Reusable Components ---

const ColorDetailDisplay: FC<{ skinColor: string; hairColor: string; eyesColor: string; lipsColor: string }> = ({
    skinColor, hairColor, eyesColor, lipsColor
}) => {
    const colorData = [
        { label: 'Skin Color', hex: skinColor },
        { label: 'Hair Color', hex: hairColor },
        { label: 'Eyes Color', hex: eyesColor },
        { label: 'Lips Color', hex: lipsColor },
    ].filter(d => !!d.hex);

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

const ColorSwatchDisplay: FC<{ colors: Color[]; title: string; colorType?: string }> = ({ colors, title, colorType }) => {
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

// --- Main Screen ---

const ExpertReviewDetailScreen: React.FC<Props> = ({ route, navigation }) => {
    const insets = useSafeAreaInsets();
    const testRequestId = route.params.id;

    const [data, setData] = useState<ReviewTestRequest | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Vote Logic State
    const [selectedResponseId, setSelectedResponseId] = useState<number | null>(null);
    const [voteNote, setVoteNote] = useState('');
    const [isConfirmModalVisible, setIsConfirmModalVisible] = useState(false);
    const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [modalConfig, setModalConfig] = useState<AlertConfig>({
        visible: false,
        title: '',
        message: '',
        type: 'info',
        onConfirm: () => { },
        onCancel: () => { }
    });

    const showAlert = (config: Partial<AlertConfig>) => {
        setModalConfig({
            visible: true,
            title: config.title || '',
            message: config.message || '',
            type: config.type || 'info',
            confirmText: config.confirmText,
            cancelText: config.cancelText,
            onConfirm: config.onConfirm || (() => setModalConfig(prev => ({ ...prev, visible: false }))),
            onCancel: config.onCancel || (() => setModalConfig(prev => ({ ...prev, visible: false }))),
        });
    };

    const hideAlert = () => {
        setModalConfig(prev => ({ ...prev, visible: false }));
    };

    const fetchReviewData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await getReviewRequestById(testRequestId);
            setData(result);
        } catch (err: any) {
            setError(err.message || 'Failed to load review request.');
        } finally {
            setIsLoading(false);
        }
    }, [testRequestId]);

    useEffect(() => {
        fetchReviewData();
    }, [fetchReviewData]);

    const hasVoted = data?.votedResponseId != null;
    const hasUnsavedChanges = !hasVoted && (selectedResponseId !== null || voteNote.trim().length > 0);

    useEffect(() => {
        const unsubscribe = navigation.addListener('beforeRemove', (e) => {
            if (isSuccessModalVisible) {
                e.preventDefault();
                return;
            }

            const actionType = e.data.action.type;

            if (actionType !== 'GO_BACK' && actionType !== 'POP') {
                return;
            }

            e.preventDefault();

            const navigateToHistoryPending = () => {
                navigation.navigate('Tabs', {
                    screen: 'History',
                    params: {
                        initialTab: 'Review Request',
                        initialStatus: 'Pending'
                    }
                });
            };

            if (hasUnsavedChanges) {
                showAlert({
                    type: 'warning',
                    title: 'Discard Changes?',
                    message: 'You have unsaved changes. Are you sure you want to discard them and leave?',
                    confirmText: 'Discard',
                    cancelText: 'Keep Editing',
                    onConfirm: () => {
                        hideAlert();
                        navigation.dispatch(e.data.action);
                        navigateToHistoryPending();
                    },
                    onCancel: hideAlert
                });
            } else {
                navigateToHistoryPending();
            }
        });

        return unsubscribe;
    }, [navigation, hasUnsavedChanges, modalConfig]);

    const handleVotePress = (responseId: number) => {
        if (selectedResponseId === responseId) {
            setSelectedResponseId(null);
            setVoteNote('');
        } else {
            setSelectedResponseId(responseId);
            setVoteNote('');
        }
    };

    const handlePreSubmit = () => {
        if (!selectedResponseId) return;
        if (!voteNote.trim()) {
            showAlert({
                type: 'error',
                title: 'Required',
                message: 'Please enter a note for your vote.',
                confirmText: 'OK'
            });
            return;
        }

        showAlert({
            type: 'warning',
            title: 'Confirm Submission',
            message: 'Your review is very important. This review cannot be edited once sent. If you are sure, please click send to submit to the user.',
            confirmText: 'Send',
            cancelText: 'Cancel',
            onConfirm: () => {
                hideAlert();
                handleConfirmSubmit();
            },
            onCancel: hideAlert
        });
    };

    const handleAnalyzeImage = () => {
        const clientPictureUri = data?.testRequest.pictures?.[0]?.source;
        if (clientPictureUri) {
            navigation.navigate('ColorTestOnImageScreen' as any, {
                imageUri: clientPictureUri,
                testRequestId: testRequestId,
                fromScreen: 'ExpertReviewDetailScreen'
            });
        } else {
            showAlert({
                type: 'error',
                title: 'Error',
                message: 'Image not found.',
                confirmText: 'Close'
            });
        }
    };

    const handleConfirmSubmit = async () => {
        setIsConfirmModalVisible(false);
        if (!selectedResponseId || !data) return;

        setIsSubmitting(true);
        const payload: VoteForReviewRequest = {
            testRequestId: data.testRequest.id,
            votedResponseId: selectedResponseId,
            note: voteNote.trim()
        };

        try {
            await sendVoteForReview(payload);
            showAlert({
                type: 'success',
                title: 'Sent Successfully!',
                message: 'Thank you for your expert review. The result has been finalized.',
                confirmText: 'Close',
                onConfirm: handleSuccessClose
            });
            fetchReviewData();
        } catch (err: any) {
            showAlert({
                type: 'error',
                title: 'Submission Failed',
                message: err.message || "Could not submit vote.",
                confirmText: 'OK'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSuccessClose = () => {
        hideAlert();
        navigation.navigate('Tabs', {
            screen: 'History',
            params: {
                initialTab: 'Review Request',
                initialStatus: 'Completed'
            }
        });
    };

    const displayResponses = useMemo(() => {
        if (!data?.previousResponses) return [];

        if (data.votedResponseId != null) {
            return data.previousResponses.filter(res => res.type !== 'Review');
        }

        return data.previousResponses;
    }, [data]);

    if (isLoading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color={BLUE_COLOR} />
                <Text style={styles.loadingText}>Loading review details...</Text>
            </View>
        );
    }

    if (error || !data) {
        return (
            <View style={styles.centered}>
                <Text style={styles.errorText}>{error || 'No data found'}</Text>
                <TouchableOpacity onPress={fetchReviewData} style={styles.retryButton}>
                    <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const { testRequest, votedResponseId, canEdit } = data;
    const clientPictureUri = testRequest.pictures?.[0]?.source;

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={28} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Review Request #{testRequest.id}</Text>
                <View style={{ width: 40 }} />
            </View>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 120 : 120}
            >

                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >

                    {/* 1. Client Info Section */}
                    <View style={styles.clientInfoCard}>
                        <Text style={styles.sectionHeader}>Client Profile</Text>
                        {clientPictureUri && (
                            <View style={styles.clientImageContainer}>
                                <Image source={{ uri: clientPictureUri }} style={styles.clientImage} resizeMode="contain" />

                                <TouchableOpacity
                                    style={styles.analyzeButton}
                                    onPress={handleAnalyzeImage}
                                    activeOpacity={0.8}
                                >
                                    <Ionicons name="camera" size={24} color="#fff" />
                                </TouchableOpacity>
                            </View>
                        )}
                        <ColorDetailDisplay
                            skinColor={testRequest.skinColor}
                            hairColor={testRequest.hairColor}
                            eyesColor={testRequest.eyesColor}
                            lipsColor={testRequest.lipsColor}
                        />
                    </View>

                    {/* 2. Responses List */}
                    <Text style={styles.sectionTitle}>Previous Expert Opinions</Text>

                    {displayResponses.map((response, index) => {
                        const isSelected = selectedResponseId === response.id;
                        const bestColors = hexStringToColorList(response.bestColor || '');
                        const worstColors = hexStringToColorList(response.worstColor || '');

                        const isVotedItem = hasVoted && response.id === votedResponseId;

                        return (
                            <View
                                key={response.id}
                                style={[
                                    styles.responseCard,
                                    isSelected && styles.responseCardSelected,
                                    isVotedItem && styles.responseCardVoted
                                ]}
                            >
                                {isVotedItem && (
                                    <View style={styles.votedTagContainer}>
                                        <Ionicons name="checkmark-circle" size={18} color="#B45309" />
                                        <Text style={styles.votedTagText}>You has voted to this result</Text>
                                    </View>
                                )}

                                <View style={styles.responseHeader}>
                                    <Text style={styles.expertName}>Expert Response #{index + 1}</Text>
                                    <Text style={styles.responseDate}>{new Date(response.createdDate).toLocaleDateString()}</Text>
                                </View>

                                <View style={styles.resultSummary}>
                                    <View style={styles.resultChip}>
                                        <Text style={styles.resultLabel}>Type:</Text>
                                        <Text style={styles.resultValue}>{response.colorTypeName || 'N/A'}</Text>
                                    </View>
                                </View>

                                <Text style={styles.noteText}>"{response.note}"</Text>

                                <View style={styles.swatchesContainer}>
                                    <ColorSwatchDisplay colors={bestColors} title="Suggested Colors" colorType="best" />
                                    <ColorSwatchDisplay colors={worstColors} title="Avoided Colors" colorType="worst" />
                                </View>

                                {!hasVoted && canEdit && (
                                    <TouchableOpacity
                                        style={[styles.voteButton, isSelected ? styles.voteButtonActive : styles.voteButtonInactive]}
                                        onPress={() => handleVotePress(response.id)}
                                        disabled={isSubmitting}
                                    >
                                        <FontAwesome5
                                            name={isSelected ? "check-circle" : "vote-yea"}
                                            size={18}
                                            color={isSelected ? "#fff" : BLUE_COLOR}
                                        />
                                        <Text style={[styles.voteButtonText, isSelected && { color: '#fff' }]}>
                                            {isSelected ? 'Voting for this option' : 'Vote for this option'}
                                        </Text>
                                    </TouchableOpacity>
                                )}

                                {isSelected && !hasVoted && (
                                    <View style={styles.voteFormContainer}>
                                        <Text style={styles.inputLabel}>Why do you agree with this result?</Text>
                                        <TextInput
                                            style={styles.voteInput}
                                            placeholder="Add your expert opinion/reasoning here..."
                                            multiline
                                            numberOfLines={4}
                                            value={voteNote}
                                            onChangeText={setVoteNote}
                                            textAlignVertical="top"
                                        />

                                        <TouchableOpacity
                                            style={styles.submitButton}
                                            onPress={handlePreSubmit}
                                            disabled={isSubmitting}
                                        >
                                            {isSubmitting ? (
                                                <ActivityIndicator color="#fff" size="small" />
                                            ) : (
                                                <Text style={styles.submitButtonText}>Send Review</Text>
                                            )}
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </View>
                        );
                    })}

                    <View style={{ height: 40 }} />
                </ScrollView>
            </KeyboardAvoidingView>
            <CustomConfirmModal {...modalConfig} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f2f4f8' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 10, color: '#666' },
    errorText: { color: DANGER_COLOR, fontSize: 16, marginBottom: 15 },
    retryButton: { padding: 10, backgroundColor: BLUE_COLOR, borderRadius: 8 },
    retryButtonText: { color: '#fff', fontWeight: 'bold' },

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 15,
        paddingVertical: 10,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    backButton: { padding: 5 },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },

    scrollContent: { padding: 15 },

    clientInfoCard: {
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 12,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    sectionHeader: { fontSize: 18, fontWeight: 'bold', color: BLUE_COLOR, marginBottom: 10 },
    clientImageContainer: {
        width: '100%', height: 500, borderRadius: 8, backgroundColor: '#eee', marginBottom: 10, overflow: 'hidden'
    },
    clientImage: { width: '100%', height: '100%' },
    colorDisplayContainer: { marginTop: 5 },
    cardSectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#555', marginBottom: 8 },
    colorRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
    colorLabel: { flex: 1, fontSize: 14, color: '#666' },
    colorBoxWrapper: { flexDirection: 'row', alignItems: 'center' },
    colorChip: { width: 20, height: 20, borderRadius: 4, marginRight: 8, borderWidth: 1, borderColor: '#ddd' },
    colorHex: { fontSize: 14, fontWeight: '500', color: '#333' },

    // Responses
    sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 15 },
    responseCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 15,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
    },
    responseCardSelected: {
        borderColor: BLUE_COLOR,
        borderWidth: 2,
        backgroundColor: '#F5F9FF',
    },
    responseCardVoted: {
        backgroundColor: '#FFFBEB',
        borderColor: '#FCD34D',
        borderWidth: 2,
    },
    // [STYLE MỚI] Tag thông báo
    votedTagContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEF3C7',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        marginBottom: 15,
        gap: 8,
        borderWidth: 1,
        borderColor: '#FCD34D',
    },
    votedTagText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#B45309', // Màu chữ nâu vàng
    },
    responseHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    expertName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
    responseDate: { fontSize: 12, color: '#999' },
    resultSummary: { flexDirection: 'row', marginBottom: 10 },
    resultChip: { flexDirection: 'row', backgroundColor: '#e3f2fd', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 15 },
    resultLabel: { fontWeight: '600', color: '#555', marginRight: 5 },
    resultValue: { fontWeight: 'bold', color: BLUE_COLOR },
    noteText: { fontSize: 14, color: '#444', fontStyle: 'italic', marginBottom: 15, lineHeight: 20, backgroundColor: 'rgba(0,0,0,0.03)', padding: 10, borderRadius: 8 },
    swatchesContainer: { marginBottom: 15 },

    // Vote Button
    voteButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 8,
        borderWidth: 1,
        marginTop: 5,
    },
    voteButtonInactive: {
        borderColor: BLUE_COLOR,
        backgroundColor: '#fff',
    },
    voteButtonActive: {
        borderColor: BLUE_COLOR,
        backgroundColor: BLUE_COLOR,
    },
    voteButtonText: {
        marginLeft: 8,
        fontSize: 16,
        fontWeight: 'bold',
        color: BLUE_COLOR,
    },

    // Vote Form (Inline)
    voteFormContainer: {
        marginTop: 15,
        paddingTop: 15,
        borderTopWidth: 1,
        borderTopColor: '#dbeafe',
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    voteInput: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        padding: 12,
        fontSize: 15,
        minHeight: 100,
        marginBottom: 15,
    },
    submitButton: {
        backgroundColor: SUCCESS_COLOR,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
        shadowColor: SUCCESS_COLOR,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
        elevation: 3,
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },

    // Swatches (Reused logic styles)
    swatchSection: { marginBottom: 10 },
    swatchTitle: { fontSize: 12, fontWeight: '700', color: '#666', marginBottom: 5, textTransform: 'uppercase' },
    swatchGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    colorSquareBox: { width: 40, height: 40, borderRadius: 6, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)' },
    colorSquareText: { fontSize: 8, fontWeight: 'bold' },

    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContainer: {
        backgroundColor: '#fff',
        borderRadius: 15,
        padding: 25,
        width: '100%',
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
    },
    modalMessage: {
        fontSize: 15,
        color: '#555',
        textAlign: 'center',
        marginBottom: 25,
        lineHeight: 22,
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        gap: 15,
    },
    modalButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: '#f0f0f0',
    },
    confirmButton: {
        backgroundColor: BLUE_COLOR,
    },
    successButton: {
        backgroundColor: SUCCESS_COLOR,
        width: '100%',
        flex: 0,
    },
    cancelButtonText: {
        color: '#333',
        fontWeight: '600',
    },
    confirmButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    analyzeButton: {
        position: 'absolute',
        bottom: 15,
        right: 15,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.5)',
        zIndex: 10,
    },
});

export default ExpertReviewDetailScreen;
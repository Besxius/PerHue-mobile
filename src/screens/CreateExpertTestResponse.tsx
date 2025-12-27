import React, { FC, useState, useEffect, useCallback, useMemo } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    ActivityIndicator,
    TextInput,
    TouchableOpacity,
    Alert,
    Image,
    Dimensions,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { getRequestById, createResponse, updateExpertResponse } from '../api/expertApi';
import { ExpertRequest, CreateResponseRequest, ColorType, Color, ExpertTestResponse, UpdateResponsePayload } from '../types/dataModels';
import Toast from 'react-native-toast-message';
import { getColorType } from '../api/capsulePaletteApi';
import ColorPickerPopup from '../components/ColorPickerPopup';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getColorsByType, getCorlorListSpectrum } from '../api/colorApi';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../navigation/AppNavigator';
import CustomConfirmModal, { AlertConfig } from '../components/CustomConfirmModal';

type CreateResponseScreenProps = NativeStackScreenProps<
    RootStackParamList,
    'CreateExpertTestResponse'
>;

type ColorPickerMode = 'BEST' | 'WORST' | null;

const { width } = Dimensions.get('window');
const BLUE_COLOR = '#4C7BE2';

const areColorsEqual = (arr1: Color[], arr2: Color[]) => {
    if (arr1.length !== arr2.length) return false;
    const hex1 = arr1.map(c => c.hexCode.toUpperCase()).sort().join(',');
    const hex2 = arr2.map(c => c.hexCode.toUpperCase()).sort().join(',');
    return hex1 === hex2;
};

const getContrastTextColor = (hex: string) => {
    const cleanHex = hex.replace('#', '');
    if (cleanHex.length !== 6) return '#FFFFFF';
    const r = parseInt(cleanHex.substr(0, 2), 16);
    const g = parseInt(cleanHex.substr(2, 2), 16);
    const b = parseInt(cleanHex.substr(4, 2), 16);
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return (yiq >= 128) ? '#000000' : '#FFFFFF';
};

const useResources = () => {
    const [colorTypes, setColorTypes] = useState<ColorType[]>([]);
    const [colorFiltersSpectrum, setColorFiltersSpectrum] = useState<Color[]>([]);
    const [isLoadingResources, setIsLoadingResources] = useState(true);

    const fetchResources = useCallback(async () => {
        setIsLoadingResources(true);
        try {
            const types = await getColorType();
            setColorTypes(types);

            const spectrum = await getCorlorListSpectrum();
            setColorFiltersSpectrum(spectrum);

        } catch (error) {
            console.error("Failed to load resources:", error);
            Toast.show({ type: 'error', text1: 'Error loading resources' });
        } finally {
            setIsLoadingResources(false);
        }
    }, []);

    useEffect(() => {
        fetchResources();
    }, [fetchResources]);

    return { colorTypes, colorFiltersSpectrum, isLoadingResources };
};


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

    if (colorData.length === 0) {
        return null;
    }

    return (
        <View style={styles.colorDisplayContainer}>
            <Text style={styles.cardSectionTitle}>User's Color Profile</Text>
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

interface SelectedColorsDisplayProps {
    colors: Color[];
    onRemove: (colorId: number) => void;
    disabled?: boolean;
}

const SelectedColorsDisplay: FC<SelectedColorsDisplayProps> = ({ colors, onRemove, disabled }) => {
    if (colors.length === 0) return null;

    return (
        <View style={styles.selectedColorsContainer}>
            {colors.map((color) => {
                const textColor = getContrastTextColor(color.hexCode);
                return (
                    <View key={color.id} style={styles.colorSquareWrapper}>
                        <View style={[styles.colorSquare, { backgroundColor: color.hexCode }]}>
                            <Text style={[styles.colorSquareHexText, { color: textColor }]}>
                                {color.hexCode.toUpperCase()}
                            </Text>
                        </View>
                        {!disabled && (
                            <TouchableOpacity
                                style={styles.removeButtonSquare}
                                onPress={() => onRemove(color.id)}
                            >
                                <Text style={styles.removeButtonText}>X</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                );
            })}
        </View>
    );
};

const CreateExpertTestResponse: FC<CreateResponseScreenProps> = ({ route, navigation }) => {
    const insets = useSafeAreaInsets();

    const testRequestId = route.params.id;
    const { initialBestColors, initialWorstColors, initialColorTypeId, initialNote } = route.params;
    const { colorTypes, colorFiltersSpectrum, isLoadingResources } = useResources();

    const [clientRequest, setClientRequest] = useState<ExpertRequest | null>(null);
    const [isLoadingRequest, setIsLoadingRequest] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [responsesHistory, setResponsesHistory] = useState<ExpertTestResponse[]>([]);

    const [canEdit, setCanEdit] = useState(true);

    const [note, setNote] = useState('');
    const [bestColorsList, setBestColorsList] = useState<Color[]>([]);
    const [worstColorsList, setWorstColorsList] = useState<Color[]>([]);
    const [colorTypeId, setColorTypeId] = useState<number | null>(null);

    const [originalData, setOriginalData] = useState<{
        note: string;
        colorTypeId: number | null;
        best: Color[];
        worst: Color[];
    }>({ note: '', colorTypeId: null, best: [], worst: [] });

    const [colorFiltersByType, setColorFiltersByType] = useState<Color[]>([]);
    const [isLoadingColorFilters, setIsLoadingColorFilters] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [isColorPickerVisible, setIsColorPickerVisible] = useState(false);
    const [pickerMode, setPickerMode] = useState<ColorPickerMode>(null);
    const [initialPickerHex, setInitialPickerHex] = useState('#4C7BE2');

    const [modalConfig, setModalConfig] = useState<AlertConfig>({
        visible: false,
        title: '',
        message: '',
        type: 'info'
    });

    const hasExistingResponse = useMemo(() => responsesHistory.length > 0, [responsesHistory]);
    const clientPictureUri = useMemo(() => clientRequest?.pictures?.[0]?.source, [clientRequest]);

    const goBackToHistory = useCallback(() => {
        navigation.navigate('Tabs', {
            screen: 'History',
            params: {
                initialTab: 'Test Request',
                initialStatus: hasExistingResponse ? 'Completed' : 'Pending'
            }
        });
    }, [navigation, hasExistingResponse]);

    const hasUnsavedChanges = useMemo(() => {
        if (!canEdit) return false;

        const isNoteChanged = note.trim() !== originalData.note.trim();
        const isTypeChanged = colorTypeId !== originalData.colorTypeId;
        const isBestChanged = !areColorsEqual(bestColorsList, originalData.best);
        const isWorstChanged = !areColorsEqual(worstColorsList, originalData.worst);

        return isNoteChanged || isTypeChanged || isBestChanged || isWorstChanged;
    }, [note, colorTypeId, bestColorsList, worstColorsList, originalData, canEdit]);

    const handleHeaderBackPress = useCallback(() => {
        if (hasUnsavedChanges && !isSubmitting) {
            setModalConfig({
                visible: true,
                title: 'Discard Changes?',
                message: 'You have unsaved changes. Are you sure you want to discard them and leave?',
                type: 'warning',
                confirmText: 'Yes',
                cancelText: 'No',
                onConfirm: goBackToHistory,
                onCancel: () => setModalConfig(prev => ({ ...prev, visible: false }))
            });
        } else {
            goBackToHistory();
        }
    }, [hasUnsavedChanges, isSubmitting, goBackToHistory]);

    useEffect(() => {
        const unsubscribe = navigation.addListener('beforeRemove', (e) => {
            if (!hasUnsavedChanges || isSubmitting) {
                return;
            }

            e.preventDefault();

            setModalConfig({
                visible: true,
                title: 'Discard Changes?',
                message: 'You have unsaved changes. Are you sure you want to discard them and leave?',
                type: 'warning',
                confirmText: 'Yes',
                cancelText: 'No',
                onConfirm: goBackToHistory,
                onCancel: () => setModalConfig(prev => ({ ...prev, visible: false }))
            });
        });

        return unsubscribe;
    }, [navigation, hasUnsavedChanges, isSubmitting]);

    const updateColorStrings = useCallback((bestList: Color[], worstList: Color[]) => {
        const bestHex = bestList.map(c => c.hexCode).join(',');
        const worstHex = worstList.map(c => c.hexCode).join(',');
        return { bestHex, worstHex };
    }, []);

    const fetchColorFiltersByType = useCallback(async (typeId: number) => {
        setIsLoadingColorFilters(true);
        try {
            const colors = await getColorsByType(typeId);
            setColorFiltersByType(colors);
        } catch (error) {
            console.error(`Failed to load colors for type ${typeId}:`, error);
            setColorFiltersByType([]);
        } finally {
            setIsLoadingColorFilters(false);
        }
    }, []);

    const hexStringToColorList = useCallback((hexString: string, filterList: Color[]): Color[] => {
        if (!hexString) return [];
        const hexCodes = hexString.split(',').map(h => h.trim().toUpperCase());

        return hexCodes.map((hex, index) => {
            const matchedColor = filterList.find(f => f.hexCode.toUpperCase() === hex);
            return matchedColor || {
                id: Date.now() + index,
                name: hex,
                hexCode: hex
            };
        });
    }, []);

    const selectedColorTypeName = useMemo(() => {
        if (!colorTypeId) return '';
        const type = colorTypes.find(t => t.id === colorTypeId);
        return type ? type.name : '';
    }, [colorTypeId, colorTypes]);

    const handleColorFieldPress = (mode: ColorPickerMode) => {
        if (!canEdit) return;

        if (!colorTypeId) {
            setModalConfig({
                visible: true,
                title: 'Selection Required',
                message: 'Please select a Color Type first before adding colors.',
                type: 'info',
                confirmText: 'OK',
                onConfirm: () => setModalConfig(prev => ({ ...prev, visible: false }))
            });
            return;
        }

        setPickerMode(mode);
        const currentList = mode === 'BEST' ? bestColorsList : worstColorsList;

        if (currentList.length > 0) {
            setInitialPickerHex(currentList[currentList.length - 1].hexCode);
        } else {
            setInitialPickerHex('#4C7BE2');
        }
        setIsColorPickerVisible(true);
    };

    const handleColorAdded = useCallback((color: Color) => {
        if (!pickerMode) return;

        const addColorToList = (prevList: Color[]) => {
            if (prevList.some(c => c.hexCode.toUpperCase() === color.hexCode.toUpperCase())) {
                Toast.show({ type: 'info', text1: 'Color already selected.' });
                return prevList;
            }
            const uniqueColor = { ...color, id: color.id || Date.now() };
            return [...prevList, uniqueColor];
        };

        if (pickerMode === 'BEST') {
            setBestColorsList(prev => addColorToList(prev));
        } else {
            setWorstColorsList(prev => addColorToList(prev));
        }

        setIsColorPickerVisible(false);
        setPickerMode(null);

    }, [pickerMode]);

    const handleRemoveColor = useCallback((colorId: number, mode: 'Best' | 'Worst') => {
        if (mode === 'Best') {
            setBestColorsList(prev => prev.filter(c => c.id !== colorId));
        } else {
            setWorstColorsList(prev => prev.filter(c => c.id !== colorId));
        }
    }, []);

    const fetchClientRequest = useCallback(async () => {
        setIsLoadingRequest(true);
        setError(null);
        try {
            const data = await getRequestById(testRequestId);
            setClientRequest(data.testRequest);
            setResponsesHistory(data.responses || []);
            setCanEdit(data.canEdit);

            if (data.responses && data.responses.length > 0) {
                const latestResponse = data.responses[data.responses.length - 1];

                if (!initialBestColors && !initialWorstColors && !initialNote) {

                    const dbNote = latestResponse.note || '';
                    const dbTypeId = latestResponse.colorTypeId || null;

                    setNote(dbNote);
                    setColorTypeId(dbTypeId);

                    let initialColorFilterList: Color[] = colorFiltersSpectrum;
                    if (dbTypeId) {
                        const loadedFiltersByType = await getColorsByType(dbTypeId);
                        setColorFiltersByType(loadedFiltersByType);
                        initialColorFilterList = loadedFiltersByType;
                    }

                    const dbBest = hexStringToColorList(latestResponse.bestColor || '', initialColorFilterList);
                    const dbWorst = hexStringToColorList(latestResponse.worstColor || '', colorFiltersSpectrum);

                    setBestColorsList(dbBest);
                    setWorstColorsList(dbWorst);

                    setOriginalData({
                        note: dbNote,
                        colorTypeId: dbTypeId,
                        best: dbBest,
                        worst: dbWorst
                    });
                } else {
                    const latestResponse = data.responses[data.responses.length - 1];
                    const dbTypeId = latestResponse.colorTypeId || null;

                    let initialColorFilterList: Color[] = colorFiltersSpectrum;
                    if (dbTypeId) {
                        const loadedFiltersByType = await getColorsByType(dbTypeId);
                        initialColorFilterList = loadedFiltersByType;
                    }

                    setOriginalData({
                        note: latestResponse.note || '',
                        colorTypeId: dbTypeId,
                        best: hexStringToColorList(latestResponse.bestColor || '', initialColorFilterList),
                        worst: hexStringToColorList(latestResponse.worstColor || '', colorFiltersSpectrum)
                    });
                }
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
            setError(`Failed to load request: ${errorMessage}`);
        } finally {
            setIsLoadingRequest(false);
        }
    }, [testRequestId, hexStringToColorList, colorFiltersSpectrum, initialBestColors, initialWorstColors, initialNote]);

    useEffect(() => {
        if (initialColorTypeId !== undefined) {
            setColorTypeId(initialColorTypeId);
        }
        if (initialNote !== undefined) {
            setNote(initialNote);
        }
        if (initialBestColors) {
            setBestColorsList(prev => {
                const existingHexes = new Set(prev.map(c => c.hexCode.toUpperCase()));
                const newUniqueColors = initialBestColors.filter(c => !existingHexes.has(c.hexCode.toUpperCase()));
                return [...prev, ...newUniqueColors];
            });
        }

        if (initialWorstColors) {
            setWorstColorsList(prev => {
                const existingHexes = new Set(prev.map(c => c.hexCode.toUpperCase()));
                const newUniqueColors = initialWorstColors.filter(c => !existingHexes.has(c.hexCode.toUpperCase()));
                return [...prev, ...newUniqueColors];
            });
        }
    }, [initialBestColors, initialWorstColors, initialColorTypeId, initialNote]);

    useEffect(() => {
        if (colorTypeId !== null) {
            fetchColorFiltersByType(colorTypeId);
        } else {
            setColorFiltersByType([]);
        }
    }, [colorTypeId, fetchColorFiltersByType]);

    useEffect(() => {
        if (!isLoadingResources) {
            fetchClientRequest();
        }
    }, [fetchClientRequest, isLoadingResources]);


    const handleSubmit = useCallback(async () => {
        if (!canEdit) {
            Toast.show({ type: 'error', text1: 'Action Denied', text2: 'You cannot edit this request anymore.' });
            return;
        }

        const { bestHex, worstHex } = updateColorStrings(bestColorsList, worstColorsList);

        if (!testRequestId || !note.trim() || bestColorsList.length === 0 || worstColorsList.length === 0 || !colorTypeId) {
            setModalConfig({
                visible: true,
                title: 'Error',
                message: 'Please fill in all required fields (Note, Best Colors, Worst Colors, Color Type).',
                type: 'error',
                confirmText: 'OK',
                onConfirm: () => setModalConfig(prev => ({ ...prev, visible: false }))
            });
            return;
        }

        setIsSubmitting(true);

        const commonPayload: UpdateResponsePayload = {
            note: note.trim(),
            bestColor: bestHex,
            worstColor: worstHex,
            colorTypeId: colorTypeId,
        };

        try {
            if (hasExistingResponse) {
                const updatePayload: UpdateResponsePayload = commonPayload;
                await updateExpertResponse(testRequestId, updatePayload);
                Toast.show({
                    type: 'success',
                    text1: 'Update Successful!',
                    text2: 'Your analysis has been successfully updated.',
                    visibilityTime: 4000,
                });
            } else {
                const createPayload: CreateResponseRequest = {
                    ...commonPayload,
                    testRequestId: testRequestId,
                };
                await createResponse(createPayload);
                Toast.show({
                    type: 'success',
                    text1: 'Response Sent!',
                    text2: 'Your analysis has been successfully submitted.',
                    visibilityTime: 4000,
                });
            }

            setOriginalData({
                note: note.trim(),
                colorTypeId,
                best: bestColorsList,
                worst: worstColorsList
            });

            navigation.navigate('Tabs', {
                screen: 'History',
                params: {
                    initialTab: 'Test Request',
                    initialStatus: 'Completed'
                }
            });

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Submission failed.';
            setModalConfig({
                visible: true,
                title: 'Submission Failed',
                message: errorMessage,
                type: 'error',
                confirmText: 'Close',
                onConfirm: () => setModalConfig(prev => ({ ...prev, visible: false }))
            });
        } finally {
            setIsSubmitting(false);
        }
    }, [testRequestId, note, bestColorsList, worstColorsList, colorTypeId, navigation, updateColorStrings, hasExistingResponse, canEdit]);

    const colorPickerProps = useMemo(() => {
        if (pickerMode === 'BEST') {
            return {
                colorFilters: colorFiltersByType,
                colorTitle: `PerHue Colors for ${selectedColorTypeName || 'Selected Type'}`,
                disabled: isLoadingColorFilters,
            };
        } else if (pickerMode === 'WORST') {
            return {
                colorFilters: colorFiltersSpectrum,
                colorTitle: `PerHue Colors`,
                disabled: isLoadingResources,
            };
        }
        return {
            colorFilters: [],
            colorTitle: '',
            disabled: true,
        };
    }, [pickerMode, colorFiltersByType, colorFiltersSpectrum, selectedColorTypeName, isLoadingColorFilters, isLoadingResources]);

    const isLoading = isLoadingRequest || isLoadingResources;

    const handleNavigateToColorTestOnImage = useCallback(() => {
        if (!clientPictureUri) {
            Toast.show({ type: 'error', text1: 'Error', text2: 'No image available for testing.', visibilityTime: 3000 });
            return;
        }

        navigation.navigate('ColorTestOnImageScreen', {
            imageUri: clientPictureUri,
            testRequestId: testRequestId,
            currentBestColors: bestColorsList,
            currentWorstColors: worstColorsList,
            colorTypeId: colorTypeId || undefined,
            currentNote: note,
            fromScreen: 'CreateExpertTestResponse'
        });
    }, [navigation, clientPictureUri, testRequestId, bestColorsList, worstColorsList, colorTypeId, note]);

    if (isLoading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color={BLUE_COLOR} />
                <Text style={styles.loadingText}>Loading client request and resources...</Text>
            </View>
        );
    }

    if (error || !clientRequest) {
        return (
            <View style={[styles.centered, styles.errorBox]}>
                <Text style={styles.errorText}>{error || 'Request data is missing.'}</Text>
                <TouchableOpacity onPress={fetchClientRequest} style={styles.retryButton}>
                    <Text style={styles.retryButtonText}>Try Again</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const getSubmitButtonText = () => {
        if (!canEdit) return 'Modification Locked';
        if (hasExistingResponse) return 'Update Response';
        return 'Submit Response';
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={handleHeaderBackPress}
                    style={styles.backButton}>
                    <Ionicons name="arrow-back" size={28} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Test Request #{testRequestId}</Text>
                <View style={{ width: 40 }} />
            </View>

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >

                <ScrollView
                    contentContainerStyle={[
                        styles.scrollViewContent,
                        { paddingBottom: styles.scrollViewContent.paddingBottom + insets.bottom }
                    ]}
                    keyboardShouldPersistTaps="handled"
                >

                    <View style={styles.clientInfoCard}>
                        <Text style={styles.cardTitle}>User photo</Text>
                        {clientPictureUri && (
                            <View style={styles.clientImageContainer}>
                                <Image source={{ uri: clientPictureUri }} style={styles.clientImage} resizeMode="contain" />

                                <TouchableOpacity
                                    style={styles.colorTestButton}
                                    onPress={handleNavigateToColorTestOnImage}
                                >
                                    <FontAwesome name="camera" size={24} color="white" />
                                    <Text style={styles.colorTestButtonText}>Test</Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        <ColorDetailDisplay
                            skinColor={clientRequest.skinColor}
                            hairColor={clientRequest.hairColor}
                            eyesColor={clientRequest.eyesColor}
                            lipsColor={clientRequest.lipsColor}
                        />

                        <Text style={styles.dateTimeText}>Received on: {new Date(clientRequest.createdDate).toLocaleDateString()}</Text>
                    </View>

                    <Text style={styles.sectionHeader}>Expert Response Form</Text>

                    <Text style={styles.label}>Color Type Assignment *</Text>
                    <View style={styles.colorTypeSelectorContainer}>
                        {colorTypes.map((type) => (

                            <TouchableOpacity
                                key={type.id}
                                style={[
                                    styles.colorTypeButton,
                                    (colorTypeId === type.id) && styles.colorTypeButtonActive,

                                    !canEdit && (
                                        (colorTypeId === type.id)
                                            ? styles.selectedDisabledItem
                                            : styles.unselectedDisabledItem
                                    )
                                ]}
                                onPress={() => canEdit && setColorTypeId(type.id)}
                                disabled={!canEdit || isSubmitting}
                            >
                                <Text style={[
                                    (colorTypeId === type.id) ? styles.colorTypeButtonTextActive : styles.colorTypeButtonText,

                                    (!canEdit && (colorTypeId !== type.id)) && styles.colorTypeTextDisabled
                                ]}>
                                    {type.name}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <Text style={styles.label}>Expert Note *</Text>
                    <TextInput
                        style={[styles.textArea, !canEdit && styles.disabledInput]}
                        value={note}
                        onChangeText={setNote}
                        placeholder="Enter your detailed analysis and suggestions here..."
                        multiline
                        numberOfLines={5}
                        editable={canEdit && !isSubmitting}
                    />

                    <Text style={styles.label}>Best Colors (Click to add color) *</Text>
                    <SelectedColorsDisplay
                        colors={bestColorsList}
                        onRemove={(id) => handleRemoveColor(id, 'Best')}
                        disabled={!canEdit}
                    />
                    {canEdit && (
                        <TouchableOpacity
                            style={styles.addColorButton}
                            onPress={() => handleColorFieldPress('BEST')}
                            disabled={isSubmitting || isLoadingColorFilters}
                        >
                            <Text style={styles.addColorButtonText}>+ Add Best Color</Text>
                        </TouchableOpacity>
                    )}

                    <Text style={styles.label}>Worst Colors (Click to add color) *</Text>
                    <SelectedColorsDisplay
                        colors={worstColorsList}
                        onRemove={(id) => handleRemoveColor(id, 'Worst')}
                        disabled={!canEdit}
                    />
                    {canEdit && (
                        <TouchableOpacity
                            style={styles.addColorButton}
                            onPress={() => handleColorFieldPress('WORST')}
                            disabled={isSubmitting || isLoadingResources}
                        >
                            <Text style={styles.addColorButtonText}>+ Add Worst Color</Text>
                        </TouchableOpacity>
                    )}

                    <View style={{ height: 30 }} />
                </ScrollView>
            </KeyboardAvoidingView>

            <View
                style={[
                    styles.footer,
                    { paddingBottom: 20 + insets.bottom }
                ]}
            >
                <TouchableOpacity
                    style={[
                        styles.submitButton,
                        (!canEdit || isSubmitting) && styles.submitButtonDisabled
                    ]}
                    onPress={handleSubmit}
                    disabled={!canEdit || isSubmitting}
                >
                    {isSubmitting ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.submitButtonText}>
                            {getSubmitButtonText()}
                        </Text>
                    )}
                </TouchableOpacity>
            </View>

            {isColorPickerVisible && (
                <ColorPickerPopup
                    isVisible={isColorPickerVisible}
                    onClose={() => setIsColorPickerVisible(false)}
                    onColorSelected={handleColorAdded}
                    initialColorHex={initialPickerHex}
                    colorFilters={colorPickerProps.colorFilters}
                    colorTitle={colorPickerProps.colorTitle}
                />
            )}

            <CustomConfirmModal
                {...modalConfig}
                onCancel={modalConfig.onCancel}
                onConfirm={() => {
                    if (modalConfig.onConfirm) modalConfig.onConfirm();
                }}
            />
        </View>
    );
};

export default CreateExpertTestResponse;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    // [CẬP NHẬT] Style Header
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
    backButton: {
        padding: 5,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    scrollViewContent: {
        padding: 15,
        paddingBottom: 100,
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
        color: 'red',
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
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#333',
    },
    cardSectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#555',
        marginBottom: 8,
        paddingTop: 5,
    },
    clientImageContainer: {
        width: '100%',
        height: 500,
        borderRadius: 8,
        marginBottom: 10,
        backgroundColor: '#eee',
        position: 'relative',
        overflow: 'hidden',
    },
    clientImage: {
        width: '100%',
        height: '100%',
        borderRadius: 8,
    },
    colorTestButton: {
        position: 'absolute',
        bottom: 10,
        right: 10,
        backgroundColor: '#473e3eff',
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
        zIndex: 10,
    },
    colorTestButtonText: {
        color: 'white',
        marginLeft: 5,
        fontWeight: 'bold',
        fontSize: 14,
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
    dateTimeText: {
        fontSize: 12,
        color: '#888',
        marginTop: 8,
        textAlign: 'right',
    },
    sectionHeader: {
        fontSize: 20,
        fontWeight: 'bold',
        color: BLUE_COLOR,
        marginBottom: 15,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginTop: 10,
        marginBottom: 5,
    },
    textArea: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        marginBottom: 15,
        minHeight: 100,
        textAlignVertical: 'top',
        color: '#333',
    },
    colorTypeSelectorContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'flex-start',
        gap: 8,
        marginBottom: 15,
    },
    colorTypeButton: {
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#ddd',
        alignItems: 'center',
        marginBottom: 8,
        backgroundColor: '#fff',
    },
    colorTypeButtonActive: {
        backgroundColor: BLUE_COLOR,
        borderColor: BLUE_COLOR,
    },
    colorTypeButtonText: {
        color: '#333',
        fontWeight: '500',
    },
    colorTypeButtonTextActive: {
        color: '#fff',
        fontWeight: 'bold',
    },
    colorTypeButtonDisabled: {
        opacity: 0.6,
        backgroundColor: '#e9ecef',
        borderColor: '#ced4da',
    },
    selectedDisabledItem: {
        opacity: 1,
        backgroundColor: BLUE_COLOR,
        borderColor: BLUE_COLOR,
        borderWidth: 1,
    },

    unselectedDisabledItem: {
        opacity: 0.5,
        backgroundColor: '#e9ecef',
        borderColor: 'transparent',
    },
    colorTypeTextDisabled: {
        color: '#6c757d',
    },
    selectedColorsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 10,
        gap: 10,
        paddingVertical: 5,
    },
    colorSquareWrapper: {
        position: 'relative',
        width: 65,
        height: 65,
        borderRadius: 8,
        overflow: 'visible',
    },
    colorSquare: {
        width: '100%',
        height: '100%',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ddd',
        justifyContent: 'flex-end',
        alignItems: 'center',
    },
    colorSquareHexText: {
        fontSize: 12,
        textShadowColor: 'rgba(0, 0, 0, 0.2)',
        textShadowOffset: { width: 0.5, height: 0.5 },
        textShadowRadius: 1,
        marginBottom: 2,
        fontWeight: 'bold',
    },
    removeButtonSquare: {
        position: 'absolute',
        top: -5,
        right: -5,
        backgroundColor: '#e88b85ff',
        borderRadius: 10,
        width: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 5,
    },
    removeButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 12,
    },
    addColorButton: {
        backgroundColor: '#e6f0ff',
        padding: 10,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 15,
        borderWidth: 1,
        borderColor: BLUE_COLOR,
    },
    addColorButtonText: {
        color: BLUE_COLOR,
        fontWeight: 'bold',
        fontSize: 16,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 15,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#eee',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    submitButton: {
        width: '80%',
        backgroundColor: '#28a745',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    submitButtonDisabled: {
        backgroundColor: '#A0AEC0',
        shadowOpacity: 0,
        elevation: 0,
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    disabledInput: {
        backgroundColor: '#E9ECEF',
        color: '#495057',
        borderColor: '#CED4DA',
    }
});
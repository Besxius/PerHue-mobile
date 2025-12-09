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
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { getRequestById, createResponse, updateExpertResponse } from '../api/expertApi';
import { ExpertRequest, CreateResponseRequest, ColorType, Color, ExpertTestResponse, UpdateResponsePayload } from '../types/dataModels';
import Toast from 'react-native-toast-message';
import { getColorType } from '../api/capsulePaletteApi';
import ColorPickerPopup from '../components/ColorPickerPopup';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getColorsByType, getCorlorListSpectrum } from '../api/colorApi';
import { FontAwesome } from '@expo/vector-icons';

type RootStackParamList = {
    CreateExpertTestResponse: {
        id: number;
        initialBestColors?: Color[];
        initialWorstColors?: Color[];
    };
    ColorTestOnImageScreen: {
        imageUri: string;
        testRequestId: number;
    };
};

type CreateResponseScreenProps = NativeStackScreenProps<
    RootStackParamList,
    'CreateExpertTestResponse'
>;

type ColorPickerMode = 'BEST' | 'WORST' | null;

const { width } = Dimensions.get('window');
const BLUE_COLOR = '#4C7BE2';


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

interface SelectedColorsDisplayProps {
    colors: Color[];
    onRemove: (colorId: number) => void;
}

const SelectedColorsDisplay: FC<SelectedColorsDisplayProps> = ({ colors, onRemove }) => {
    if (colors.length === 0) return null;

    return (
        <View style={styles.selectedColorsContainer}>
            {colors.map((color) => (
                <View key={color.id} style={styles.colorSquareWrapper}>
                    <View style={[styles.colorSquare, { backgroundColor: color.hexCode }]}>
                        <Text style={styles.colorSquareHexText}>{color.hexCode.toUpperCase()}</Text>
                    </View>
                    <TouchableOpacity
                        style={styles.removeButtonSquare}
                        onPress={() => onRemove(color.id)}
                    >
                        <Text style={styles.removeButtonText}>X</Text>
                    </TouchableOpacity>
                </View>
            ))}
        </View>
    );
};

const isRequestExpired = (createdDate: string | Date, daysLimit: number = 2): boolean => {
    const creationTime = new Date(createdDate).getTime();
    const currentTime = Date.now();
    const expiryTime = creationTime + daysLimit * 24 * 60 * 60 * 1000;
    return currentTime > expiryTime;
};


const CreateExpertTestResponse: FC<CreateResponseScreenProps> = ({ route, navigation }) => {
    const insets = useSafeAreaInsets();

    const testRequestId = route.params.id;
    const { initialBestColors, initialWorstColors } = route.params; // Nhận tham số mới
    const { colorTypes, colorFiltersSpectrum, isLoadingResources } = useResources();

    const [clientRequest, setClientRequest] = useState<ExpertRequest | null>(null);
    const [isLoadingRequest, setIsLoadingRequest] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [responsesHistory, setResponsesHistory] = useState<ExpertTestResponse[]>([]);

    const [note, setNote] = useState('');
    const [bestColorsList, setBestColorsList] = useState<Color[]>([]);
    const [worstColorsList, setWorstColorsList] = useState<Color[]>([]);
    const [colorTypeId, setColorTypeId] = useState<number | null>(null);

    const [colorFiltersByType, setColorFiltersByType] = useState<Color[]>([]);
    const [isLoadingColorFilters, setIsLoadingColorFilters] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [isColorPickerVisible, setIsColorPickerVisible] = useState(false);
    const [pickerMode, setPickerMode] = useState<ColorPickerMode>(null);
    const [initialPickerHex, setInitialPickerHex] = useState('#4C7BE2');

    const hasExistingResponse = useMemo(() => responsesHistory.length > 0, [responsesHistory]);

    const clientPictureUri = useMemo(() => clientRequest?.pictures?.[0]?.source, [clientRequest]);

    const isExpired = useMemo(() => {
        if (!clientRequest?.createdDate) return false;
        return isRequestExpired(clientRequest.createdDate, 2);
    }, [clientRequest]);

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
            console.log(`Loaded ${colors.length} colors for type ${typeId}`);
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
        if (mode === 'BEST' && !colorTypeId) {
            Alert.alert(
                'Selection Required',
                'Please select a Color Type first before choosing Best Colors.'
            );
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

            if (data.responses && data.responses.length > 0) {
                const latestResponse = data.responses[data.responses.length - 1];

                setNote(latestResponse.note || '');
                const initialColorTypeId = latestResponse.colorTypeId || null;
                setColorTypeId(latestResponse.colorTypeId || null);

                let initialColorFilterList: Color[] = colorFiltersSpectrum;
                if (initialColorTypeId) {
                    const loadedFiltersByType = await getColorsByType(initialColorTypeId);
                    setColorFiltersByType(loadedFiltersByType);
                    initialColorFilterList = loadedFiltersByType;
                }

                const initialBest = hexStringToColorList(latestResponse.bestColor || '', initialColorFilterList);
                const initialWorst = hexStringToColorList(latestResponse.worstColor || '', colorFiltersSpectrum);

                setBestColorsList(initialBest);
                setWorstColorsList(initialWorst);
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
            setError(`Failed to load request: ${errorMessage}`);
        } finally {
            setIsLoadingRequest(false);
        }
    }, [testRequestId, hexStringToColorList, colorFiltersSpectrum]);

    useEffect(() => {
        if (initialBestColors || initialWorstColors) {
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
        }
    }, [initialBestColors, initialWorstColors]);


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
        const { bestHex, worstHex } = updateColorStrings(bestColorsList, worstColorsList);

        if (!testRequestId || !note.trim() || bestColorsList.length === 0 || worstColorsList.length === 0 || !colorTypeId) {
            Alert.alert('Error', 'Please fill in all required fields (Note, Best Colors, Worst Colors, Color Type).');
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

            navigation.goBack();

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Submission failed.';
            Alert.alert('Submission Failed', errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    }, [testRequestId, note, bestColorsList, worstColorsList, colorTypeId, navigation, updateColorStrings, hasExistingResponse]);

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
        });
    }, [navigation, clientPictureUri, testRequestId]);

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

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <ScrollView
                contentContainerStyle={[
                    styles.scrollViewContent,
                    { paddingBottom: styles.scrollViewContent.paddingBottom + insets.bottom }
                ]}
            >

                <View style={styles.clientInfoCard}>
                    <Text style={styles.cardTitle}>Client Request Details #{clientRequest.id}</Text>
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
                                colorTypeId === type.id && styles.colorTypeButtonActive,
                            ]}
                            onPress={() => setColorTypeId(type.id)}
                            disabled={isSubmitting}
                        >
                            <Text style={colorTypeId === type.id ? styles.colorTypeButtonTextActive : styles.colorTypeButtonText}>
                                {type.name}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <Text style={styles.label}>Expert Note *</Text>
                <TextInput
                    style={styles.textArea}
                    value={note}
                    onChangeText={setNote}
                    placeholder="Enter your detailed analysis and suggestions here..."
                    multiline
                    numberOfLines={5}
                    editable={!isSubmitting}
                />

                <Text style={styles.label}>Best Colors (Click to add color) *</Text>
                <SelectedColorsDisplay
                    colors={bestColorsList}
                    onRemove={(id) => handleRemoveColor(id, 'Best')}
                />
                <TouchableOpacity
                    style={styles.addColorButton}
                    onPress={() => handleColorFieldPress('BEST')}
                    disabled={isSubmitting || isLoadingColorFilters || !colorTypeId}
                >
                    <Text style={styles.addColorButtonText}>+ Add Best Color</Text>
                </TouchableOpacity>

                <Text style={styles.label}>Worst Colors (Click to add color) *</Text>
                <SelectedColorsDisplay
                    colors={worstColorsList}
                    onRemove={(id) => handleRemoveColor(id, 'Worst')}
                />
                <TouchableOpacity
                    style={styles.addColorButton}
                    onPress={() => handleColorFieldPress('WORST')}
                    disabled={isSubmitting || isLoadingResources}
                >
                    <Text style={styles.addColorButtonText}>+ Add Worst Color</Text>
                </TouchableOpacity>

                <View style={{ height: 30 }} />
            </ScrollView>

            <View
                style={[
                    styles.footer,
                    { paddingBottom: styles.footer.padding + insets.bottom }
                ]}
            >
                <TouchableOpacity
                    style={[styles.backButtonFooter]}
                    onPress={() => navigation.goBack()}
                    disabled={isSubmitting}
                >
                    <Text style={styles.backButtonText}>Back</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[
                        styles.submitButton,
                        (isSubmitting || isExpired) && styles.submitButtonDisabled
                    ]}
                    onPress={handleSubmit}
                    disabled={isSubmitting || isExpired}
                >
                    {isSubmitting ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.submitButtonText}>
                            {hasExistingResponse ? 'Update Response' : 'Submit Response'}
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
        </View>
    );
};

export default CreateExpertTestResponse;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    scrollViewContent: {
        padding: 15,
        paddingBottom: 80,
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
        height: 200,
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
        color: '#fff',
        textShadowColor: 'rgba(0, 0, 0, 0.7)',
        textShadowOffset: { width: 0.5, height: 0.5 },
        textShadowRadius: 1,
        marginBottom: 2,
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
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    submitButton: {
        flex: 3,
        backgroundColor: '#28a745',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
    },
    submitButtonDisabled: {
        backgroundColor: '#90ee90',
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    backButtonFooter: {
        flex: 1,
        backgroundColor: '#e0e0e0',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        marginRight: 10,
    },
    backButtonText: {
        color: '#333',
        fontSize: 18,
        fontWeight: 'bold',
    },
});
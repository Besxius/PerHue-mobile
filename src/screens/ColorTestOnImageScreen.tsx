import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import {
    StyleSheet,
    Text,
    View,
    Alert,
    TouchableOpacity,
    Image,
    Dimensions,
    ScrollView,
    Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import Svg, { Rect, Mask, Defs, Ellipse } from 'react-native-svg';
import Toast from 'react-native-toast-message';
import {
    Color,
    ColorType,
    CapsulePaletteModel,
} from '../types/dataModels';
import { getColorsByType, getCorlorListSpectrum } from '../api/colorApi';
import ColorPopup from '../components/ColorPopup';
import ColorPickerPopup from '../components/ColorPickerPopup';
import PalettePopup from '../components/PalettePopup';
import { getCapsulePalettesByType, getColorType } from '../api/capsulePaletteApi';
import { MaterialIcons } from '@expo/vector-icons';
import CustomConfirmModal, { AlertConfig } from '../components/CustomConfirmModal';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const DEFAULT_COLOR: Color = { id: 0, name: 'Default Transparent', hexCode: 'transparent' };

const OVAL_WIDTH = screenWidth * 0.8;
const OVAL_HEIGHT = screenWidth * 1.0;
const OVAL_RADIUS_X = OVAL_WIDTH / 2;
const OVAL_RADIUS_Y = OVAL_HEIGHT / 2;
const OVAL_CENTER_X = screenWidth / 2;
const OVAL_CENTER_Y = screenHeight / 2;

type ColorListMode = 'best' | 'worst';

const ColorTestOnImageScreen: React.FC<any> = ({ route, navigation }) => {
    const insets = useSafeAreaInsets();
    const {
        imageUri,
        testRequestId,
        currentBestColors,
        currentWorstColors,
        colorTypeId,
        currentNote
    } = route.params as {
        imageUri: string,
        testRequestId?: number,
        currentBestColors?: Color[],
        currentWorstColors?: Color[],
        colorTypeId?: number,
        currentNote?: string
    };

    const [bestColors, setBestColors] = useState<Color[]>(currentBestColors || []);
    const [worstColors, setWorstColors] = useState<Color[]>(currentWorstColors || []);
    const [selectedColorInfo, setSelectedColorInfo] = useState<Color>(DEFAULT_COLOR);
    const [activeColorListMode, setActiveColorListMode] = useState<ColorListMode>('best');

    const [showColorPickerPopup, setShowColorPickerTool] = useState(false);
    const [showColorPopup, setShowColorPicker] = useState(false);
    const [showPalettPopup, setShowPalettePicker] = useState(false);
    const [showSavedColorPopup, setShowSavedColorPopup] = useState(false);

    const [confirmModalConfig, setConfirmModalConfig] = useState<AlertConfig>({
        visible: false, title: '', message: '', type: 'info'
    });
    const [showSaveOptionModal, setShowSaveOptionModal] = useState(false);

    const [allColors, setAllColors] = useState<Color[]>([]);
    const [pickerColors, setPickerColors] = useState<Color[]>([]);

    const [colorTypes, setColorTypes] = useState<ColorType[]>([]);
    const [palettesBySeason, setPalettesBySeason] = useState<CapsulePaletteModel[]>([]);
    const [isLoadingPalettes, setIsLoadingPalettes] = useState(false);
    const [selectedTabName, setSelectedTabName] = useState<string>('');

    const isSavingRef = useRef(false);

    const activeColorList = activeColorListMode === 'best' ? bestColors : worstColors;

    const colorTypeName = useMemo(() => {
        if (!colorTypeId) return null;
        const type = colorTypes.find(t => t.id === colorTypeId);
        return type ? type.name : null;
    }, [colorTypeId, colorTypes]);

    useEffect(() => {
        const unsubscribe = navigation.addListener('beforeRemove', (e: any) => {
            if (isSavingRef.current) {
                return;
            }

            e.preventDefault();

            isSavingRef.current = true;

            navigation.navigate('CreateExpertTestResponse', {
                id: testRequestId,
                initialBestColors: bestColors,
                initialWorstColors: worstColors,
                initialColorTypeId: colorTypeId,
                initialNote: currentNote,
            });
        });

        return unsubscribe;
    }, [navigation, bestColors, worstColors, testRequestId, colorTypeId, currentNote]);

    const loadPalettesByTypeId = useCallback(async (colorTypeId: number, seasonName: string) => {
        setIsLoadingPalettes(true);
        try {
            const data = await getCapsulePalettesByType(colorTypeId);
            const updatedData: CapsulePaletteModel[] = data.map(p => ({
                ...p,
                colorType: { id: colorTypeId, name: seasonName }
            }));
            setPalettesBySeason(updatedData);
        } catch (error) {
            console.error('Error loading palettes for season:', seasonName, error);
            setPalettesBySeason([]);
        } finally {
            setIsLoadingPalettes(false);
        }
    }, []);

    const fetchColors = useCallback(async () => {
        try {
            // 1. Luôn lấy Full Spectrum cho ColorPopup (Tab All)
            const fullSpectrum = await getCorlorListSpectrum();
            setAllColors(fullSpectrum);

            // 2. Lấy dữ liệu cho Picker Tool (dựa vào colorTypeId)
            if (colorTypeId) {
                console.log(`Loading picker colors for type: ${colorTypeId}`);
                const typeColors = await getColorsByType(colorTypeId);
                setPickerColors(typeColors);
            } else {
                // Nếu không có Type, Picker Tool cũng dùng Full Spectrum
                setPickerColors(fullSpectrum);
            }
        } catch (error) {
            console.error('Error loading colors from API:', error);
            setConfirmModalConfig({
                visible: true,
                title: 'Data Load Error',
                message: 'Unable to load color list from the system.',
                type: 'error',
                confirmText: 'Close',
                onConfirm: () => setConfirmModalConfig(prev => ({ ...prev, visible: false }))
            });
        }
    }, [colorTypeId]);

    useEffect(() => {
        fetchColors();
        const loadInitialData = async () => {
            if (colorTypes.length > 0) return;
            try {
                const types = await getColorType() as ColorType[];
                setColorTypes(types);
                if (types.length > 0) {
                    const defaultType = types[0];
                    const defaultTab = defaultType.name;
                    setSelectedTabName(defaultTab);
                    await loadPalettesByTypeId(defaultType.id, defaultTab);
                }
            } catch (error) {
                console.error('Error loading initial data:', error);
            }
        };
        loadInitialData();
    }, [fetchColors, loadPalettesByTypeId, colorTypes.length, colorTypeId]);

    // --- Handlers ---

    const handleGoBack = () => {
        isSavingRef.current = true;

        navigation.navigate('CreateExpertTestResponse', {
            id: testRequestId,
            initialBestColors: bestColors,
            initialWorstColors: worstColors,
            initialColorTypeId: colorTypeId,
            initialNote: currentNote,
        });
    };

    const handleColorSelect = (color: Color) => {
        setSelectedColorInfo(color);
        setShowColorPicker(false);
        setShowColorPickerTool(false);
        setShowPalettePicker(false);
        setShowSavedColorPopup(false);
    };

    const attemptSaveToColorList = (mode: ColorListMode) => {
        const setList = mode === 'best' ? setBestColors : setWorstColors;

        const exists = (mode === 'best' ? bestColors : worstColors).some(
            c => c.id === selectedColorInfo.id || c.hexCode === selectedColorInfo.hexCode
        );

        if (!exists) {
            const colorToSave: Color = {
                ...selectedColorInfo,
                id: selectedColorInfo.id === 0 ? Date.now() : selectedColorInfo.id,
            };
            setList(prev => [colorToSave, ...prev]);
            setSelectedColorInfo(DEFAULT_COLOR);
            Toast.show({
                type: 'success',
                text1: 'Thành công',
                text2: `Đã lưu màu "${colorToSave.name}" vào danh sách ${mode.toUpperCase()}!`,
                visibilityTime: 2000,
            });
        } else {
            Toast.show({
                type: 'info',
                text1: 'Thông báo',
                text2: `Màu "${selectedColorInfo.name}" đã được lưu trước đó.`,
                visibilityTime: 2000,
            });
        }
        setShowSaveOptionModal(false);
    };

    const handleSaveColor = () => {
        if (selectedColorInfo.id === DEFAULT_COLOR.id || selectedColorInfo.hexCode === 'transparent') {
            Toast.show({
                type: 'error',
                text1: 'Lỗi',
                text2: 'Vui lòng chọn một màu cụ thể để lưu.',
                visibilityTime: 2000,
            });
            return;
        }

        setShowSaveOptionModal(true);
    };

    const handleDeleteColor = (colorId: number, mode: ColorListMode) => {
        const setList = mode === 'best' ? setBestColors : setWorstColors;
        const listName = mode === 'best' ? 'Best' : 'Worst';

        setList(prevColors => {
            const updatedColors = prevColors.filter(color => color.id !== colorId);
            Toast.show({
                type: 'success',
                text1: 'Xóa thành công',
                text2: `Đã xóa màu khỏi danh sách ${listName}.`,
                visibilityTime: 2000,
            });
            if (selectedColorInfo.id === colorId) {
                setSelectedColorInfo(DEFAULT_COLOR);
            }
            return updatedColors;
        });
    };

    const handleTestSubmit = () => {
        isSavingRef.current = true;

        navigation.navigate('CreateExpertTestResponse', {
            id: testRequestId,
            initialBestColors: bestColors,
            initialWorstColors: worstColors,
            initialColorTypeId: colorTypeId,
            initialNote: currentNote,
        });

    };

    const handleShowSavedColorPopup = (mode: ColorListMode) => {
        setActiveColorListMode(mode);
        setShowSavedColorPopup(true);
    };

    const renderSavedColorTags = (mode: ColorListMode) => {
        const colors = mode === 'best' ? bestColors : worstColors;
        const colorName = mode === 'best' ? 'Best' : 'Worst';
        const isBest = mode === 'best';
        const colorStyle = isBest ? styles.bestColorTag : styles.worstColorTag;

        return (
            <View style={styles.colorTagListContainer}>
                <Text style={[styles.colorListTitle, isBest ? { color: '#4CAF50' } : { color: '#F44336' }]}>
                    {colorName} Colors ({colors.length})
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.colorTagsScrollView}>
                    {colors.map(color => (
                        <View key={color.id} style={[styles.tagNameBox, colorStyle]}>
                            <TouchableOpacity
                                style={[
                                    styles.singleColorButton,
                                    { backgroundColor: color.hexCode },
                                ]}
                                onPress={() => handleColorSelect(color)}
                            />
                            <Text style={styles.tagNameText}>{color.name.toUpperCase()}</Text>
                            <TouchableOpacity
                                style={styles.closeIcon}
                                onPress={() => handleDeleteColor(color.id, mode)}
                            >
                                <Ionicons name="close" size={18} color="white" />
                            </TouchableOpacity>
                        </View>
                    ))}
                    {colors.length === 0 && (
                        <Text style={styles.emptyListText}>No colors were saved.</Text>
                    )}
                </ScrollView>
            </View>
        );
    };

    const shouldShowColorOverlay =
        selectedColorInfo.id !== DEFAULT_COLOR.id && selectedColorInfo.hexCode !== 'transparent';

    return (
        <View style={styles.container}>
            <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="cover" />

            {shouldShowColorOverlay && (
                <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
                    <Svg
                        height={screenHeight}
                        width={screenWidth}
                        style={[StyleSheet.absoluteFill, { zIndex: 1 }]}
                    >
                        <Defs>
                            <Mask id="ovalMask" x="0" y="0" width={screenWidth} height={screenHeight}>
                                <Rect x="0" y="0" width={screenWidth} height={screenHeight} fill="white" />
                                <Ellipse
                                    cx={OVAL_CENTER_X}
                                    cy={OVAL_CENTER_Y}
                                    rx={OVAL_RADIUS_X}
                                    ry={OVAL_RADIUS_Y}
                                    fill="black"
                                />
                            </Mask>
                        </Defs>
                        <Rect
                            x="0"
                            y="0"
                            width={screenWidth}
                            height={screenHeight}
                            fill={selectedColorInfo.hexCode}
                            mask="url(#ovalMask)"
                            opacity="1"
                        />
                    </Svg>
                </View>
            )}

            <View style={[styles.topControls, { paddingTop: insets.top + 10 }]}>
                <TouchableOpacity style={styles.topControlButton} onPress={handleGoBack}>
                    <Ionicons name="arrow-back" size={30} color="white" />
                </TouchableOpacity>
                <View style={styles.topControlButtonPlaceholder} />
            </View>

            <View style={[styles.rightControls, { top: insets.top + 80 }]}>
                <TouchableOpacity
                    style={styles.leftControlButton}
                    onPress={() => setShowColorPickerTool(true)}
                >
                    <Ionicons name="color-filter" size={24} color="white" />
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.leftControlButton}
                    onPress={() => setShowColorPicker(true)}
                >
                    <Ionicons name="color-palette" size={24} color="white" />
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.leftControlButton}
                    onPress={() => setShowPalettePicker(true)}
                >
                    <Ionicons name="grid" size={24} color="white" />
                </TouchableOpacity>

                <View style={styles.separator} />

                <TouchableOpacity
                    style={[styles.leftControlButton, { backgroundColor: 'rgba(76, 175, 80, 0.7)' }]}
                    onPress={() => handleShowSavedColorPopup('best')}
                >
                    <MaterialIcons name="thumb-up" size={24} color="white" />
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.leftControlButton, { backgroundColor: 'rgba(244, 67, 54, 0.7)' }]}
                    onPress={() => handleShowSavedColorPopup('worst')}
                >
                    <MaterialIcons name="thumb-down" size={24} color="white" />
                </TouchableOpacity>
            </View>

            <View style={styles.filterTagContainer}>
                <View style={styles.filterRow}>
                    {selectedColorInfo.id !== DEFAULT_COLOR.id && (
                        <View style={styles.tagNameBox}>
                            <TouchableOpacity
                                style={[
                                    styles.singleColorButton,
                                    { backgroundColor: selectedColorInfo.hexCode },
                                ]}
                                onPress={() => handleColorSelect(DEFAULT_COLOR)}
                            />
                            <Text style={styles.tagNameText}>
                                {selectedColorInfo.name.toUpperCase()}
                            </Text>
                        </View>
                    )}
                    {shouldShowColorOverlay && (
                        <TouchableOpacity style={styles.saveColorButton} onPress={handleSaveColor}>
                            <Ionicons name="add-circle" size={28} color="white" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Best/Worst Color Lists and Submit Button (Bottom Area) */}
            {/* <View style={[styles.bottomArea, { paddingBottom: insets.bottom + 10 }]}> */}
            {/* <View style={styles.colorListsWrapper}>
                    {renderSavedColorTags('best')}
                    {renderSavedColorTags('worst')}
                </View> */}

            {/* Test Button */}
            {/* <TouchableOpacity
                    style={styles.testButton}
                    onPress={handleTestSubmit}
                    disabled={bestColors.length === 0 || worstColors.length === 0}
                >
                    <Text style={styles.testButtonText}>Back To Detail Screen</Text>
                    <Ionicons name="send" size={20} color="white" style={{ marginLeft: 10 }} />
                </TouchableOpacity> */}
            {/* </View> */}

            {/* --- Popups (rest of the popups remain unchanged) --- */}
            <ColorPopup
                showColorPicker={showColorPopup}
                setShowColorPicker={setShowColorPicker}
                allColorFilters={allColors}
                selectedColorInfo={selectedColorInfo}
                handleColorSelect={handleColorSelect}
                title="SELECT COLOR SPECTRUM"
                showTabs={true}
                getColorTypeApi={getColorType}
                getColorsByTypeApi={getColorsByType}
            />
            <ColorPickerPopup
                isVisible={showColorPickerPopup}
                onClose={() => setShowColorPickerTool(false)}
                onColorSelected={handleColorSelect}
                initialColorHex={selectedColorInfo.hexCode}
                colorFilters={pickerColors}
                colorTitle={colorTypeName ? `PerHue Colors for ${colorTypeName}` : 'Select Color'}
            />
            <PalettePopup
                showPalettePicker={showPalettPopup}
                setShowPalettePicker={setShowPalettePicker}
                colorFilters={allColors}
                handleColorSelect={handleColorSelect}
                colorTypes={colorTypes}
                palettesBySeason={palettesBySeason}
                isLoading={isLoadingPalettes}
                selectedTabName={selectedTabName}
                loadPalettesByTypeId={loadPalettesByTypeId}
                setSelectedTabName={setSelectedTabName}
            />
            {/* Popup quản lý màu đã lưu (Best/Worst) */}
            <ColorPopup
                showColorPicker={showSavedColorPopup}
                setShowColorPicker={setShowSavedColorPopup}
                allColorFilters={activeColorList}
                selectedColorInfo={selectedColorInfo}
                handleColorSelect={handleColorSelect}
                title={`${activeColorListMode.toUpperCase()} COLORS`}
                canDelete={true}
                onDeleteColor={(colorId) => handleDeleteColor(colorId, activeColorListMode)}
            />

            <CustomConfirmModal
                {...confirmModalConfig}
                onCancel={confirmModalConfig.onCancel}
                onConfirm={() => {
                    if (confirmModalConfig.onConfirm) confirmModalConfig.onConfirm();
                }}
            />

            {/* Save Option Modal (Custom) */}
            <Modal
                transparent={true}
                visible={showSaveOptionModal}
                animationType="fade"
                onRequestClose={() => setShowSaveOptionModal(false)}
            >
                <View style={modalStyles.overlay}>
                    <View style={modalStyles.container}>
                        <View style={[modalStyles.iconWrapper, { backgroundColor: '#E0F2F1' }]}>
                            <Ionicons name="save" size={32} color="#009688" />
                        </View>
                        <Text style={modalStyles.title}>Save Color</Text>
                        <Text style={modalStyles.message}>
                            Which list would you like to save "{selectedColorInfo.name}" to?
                        </Text>

                        <View style={modalStyles.buttonStack}>
                            {/* Best Color Button */}
                            <TouchableOpacity
                                style={[modalStyles.button, { backgroundColor: '#4CAF50' }]}
                                onPress={() => attemptSaveToColorList('best')}
                            >
                                <Ionicons name="thumbs-up" size={18} color="white" style={{ marginRight: 8 }} />
                                <Text style={modalStyles.buttonText}>Best Color</Text>
                            </TouchableOpacity>

                            {/* Worst Color Button */}
                            <TouchableOpacity
                                style={[modalStyles.button, { backgroundColor: '#F44336', marginTop: 10 }]}
                                onPress={() => attemptSaveToColorList('worst')}
                            >
                                <Ionicons name="thumbs-down" size={18} color="white" style={{ marginRight: 8 }} />
                                <Text style={modalStyles.buttonText}>Worst Color</Text>
                            </TouchableOpacity>

                            {/* Cancel Button */}
                            <TouchableOpacity
                                style={[modalStyles.button, { backgroundColor: '#ECEFF1', marginTop: 15 }]}
                                onPress={() => setShowSaveOptionModal(false)}
                            >
                                <Text style={[modalStyles.buttonText, { color: '#555' }]}>Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const modalStyles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    container: {
        width: screenWidth * 0.85,
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
        elevation: 5,
    },
    iconWrapper: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111',
        marginBottom: 8,
        textAlign: 'center',
    },
    message: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginBottom: 20,
    },
    buttonStack: {
        width: '100%',
    },
    button: {
        flexDirection: 'row',
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    }
});

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    previewImage: {
        width: screenWidth,
        height: screenHeight,
        position: 'absolute',
        top: 0,
        left: 0,
    },
    screenTitle: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    separator: {
        height: 1,
        width: '70%',
        backgroundColor: 'rgba(255, 255, 255, 0.4)',
        marginVertical: 10,
    },
    topControls: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 15,
        zIndex: 3,
    },
    topControlButton: {
        padding: 5,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        borderRadius: 25,
    },
    topControlButtonPlaceholder: {
        width: 30,
    },
    rightControls: {
        position: 'absolute',
        right: 15,
        alignItems: 'center',
        zIndex: 3,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        borderRadius: 25,
        paddingVertical: 10,
        paddingHorizontal: 5,
    },
    leftControlButton: {
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        borderRadius: 20,
        padding: 8,
        marginBottom: 10,
    },
    filterTagContainer: {
        position: 'absolute',
        top: screenHeight / 2 + OVAL_HEIGHT / 2 + 20,
        left: 0,
        right: 0,
        zIndex: 3,
        alignItems: 'center',
    },
    filterRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
        marginBottom: 10,
    },
    tagNameBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        borderRadius: 20,
        paddingHorizontal: 15,
        paddingVertical: 8,
        marginRight: 10,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    tagNameText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 14,
        marginHorizontal: 8,
        letterSpacing: 0.5,
    },
    closeIcon: {
        marginLeft: 4,
    },
    singleColorButton: {
        width: 25,
        height: 25,
        borderRadius: 25,
        borderWidth: 2,
        borderColor: 'white',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1.5,
    },
    saveColorButton: {
        width: 45,
        height: 45,
        borderRadius: 22.5,
        backgroundColor: 'rgba(25, 118, 210, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'white',
    },
    bottomArea: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        zIndex: 3,
        paddingTop: 10,
    },
    colorListsWrapper: {
        marginBottom: 10,
        paddingHorizontal: 10,
    },
    colorTagListContainer: {
        marginBottom: 10,
    },
    colorListTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        paddingHorizontal: 10,
        marginBottom: 5,
    },
    colorTagsScrollView: {
        paddingVertical: 5,
    },
    emptyListText: {
        color: 'rgba(255, 255, 255, 0.6)',
        fontSize: 14,
        fontStyle: 'italic',
        marginHorizontal: 10,
        alignSelf: 'center',
        paddingVertical: 5,
    },
    bestColorTag: {
        backgroundColor: 'rgba(76, 175, 80, 0.7)',
        borderColor: '#4CAF50',
    },
    worstColorTag: {
        backgroundColor: 'rgba(244, 67, 54, 0.7)',
        borderColor: '#F44336',
    },
    testButton: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#0095F6',
        borderRadius: 10,
        marginHorizontal: 20,
        paddingVertical: 12,
        marginBottom: 10,
    },
    testButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 18,
    },
});

export default ColorTestOnImageScreen;
import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import {
    StyleSheet,
    Text,
    View,
    Alert,
    TouchableOpacity,
    PermissionsAndroid,
    Platform,
    Image,
    Dimensions,
    Animated,
    ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
    Camera,
    useCameraDevices,
    CameraDevice,
    CameraPosition,
    PhotoFile,
} from 'react-native-vision-camera';
import { launchImageLibrary, ImageLibraryOptions, Asset } from 'react-native-image-picker';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import AntDesign from '@expo/vector-icons/AntDesign';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import Ionicons from '@expo/vector-icons/Ionicons';
import Entypo from '@expo/vector-icons/Entypo';
import Svg, { Rect, Mask, Defs, Ellipse } from 'react-native-svg';
import { ColorTestRequest, CapsulePaletteModel, Color, ColorType, ImageFile, ManualColorTestResponse, AiColorTestResponse } from '../types/dataModels';
import { getColorsByType, getCorlorListSpectrum } from '../api/colorApi';
import { getAuthRole } from '../api/apiClient';
import ColorPopup from '../components/ColorPopup';
import ColorPickerPopup from '../components/ColorPickerPopup';
import PalettePopup from '../components/PalettePopup';
import { getCapsulePalettesByType, getColorType } from '../api/capsulePaletteApi';
import ColorPickerOverlay, { AttributeColor, DEFAULT_SELECTED_COLORS, SelectedColors } from '../components/ColorPickerOverlay';
import { FontAwesome } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { aiColorTest, expertColorTest, manualColorTest } from '../api/colorTestApi';
import ManualResultModal from '../components/ManualResultModal';
import AiTestResultModal from '../components/AiResultModal';
import ExpertSuccessModal from '../components/ExpertSuccessModal';
import { getActiveSubscriptions } from '../api/dataApi';
import SubscriptionAlertModal from '../components/SubscriptionAlertModal';

// Get screen dimensions
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Define type for selected photo
type PhotoAsset = PhotoFile | Asset | null;
type CaptureMode = 'manual' | 'ai' | 'expert';

// Default color value
const DEFAULT_COLOR: Color = { id: 0, name: "Default White", hexCode: "white" };

const OVAL_WIDTH = screenWidth * 0.7;
const OVAL_HEIGHT = screenWidth * 0.8;
const OVAL_RADIUS_X = OVAL_WIDTH / 2;
const OVAL_RADIUS_Y = OVAL_HEIGHT / 2;
const OVAL_CENTER_X = screenWidth / 2;
const OVAL_CENTER_Y = screenHeight / 2;

const HIGHLIGHT_WIDTH = 50;
const TOTAL_WIDTH_TABS = screenWidth * 0.7;
const TAB_AREA_WIDTH = TOTAL_WIDTH_TABS;
const TAB_ITEM_WIDTH = TAB_AREA_WIDTH / 3;

// 1. RELATIVE translation position inside the TAB_AREA_WIDTH region
const TAB_POSITIONS: { [key in CaptureMode]: number } = {
    manual: (TAB_ITEM_WIDTH * 0) + (TAB_ITEM_WIDTH / 2) - (HIGHLIGHT_WIDTH / 2),
    ai: (TAB_ITEM_WIDTH * 1) + (TAB_ITEM_WIDTH / 2) - (HIGHLIGHT_WIDTH / 2),
    expert: (TAB_ITEM_WIDTH * 2) + (TAB_ITEM_WIDTH / 2) - (HIGHLIGHT_WIDTH / 2),
};

const CameraScreen: React.FC<any> = ({ navigation }) => {
    const insets = useSafeAreaInsets();

    const devices = useCameraDevices();
    const cameraRef = useRef<Camera>(null);

    const backCamera = useMemo(() => devices.find(d => d.position === 'back'), [devices]);
    const frontCamera = useMemo(() => devices.find(d => d.position === 'front'), [devices]);

    const [activeDevice, setActiveDevice] = useState<CameraDevice | null>(null);
    const [cameraPosition, setCameraPosition] = useState<CameraPosition>('back');
    const [hasPermission, setHasPermission] = useState<false | true>(false);
    const [flashMode, setFlashMode] = useState<'off' | 'on' | 'auto'>('off');

    const [fullPreviewUri, setFullPreviewUri] = useState<string | null>(null);
    const [currentPhoto, setCurrentPhoto] = useState<PhotoAsset>(null);

    const [captureMode, setCaptureMode] = useState<CaptureMode>('manual');

    // Add Loading State
    const [isLoading, setIsLoading] = useState(false);
    // 2. Add isUserExpert State
    const [isUserExpert, setIsUserExpert] = useState(false);

    const [showLeftControls, setShowLeftControls] = useState(true);

    const [showColorPickerPopup, setShowColorPickerTool] = useState(false);
    const [showColorPopup, setShowColorPicker] = useState(false);
    const [showPalettPopup, setShowPalettePicker] = useState(false);
    const [showSkiaPicker, setShowSkiaPicker] = useState(false);

    const [savedColors, setSavedColors] = useState<Color[]>([]);
    const [showSavedColorPopup, setShowSavedColorPopup] = useState(false);

    const [selectedColorInfo, setSelectedColorInfo] = useState<Color>(DEFAULT_COLOR);

    const [colorFilters, setColorFilters] = useState<Color[]>([]);
    const [colorTypes, setColorTypes] = useState<ColorType[]>([]);
    const [palettesBySeason, setPalettesBySeason] = useState<CapsulePaletteModel[]>([]);
    const [isLoadingPalettes, setIsLoadingPalettes] = useState(false);
    const [selectedTabName, setSelectedTabName] = useState<string>('');

    const [capturedColors, setCapturedColors] = useState<SelectedColors | null>(null);
    const [showModeDropdown, setShowModeDropdown] = useState(false);

    const [showManualResultModal, setShowManualResultModal] = useState(false);
    const [manualResultData, setManualResultData] = useState<ManualColorTestResponse | null>(null);

    const [showAiResultModal, setShowAiResultModal] = useState(false);
    const [aiResultData, setAiResultData] = useState<AiColorTestResponse | null>(null);

    const [showExpertSuccessModal, setShowExpertSuccessModal] = useState(false);
    const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

    const highlightAnim = useRef(new Animated.Value(TAB_POSITIONS.manual)).current;

    // 3. Load Role
    useEffect(() => {
        const checkRole = async () => {
            const role = await getAuthRole();
            if (role === 'Expert') {
                setIsUserExpert(true);
            } else {
                setIsUserExpert(false);
            }
        };
        checkRole();
    }, []);

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

    useEffect(() => {
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
    }, [loadPalettesByTypeId, colorTypes.length]);

    useEffect(() => {
        const targetX = TAB_POSITIONS[captureMode];

        Animated.timing(highlightAnim, {
            toValue: targetX,
            duration: 250,
            useNativeDriver: true,
        }).start();
    }, [captureMode, highlightAnim]);

    const fetchColorFilters = useCallback(async () => {
        try {
            const data = await getCorlorListSpectrum();
            setColorFilters(data);
        } catch (error) {
            console.error("Error loading colors from API:", error);
            Alert.alert("Color Load Error", "Could not load color data from API.");
        }
    }, []);

    const handleToggleLeftControls = () => {
        setShowLeftControls(prev => !prev);
    };

    const handleGoBack = () => {
        setCapturedColors(null);
        navigation.goBack();
    };

    const handleColorSelect = (color: Color) => {
        setSelectedColorInfo(color);
        setShowColorPicker(false);
        setShowColorPickerTool(false);
        setShowPalettePicker(false);
        setShowSavedColorPopup(false);
    };

    const handleShowPalettePicker = () => {
        setShowPalettePicker(true);
    };
    const handleShowSkiaPicker = () => {
        if (fullPreviewUri) {
            setShowSkiaPicker(true);
        } else {
            Alert.alert("Chụp Ảnh", "Vui lòng chụp ảnh hoặc chọn ảnh từ thư viện trước.");
        }
    };
    const handleChangeCaptureMode = (mode: 'manual' | 'ai' | 'expert') => {
        if (mode === 'manual') {
            setShowSkiaPicker(false);
            setCaptureMode(mode);
        } else {
            setShowSkiaPicker(true);
            setCaptureMode(mode);
        }
    };
    const handleChangeCaptureModePreview = (newMode: 'ai' | 'expert') => {
        setCaptureMode(newMode);
        setShowModeDropdown(false);
    };

    const handleSaveColor = () => {
        if (selectedColorInfo.id !== DEFAULT_COLOR.id) {
            const exists = savedColors.some(c => c.id === selectedColorInfo.id || c.hexCode === selectedColorInfo.hexCode);

            if (!exists) {
                const colorToSave: Color = {
                    ...selectedColorInfo,
                    id: selectedColorInfo.id === 0 ? Date.now() : selectedColorInfo.id
                };
                setSavedColors(prev => [colorToSave, ...prev]);

                setSelectedColorInfo(DEFAULT_COLOR);

                Toast.show({
                    type: 'success',
                    text1: 'Thành công',
                    text2: `Đã lưu màu "${selectedColorInfo.name}"!`,
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
        } else {
            Toast.show({
                type: 'error',
                text1: 'Lỗi',
                text2: 'Vui lòng chọn một màu cụ thể để lưu.',
                visibilityTime: 2000,
            });
        }
    };

    const handleDeleteSavedColor = (colorId: number) => {
        setSavedColors(prevColors => {
            const updatedColors = prevColors.filter(color => color.id !== colorId);
            if (selectedColorInfo.id === colorId) {
                setSelectedColorInfo(DEFAULT_COLOR);
            }
            return updatedColors;
        });
    };

    const handleManualTest = async () => {
        if (!currentPhoto) {
            Toast.show({ type: 'error', text1: 'Error', text2: 'No photo captured to submit.', visibilityTime: 2000 });
            return;
        }

        const SelectedColors: string[] = savedColors.map(c => c.hexCode);
        console.log("SelectedColors for Manual Test:", SelectedColors);

        if (SelectedColors.length === 0) {
            Toast.show({ type: 'error', text1: 'Error', text2: 'Please select at least one saved color.', visibilityTime: 3000 });
            return;
        }

        const isPhotoFile = (currentPhoto: PhotoAsset): currentPhoto is PhotoFile => {
            return (currentPhoto as PhotoFile).path !== undefined;
        };

        let imageFileForApi: ImageFile;
        const defaultMimeType = 'image/jpeg';
        const defaultFileName = 'photo.jpg';

        if (isPhotoFile(currentPhoto)) {
            const path = currentPhoto.path;
            const fileName = path.substring(path.lastIndexOf('/') + 1) || defaultFileName;
            const fileExtension = fileName.split('.').pop()?.toLowerCase();
            let mimeType = defaultMimeType;
            if (fileExtension === 'png') mimeType = 'image/png';
            else if (fileExtension === 'heic') mimeType = 'image/heic';

            imageFileForApi = {
                uri: `file://${path}`,
                type: mimeType,
                name: fileName,
            };
        } else if (currentPhoto && currentPhoto.uri) {
            const uri = currentPhoto.uri;
            const fileName = currentPhoto.fileName || uri.substring(uri.lastIndexOf('/') + 1) || defaultFileName;
            imageFileForApi = {
                uri: uri,
                type: currentPhoto.type || defaultMimeType,
                name: fileName,
            };
        } else {
            Toast.show({ type: 'error', text1: 'Error', text2: 'Invalid photo data.', visibilityTime: 3000 });
            return;
        }

        setIsLoading(true);
        try {
            const result: ManualColorTestResponse = await manualColorTest(SelectedColors, imageFileForApi);
            setManualResultData(result);
            setShowManualResultModal(true);
        } catch (error) {
            console.error('Error calling manualColorTest API:', error);
            Toast.show({
                type: 'error',
                text1: 'API Error',
                text2: 'Failed to retrieve color analysis results.',
                visibilityTime: 4000
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleNavigateToManualDetail = () => {
        if (manualResultData && fullPreviewUri) {
            setShowManualResultModal(false);
            navigation.navigate('ManualResultDetail', {
                resultData: manualResultData,
                currentPhotoUri: fullPreviewUri
            });
        } else {
            Toast.show({ type: 'error', text1: 'Lỗi', text2: 'Không có dữ liệu chi tiết.', visibilityTime: 2000 });
        }
    };

    const handleCloseManualModal = () => {
        setShowManualResultModal(false);
        setManualResultData(null);
    };

    const handleColorTest = async () => {
        if (!currentPhoto || fullPreviewUri === null) {
            Toast.show({ type: 'error', text1: 'Error', text2: 'Please take a photo before sending.', visibilityTime: 2000 });
            return;
        }

        if (captureMode !== 'ai' && captureMode !== 'expert') {
            Toast.show({ type: 'error', text1: 'Error', text2: 'This function is only for AI or Expert mode.', visibilityTime: 2000 });
            return;
        }

        if (!capturedColors) {
            Toast.show({ type: 'error', text1: 'Lỗi', text2: 'Please select Hair, Eye, Lip and Skin color.', visibilityTime: 3000 });
            return;
        }

        const isPhotoFile = (currentPhoto: PhotoAsset): currentPhoto is PhotoFile => {
            return (currentPhoto as PhotoFile).path !== undefined;
        };

        let imageFileForApi: ImageFile;
        const defaultMimeType = 'image/jpeg';
        const defaultFileName = 'photo.jpg';

        if (isPhotoFile(currentPhoto)) {
            const path = currentPhoto.path;
            const fileName = path.substring(path.lastIndexOf('/') + 1) || defaultFileName;
            const fileExtension = fileName.split('.').pop()?.toLowerCase();
            let mimeType = defaultMimeType;
            if (fileExtension === 'png') mimeType = 'image/png';
            else if (fileExtension === 'heic') mimeType = 'image/heic';

            imageFileForApi = {
                uri: `file://${path}`,
                type: mimeType,
                name: fileName,
            };
        } else if (currentPhoto && currentPhoto.uri) {
            const uri = currentPhoto.uri;
            const fileName = currentPhoto.fileName || uri.substring(uri.lastIndexOf('/') + 1) || defaultFileName;
            imageFileForApi = {
                uri: uri,
                type: currentPhoto.type || defaultMimeType,
                name: fileName,
            };
        } else {
            Toast.show({ type: 'error', text1: 'Error', text2: 'Invalid image data.', visibilityTime: 3000 });
            return;
        }

        const aiTestParams: ColorTestRequest = {
            imageFile: imageFileForApi,
            hairColor: capturedColors.Hair.hex,
            eyesColor: capturedColors.Eyes.hex,
            lipsColor: capturedColors.Lips.hex,
            skinColor: capturedColors.Skin.hex,
        };

        setIsLoading(true);
        try {
            // [Check Subscription Logic]
            const activeSubs = await getActiveSubscriptions();
            const isAiMode = captureMode === 'ai';

            const hasUsage = activeSubs.some(sub => {
                const name = sub.servicePackage?.name?.toLowerCase() || '';
                const uses = sub.remainingUses || 0;

                if (isAiMode) {
                    return (name.includes('ai') || name.includes('test')) && uses > 0;
                } else {
                    return (name.includes('expert') || name.includes('suggestion')) && uses > 0;
                }
            });

            if (!hasUsage) {
                setShowSubscriptionModal(true);
                return;
            }

            // Execute Test
            if (captureMode === 'ai') {
                const result = await aiColorTest(aiTestParams);
                setAiResultData(result);
                setShowAiResultModal(true);
            } else {
                await expertColorTest(aiTestParams);
                setShowExpertSuccessModal(true);
                handleRetake();
            }
        } catch (error) {
            console.error(`Error calling ${captureMode.toUpperCase()} API:`, error);
            Toast.show({
                type: 'error',
                text1: 'Lỗi API',
                text2: 'Thử nghiệm AI thất bại. Vui lòng thử lại.',
                visibilityTime: 4000
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleBuyPackage = () => {
        setShowSubscriptionModal(false);
        navigation.navigate('PackageScreen');
    };

    const handleNavigateToAiDetail = (result: AiColorTestResponse) => {
        if (fullPreviewUri) {
            setShowAiResultModal(false);
            navigation.navigate('AiResultDetail', {
                resultData: result,
                currentPhotoUri: fullPreviewUri
            });
        } else {
            Toast.show({ type: 'error', text1: 'Lỗi', text2: 'Không có dữ liệu chi tiết ảnh.', visibilityTime: 2000 });
        }
    };

    const handleCloseAiModal = () => {
        setShowAiResultModal(false);
        setAiResultData(null);
    };

    useEffect(() => {
        const requestPermissions = async () => {
            const cameraPermission = await Camera.requestCameraPermission();

            if (Platform.OS === 'android') {
                await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE
                );
            }

            if (cameraPermission === 'granted') {
                setHasPermission(true);
            } else {
                Alert.alert('Permission Error', 'No access to camera.');
            }
        };
        requestPermissions();
    }, []);

    useEffect(() => {
        if (cameraPosition === 'back' && backCamera) {
            setActiveDevice(backCamera);
        } else if (cameraPosition === 'front' && frontCamera) {
            setActiveDevice(frontCamera);
        } else if (!activeDevice && devices.length > 0) {
            setActiveDevice(devices[0]);
        }
    }, [cameraPosition, backCamera, frontCamera, devices]);

    useEffect(() => {
        fetchColorFilters();
    }, [fetchColorFilters]);

    const handleToggleCamera = useCallback(() => {
        if (backCamera && frontCamera) {
            setCameraPosition(prev => (prev === 'back' ? 'front' : 'back'));
        } else {
            Alert.alert('Notice', 'Only one camera found.');
        }
    }, [backCamera, frontCamera]);

    const handleTakePhoto = async () => {
        if (cameraRef.current && activeDevice) {
            try {
                const photo: PhotoFile = await cameraRef.current.takePhoto({ flash: flashMode });
                const uri = `file://${photo.path}`;
                setCurrentPhoto(photo);
                setFullPreviewUri(uri);
            } catch (e) {
                console.error("Error taking photo", e);
                Alert.alert('Error', 'Could not take photo.');
            }
        }
    };

    const handleLaunchLibrary = () => {
        const options: ImageLibraryOptions = { mediaType: 'photo', selectionLimit: 1 };
        launchImageLibrary(options, (response) => {
            if (response.didCancel || response.errorCode || !response.assets || response.assets.length === 0) {
                console.log('User cancelled or error');
                return;
            }
            const asset = response.assets[0];
            if (asset.uri) {
                setCurrentPhoto(asset);
                setFullPreviewUri(asset.uri);
            }
        });
    };

    const handleRetake = () => {
        setFullPreviewUri(null);
        setCurrentPhoto(null);
        setCapturedColors(null);
        setShowSavedColorPopup(false);
        if (captureMode === 'ai' || captureMode === 'expert') {
            setShowSkiaPicker(true);
        } else {
            setShowSkiaPicker(false);
        }
    };

    const handleToggleFlash = () => {
        setFlashMode(prevMode => {
            if (prevMode === 'off') return 'on';
            if (prevMode === 'on') return 'auto';
            return 'off';
        });
    };

    const getFlashIcon = () => {
        if (flashMode === 'on') return 'flash';
        if (flashMode === 'auto') return 'flash-auto';
        return 'flash-off';
    };

    if (!hasPermission) {
        return <View style={styles.container}><Text style={styles.loadingText}>Requesting Camera Permissions...</Text></View>;
    }
    if (!activeDevice) {
        return <View style={styles.container}><Text style={styles.loadingText}>No camera devices found.</Text></View>;
    }

    const shouldShowColorOverlay = captureMode === 'manual' && selectedColorInfo.id !== DEFAULT_COLOR.id && !showColorPopup;
    const shouldShowFrame = (captureMode === 'ai' || captureMode === 'expert') && !fullPreviewUri;
    const shouldShowEyeDropper = (captureMode === 'ai' || captureMode === 'expert') && fullPreviewUri;
    const shouldShowSavedColorButton = captureMode === 'manual' && selectedColorInfo.id !== DEFAULT_COLOR.id && !showColorPopup;
    const shouldShowModeDropdown = fullPreviewUri && (captureMode === 'ai' || captureMode === 'expert');

    const renderColorBlock = (attribute: AttributeColor) => {
        return (
            <TouchableOpacity
                key={attribute}
                style={styles.colorBlockWrapper}
                onPress={handleShowSkiaPicker}
            >
                <View
                    style={[
                        styles.colorSquare,
                        { backgroundColor: capturedColors![attribute].hex }
                    ]}
                />
                <Text style={styles.colorLabel}>{attribute}</Text>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            {/* Loading Overlay */}
            {isLoading && (
                <View style={styles.loadingOverlayApi}>
                    <ActivityIndicator size="large" color="#4C7BE2" />
                    <Text style={{ color: 'white', marginTop: 10, fontWeight: 'bold' }}>Processing...</Text>
                </View>
            )}

            <Camera
                ref={cameraRef}
                style={StyleSheet.absoluteFill}
                device={activeDevice}
                isActive={!fullPreviewUri}
                photo={true}
                video={false}
            />

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
            {shouldShowFrame && (
                <View style={styles.invertedColorFrame} pointerEvents="none">
                    <View style={styles.invertedFrameInnerOval} />
                </View>
            )}

            {/* Preview Area (If photo taken) */}
            {fullPreviewUri && (
                <View style={styles.previewContainer}>

                    <Image source={{ uri: fullPreviewUri }} style={styles.previewImage} />

                    <View style={[styles.topControls, { paddingTop: insets.top + 10, justifyContent: 'space-between', paddingHorizontal: 15 }]}>
                        <TouchableOpacity style={styles.topControlButton} onPress={handleRetake}>
                            <Ionicons name="arrow-back" size={30} color="white" />
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.topControlButton} onPress={handleToggleLeftControls}>
                            <Entypo name={showLeftControls ? "chevron-up" : "chevron-down"} size={30} color="white" />
                        </TouchableOpacity>
                    </View>

                    {shouldShowModeDropdown && (
                        <View style={[styles.modeDropdownWrapper, { bottom: insets.bottom + 70 }]}>
                            <TouchableOpacity style={styles.modeDropdownButton} onPress={() => setShowModeDropdown(prev => !prev)}>
                                <Text style={styles.modeDropdownText}>{captureMode.toUpperCase()}</Text>
                                <Ionicons name={showModeDropdown ? "chevron-up" : "chevron-down"} size={20} color="white" />
                            </TouchableOpacity>

                            {showModeDropdown && (
                                <View style={styles.modeDropdownList}>
                                    {['ai', 'expert']
                                        .filter(mode => mode !== captureMode)
                                        .map((mode) => (
                                            <TouchableOpacity
                                                key={mode}
                                                style={styles.dropdownItem}
                                                onPress={() => handleChangeCaptureModePreview(mode as 'ai' | 'expert')}
                                            >
                                                <Text style={styles.dropdownItemText}>{mode.toUpperCase()}</Text>
                                            </TouchableOpacity>
                                        ))}
                                </View>
                            )}
                        </View>
                    )}

                    <TouchableOpacity
                        style={[styles.sendButton, { bottom: insets.bottom + 70 }]}
                        onPress={captureMode === 'manual' ? handleManualTest : handleColorTest}
                    >
                        <View style={styles.sendButtonContent}>
                            <Text style={styles.buttonText}>SEND</Text>
                        </View>
                    </TouchableOpacity>
                    {capturedColors && (
                        <View style={[styles.paletteContainer, { bottom: 150 + insets.bottom }]}>
                            {Object.keys(DEFAULT_SELECTED_COLORS).map(key =>
                                renderColorBlock(key as AttributeColor)
                            )}
                        </View>
                    )}

                </View>
            )}

            {/* Top Navigation Bar (Hidden in preview) */}
            {!fullPreviewUri && (
                <View style={[styles.topControls, { paddingTop: insets.top + 10 }]}>
                    <TouchableOpacity style={styles.topControlButton} onPress={handleGoBack}>
                        <Ionicons name="close" size={30} color="white" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.topControlButton} onPress={handleToggleFlash}>
                        <MaterialCommunityIcons name={getFlashIcon()} size={30} color="white" />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.topControlButton} onPress={handleToggleLeftControls}>
                        <Entypo name={showLeftControls ? "chevron-up" : "chevron-down"} size={30} color="white" />
                    </TouchableOpacity>
                </View>
            )}

            {/* Vertical Right Controls (Hidden in preview) */}
            {showLeftControls && (
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
                        onPress={handleShowPalettePicker}
                    >
                        <Ionicons name="grid" size={24} color="white" />
                    </TouchableOpacity>

                    {shouldShowEyeDropper && (
                        <TouchableOpacity
                            style={styles.leftControlButton}
                            onPress={handleShowSkiaPicker}
                        >
                            <FontAwesome name="eyedropper" size={24} color="white" />
                        </TouchableOpacity>)}
                    {captureMode === 'manual' && (
                        <TouchableOpacity
                            style={styles.leftControlButton}
                            onPress={() => setShowSavedColorPopup(true)}
                        >
                            <FontAwesome name="tags" size={24} color="white" />
                        </TouchableOpacity>)}
                </View>
            )}

            {/* Tag Name Container */}
            {!showColorPopup && !(captureMode === 'ai' || captureMode === 'expert') && (
                <View style={styles.filterTagContainer}>
                    <View style={styles.filterRow}>
                        {selectedColorInfo.id !== DEFAULT_COLOR.id && (
                            <View style={styles.tagNameBox}>
                                <TouchableOpacity
                                    style={[
                                        styles.singleColorButton,
                                        { backgroundColor: selectedColorInfo.hexCode },
                                    ]}
                                    onPress={() => setShowColorPicker(true)}
                                />
                                <Text style={styles.tagNameText}>
                                    {selectedColorInfo.name.toUpperCase()}
                                </Text>
                                <TouchableOpacity
                                    style={styles.closeIcon}
                                    onPress={() => setSelectedColorInfo(DEFAULT_COLOR)}>
                                    <Ionicons name="close" size={18} color="white" />
                                </TouchableOpacity>
                            </View>
                        )}
                        {shouldShowSavedColorButton && (
                            <TouchableOpacity style={styles.saveColorButton} onPress={handleSaveColor}>
                                <Ionicons name="bookmark" size={24} color="white" />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            )}

            {/* Bottom Navigation Bar and Modes */}
            {!fullPreviewUri && (
                <View style={[styles.bottomNavigationWrapper, { paddingBottom: insets.bottom }]}>

                    {/* 4. Conditional Rendering for Tab Selector based on Role */}
                    {!isUserExpert && (
                        <View style={[styles.captureModeSelector, { width: TAB_AREA_WIDTH, alignSelf: 'center' }]}>

                            <Animated.View style={[
                                styles.modeHighlight,
                                {
                                    transform: [{
                                        translateX: highlightAnim
                                    }]
                                }
                            ]} />

                            <TouchableOpacity style={[styles.tabButton]} onPress={() => handleChangeCaptureMode('manual')}>
                                <Text style={[styles.modeText, captureMode === 'manual' && styles.activeModeText]}>Manual</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.tabButton]} onPress={() => handleChangeCaptureMode('ai')}>
                                <Text style={[styles.modeText, captureMode === 'ai' && styles.activeModeText]}>AI</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.tabButton]} onPress={() => setCaptureMode('expert')}>
                                <Text style={[styles.modeText, captureMode === 'expert' && styles.activeModeText]}>Expert</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    <View style={styles.mainControlsRow}>
                        <TouchableOpacity style={styles.smallIconContainer} onPress={handleLaunchLibrary}>
                            <AntDesign name="picture" size={24} color="white" />
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.captureButton} onPress={handleTakePhoto} disabled={!activeDevice}>
                            <View style={[styles.innerCaptureButton, { backgroundColor: selectedColorInfo.hexCode }]} />
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.smallIconContainer} onPress={handleToggleCamera} disabled={!backCamera || !frontCamera}>
                            <FontAwesome6 name="arrows-rotate" size={24} color="white" />
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            <ColorPopup
                showColorPicker={showColorPopup}
                setShowColorPicker={setShowColorPicker}
                allColorFilters={colorFilters}
                selectedColorInfo={selectedColorInfo}
                handleColorSelect={handleColorSelect}
                showTabs={true}
                getColorTypeApi={getColorType}
                getColorsByTypeApi={getColorsByType}
            />
            <ColorPickerPopup
                isVisible={showColorPickerPopup}
                onClose={() => setShowColorPickerTool(false)}
                onColorSelected={handleColorSelect}
                initialColorHex={selectedColorInfo.hexCode}
                colorFilters={colorFilters}
            />
            <PalettePopup
                showPalettePicker={showPalettPopup}
                setShowPalettePicker={setShowPalettePicker}
                colorFilters={colorFilters}
                handleColorSelect={handleColorSelect}
                colorTypes={colorTypes}
                palettesBySeason={palettesBySeason}
                isLoading={isLoadingPalettes}
                selectedTabName={selectedTabName}
                loadPalettesByTypeId={loadPalettesByTypeId}
                setSelectedTabName={setSelectedTabName}
            />

            {showSkiaPicker && fullPreviewUri && (
                <ColorPickerOverlay
                    imageUri={fullPreviewUri}
                    initialColors={capturedColors}
                    onClose={() => setShowSkiaPicker(false)}
                    onDone={(colors) => {
                        setCapturedColors(colors);
                        console.log("Màu đã chọn:", colors);
                        setShowSkiaPicker(false);
                    }}
                />
            )}
            <ColorPopup
                showColorPicker={showSavedColorPopup}
                setShowColorPicker={setShowSavedColorPopup}
                allColorFilters={savedColors}
                selectedColorInfo={selectedColorInfo}
                handleColorSelect={handleColorSelect}
                title="SAVED COLORS"
                canDelete={true}
                onDeleteColor={handleDeleteSavedColor}
            />

            <ManualResultModal
                isVisible={showManualResultModal}
                onClose={handleCloseManualModal}
                resultData={manualResultData}
                onNavigateToDetail={handleNavigateToManualDetail}
                currentPhotoUri={fullPreviewUri}
            />

            <AiTestResultModal
                isVisible={showAiResultModal}
                onClose={handleCloseAiModal}
                resultData={aiResultData}
                currentPhotoUri={fullPreviewUri}
                onNavigateToDetail={() => aiResultData && handleNavigateToAiDetail(aiResultData)}
            />

            <ExpertSuccessModal
                isVisible={showExpertSuccessModal}
                onClose={() => setShowExpertSuccessModal(false)}
            />

            <SubscriptionAlertModal
                isVisible={showSubscriptionModal}
                onClose={() => setShowSubscriptionModal(false)}
                onConfirm={handleBuyPackage}
            />

        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    loadingText: { color: '#fff', textAlign: 'center', marginTop: screenHeight / 2 },

    // Style cho Loading Overlay API
    loadingOverlayApi: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 999,
    },

    invertedColorFrame: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 4,
    },
    invertedFrameInnerOval: {
        width: OVAL_WIDTH,
        height: OVAL_HEIGHT,
        borderRadius: OVAL_HEIGHT / 2,
        backgroundColor: 'transparent',
        borderWidth: 4,
        borderColor: 'white',
    },

    // --- Styles for Preview ---
    previewContainer: {
        flex: 1, backgroundColor: 'black'
    },
    previewImage: {
        width: screenWidth,
        height: screenHeight,
        position: 'absolute',
        top: 0,
        left: 0,
    },
    captionInput: {
        position: 'absolute',
        bottom: 120,
        width: '80%',
        alignSelf: 'center',
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        padding: 10,
        borderRadius: 10,
        zIndex: 3,
    },
    storyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 25,
        paddingVertical: 8,
        paddingHorizontal: 15,
    },
    profilePicture: {
        width: 30,
        height: 30,
        borderRadius: 15,
        marginRight: 8,
    },
    storyButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 14,
    },
    friendButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 25,
        paddingVertical: 8,
        paddingHorizontal: 15,
        marginLeft: 10,
    },
    friendButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 14,
        marginLeft: 5,
    },
    sendButton: {
        position: 'absolute',
        right: 30,
        backgroundColor: '#0095F6',
        borderRadius: 25,
        padding: 10,
        marginLeft: 'auto',
        paddingHorizontal: 20,
        paddingVertical: 10,
    },
    sendButtonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 2,
    },
    sendIcon: {
        marginLeft: 5,
    },
    buttonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },

    // Top Navigation Bar
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
    },

    // Vertical Right Controls
    rightControls: {
        position: 'absolute',
        right: 15,
        alignItems: 'center',
        zIndex: 3,
    },
    leftControlButton: {
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        borderRadius: 20,
        padding: 8,
        marginBottom: 10,
    },
    leftControlText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },

    // =========================================================
    // Styles for Tag Name
    // =========================================================
    filterTagContainer: {
        position: 'absolute',
        bottom: 170,
        left: 0,
        right: 0,
        zIndex: 3,
        alignItems: 'center',
    },
    filterRow: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
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
        width: 30,
        height: 30,
        borderRadius: 30,
        borderWidth: 3,
        borderColor: 'white',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    saveColorButton: {
        position: 'absolute',
        right: 20,
        width: 45,
        height: 45,
        borderRadius: 22.5,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'white',
    },

    // =========================================================
    // Styles for Bottom Navigation
    // =========================================================
    bottomNavigationWrapper: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: 3,
    },
    captureModeSelector: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 10,
        position: 'relative',
        height: 45,
    },
    tabButton: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modeHighlight: {
        position: 'absolute',
        bottom: 8,
        height: 3,
        width: HIGHLIGHT_WIDTH,
        borderRadius: 2,
        backgroundColor: '#fff',
        left: 0,
    },
    modeText: {
        color: 'rgba(255, 255, 255, 0.6)',
        fontSize: 16,
        fontWeight: 'bold',
    },
    activeModeText: {
        color: 'white',
    },
    mainControlsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingVertical: 20,
        paddingHorizontal: 10,
    },
    smallIconContainer: {
        width: 50,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
    },
    captureButton: {
        width: 70, height: 70,
        borderRadius: 35,
        borderWidth: 4,
        borderColor: '#fff',
        backgroundColor: 'transparent',
        justifyContent: 'center',
        alignItems: 'center',
    },
    innerCaptureButton: {
        width: 60,
        height: 60,
        borderRadius: 30
    },
    colorBlockWrapper: {
        flexDirection: 'column',
        alignItems: 'center',
        marginBottom: 10,
        padding: 5,
        borderRadius: 5,
    },
    colorSquare: {
        width: 40,
        height: 40,
        borderRadius: 5,
        borderWidth: 2,
        borderColor: 'white',
        marginBottom: 5,
    },
    colorLabel: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
    },
    paletteContainer: {
        position: 'absolute',
        right: 20,
        backgroundColor: 'rgba(65, 53, 53, 0.6)',
        borderRadius: 10,
        padding: 10,
    },
    // =========================================================
    // Styles for Mode Dropdown (NEW)
    // =========================================================
    modeDropdownWrapper: {
        position: 'absolute',
        left: 0,
        right: 0,
        alignItems: 'center',
    },
    modeDropdownButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        borderRadius: 20,
        paddingHorizontal: 15,
        paddingVertical: 8,
    },
    modeDropdownText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
        marginRight: 8,
    },
    modeDropdownList: {
        position: 'absolute',
        top: 45,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        borderRadius: 10,
        minWidth: 100,
        alignItems: 'center',
    },
    dropdownItem: {
        paddingVertical: 8,
        paddingHorizontal: 15,
        width: '100%',
        alignItems: 'center',
    },
    dropdownItemText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '500',
    },
});

export default CameraScreen;
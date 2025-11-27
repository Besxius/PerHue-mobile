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
    TextInput,
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
import Svg, { Rect, Mask, Circle, Defs, Ellipse } from 'react-native-svg';
import { CapsulePaletteModel, Color, ColorType } from '../types/dataModels';
import { getCorlorListSpectrum } from '../api/colorApi';
import ColorPopup from '../components/ColorPopup';
import ColorPickerPopup from '../components/ColorPickerPopup';
import PalettePopup from '../components/PalettePopup';
import { getCapsulePalettesByType, getColorType } from '../api/capsulePaletteApi';
import ColorPickerOverlay, { AttributeColor, DEFAULT_SELECTED_COLORS, SelectedColors } from '../components/ColorPickerOverlay';
import { FontAwesome } from '@expo/vector-icons';

// Get screen dimensions
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Define type for selected photo
type PhotoAsset = PhotoFile | Asset | null;
type CaptureMode = 'manual' | 'ai' | 'expert';

// Default color value
const DEFAULT_COLOR: Color = { id: 0, name: "Default White", hexCode: "white" };

const OVAL_WIDTH = screenWidth * 0.55;
const OVAL_HEIGHT = screenWidth * 0.7;
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
    const [hasPermission, setHasPermission] = useState(false);
    const [flashMode, setFlashMode] = useState<'off' | 'on' | 'auto'>('off');

    const [fullPreviewUri, setFullPreviewUri] = useState<string | null>(null);
    const [currentPhoto, setCurrentPhoto] = useState<PhotoAsset>(null);
    const [captionText, setCaptionText] = useState('');

    const [captureMode, setCaptureMode] = useState<CaptureMode>('manual');

    const [showLeftControls, setShowLeftControls] = useState(true);

    const [showColorPicker, setShowColorPicker] = useState(false);

    const [showColorPickerTool, setShowColorPickerTool] = useState(false);

    const [showPalettePicker, setShowPalettePicker] = useState(false);

    const [selectedColorInfo, setSelectedColorInfo] = useState<Color>(DEFAULT_COLOR);

    const [colorFilters, setColorFilters] = useState<Color[]>([]);

    const highlightAnim = useRef(new Animated.Value(TAB_POSITIONS.manual)).current;
    const [colorTypes, setColorTypes] = useState<ColorType[]>([]);
    const [palettesBySeason, setPalettesBySeason] = useState<CapsulePaletteModel[]>([]);
    const [isLoadingPalettes, setIsLoadingPalettes] = useState(false);
    const [selectedTabName, setSelectedTabName] = useState<string>('');

    const [showSkiaPicker, setShowSkiaPicker] = useState(false);
    const [capturedColors, setCapturedColors] = useState<SelectedColors | null>(null);

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

    const handleUpload = () => {
        if (!currentPhoto) {
            Alert.alert('Error', 'No photo to upload.');
            return;
        }
        Alert.alert('Simulated Upload', `Ready to upload photo from: ${'path' in currentPhoto ? currentPhoto.path : currentPhoto.uri}`, [
            { text: "OK", onPress: handleRetake }
        ]);
    };

    const handleRetake = () => {
        setFullPreviewUri(null);
        setCurrentPhoto(null);
        setCaptionText('');
        setCapturedColors(null);
        if (captureMode === 'ai' || captureMode === 'expert') {
            setShowSkiaPicker(true);
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

    const shouldShowColorOverlay = captureMode === 'manual' && selectedColorInfo.id !== DEFAULT_COLOR.id && !showColorPicker;
    const shouldShowFrame = (captureMode === 'ai' || captureMode === 'expert') && !fullPreviewUri;
    const shouldShowEyeDropper = (captureMode === 'ai' || captureMode === 'expert') && fullPreviewUri;

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

                    {/* <TextInput
                        style={styles.captionInput}
                        value={captionText}
                        onChangeText={setCaptionText}
                        placeholder="Add a caption..."
                        placeholderTextColor="rgba(255, 255, 255, 0.7)"
                    /> */}

                    <TouchableOpacity style={[styles.sendButton, { bottom: insets.bottom + 70 }]} onPress={handleUpload}>
                        <View style={styles.sendButtonContent}>
                            <Text style={styles.buttonText}>SEND</Text>
                            {/* <Ionicons name="chevron-forward" size={24} color="white" style={styles.sendIcon} /> */}
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
                </View>
            )}

            {/* Tag Name Container (Hidden in preview and when Popup is open) */}
            {!showColorPicker && (
                <View style={styles.filterTagContainer}>
                    <View style={styles.filterRow}>
                        {/* 1. Tag Name */}
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
                    </View>
                </View>
            )}

            {/* Bottom Navigation Bar and Modes (Hidden in preview) */}
            {!fullPreviewUri && (
                <View style={[styles.bottomNavigationWrapper, { paddingBottom: insets.bottom }]}>
                    <View style={[styles.captureModeSelector, { width: TAB_AREA_WIDTH, alignSelf: 'center' }]}>

                        <Animated.View style={[
                            styles.modeHighlight,
                            {
                                transform: [{
                                    translateX: highlightAnim
                                }]
                            }
                        ]} />

                        {/* Tab Buttons */}
                        <TouchableOpacity style={[styles.tabButton]} onPress={() => setCaptureMode('manual')}>
                            <Text style={[styles.modeText, captureMode === 'manual' && styles.activeModeText]}>Manual</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.tabButton]} onPress={() => setCaptureMode('ai')}>
                            <Text style={[styles.modeText, captureMode === 'ai' && styles.activeModeText]}>AI</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.tabButton]} onPress={() => setCaptureMode('expert')}>
                            <Text style={[styles.modeText, captureMode === 'expert' && styles.activeModeText]}>Expert</Text>
                        </TouchableOpacity>
                    </View>

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
                showColorPicker={showColorPicker}
                setShowColorPicker={setShowColorPicker}
                colorFilters={colorFilters}
                selectedColorInfo={selectedColorInfo}
                handleColorSelect={handleColorSelect}
            />
            <ColorPickerPopup
                isVisible={showColorPickerTool}
                onClose={() => setShowColorPickerTool(false)}
                onColorSelected={handleColorSelect}
                initialColorHex={selectedColorInfo.hexCode}
                colorFilters={colorFilters}
            />
            <PalettePopup
                showPalettePicker={showPalettePicker}
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
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    loadingText: { color: '#fff', textAlign: 'center', marginTop: screenHeight / 2 },

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
        right: 20,
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
        // marginHorizontal: 15,
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
        // bottom: 150, // Đã chuyển sang inline style
        right: 20,
        backgroundColor: 'rgba(65, 53, 53, 0.6)',
        borderRadius: 10,
        padding: 10,
    },
});

export default CameraScreen;
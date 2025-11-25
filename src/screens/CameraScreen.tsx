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
    TextInput,
    Animated,
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
import Svg, { Rect, Mask, Circle, Defs, Ellipse } from 'react-native-svg'; // <-- IMPORT MỚI
import { Color } from '../types/dataModels';
import ColorPickerPopup from '../components/ColorPickerPopup';
import { getCorlorListSpectrum } from '../api/colorApi';
import ColorPickerTool from '../components/ColorPickerTool';
import PalettePickerPopup from '../components/PalettePickerPopup';

// Lấy kích thước màn hình
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Định nghĩa kiểu dữ liệu cho ảnh được chọn
type PhotoAsset = PhotoFile | Asset | null;
type CaptureMode = 'manual' | 'ai' | 'expert';

// Giá trị màu mặc định
const DEFAULT_COLOR: Color = { id: 0, name: "Default White", hexCode: "white" };

const OVAL_WIDTH = screenWidth * 0.55; // Chiều rộng của hình bầu dục
const OVAL_HEIGHT = screenWidth * 0.7; // Chiều cao của hình bầu dục (cao hơn chiều rộng một chút)
const OVAL_RADIUS_X = OVAL_WIDTH / 2;
const OVAL_RADIUS_Y = OVAL_HEIGHT / 2;
const OVAL_CENTER_X = screenWidth / 2;
const OVAL_CENTER_Y = screenHeight / 2;

const HIGHLIGHT_WIDTH = 50;
const TOTAL_WIDTH_TABS = screenWidth * 0.7;
const TAB_AREA_WIDTH = TOTAL_WIDTH_TABS;
const TAB_ITEM_WIDTH = TAB_AREA_WIDTH / 3;

// 1. Vị trí dịch chuyển TƯƠNG ĐỐI bên trong vùng TAB_AREA_WIDTH
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

    useEffect(() => {
        // Tính toán vị trí dịch chuyển dựa trên chế độ đang chọn
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
            console.error("Lỗi khi tải màu từ API:", error);
            Alert.alert("Lỗi tải màu", "Không thể tải dữ liệu màu từ API.");
        }
    }, []);

    const handleToggleLeftControls = () => {
        setShowLeftControls(prev => !prev);
    };

    const handleGoBack = () => {
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
                Alert.alert('Lỗi Quyền', 'Không có quyền truy cập camera.');
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
            Alert.alert('Thông báo', 'Chỉ tìm thấy một camera.');
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
                console.error("Lỗi khi chụp ảnh", e);
                Alert.alert('Lỗi', 'Không thể chụp ảnh.');
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
            Alert.alert('Lỗi', 'Không có ảnh để upload.');
            return;
        }
        Alert.alert('Upload Giả lập', `Đã sẵn sàng upload ảnh từ: ${'path' in currentPhoto ? currentPhoto.path : currentPhoto.uri}`, [
            { text: "OK", onPress: handleRetake }
        ]);
    };

    const handleRetake = () => {
        setFullPreviewUri(null);
        setCurrentPhoto(null);
        setCaptionText('');
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
        return <View style={styles.container}><Text style={styles.loadingText}>Đang yêu cầu quyền truy cập Camera...</Text></View>;
    }
    if (!activeDevice) {
        return <View style={styles.container}><Text style={styles.loadingText}>Không tìm thấy thiết bị camera nào.</Text></View>;
    }

    const shouldShowColorOverlay = captureMode === 'manual' && selectedColorInfo.id !== DEFAULT_COLOR.id && !fullPreviewUri && !showColorPicker;
    const shouldShowFrame = (captureMode === 'ai' || captureMode === 'expert') && !fullPreviewUri;

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

            {/* ********************************************** */}
            {/* SỬ DỤNG REACT-NATIVE-SVG CHO MASKING */}
            {/* ********************************************** */}
            {shouldShowColorOverlay && (
                <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
                    <Svg
                        height={screenHeight}
                        width={screenWidth}
                        style={[StyleSheet.absoluteFill, { zIndex: 1 }]}
                    >
                        <Defs>
                            {/* 1. Định nghĩa Mask: Mask Hole (Hình bầu dục) */}
                            {/* Màu trắng = Vùng hiển thị. Màu đen = Vùng bị cắt bỏ/trong suốt */}
                            <Mask id="ovalMask" x="0" y="0" width={screenWidth} height={screenHeight}>
                                {/* Lớp nền (Background) mask: MÀU TRẮNG (Hiển thị toàn bộ) */}
                                <Rect x="0" y="0" width={screenWidth} height={screenHeight} fill="white" />

                                {/* Lỗ (Hole) mask: MÀU ĐEN (Cắt bỏ/Trong suốt) */}
                                <Ellipse
                                    cx={OVAL_CENTER_X}
                                    cy={OVAL_CENTER_Y}
                                    rx={OVAL_RADIUS_X}
                                    ry={OVAL_RADIUS_Y}
                                    fill="black"
                                />
                            </Mask>
                        </Defs>

                        {/* 2. Áp dụng Mask lên lớp phủ màu */}
                        {/* Rect này là lớp phủ màu rắn (SOLID COLOR OVERLAY) */}
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

            {/* Vùng Preview (Nếu có ảnh) */}
            {fullPreviewUri && (
                <View style={styles.previewContainer}>
                    <Image source={{ uri: fullPreviewUri }} style={styles.previewImage} />

                    <View style={[styles.topControls, { paddingTop: insets.top + 10, justifyContent: 'space-between', paddingHorizontal: 15 }]}>
                        <TouchableOpacity style={styles.topControlButton} onPress={handleRetake}>
                            <Ionicons name="arrow-back" size={30} color="white" />
                        </TouchableOpacity>
                    </View>

                    <TextInput
                        style={styles.captionInput}
                        value={captionText}
                        onChangeText={setCaptionText}
                        placeholder="Thêm chú thích..."
                        placeholderTextColor="rgba(255, 255, 255, 0.7)"
                    />

                    <View style={[styles.previewActions, { paddingBottom: insets.bottom + 10 }]}>
                        <TouchableOpacity style={styles.storyButton}>
                            <Image
                                source={{ uri: 'https://i.pravatar.cc/150?img=1' }}
                                style={styles.profilePicture}
                            />
                            <Text style={styles.storyButtonText}>Tin của bạn</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.friendButton}>
                            <Ionicons name="star" size={20} color="white" />
                            <Text style={styles.friendButtonText}>Bạn thân</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.sendButton} onPress={handleUpload}>
                            <Ionicons name="chevron-forward" size={24} color="white" />
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {/* Thanh điều hướng trên cùng (Ẩn trong preview) */}
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

            {/* Các nút chức năng dọc bên phải (Ẩn trong preview) */}
            {!fullPreviewUri && showLeftControls && (
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
                </View>
            )}

            {/* Vùng chứa Tag Name (Ẩn trong preview và khi Popup đang mở) */}
            {!fullPreviewUri && !showColorPicker && (
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
                                <TouchableOpacity onPress={() => setSelectedColorInfo(DEFAULT_COLOR)} style={styles.closeIcon}>
                                    <Ionicons name="close" size={18} color="white" />
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                </View>
            )}

            {/* Thanh điều hướng dưới cùng và các chế độ (Ẩn trong preview) */}
            {!fullPreviewUri && (
                <View style={[styles.bottomNavigationWrapper, { paddingBottom: insets.bottom }]}>
                    <View style={[styles.captureModeSelector, { width: TAB_AREA_WIDTH, alignSelf: 'center' }]}>

                        {/* --- Thanh highlight ANIMATED --- */}
                        <Animated.View style={[
                            styles.modeHighlight,
                            {
                                // BỎ left: INITIAL_OFFSET, chỉ dịch chuyển bằng highlightAnim
                                transform: [{
                                    translateX: highlightAnim
                                }]
                            }
                        ]} />

                        {/* Các nút Tab */}
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

            <ColorPickerPopup
                showColorPicker={showColorPicker}
                setShowColorPicker={setShowColorPicker}
                colorFilters={colorFilters}
                selectedColorInfo={selectedColorInfo}
                handleColorSelect={handleColorSelect}
            />
            <ColorPickerTool
                isVisible={showColorPickerTool}
                onClose={() => setShowColorPickerTool(false)}
                onColorSelected={handleColorSelect}
                initialColorHex={selectedColorInfo.hexCode}
                colorFilters={colorFilters}
            />
            <PalettePickerPopup
                showPalettePicker={showPalettePicker}
                setShowPalettePicker={setShowPalettePicker}
                colorFilters={colorFilters}
                handleColorSelect={handleColorSelect}
            />
        </View>
    );
};

// =========================================================
// --- STYLESHEET (CẬP NHẬT) ---
// =========================================================
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    loadingText: { color: '#fff', textAlign: 'center', marginTop: screenHeight / 2 },

    // --- Styles cho SVG Masking (Cập nhật Frame Định vị) ---
    // Khung định vị vẫn sử dụng View để nằm trên cùng
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
    invertedFrameInnerOval: { // <-- STYLE MỚI CHO HÌNH BẦU DỤC
        width: OVAL_WIDTH,
        height: OVAL_HEIGHT,
        borderRadius: OVAL_HEIGHT / 2, // Tạo hình bầu dục từ borderRadius của hình chữ nhật
        backgroundColor: 'transparent', // Trong suốt
        borderWidth: 4,
        borderColor: 'white', // Viền trắng
    },
    // --- Kết thúc Styles cho SVG Masking ---

    // --- Styles cho Preview ---
    previewContainer: { flex: 1, backgroundColor: 'black' },
    previewImage: {
        width: screenWidth,
        height: screenHeight,
        position: 'absolute',
        top: 0,
        left: 0,
    },
    captionInput: {
        position: 'absolute',
        bottom: 180,
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
    previewActions: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingTop: 15,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
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
        backgroundColor: '#0095F6',
        borderRadius: 25,
        padding: 10,
        marginLeft: 'auto',
    },

    // Thanh điều hướng trên cùng
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

    // Các nút chức năng dọc bên phải
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
    // Styles cho Tag Name
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
    // Styles cho Bottom Navigation
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
        width: 70, height: 70, borderRadius: 35,
        borderWidth: 4, borderColor: '#fff',
        backgroundColor: 'transparent',
        justifyContent: 'center', alignItems: 'center',
    },
    innerCaptureButton: { width: 60, height: 60, borderRadius: 30 },
});

export default CameraScreen;
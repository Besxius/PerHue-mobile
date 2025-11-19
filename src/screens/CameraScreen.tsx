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
    ScrollView,
} from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

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
import Feather from '@expo/vector-icons/Feather';
import Entypo from '@expo/vector-icons/Entypo';

// Lấy kích thước màn hình
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Định nghĩa kiểu dữ liệu cho ảnh được chọn
type PhotoAsset = PhotoFile | Asset | null;

// Định nghĩa kiểu dữ liệu cho màu
interface ColorFilter {
    id: number;
    name: string;
    hexCode: string;
}

// Mảng các màu lọc (filter colors) - Giữ nguyên
const COLOR_FILTERS: ColorFilter[] = [
    { id: 1, name: "Fresh Guacamole", hexCode: "#AEBE89" },
    { id: 2, name: "Aloe Cream", hexCode: "#DAE3BB" },
    { id: 3, name: "White Lace", hexCode: "#FFF7EC" },
    { id: 4, name: "Brook Green", hexCode: "#A8EAD5" },
    { id: 5, name: "Earthy Cane", hexCode: "#C5B08B" },
    { id: 6, name: "Caraway Seeds", hexCode: "#DED5BC" },
    { id: 7, name: "Swan White", hexCode: "#F8F3E6" },
    { id: 8, name: "Frosty Pine", hexCode: "#C6CEBE" },
    { id: 9, name: "Aurora Red", hexCode: "#850121" },
    { id: 10, name: "Incarnadine", hexCode: "#B1002A" },
    { id: 11, name: "Sizzling Sunset", hexCode: "#EC7A49" },
    { id: 12, name: "Dark Scarlet Red", hexCode: "#800733" },
];

// Giá trị màu mặc định
const DEFAULT_COLOR: ColorFilter = { id: 0, name: "Default White", hexCode: "white" };


// --- Component Chính (CameraScreen) ---
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

    const [captureMode, setCaptureMode] = useState<'manual' | 'ai' | 'expert'>('manual');

    const [showLeftControls, setShowLeftControls] = useState(true);

    // State MỚI: Kiểm soát việc hiển thị Popup Dải Màu
    const [showColorPicker, setShowColorPicker] = useState(false);

    // State MỚI cho thông tin màu được chọn
    const [selectedColorInfo, setSelectedColorInfo] = useState<ColorFilter>(DEFAULT_COLOR);

    const handleToggleLeftControls = () => {
        setShowLeftControls(prev => !prev);
    };

    const handleGoBack = () => {
        navigation.goBack();
    };

    // Hàm chọn màu mới: Đóng popup sau khi chọn
    const handleColorSelect = (color: ColorFilter) => {
        setSelectedColorInfo(color);
        setShowColorPicker(false); // Đóng popup sau khi chọn màu
    };

    // --- Các hàm xử lý khác (Giữ nguyên) ---
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
        let photoPath: string | undefined;
        let mimeType: string | undefined;

        if ('path' in currentPhoto) {
            photoPath = `file://${currentPhoto.path}`;
            mimeType = 'image/jpeg';
        } else {
            photoPath = currentPhoto.uri;
            mimeType = currentPhoto.type;
        }

        Alert.alert('Upload Giả lập', `Đã sẵn sàng upload ảnh từ: ${photoPath}`, [
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
    // --- Kết thúc các hàm xử lý khác ---


    // Component Popup hiển thị toàn bộ dải màu
    const ColorPickerPopup = () => (
        <View style={styles.colorPickerPopup}>
            <Text style={styles.colorPickerTitle}>CHỌN MÀU LỌC</Text>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.popupScrollContainer}
            >
                {COLOR_FILTERS.map((color) => {
                    const isSelected = color.id === selectedColorInfo.id;
                    return (
                        <TouchableOpacity
                            key={color.id}
                            style={[
                                styles.colorFilterCircle,
                                { backgroundColor: color.hexCode },
                                isSelected && styles.activeColorFilter,
                            ]}
                            onPress={() => handleColorSelect(color)} // Sử dụng hàm chọn màu để đóng popup
                        >
                            {/* Hiển thị checkmark nếu đang chọn */}
                            {isSelected && <Ionicons name="checkmark" size={24} color="white" />}
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>
            {/* Nút đóng popup */}
            <TouchableOpacity style={styles.closePopupButton} onPress={() => setShowColorPicker(false)}>
                <Ionicons name="close-circle" size={30} color="white" />
            </TouchableOpacity>
        </View>
    );

    // --- Màn hình Camera Trực tiếp ---
    if (!hasPermission) {
        return <View style={styles.container}><Text style={styles.loadingText}>Đang yêu cầu quyền truy cập Camera...</Text></View>;
    }
    if (!activeDevice) {
        return <View style={styles.container}><Text style={styles.loadingText}>Không tìm thấy thiết bị camera nào.</Text></View>;
    }

    const getFlashIcon = () => {
        if (flashMode === 'on') return 'flash';
        if (flashMode === 'auto') return 'flash-auto';
        return 'flash-off';
    };

    return (
        <View style={styles.container}>
            <Camera
                ref={cameraRef}
                style={StyleSheet.absoluteFill}
                device={activeDevice}
                isActive={!fullPreviewUri} // Chỉ active camera khi không có preview
                photo={true}
                video={false}
            />

            {/* Vùng Preview (Nếu có ảnh) */}
            {fullPreviewUri && (
                <View style={styles.previewContainer}>
                    <Image source={{ uri: fullPreviewUri }} style={styles.previewImage} />

                    {/* Thanh điều hướng trên cùng cho Preview */}
                    <View style={[styles.topControls, { paddingTop: insets.top + 10, justifyContent: 'space-between', paddingHorizontal: 15 }]}>
                        <TouchableOpacity style={styles.topControlButton} onPress={handleRetake}>
                            <Ionicons name="arrow-back" size={30} color="white" />
                        </TouchableOpacity>
                        <View style={{ flexDirection: 'row' }}>
                            <TouchableOpacity style={styles.topControlButton}>
                                <Text style={styles.leftControlText}>Aa</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.topControlButton}>
                                <Entypo name="emoji-happy" size={30} color="white" />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.topControlButton}>
                                <FontAwesome6 name="layer-group" size={24} color="white" />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.topControlButton}>
                                <Ionicons name="musical-notes-outline" size={30} color="white" />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.topControlButton}>
                                <Entypo name="dots-three-vertical" size={30} color="white" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Input Caption */}
                    <TextInput
                        style={styles.captionInput}
                        value={captionText}
                        onChangeText={setCaptionText}
                        placeholder="Thêm chú thích..."
                        placeholderTextColor="rgba(255, 255, 255, 0.7)"
                    />

                    {/* Nút Upload/Retake trong chế độ preview */}
                    <View style={[styles.previewActions, { paddingBottom: insets.bottom + 10 }]}>
                        <TouchableOpacity style={styles.storyButton}>
                            <Image
                                source={{ uri: 'https://i.pravatar.cc/150?img=1' }} // Replace with actual profile picture
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
                    <TouchableOpacity style={styles.leftControlButton}>
                        <Text style={styles.leftControlText}>Aa</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.leftControlButton}>
                        <FontAwesome6 name="infinity" size={24} color="white" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.leftControlButton}>
                        <MaterialCommunityIcons name="view-grid-outline" size={24} color="white" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.leftControlButton}>
                        <AntDesign name="down" size={24} color="white" />
                    </TouchableOpacity>
                </View>
            )}

            {/* Vùng chứa Tag Name và Nút/Popup Dải Màu (Ẩn trong preview) */}
            {!fullPreviewUri && (
                <View style={styles.filterTagContainer}>

                    {/* Hàng chứa Tag Name và Nút Màu */}
                    {!showColorPicker ? (
                        <View style={styles.filterRow}>
                            {/* 1. Tag Name */}
                            <View style={styles.tagNameBox}>
                                {/* <TouchableOpacity style={styles.bookmarkIcon}>
                                    <Feather name="bookmark" size={16} color="white" />
                                </TouchableOpacity> */}
                                <TouchableOpacity
                                    style={[
                                        styles.singleColorButton,
                                        { backgroundColor: selectedColorInfo.hexCode },
                                    ]}
                                    onPress={() => setShowColorPicker(true)}
                                >
                                    {/* <MaterialCommunityIcons name="face-recognition" size={28} color={'rgba(255,255,255,0.9)'} /> */}
                                </TouchableOpacity>
                                <Text style={styles.tagNameText}>
                                    {selectedColorInfo.name.toUpperCase()}
                                </Text>
                                <TouchableOpacity onPress={() => setSelectedColorInfo(DEFAULT_COLOR)} style={styles.closeIcon}>
                                    <Ionicons name="close" size={18} color="white" />
                                </TouchableOpacity>
                            </View>

                            {/* 2. Nút hình tròn đơn sắc (Bên phải) */}


                        </View>
                    ) : (
                        // Popup hiển thị dải màu đầy đủ (Hiển thị phủ lên, căn giữa)
                        <ColorPickerPopup />
                    )}

                </View>
            )}


            {/* Thanh điều hướng dưới cùng và các chế độ (Ẩn trong preview) */}
            {!fullPreviewUri && (
                <View style={[styles.bottomNavigationWrapper, { paddingBottom: insets.bottom }]}>
                    {/* Các chế độ chụp: Bài viết, Tin, Thước phim */}
                    <View style={styles.captureModeSelector}>
                        <TouchableOpacity onPress={() => setCaptureMode('manual')}>
                            <Text style={[styles.modeText, captureMode === 'manual' && styles.activeModeText]}>Manual</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setCaptureMode('ai')}>
                            <Text style={[styles.modeText, captureMode === 'ai' && styles.activeModeText]}>AI</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setCaptureMode('expert')}>
                            <Text style={[styles.modeText, captureMode === 'expert' && styles.activeModeText]}>Expert</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Các nút chính: Thư viện, Nút chụp, Lật Camera */}
                    <View style={styles.mainControlsRow}>
                        {/* Nút Thư viện */}
                        <TouchableOpacity style={styles.smallIconContainer} onPress={handleLaunchLibrary}>
                            <AntDesign name="picture" size={24} color="white" />
                        </TouchableOpacity>

                        {/* Nút Chụp Ảnh (ở giữa) */}
                        <TouchableOpacity style={styles.captureButton} onPress={handleTakePhoto} disabled={!activeDevice}>
                            {/* Sử dụng selectedColorInfo.hexCode làm màu nền cho innerCaptureButton */}
                            <View style={[styles.innerCaptureButton, { backgroundColor: selectedColorInfo.hexCode }]} />
                        </TouchableOpacity>

                        {/* Nút Lật Camera */}
                        <TouchableOpacity style={styles.smallIconContainer} onPress={handleToggleCamera} disabled={!backCamera || !frontCamera}>
                            <FontAwesome6 name="arrows-rotate" size={24} color="white" />
                        </TouchableOpacity>
                    </View>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    loadingText: { color: '#fff', textAlign: 'center', marginTop: screenHeight / 2 },

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
        bottom: 180, // Căn chỉnh dưới top controls
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

    // --- Kết thúc Styles cho Preview ---

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
        zIndex: 2,
    },
    topControlButton: {
        padding: 5,
    },

    // Các nút chức năng dọc bên phải
    rightControls: {
        position: 'absolute',
        right: 15,
        alignItems: 'center',
        zIndex: 2,
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
    // Styles MỚI & Cập nhật cho Dải Màu và Tag Name
    // =========================================================
    filterTagContainer: {
        position: 'absolute',
        bottom: 170, // Đặt ở vị trí giữa, phía trên thanh bottomNavigationWrapper
        left: 0,
        right: 0,
        zIndex: 2,
        alignItems: 'center',
    },
    filterRow: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%', // Cho phép chiếm toàn bộ chiều ngang
        justifyContent: 'center', // Đẩy các phần tử sang phải
        paddingHorizontal: 20, // Khoảng cách hai bên
        marginBottom: 10,
    },
    // Tag Name Box (giữ nguyên)
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
    bookmarkIcon: {
        marginRight: 4,
    },
    closeIcon: {
        marginLeft: 4,
    },

    // Style cho Nút hình tròn đơn sắc MỚI (Single Button)
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

    // Styles MỚI cho Popup Dải Màu
    colorPickerPopup: {
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        borderRadius: 15,
        paddingVertical: 10,
        width: screenWidth * 0.9,
        alignItems: 'center',
        paddingBottom: 20,
    },
    colorPickerTitle: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    popupScrollContainer: {
        paddingHorizontal: 10,
        alignItems: 'center',
    },
    closePopupButton: {
        marginTop: 15,
    },

    // Vòng màu trong Popup (Điều chỉnh kích thước nhỏ lại)
    colorFilterCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginHorizontal: 8,
        borderWidth: 2,
        borderColor: 'transparent',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    activeColorFilter: {
        borderColor: 'white',
    },

    // =========================================================
    // Styles cho Bottom Navigation (Giữ nguyên)
    // =========================================================
    bottomNavigationWrapper: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: 2,
    },
    captureModeSelector: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 10,
    },
    modeText: {
        color: 'rgba(255, 255, 255, 0.6)',
        fontSize: 16,
        fontWeight: 'bold',
        marginHorizontal: 15,
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
import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Alert } from 'react-native';
// Nhập các thành phần từ vision-camera
import {
    Camera,
    useCameraDevices,
    CameraPermissionStatus,
    useFrameProcessor,
    CameraDevice,
} from 'react-native-vision-camera';
import { request, PERMISSIONS, RESULTS } from 'react-native-permissions';

/**
 * Component CameraScreen sử dụng react-native-vision-camera
 */

interface DeviceMap {
    back?: CameraDevice;
    front?: CameraDevice;
    [key: string]: CameraDevice | undefined; // Cho các thiết bị khác
}

const CameraScreen: React.FC = () => {
    const devices = useCameraDevices() as unknown as DeviceMap;      // Hook để lấy danh sách thiết bị camera
    const device = devices.back;             // Chọn camera sau (back)

    const cameraRef = useRef<Camera>(null); // Ref để gọi các phương thức chụp ảnh
    const [cameraPermission, setCameraPermission] = useState<CameraPermissionStatus>('not-determined');
    const [photoPath, setPhotoPath] = useState<string | null>(null); // Lưu đường dẫn ảnh đã chụp

    // 1. Hàm yêu cầu quyền truy cập camera
    const requestCameraPermission = async () => {
        // Sử dụng react-native-permissions để yêu cầu quyền
        const permission = Platform.select({
            ios: PERMISSIONS.IOS.CAMERA,
            android: PERMISSIONS.ANDROID.CAMERA,
            default: PERMISSIONS.ANDROID.CAMERA,
        });

        if (!permission) return;

        try {
            const result = await request(permission);

            if (result === RESULTS.GRANTED) {
                setCameraPermission('granted');
                console.log('Quyền camera đã được cấp.');
            } else {
                setCameraPermission('denied');
                console.warn('Quyền camera bị từ chối.');
            }
        } catch (err) {
            console.warn('Lỗi khi yêu cầu quyền camera:', err);
            setCameraPermission('denied');
        }
    };

    useEffect(() => {
        // Kiểm tra quyền khi component được mount
        requestCameraPermission();
    }, []);

    // 2. Hàm chụp ảnh
    const takePhoto = async () => {
        if (cameraRef.current) {
            try {
                const photo = await cameraRef.current.takePhoto({
                    flash: 'off', // Tắt flash
                    // skipMetadata: true,
                });

                const path = `file://${photo.path}`;
                setPhotoPath(path);
                Alert.alert("Thành công", `Ảnh đã chụp tại: ${path}`);
                console.log('Ảnh đã chụp:', path);

            } catch (e) {
                console.error('Lỗi khi chụp ảnh:', e);
                Alert.alert("Lỗi", "Không thể chụp ảnh.");
            }
        }
    };

    // 3. Xử lý trạng thái quyền và thiết bị
    if (cameraPermission === 'not-determined') {
        return (
            <View style={styles.container}>
                <Text style={styles.text}>Đang kiểm tra quyền truy cập Camera...</Text>
            </View>
        );
    }

    if (cameraPermission === 'denied') {
        return (
            <View style={styles.container}>
                <Text style={styles.text}>
                    Truy cập Camera bị từ chối. Vui lòng cấp quyền trong cài đặt.
                </Text>
                <TouchableOpacity style={styles.button} onPress={requestCameraPermission}>
                    <Text style={styles.buttonText}>Thử lại</Text>
                </TouchableOpacity>
            </View>
        );
    }

    if (device == null) {
        return (
            <View style={styles.container}>
                <Text style={styles.text}>Không tìm thấy thiết bị camera!</Text>
            </View>
        );
    }

    // 4. Hiển thị Camera khi có quyền và thiết bị sẵn sàng
    return (
        <View style={styles.container}>
            <Camera
                ref={cameraRef}
                style={StyleSheet.absoluteFill} // Camera chiếm toàn bộ màn hình
                device={device}
                isActive={true} // Camera luôn hoạt động
                photo={true}    // Kích hoạt tính năng chụp ảnh
            // Lưu ý: vision-camera không cần prop 'onCameraReady' như RNCamera
            />

            {/* Nút Chụp Ảnh */}
            <View style={styles.buttonContainer}>
                <TouchableOpacity
                    style={styles.captureButton}
                    onPress={takePhoto}
                    activeOpacity={0.8}
                >
                    <View style={styles.innerCircle} />
                </TouchableOpacity>
            </View>
        </View>
    );
};

// Định nghĩa Stylesheets
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'black',
    },
    text: {
        color: 'white',
        fontSize: 16,
        textAlign: 'center',
        margin: 20,
    },
    button: {
        padding: 10,
        backgroundColor: '#3498db',
        borderRadius: 5,
        marginTop: 10,
        alignSelf: 'center',
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
    },
    buttonContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 120,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)', // Nền mờ cho khu vực nút
    },
    captureButton: {
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 5,
        borderColor: 'white',
        backgroundColor: 'transparent',
        justifyContent: 'center',
        alignItems: 'center',
    },
    innerCircle: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'white',
    }
});

export default CameraScreen;
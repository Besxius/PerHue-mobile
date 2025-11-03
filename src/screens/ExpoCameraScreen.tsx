import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Button, Platform, Image } from 'react-native';

import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import * as ImagePicker from 'expo-image-picker';

// Định nghĩa Component chính
const ExpoCameraScreen = () => {
    const cameraRef = useRef<CameraView | null>(null);
    const [facing, setFacing] = useState<CameraType>('back');
    const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);

    // 💡 Xin quyền Camera và Thư viện
    const [cameraPermission, requestCameraPermission] = useCameraPermissions();
    const [mediaLibraryPermission, requestMediaLibraryPermission] = MediaLibrary.usePermissions();
    const [imagePickerPermission, requestImagePickerPermission] = ImagePicker.useMediaLibraryPermissions();

    // Xin quyền khi component được mount
    useEffect(() => {
        if (!cameraPermission?.granted) {
            requestCameraPermission();
        }
        if (!mediaLibraryPermission?.granted) {
            requestMediaLibraryPermission();
        }
        if (!imagePickerPermission?.granted) {
            requestImagePickerPermission();
        }
    }, [cameraPermission, mediaLibraryPermission, imagePickerPermission]);

    // 1. Chuyển đổi camera trước/sau
    function toggleCameraFacing() {
        setFacing(current => (current === 'back' ? 'front' : 'back'));
    }

    // 2. Chụp ảnh
    const takePicture = async () => {
        if (cameraRef.current && cameraRef.current.takePictureAsync) {
            const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
            setCapturedPhoto(photo.uri);
        } else {
            console.warn("Camera reference is not available or takePictureAsync is missing.");
        }
    };

    // 3. Lưu ảnh vào thư viện (từ màn hình xem trước)
    const savePhoto = async () => {
        if (capturedPhoto && mediaLibraryPermission?.granted) {
            try {
                await MediaLibrary.saveToLibraryAsync(capturedPhoto);
                alert('Photo saved to media library!');
                setCapturedPhoto(null); // Quay lại màn hình camera
            } catch (error) {
                console.error('Error saving photo: ', error);
            }
        } else if (!mediaLibraryPermission?.granted) {
            alert('Permission to access media library is required to save the photo.');
        }
    };

    // 4. Mở thư viện ảnh để chọn
    const openMediaLibrary = async () => {
        if (!imagePickerPermission?.granted) {
            alert('Permission to access media library is required.');
            requestImagePickerPermission();
            return;
        }

        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
        });

        if (!result.canceled) {
            // Hiển thị ảnh vừa chọn
            setCapturedPhoto(result.assets[0].uri);
        }
    };

    // --- Xử lý Quyền truy cập (Permissions) ---

    if (!cameraPermission || !mediaLibraryPermission || !imagePickerPermission) {
        // Quyền đang được load
        return <View />;
    }

    if (!cameraPermission.granted) {
        // Camera chưa được cấp quyền
        return (
            <View style={styles.container}>
                <Text style={styles.message}>We need your permission to show the camera</Text>
                <Button onPress={requestCameraPermission} title="grant camera permission" />
            </View>
        );
    }

    // --- Render các màn hình (Camera / Photo Preview) ---

    // Màn hình xem trước ảnh
    if (capturedPhoto) {
        return (
            <View style={styles.container}>
                <Image source={{ uri: capturedPhoto }} style={styles.camera} />
                <View style={styles.buttonContainer}>
                    <TouchableOpacity style={styles.button} onPress={() => setCapturedPhoto(null)}>
                        <Text style={styles.text}>Retake</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.button} onPress={savePhoto}>
                        <Text style={styles.text}>Save Photo</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    // Màn hình Camera chính
    return (
        <View style={styles.container}>
            <CameraView
                style={styles.camera}
                facing={facing}
                ref={cameraRef} // Gán ref
            />
            <View style={styles.buttonContainer}>
                {/* Nút Flip Camera */}
                <TouchableOpacity style={styles.button} onPress={toggleCameraFacing}>
                    <Text style={styles.text}>Flip</Text>
                </TouchableOpacity>

                {/* Nút Chụp ảnh */}
                <TouchableOpacity
                    style={[styles.button, styles.captureButton]}
                    onPress={takePicture}
                >
                    <View style={styles.captureCircle} />
                </TouchableOpacity>

                {/* Nút Import ảnh */}
                <TouchableOpacity style={styles.button} onPress={openMediaLibrary}>
                    <Text style={styles.text}>Import</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        backgroundColor: 'black',
    },
    message: {
        textAlign: 'center',
        paddingBottom: 10,
        color: 'white',
    },
    camera: {
        flex: 1,
    },
    buttonContainer: {
        position: 'absolute',
        bottom: 40,
        flexDirection: 'row',
        backgroundColor: 'transparent',
        width: '100%',
        paddingHorizontal: 10,
        justifyContent: 'space-around',
        alignItems: 'center',
    },
    button: {
        flex: 1,
        alignItems: 'center',
        padding: 10,
    },
    text: {
        fontSize: 18, // Điều chỉnh kích thước text
        fontWeight: 'bold',
        color: 'white',
        textAlign: 'center',
    },
    // Style cho nút chụp ảnh (vòng tròn)
    captureButton: {
        flex: 0, // Giảm flex để nút chụp nhỏ hơn
        padding: 0,
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'transparent',
        borderWidth: 5,
        borderColor: 'white',
        justifyContent: 'center',
        alignItems: 'center',
    },
    captureCircle: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'white',
    }
});

export default ExpoCameraScreen;
import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Button, Platform, Image } from 'react-native';

import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';

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
    const capturePhotoAndGetAssetUri = async () => {
        if (cameraRef.current && cameraRef.current.takePictureAsync) {
            const photo = await cameraRef.current.takePictureAsync({
                quality: 0.8,
                base64: true
            });

            if (photo && photo.uri) {
                console.log("Photo URI captured (cache):", photo.uri);

                if (mediaLibraryPermission?.granted) {
                    try {
                        // **BƯỚC KHẮC PHỤC CHÍNH:** Tạo Asset từ URI cache.
                        // Hàm này tạo ra một URI mới (content:// hoặc tương đương) 
                        // có quyền truy cập công khai và bền vững, khắc phục lỗi quyền đọc file.
                        const asset = await MediaLibrary.createAssetAsync(photo.uri);

                        const publicUri = asset.uri;
                        console.log("Photo URI saved (Asset URI):", publicUri);

                        // Sử dụng URI công khai mới để hiển thị
                        setCapturedPhoto(publicUri);

                    } catch (error) {
                        console.error('Error creating Asset from photo cache: ', error);
                        // Nếu lưu thất bại, vẫn thử hiển thị URI cache ban đầu như phương án dự phòng
                        setCapturedPhoto(photo.uri);
                    }
                } else {
                    // Nếu không có quyền Media Library, không thể tạo Asset và khắc phục lỗi
                    alert('Cần cấp quyền Thư viện ảnh để hiển thị ảnh. Ảnh có thể không hiển thị.');
                    setCapturedPhoto(photo.uri); // Vẫn thử URI cache
                }

            } else {
                console.error("takePictureAsync did not return a valid URI.");
            }
        } else {
            console.warn("Camera reference is not available or takePictureAsync is missing.");
        }
    };

    const takePictureAndSave = async () => {
        if (cameraRef.current && cameraRef.current.takePictureAsync) {
            const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });

            if (photo && photo.uri) {
                console.log("Photo URI captured (cache):", photo.uri);

                // --- BẮT ĐẦU LOGIC CỦA GIẢI PHÁP 1 ---
                if (mediaLibraryPermission?.granted) {
                    try {
                        // Lưu ảnh từ URI cache vào Media Library.
                        // Hàm này trả về một Asset, chứa URI công khai (content://)
                        const asset = await MediaLibrary.createAssetAsync(photo.uri);

                        const newUri = asset.uri;
                        console.log("Photo URI saved (Asset URI):", newUri);

                        // Sử dụng URI mới để hiển thị
                        setCapturedPhoto(newUri);

                    } catch (error) {
                        console.error('Error saving photo and getting Asset URI: ', error);
                        alert('Lỗi khi lưu ảnh. Thử sử dụng URI tạm thời.');
                        // Phương án dự phòng: Sử dụng URI cache ban đầu
                        setCapturedPhoto(photo.uri);
                    }
                } else {
                    alert('Không có quyền truy cập Thư viện ảnh để lưu. Chỉ hiển thị tạm thời URI cache.');
                    setCapturedPhoto(photo.uri); // Sử dụng URI cache
                }
                // --- KẾT THÚC LOGIC CỦA GIẢI PHÁP 1 ---

            } else {
                console.error("takePictureAsync did not return a valid URI.");
            }
        } else {
            console.warn("Camera reference is not available or takePictureAsync is missing.");
        }
    };

    const takePicture = async () => {
        if (cameraRef.current && cameraRef.current.takePictureAsync) {
            // Chụp ảnh và lấy URI cache tạm thời
            const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });

            if (photo && photo.uri) {
                console.log("Photo URI captured (cache):", photo.uri);

                try {
                    // ✨ BƯỚC KHẮC PHỤC: Sao chép file từ cache tạm thời sang thư mục ứng dụng
                    const fileName = `photo_${Date.now()}.jpg`;
                    // Sử dụng cacheDirectory, nơi ứng dụng có quyền truy cập rõ ràng
                    const FileSystemWithCache = FileSystem as any
                    const newUri = FileSystemWithCache.cacheDirectory + fileName;

                    await FileSystem.copyAsync({
                        from: photo.uri,
                        to: newUri
                    });

                    console.log("Photo URI copied (New URI):", newUri);
                    // Dùng URI mới để hiển thị (đã khắc phục lỗi quyền truy cập)
                    setCapturedPhoto(newUri);

                } catch (error) {
                    console.error("Error copying file or setting state:", error);
                    alert("Lỗi xử lý file. Ảnh không thể hiển thị.");
                    // Phương án dự phòng (URI cache cũ)
                    setCapturedPhoto(photo.uri);
                }
            } else {
                console.error("takePictureAsync did not return a valid URI.");
            }
        } else {
            console.warn("Camera reference is not available or takePictureAsync is missing.");
        }
    };

    // 3. Lưu ảnh vào thư viện (từ màn hình xem trước)
    // const savePhoto = async () => {
    //     if (capturedPhoto && mediaLibraryPermission?.granted) {
    //         try {
    //             // Sử dụng URI (đã được copy) để lưu chính thức vào Media Library
    //             await MediaLibrary.saveToLibraryAsync(capturedPhoto);

    //             alert('Photo saved to media library!');
    //             setCapturedPhoto(null); // Quay lại màn hình camera

    //             // OPTIONAL: Xóa file tạm thời đã copy nếu bạn muốn dọn dẹp cache
    //             // await FileSystem.deleteAsync(capturedPhoto, { idempotent: true });

    //         } catch (error) {
    //             console.error('Error saving photo: ', error);
    //             alert('Lỗi khi lưu ảnh. Vui lòng kiểm tra quyền Thư viện ảnh.');
    //         }
    //     } else if (!mediaLibraryPermission?.granted) {
    //         alert('Permission to access media library is required to save the photo.');
    //         requestMediaLibraryPermission();
    //     } else {
    //         alert('No photo to save.');
    //     }
    // };
    const savePhoto = async () => {
        if (capturedPhoto) {
            alert('Photo is already saved to Media Library! Returning to camera.');
            setCapturedPhoto(null);
        } else {
            alert('No photo to save.');
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
                <Image
                    source={{ uri: capturedPhoto }}
                    style={styles.camera}
                    resizeMode="contain"
                />
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
                    onPress={capturePhotoAndGetAssetUri}
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
    previewImage: {
        flex: 1, // Vẫn cố gắng dùng flex 1
        width: '100%', // Đảm bảo chiều rộng
        // background-color: 'red', // 💡 DEBUG: Bỏ comment dòng này để xem Image có chiếm không gian không
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
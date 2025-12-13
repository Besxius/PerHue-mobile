import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    ScrollView,
    Alert,
    Modal,
    TouchableOpacity,
    ActivityIndicator,
    Image,
    Platform,
    KeyboardAvoidingView
} from 'react-native';
import { Asset, launchImageLibrary, ImageLibraryOptions } from 'react-native-image-picker';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { UserInfo, VerificationPayload, ImageFile } from '../types/dataModels';
import { loadUserInfo, submitVerificationRequest, checkPendingVerification } from '../api/userApi';
import CustomButton from '../components/CustomButton';

type VerificationImageType = 'ID_FRONT' | 'ID_BACK' | 'CERTIFICATE' | 'FACE_FRONT' | 'FACE_LEFT' | 'FACE_RIGHT';

interface UserInfoState {
    userInfo: UserInfo | null;
    isLoading: boolean;
    error: Error | null;
}

const useCurrentUser = (): UserInfoState => {
    const [state, setState] = useState<UserInfoState>({
        userInfo: null,
        isLoading: true,
        error: null,
    });

    useEffect(() => {
        const fetchUserInfo = async () => {
            try {
                setState(prev => ({ ...prev, isLoading: true, error: null }));
                const data = await loadUserInfo();
                setState({ userInfo: data, isLoading: false, error: null });
            } catch (err) {
                const error = err instanceof Error ? err : new Error("An unknown error occurred while fetching user info.");
                setState({ userInfo: null, isLoading: false, error: error });
            }
        };
        fetchUserInfo();
    }, []);

    return state;
};

interface ImageUploadBlockProps {
    label: string;
    imageAsset: Asset | null;
    onPress: () => void;
    onRemove: () => void;
}

const ImageUploadBlock: React.FC<ImageUploadBlockProps> = ({ label, imageAsset, onPress, onRemove }) => {
    return (
        <View style={styles.uploadBlockContainer}>
            <Text style={styles.uploadLabel}>{label}</Text>
            <TouchableOpacity onPress={onPress} style={styles.uploadBox} activeOpacity={0.7}>
                {imageAsset && imageAsset.uri ? (
                    <>
                        <Image source={{ uri: imageAsset.uri }} style={styles.previewImage} resizeMode="cover" />
                        <TouchableOpacity style={styles.removeIcon} onPress={(e) => { e.stopPropagation(); onRemove(); }}>
                            <Ionicons name="close-circle" size={24} color="red" />
                        </TouchableOpacity>
                    </>
                ) : (
                    <View style={styles.placeholderContainer}>
                        <MaterialCommunityIcons name="camera-plus" size={30} color="#888" />
                        <Text style={styles.placeholderText}>Select Photo</Text>
                    </View>
                )}
            </TouchableOpacity>
        </View>
    );
};

const VerifyExpertScreen: React.FC = () => {
    const navigation = useNavigation();
    const currentUser = useCurrentUser();

    const [isCheckingStatus, setIsCheckingStatus] = useState(true);
    const [hasPendingRequest, setHasPendingRequest] = useState(false);

    const [nickname, setNickname] = useState('');
    const [specialization, setSpecialization] = useState('');
    const [bio, setBio] = useState('');
    const [yearsOfExperience, setYearsOfExperience] = useState('');

    const [languages, setLanguages] = useState('');
    const [certification, setCertification] = useState('');

    const [facebookAccount, setFacebookAccount] = useState('');
    const [linkedInAccount, setLinkedInAccount] = useState('');
    const [instagramAccount, setInstagramAccount] = useState('');

    const [images, setImages] = useState<Record<VerificationImageType, Asset | null>>({
        ID_FRONT: null,
        ID_BACK: null,
        CERTIFICATE: null,
        FACE_FRONT: null,
        FACE_LEFT: null,
        FACE_RIGHT: null,
    });

    const [isLoading, setIsLoading] = useState(false);
    const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);

    useEffect(() => {
        const verifyStatus = async () => {
            setIsCheckingStatus(true);
            try {
                const status = await checkPendingVerification();
                if (status && status.hasPending) {
                    setHasPendingRequest(true);
                }
            } catch (error) {
                console.error("Failed to check pending status:", error);
            } finally {
                setIsCheckingStatus(false);
            }
        };

        verifyStatus();
    }, []);

    const handleSelectImage = async (type: VerificationImageType) => {
        const options: ImageLibraryOptions = {
            mediaType: 'photo',
            selectionLimit: 1,
            quality: 0.8,
        };

        const result = await launchImageLibrary(options);

        if (result.didCancel) return;
        if (result.errorCode) {
            Alert.alert('Error', result.errorMessage || 'Failed to select image.');
            return;
        }

        if (result.assets && result.assets.length > 0) {
            const asset = result.assets[0];
            setImages(prev => ({ ...prev, [type]: asset }));
        }
    };

    const handleRemoveImage = (type: VerificationImageType) => {
        setImages(prev => ({ ...prev, [type]: null }));
    };

    const handleSubmit = async () => {
        if (!nickname || !specialization || !bio || !yearsOfExperience || !certification) {
            Alert.alert('Missing Information', 'Please fill in all required text fields (*), including Certification.');
            return;
        }

        if (!images.ID_FRONT || !images.ID_BACK || !images.FACE_FRONT) {
            Alert.alert('Missing Photos', 'Please upload at least your ID cards (Front/Back) and a Front Face photo.');
            return;
        }

        setIsLoading(true);

        try {
            const photoList: ImageFile[] = [];
            const typeList: string[] = [];

            Object.entries(images).forEach(([key, asset]) => {
                if (asset && asset.uri) {
                    const uri = Platform.OS === 'ios' ? asset.uri.replace('file://', '') : asset.uri;

                    const imageFile: ImageFile = {
                        uri: uri,
                        type: asset.type || 'image/jpeg',
                        name: asset.fileName || `photo_${key}.jpg`,
                    };

                    photoList.push(imageFile);
                    typeList.push(key);
                }
            });

            const payload: VerificationPayload = {
                id: currentUser.userInfo?.id ?? 0,
                email: currentUser.userInfo?.email ?? '',
                nickname: nickname.trim(),
                specialization: specialization.trim(),
                bio: bio.trim(),
                yearsOfExperience: parseInt(yearsOfExperience) || 0,
                languages: languages.trim(),
                certification: certification.trim(),
                facebookAccount: facebookAccount.trim(),
                linkedInAccount: linkedInAccount.trim(),
                instagramAccount: instagramAccount.trim(),
                Photo: photoList,
                PhotoType: typeList,
            };

            await submitVerificationRequest(payload);
            setIsSuccessModalVisible(true);

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
            Alert.alert('Submission Failed', errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCloseModal = () => {
        setIsSuccessModalVisible(false);
        navigation.goBack();
    };

    // 1. Hiển thị Loading khi đang kiểm tra trạng thái
    if (isCheckingStatus) {
        return (
            <View style={[styles.container, styles.centerContent]}>
                <ActivityIndicator size="large" color="#4C7BE2" />
                <Text style={styles.loadingText}>Checking verification status...</Text>
            </View>
        );
    }

    // 2. Hiển thị màn hình chặn nếu có yêu cầu đang Pending
    if (hasPendingRequest) {
        return (
            <View style={[styles.container, styles.centerContent]}>
                <Ionicons name="time-outline" size={80} color="#FFC107" style={{ marginBottom: 20 }} />
                <Text style={styles.pendingTitle}>Verification Pending</Text>
                <Text style={styles.pendingText}>
                    You have already submitted a request to become an expert.
                    {"\n"}Please wait for the administrator to review your application.
                </Text>
                <TouchableOpacity style={styles.buttonBack} onPress={() => navigation.goBack()}>
                    <Text style={styles.textStyle}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // 3. Hiển thị Form đăng ký nếu chưa có yêu cầu nào
    return (
        <View style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1 }}
            >
                <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>

                    <Text style={styles.headerTitle}>Expert Registration</Text>
                    <Text style={styles.headerSubtitle}>Please complete the form to verify your profile.</Text>

                    <View style={styles.section}>
                        <Text style={styles.sectionHeader}>Personal Information</Text>

                        <Text style={styles.label}>Nickname *</Text>
                        <TextInput
                            style={styles.input}
                            value={nickname}
                            onChangeText={setNickname}
                            placeholder="Dr. Jane"
                        />

                        <Text style={styles.label}>Specialization *</Text>
                        <TextInput
                            style={styles.input}
                            value={specialization}
                            onChangeText={setSpecialization}
                            placeholder="Dermatology, Color Analysis..."
                        />

                        <Text style={styles.label}>Years of Experience *</Text>
                        <TextInput
                            style={styles.input}
                            value={yearsOfExperience}
                            onChangeText={text => setYearsOfExperience(text.replace(/[^0-9]/g, ''))}
                            keyboardType="numeric"
                            placeholder="5"
                        />

                        <Text style={styles.label}>Bio *</Text>
                        <TextInput
                            style={styles.textArea}
                            value={bio}
                            onChangeText={setBio}
                            multiline
                            numberOfLines={4}
                            placeholder="Brief introduction about yourself..."
                        />
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionHeader}>Professional Qualification</Text>

                        <Text style={styles.label}>Languages</Text>
                        <TextInput
                            style={styles.input}
                            value={languages}
                            onChangeText={setLanguages}
                            placeholder="e.g., English, Vietnamese"
                        />

                        <Text style={styles.label}>Certification / License *</Text>
                        <TextInput
                            style={styles.input}
                            value={certification}
                            onChangeText={setCertification}
                            placeholder="e.g., Board Certified Dermatologist"
                        />
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionHeader}>Verification Documents</Text>
                        <Text style={styles.helperText}>Please upload clear photos for verification.</Text>

                        <View style={styles.row}>
                            <ImageUploadBlock
                                label="ID Card (Front) *"
                                imageAsset={images.ID_FRONT}
                                onPress={() => handleSelectImage('ID_FRONT')}
                                onRemove={() => handleRemoveImage('ID_FRONT')}
                            />
                            <ImageUploadBlock
                                label="ID Card (Back) *"
                                imageAsset={images.ID_BACK}
                                onPress={() => handleSelectImage('ID_BACK')}
                                onRemove={() => handleRemoveImage('ID_BACK')}
                            />
                        </View>

                        <View style={styles.row}>
                            <ImageUploadBlock
                                label="Certificate/License"
                                imageAsset={images.CERTIFICATE}
                                onPress={() => handleSelectImage('CERTIFICATE')}
                                onRemove={() => handleRemoveImage('CERTIFICATE')}
                            />
                            <View style={{ flex: 1, marginHorizontal: 5 }} />
                        </View>

                        <Text style={[styles.sectionHeader, { marginTop: 15 }]}>Face Check Photos</Text>
                        <View style={styles.row}>
                            <ImageUploadBlock
                                label="Face Front *"
                                imageAsset={images.FACE_FRONT}
                                onPress={() => handleSelectImage('FACE_FRONT')}
                                onRemove={() => handleRemoveImage('FACE_FRONT')}
                            />
                            <ImageUploadBlock
                                label="Face Left Side"
                                imageAsset={images.FACE_LEFT}
                                onPress={() => handleSelectImage('FACE_LEFT')}
                                onRemove={() => handleRemoveImage('FACE_LEFT')}
                            />
                        </View>
                        <View style={styles.row}>
                            <ImageUploadBlock
                                label="Face Right Side"
                                imageAsset={images.FACE_RIGHT}
                                onPress={() => handleSelectImage('FACE_RIGHT')}
                                onRemove={() => handleRemoveImage('FACE_RIGHT')}
                            />
                            <View style={{ flex: 1, marginHorizontal: 5 }} />
                        </View>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionHeader}>Social Media (Optional)</Text>
                        <TextInput
                            style={styles.input}
                            value={facebookAccount}
                            onChangeText={setFacebookAccount}
                            placeholder="Facebook URL"
                        />
                        <TextInput
                            style={styles.input}
                            value={linkedInAccount}
                            onChangeText={setLinkedInAccount}
                            placeholder="LinkedIn URL"
                        />
                        <TextInput
                            style={styles.input}
                            value={instagramAccount}
                            onChangeText={setInstagramAccount}
                            placeholder="Instagram URL"
                        />
                    </View>

                    <View style={{ height: 30 }} />

                    <CustomButton
                        title={isLoading ? "Submitting..." : "Submit Application"}
                        onPress={handleSubmit}
                        loading={isLoading}
                        color="#4C7BE2"
                    />

                    <View style={{ height: 50 }} />
                </ScrollView>
            </KeyboardAvoidingView>

            <Modal
                animationType="fade"
                transparent={true}
                visible={isSuccessModalVisible}
                onRequestClose={handleCloseModal}
            >
                <View style={styles.centeredView}>
                    <View style={styles.modalView}>
                        <Ionicons name="checkmark-circle" size={60} color="#4CAF50" />
                        <Text style={styles.modalTitle}>Success!</Text>
                        <Text style={styles.modalText}>
                            Your expert verification request has been submitted successfully.
                            We will review your information and get back to you soon.
                        </Text>
                        <TouchableOpacity
                            style={styles.buttonClose}
                            onPress={handleCloseModal}
                        >
                            <Text style={styles.textStyle}>OK</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {isLoading && (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color="#4C7BE2" />
                    <Text style={{ color: 'white', marginTop: 10 }}>Uploading data...</Text>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        paddingHorizontal: 20,
    },
    centerContent: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollView: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 20,
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#666',
        marginBottom: 20,
    },
    section: {
        marginBottom: 20,
    },
    sectionHeader: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#4C7BE2',
        marginBottom: 10,
        borderLeftWidth: 3,
        borderLeftColor: '#4C7BE2',
        paddingLeft: 10,
    },
    helperText: {
        fontSize: 12,
        color: '#888',
        marginBottom: 10,
        fontStyle: 'italic',
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 5,
        marginTop: 10,
    },
    input: {
        height: 45,
        borderColor: '#E0E0E0',
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 12,
        backgroundColor: '#F9F9F9',
        fontSize: 15,
    },
    textArea: {
        borderColor: '#E0E0E0',
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingTop: 12,
        backgroundColor: '#F9F9F9',
        fontSize: 15,
        minHeight: 100,
        textAlignVertical: 'top',
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    uploadBlockContainer: {
        flex: 1,
        marginHorizontal: 5,
    },
    uploadLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#555',
        marginBottom: 5,
        textAlign: 'center',
    },
    uploadBox: {
        height: 120,
        backgroundColor: '#F0F4F8',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#D1D9E6',
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    placeholderContainer: {
        alignItems: 'center',
    },
    placeholderText: {
        fontSize: 12,
        color: '#888',
        marginTop: 5,
    },
    previewImage: {
        width: '100%',
        height: '100%',
    },
    removeIcon: {
        position: 'absolute',
        top: 5,
        right: 5,
        backgroundColor: 'white',
        borderRadius: 12,
    },
    centeredView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
    },
    modalView: {
        margin: 20,
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 30,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
        width: '85%',
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
        marginVertical: 10,
    },
    modalText: {
        marginBottom: 20,
        textAlign: 'center',
        color: '#666',
        lineHeight: 20,
    },
    buttonClose: {
        backgroundColor: '#4C7BE2',
        borderRadius: 25,
        paddingVertical: 12,
        paddingHorizontal: 40,
        elevation: 2,
    },
    textStyle: {
        color: 'white',
        fontWeight: 'bold',
        textAlign: 'center',
        fontSize: 16,
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    // --- Styles cho Pending View ---
    pendingTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
    },
    pendingText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 30,
        lineHeight: 24,
        paddingHorizontal: 20,
    },
    buttonBack: {
        backgroundColor: '#333',
        borderRadius: 25,
        paddingVertical: 12,
        paddingHorizontal: 40,
    },
    loadingText: {
        marginTop: 10,
        color: '#666',
        fontSize: 16,
    }
});

export default VerifyExpertScreen;
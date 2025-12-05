import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    TextInput,
    Button,
    StyleSheet,
    ScrollView,
    Alert,
    Modal,
    TouchableOpacity,
    ActivityIndicator
} from 'react-native';
import { UserInfo, VerificationPayload } from '../types/dataModels';
import { loadUserInfo, submitVerificationRequest } from '../api/userApi';

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

                console.error("Failed to load user info in hook:", error.message);
            }
        };

        fetchUserInfo();
    }, []);

    return state;
};

const VerifyExpertScreen: React.FC = () => {
    const currentUser = useCurrentUser();

    // --- State cho Form ---
    const [nickname, setNickname] = useState('');
    const [specialization, setSpecialization] = useState('');
    const [bio, setBio] = useState('');
    const [yearsOfExperience, setYearsOfExperience] = useState('');
    const [languages, setLanguages] = useState('');
    const [certification, setCertification] = useState('');
    const [facebookAccount, setFacebookAccount] = useState('');
    const [linkedInAccount, setLinkedInAccount] = useState('');
    const [instagramAccount, setInstagramAccount] = useState('');
    const [profilePhotoUrl, setProfilePhotoUrl] = useState('');

    const [isLoading, setIsLoading] = useState(false);
    const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);

    const handlePhotoUpload = () => {
        Alert.alert("Note", "Photo upload feature is mocked. Using a temporary URL.");
        setProfilePhotoUrl('https://api.example.com/uploads/expert-photo-123.jpg');
    };

    const handleSubmit = async () => {
        if (!nickname || !specialization || !bio || !yearsOfExperience || !profilePhotoUrl) {
            Alert.alert('Error', 'Please fill in all required fields and upload a profile photo.');
            return;
        }

        setIsLoading(true);

        // Chuẩn bị Payload
        const payload: VerificationPayload = {
            id: currentUser.userInfo?.id ?? 0,
            email: currentUser.userInfo?.email ?? '',
            nickname: nickname.trim(),
            specialization: specialization.trim(),
            bio: bio.trim(),
            yearsOfExperience: parseInt(yearsOfExperience),
            languages: languages.trim(),
            certification: certification.trim(),
            facebookAccount: facebookAccount.trim(),
            linkedInAccount: linkedInAccount.trim(),
            instagramAccount: instagramAccount.trim(),
            photoAndTypes: [
                { photo: profilePhotoUrl, type: 'PROFILE' },
            ],
        };

        try {
            await submitVerificationRequest(payload);

            setIsSuccessModalVisible(true);

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred during submission.';
            Alert.alert('Submission Failed', errorMessage);

        } finally {
            setIsLoading(false);
        }
    };

    const handleCloseModal = () => {
        setIsSuccessModalVisible(false);
    };


    return (
        <View style={styles.container}>

            <ScrollView style={styles.scrollView}>

                {/* --- Required Fields --- */}
                <Text style={styles.label}>Nickname *</Text>
                <TextInput
                    style={styles.input}
                    value={nickname}
                    onChangeText={setNickname}
                    placeholder="e.g., Dr. Jane"
                />

                <Text style={styles.label}>Specialization *</Text>
                <TextInput
                    style={styles.input}
                    value={specialization}
                    onChangeText={setSpecialization}
                    placeholder="e.g., Dermatology, Cardiology"
                />

                <Text style={styles.label}>Years of Experience *</Text>
                <TextInput
                    style={styles.input}
                    value={yearsOfExperience}
                    onChangeText={text => setYearsOfExperience(text.replace(/[^0-9]/g, ''))}
                    keyboardType="numeric"
                    placeholder="e.g., 5"
                />

                <Text style={styles.label}>Bio (Short Description) *</Text>
                <TextInput
                    style={styles.textArea}
                    value={bio}
                    onChangeText={setBio}
                    multiline
                    numberOfLines={4}
                    placeholder="Tell us about your background and expertise..."
                />

                {/* --- Photo Upload --- */}
                <Text style={styles.label}>Profile Photo *</Text>
                <View style={styles.photoContainer}>
                    <Button
                        title={profilePhotoUrl ? "Change Photo" : "Upload Photo"}
                        onPress={handlePhotoUpload}
                    />
                    {profilePhotoUrl ? (
                        <Text style={styles.photoStatus}>✅ Photo uploaded!</Text>
                    ) : (
                        <Text style={styles.photoStatus}>Pending upload...</Text>
                    )}
                </View>

                {/* --- Optional Fields --- */}
                <Text style={styles.sectionTitle}>Optional Information</Text>

                <Text style={styles.label}>Languages</Text>
                <TextInput
                    style={styles.input}
                    value={languages}
                    onChangeText={setLanguages}
                    placeholder="e.g., English, Vietnamese"
                />

                <Text style={styles.label}>Certification / License</Text>
                <TextInput
                    style={styles.input}
                    value={certification}
                    onChangeText={setCertification}
                    placeholder="e.g., Board Certified Dermatologist"
                />

                <Text style={styles.label}>Facebook Account</Text>
                <TextInput
                    style={styles.input}
                    value={facebookAccount}
                    onChangeText={setFacebookAccount}
                    placeholder="https://facebook.com/your-profile"
                    keyboardType="url"
                />

                <Text style={styles.label}>LinkedIn Account</Text>
                <TextInput
                    style={styles.input}
                    value={linkedInAccount}
                    onChangeText={setLinkedInAccount}
                    placeholder="https://linkedin.com/in/your-profile"
                    keyboardType="url"
                />

                <Text style={styles.label}>Instagram Account</Text>
                <TextInput
                    style={styles.input}
                    value={instagramAccount}
                    onChangeText={setInstagramAccount}
                    placeholder="https://instagram.com/your-profile"
                    keyboardType="url"
                />

                <View style={{ height: 50 }} />

            </ScrollView>

            {/* --- Submit Button --- */}
            <View style={styles.buttonContainer}>
                <Button
                    title={isLoading ? "Submitting..." : "Submit Verification Request"}
                    onPress={handleSubmit}
                    disabled={isLoading}
                />
            </View>


            {/* --- Success Modal --- */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={isSuccessModalVisible}
                onRequestClose={handleCloseModal}
            >
                <View style={styles.centeredView}>
                    <View style={styles.modalView}>
                        <Text style={styles.modalTitle}>Registration Successful!</Text>
                        <Text style={styles.modalText}>
                            Your registration data has been successfully submitted.
                            Please await review from our system.
                        </Text>
                        <TouchableOpacity
                            style={styles.buttonClose}
                            onPress={handleCloseModal}
                            disabled={isLoading} // Ngăn chặn tương tác nếu đang tải
                        >
                            <Text style={styles.textStyle}>OK</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Loading Overlay (Tùy chọn) */}
            {isLoading && (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color="#0000ff" />
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 15,
    },
    scrollView: {
        flex: 1,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
        color: '#333',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 15,
        marginBottom: 5,
        color: '#555',
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginTop: 10,
        marginBottom: 5,
        color: '#333',
    },
    input: {
        height: 45,
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 10,
        marginBottom: 10,
        backgroundColor: '#f9f9f9',
    },
    textArea: {
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingTop: 10,
        marginBottom: 10,
        backgroundColor: '#f9f9f9',
        minHeight: 100,
        textAlignVertical: 'top', // Quan trọng cho Android
    },
    photoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
        padding: 10,
        backgroundColor: '#f0f8ff',
        borderRadius: 8,
    },
    photoStatus: {
        color: 'green',
        fontWeight: 'bold',
    },
    buttonContainer: {
        paddingVertical: 10,
        borderTopWidth: 1,
        borderTopColor: '#eee',
    },
    // --- Modal Styles ---
    centeredView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)', // Nền tối
    },
    modalView: {
        margin: 20,
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 35,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
        width: '80%',
    },
    modalTitle: {
        marginBottom: 15,
        textAlign: 'center',
        fontSize: 20,
        fontWeight: 'bold',
        color: '#4CAF50', // Màu xanh lá cho thành công
    },
    modalText: {
        marginBottom: 25,
        textAlign: 'center',
        fontSize: 16,
        lineHeight: 22,
        color: '#333',
    },
    buttonClose: {
        backgroundColor: '#2196F3',
        borderRadius: 10,
        padding: 10,
        elevation: 2,
        minWidth: 100,
    },
    textStyle: {
        color: 'white',
        fontWeight: 'bold',
        textAlign: 'center',
        fontSize: 16,
    },
    loadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        zIndex: 10,
    }
});

export default VerifyExpertScreen;
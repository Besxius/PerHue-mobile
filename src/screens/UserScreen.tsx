import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StatusBar,
    Platform,
    KeyboardAvoidingView,
    ScrollView,
    Image,
    Alert,
    ActivityIndicator,
    Modal,
    FlatList,
    TouchableWithoutFeedback,
    ImageSourcePropType,
    PanResponder
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons, Ionicons, AntDesign } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';

import { UserInfo } from '../types/dataModels';
import { loadUserInfo, updateUserInfo, uploadProfilePicture } from '../api/userApi';

const MEN_AVATARS = [
    require('../assets/avatar/men/men.png'),
    require('../assets/avatar/men/men2.png'),
    require('../assets/avatar/men/men3.png'),
];

const WOMEN_AVATARS = [
    require('../assets/avatar/women/women.png'),
    require('../assets/avatar/women/women2.png'),
    require('../assets/avatar/women/women3.png'),
];

const BLUE_COLOR = '#4285F4';

interface InputProps {
    label: string;
    placeholder: string;
    value: string;
    onChangeText: (text: string) => void;
    editable?: boolean;
}

const CustomInput = ({ label, placeholder, value, onChangeText, editable = true }: InputProps) => (
    <View style={inputStyles.wrapper}>
        <Text style={inputStyles.label}>{label}</Text>
        <View style={[inputStyles.container, !editable && inputStyles.disabledContainer]}>
            <TextInput
                style={inputStyles.textInput}
                placeholder={placeholder}
                value={value}
                onChangeText={onChangeText}
                placeholderTextColor="#888"
                editable={editable}
            />
        </View>
    </View>
);

interface GenderInputProps {
    label: string;
    value: 'Male' | 'Female';
    onChange: (gender: 'Male' | 'Female') => void;
}

const GenderInput: React.FC<GenderInputProps> = ({ label, value, onChange }) => (
    <View style={inputStyles.wrapper}>
        <Text style={inputStyles.label}>{label}</Text>
        <View style={genderStyles.radioGroup}>
            {(['Male', 'Female'] as const).map((genderOption) => (
                <TouchableOpacity
                    key={genderOption}
                    style={genderStyles.radioButton}
                    onPress={() => onChange(genderOption)}
                >
                    <View style={genderStyles.radioOuter}>
                        {value === genderOption && <View style={genderStyles.radioInner} />}
                    </View>
                    <Text style={genderStyles.radioText}>{genderOption}</Text>
                </TouchableOpacity>
            ))}
        </View>
    </View>
);

const DateInput = ({ label, value, onChangeDate }: { label: string, value: string, onChangeDate: (date: Date) => void }) => {
    const [showPicker, setShowPicker] = useState(false);
    const initialDate = value ? new Date(value) : new Date();

    const onDateChange = (event: any, selectedDate?: Date) => {
        if (Platform.OS === 'android') setShowPicker(false);
        if (event.type === 'set' && selectedDate) onChangeDate(selectedDate);
        if (event.type === 'dismissed') setShowPicker(false);
    };

    const displayValue = value || 'Select Date (YYYY-MM-DD)';

    return (
        <View style={inputStyles.wrapper}>
            <Text style={inputStyles.label}>{label}</Text>
            <TouchableOpacity onPress={() => setShowPicker(true)} style={stylesDate.dateInputContainer} activeOpacity={0.7}>
                <Text style={[stylesDate.valueText, { color: value ? '#333' : '#888' }]}>
                    {displayValue}
                </Text>
                <Ionicons name="calendar-outline" size={24} color="#666" />
            </TouchableOpacity>
            {showPicker && (
                <DateTimePicker
                    testID="dateTimePicker"
                    value={initialDate}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={onDateChange}
                    maximumDate={new Date()}
                />
            )}
        </View>
    );
};

const UserScreen = () => {
    const insets = useSafeAreaInsets();
    const TAB_BAR_HEIGHT = 60;

    const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);

    const [fullname, setFullname] = useState('');
    const [phone, setPhone] = useState('');
    const [gender, setGender] = useState<'Male' | 'Female'>('Male');
    const [dob, setDob] = useState(new Date());

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: (_, gestureState) => {
                return gestureState.dy > 5;
            },
            onPanResponderRelease: (_, gestureState) => {
                if (gestureState.dy > 100) {
                    setModalVisible(false);
                }
            },
        })
    ).current;

    const formatDate = (date: Date) => {
        if (!date || isNaN(date.getTime())) return '';
        return date.toISOString().split('T')[0];
    };

    const fetchUserInfo = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await loadUserInfo();
            setUserInfo(data);

            setFullname(data.fullname || '');
            setPhone(data.phone || '');
            setGender(data.gender === true ? 'Male' : 'Female');
            setDob(data.dob ? new Date(data.dob) : new Date());

        } catch (err: any) {
            console.error('Error fetching info:', err);
            setError(err.message || 'Cannot load user information.');
            setUserInfo(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUserInfo();
    }, [fetchUserInfo]);


    const displayAvatarSource = useMemo(() => {
        if (userInfo?.profilepicture) {
            return { uri: userInfo.profilepicture };
        }
        const isMale = gender === 'Male';
        return isMale ? MEN_AVATARS[0] : WOMEN_AVATARS[0];
    }, [userInfo, gender]);


    const performUpload = async (uri: string, mimeType?: string, fileName?: string | null) => {
        setIsUploading(true);
        try {
            const finalFileName = fileName || uri.split('/').pop() || 'avatar.jpg';
            let finalMimeType = mimeType;
            if (!finalMimeType) {
                const match = /\.(\w+)$/.exec(finalFileName);
                finalMimeType = match ? `image/${match[1]}` : `image/jpeg`;
            }

            console.log("Uploading...", { uri, finalMimeType, finalFileName });

            const response = await uploadProfilePicture(uri, finalMimeType, finalFileName);

            setUserInfo(prev => prev ? { ...prev, profilepicture: response.url } : null);
            Alert.alert('Success', 'Profile picture updated successfully!');

        } catch (err: any) {
            console.error("Upload error:", err);
            Alert.alert('Upload Error', err.message || 'Cannot upload image to server.');
        } finally {
            setIsUploading(false);
        }
    };


    const handleUploadFromLibrary = async () => {
        setModalVisible(false);

        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'Camera roll permissions are required to select an image.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
            const asset = result.assets[0];
            await performUpload(asset.uri, asset.mimeType, asset.fileName);
        }
    };

    const handleSelectSystemAvatar = async (avatarSource: ImageSourcePropType) => {
        setModalVisible(false);

        try {
            const assetSource = Image.resolveAssetSource(avatarSource);
            const uri = assetSource.uri;

            const fileName = `system_avatar_${Date.now()}.png`;
            const mimeType = "image/png";

            await performUpload(uri, mimeType, fileName);

        } catch (error) {
            console.error("Error processing system image:", error);
            Alert.alert("Error", "Cannot use this image.");
        }
    };

    const handleSaveChanges = async () => {
        if (!userInfo || !userInfo.id) {
            Alert.alert("Lỗi", "Không tìm thấy thông tin người dùng.");
            return;
        }

        setIsSaving(true);

        try {
            const payload = {
                fullname: fullname,
                phone: phone,
                gender: gender === 'Male',
                dob: formatDate(dob),
                profilepicture: userInfo.profilepicture || ""
            };

            console.log("Sending payload:", payload);

            await updateUserInfo(userInfo.id, payload);

            Alert.alert("Thành công", "Cập nhật thông tin thành công!");

            await fetchUserInfo();

        } catch (error: any) {
            console.error("Save error:", error);
            Alert.alert("Lỗi", error.message || "Không thể cập nhật thông tin.");
        } finally {
            setIsSaving(false);
        }
    };


    const renderAvatarSelectionModal = () => {
        const currentSystemAvatars = gender === 'Male' ? MEN_AVATARS : WOMEN_AVATARS;

        return (
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
                    <View style={modalStyles.overlay}>
                        <View
                            style={modalStyles.contentContainer}
                            {...panResponder.panHandlers}
                        >
                            <View style={modalStyles.headerIndicator} />

                            <Text style={modalStyles.title}>Update Profile Picture</Text>
                            <Text style={{ textAlign: 'center', color: '#888', marginBottom: 15, marginTop: -15, fontSize: 12 }}>
                                (Swipe down to close)
                            </Text>

                            <TouchableOpacity style={modalStyles.optionButton} onPress={handleUploadFromLibrary}>
                                <View style={modalStyles.optionIconContainer}>
                                    <Ionicons name="images-outline" size={24} color={BLUE_COLOR} />
                                </View>
                                <View>
                                    <Text style={modalStyles.optionText}>Upload from Library</Text>
                                    <Text style={modalStyles.optionSubText}>Select photo from your device</Text>
                                </View>
                            </TouchableOpacity>

                            <Text style={modalStyles.sectionTitle}>System Avatars ({gender})</Text>

                            <FlatList
                                data={currentSystemAvatars}
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                keyExtractor={(_, index) => index.toString()}
                                contentContainerStyle={{ paddingVertical: 10 }}
                                renderItem={({ item }) => (
                                    <TouchableOpacity onPress={() => handleSelectSystemAvatar(item)}>
                                        <Image source={item} style={modalStyles.systemAvatarItem} />
                                    </TouchableOpacity>
                                )}
                            />
                            <View style={{ height: 20 }} />
                        </View>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
        );
    };

    if (loading) {
        return (
            <View style={[styles.flexContainer, styles.center]}>
                <ActivityIndicator size="large" color={BLUE_COLOR} />
                <Text style={styles.loadingText}>Loading info...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={[styles.flexContainer, styles.center]}>
                <Text style={styles.errorText}>Error: {error}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={fetchUserInfo}>
                    <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.flexContainer}>
            <StatusBar barStyle="dark-content" />

            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.flexContainer}
                keyboardVerticalOffset={Platform.OS === "ios" ? insets.top : 0}
            >
                <ScrollView
                    style={styles.scrollView}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={[
                        styles.contentContainer,
                        {
                            paddingTop: insets.top + 20,
                            paddingBottom: TAB_BAR_HEIGHT + insets.bottom + 80
                        }
                    ]}
                >
                    {/* Avatar Section */}
                    <View style={styles.avatarContainer}>
                        <Image
                            source={displayAvatarSource}
                            style={styles.avatar}
                        />
                        <TouchableOpacity
                            style={styles.editIconContainer}
                            onPress={() => setModalVisible(true)}
                            disabled={isUploading}
                        >
                            {isUploading ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <AntDesign name="edit" size={20} color="#fff" />
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* Form Section */}
                    <View style={styles.inputSection}>
                        <CustomInput
                            label="Email"
                            placeholder="Email"
                            value={userInfo?.email || 'N/A'}
                            onChangeText={() => { }}
                            editable={false}
                        />
                        <CustomInput
                            label="Username"
                            placeholder="Username"
                            value={userInfo?.username || 'N/A'}
                            onChangeText={() => { }}
                            editable={false}
                        />

                        <CustomInput label="Fullname" placeholder="Enter Full Name" value={fullname} onChangeText={setFullname} />
                        <CustomInput label="Phone" placeholder="Enter Phone Number" value={phone} onChangeText={setPhone} />

                        <GenderInput label="Gender" value={gender} onChange={setGender} />

                        <DateInput label="Date of Birth (DOB)" value={formatDate(dob)} onChangeDate={setDob} />
                    </View>

                    <View style={styles.buttonWrapperScrolling}>
                        <TouchableOpacity
                            style={[styles.saveButton, isSaving && { opacity: 0.7 }]}
                            onPress={handleSaveChanges}
                            disabled={isSaving}
                        >
                            {isSaving ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <Text style={styles.saveButtonText}>Save Changes</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            {renderAvatarSelectionModal()}

        </View>
    );
}

export default UserScreen;

const modalStyles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    contentContainer: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        minHeight: 300,
        paddingBottom: 40,
    },
    headerIndicator: {
        width: 40,
        height: 5,
        backgroundColor: '#ccc',
        borderRadius: 3,
        alignSelf: 'center',
        marginBottom: 15,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 20,
        textAlign: 'center',
    },
    optionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        borderWidth: 1,
        borderColor: '#eee',
        borderRadius: 12,
        marginBottom: 20,
    },
    optionIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#EBF5FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    optionText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    optionSubText: {
        fontSize: 12,
        color: '#888',
        marginTop: 2,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
    },
    systemAvatarItem: {
        width: 80,
        height: 80,
        borderRadius: 40,
        marginRight: 15,
        borderWidth: 1,
        borderColor: '#eee',
    }
});

const stylesDate = StyleSheet.create({
    dateInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 50,
        backgroundColor: '#f5f5f5',
        borderRadius: 10,
        paddingHorizontal: 15,
        marginBottom: 15,
    },
    valueText: { fontSize: 16, flex: 1 }
});

const genderStyles = StyleSheet.create({
    radioGroup: { flexDirection: 'row', justifyContent: 'flex-start', marginTop: 5 },
    radioButton: { flexDirection: 'row', alignItems: 'center', marginRight: 20, paddingVertical: 5 },
    radioOuter: { height: 24, width: 24, borderRadius: 12, borderWidth: 2, borderColor: BLUE_COLOR, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
    radioInner: { height: 12, width: 12, borderRadius: 6, backgroundColor: BLUE_COLOR },
    radioText: { fontSize: 16, color: '#333' },
});

const inputStyles = StyleSheet.create({
    wrapper: { marginBottom: 15 },
    label: { fontSize: 14, fontWeight: 'bold', color: '#333', marginBottom: 5, marginLeft: 5 },
    container: { backgroundColor: '#f5f5f5', borderRadius: 10, height: 50, justifyContent: 'center', paddingHorizontal: 15 },
    disabledContainer: { backgroundColor: '#e9e9e9' },
    textInput: { fontSize: 16, color: '#333', flex: 1, paddingVertical: 0 },
});

const styles = StyleSheet.create({
    flexContainer: { flex: 1, backgroundColor: '#fff' },
    center: { justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 10, fontSize: 16, color: BLUE_COLOR },
    errorText: { marginTop: 10, fontSize: 16, color: '#D32F2F', textAlign: 'center', marginHorizontal: 30 },
    retryButton: { marginTop: 15, backgroundColor: BLUE_COLOR, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
    retryButtonText: { color: '#fff', fontWeight: 'bold' },
    scrollView: { flex: 1 },
    contentContainer: { paddingHorizontal: 20 },
    avatarContainer: { alignItems: 'center', justifyContent: 'center', marginBottom: 40, position: 'relative', alignSelf: 'center' },
    avatar: { width: 200, height: 200, borderRadius: 100, borderWidth: 3, borderColor: '#eee', backgroundColor: '#f0f0f0' },
    editIconContainer: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: BLUE_COLOR,
        borderRadius: 20,
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 3,
        borderColor: '#fff',
        elevation: 3,
        zIndex: 1
    },
    inputSection: { width: '100%', marginBottom: 30 },
    buttonWrapperScrolling: { paddingTop: 30, paddingBottom: 20 },
    saveButton: { backgroundColor: BLUE_COLOR, paddingVertical: 15, borderRadius: 10, width: '100%', alignItems: 'center' },
    saveButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});
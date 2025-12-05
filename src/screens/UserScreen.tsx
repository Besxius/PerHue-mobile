import React, { useState, useEffect, useCallback } from 'react';
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
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { UserInfo } from '../types/dataModels';
import { loadUserInfo, uploadProfilePicture } from '../api/userApi';
import DateTimePicker from '@react-native-community/datetimepicker';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { ImageLibraryOptions, launchImageLibrary } from 'react-native-image-picker';
import { Ionicons } from '@expo/vector-icons';

// 1. Định nghĩa kiểu dữ liệu (Interface) cho Props
interface InputProps {
    label: string;
    placeholder: string;
    value: string;
    onChangeText: (text: string) => void;
    editable?: boolean;
}

const CustomInput = ({
    label,
    placeholder,
    value,
    onChangeText,
    editable = true
}: InputProps) => (
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
    value: 'Nam' | 'Nữ';
    onChange: (gender: 'Nam' | 'Nữ') => void;
}

const GenderInput: React.FC<GenderInputProps> = ({ label, value, onChange }) => (
    <View style={inputStyles.wrapper}>
        <Text style={inputStyles.label}>{label}</Text>
        <View style={genderStyles.radioGroup}>
            {(['Nam', 'Nữ'] as const).map((genderOption) => (
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


const DateInput = ({
    label,
    value,
    onChangeDate
}: { label: string, value: string, onChangeDate: (date: Date) => void }) => {

    const [showPicker, setShowPicker] = useState(false);
    const initialDate = value ? new Date(value) : new Date();

    const onDateChange = (event: any, selectedDate?: Date) => {
        if (Platform.OS === 'android') {
            setShowPicker(false);
        }

        if (event.type === 'set' && selectedDate) {
            onChangeDate(selectedDate);
        }
        if (event.type === 'dismissed') {
            setShowPicker(false);
        }
    };
    const handlePress = () => {
        setShowPicker(true);
    };


    const displayValue = value || 'Chọn ngày sinh (YYYY-MM-DD)';

    return (
        <View style={inputStyles.wrapper}>
            <Text style={inputStyles.label}>{label}</Text>

            <TouchableOpacity
                onPress={handlePress}
                style={stylesDate.dateInputContainer}
                activeOpacity={0.7}
            >
                <Text style={[
                    stylesDate.valueText,
                    { color: value ? '#333' : '#888' }
                ]}>
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
    const [fullname, setFullname] = useState('');
    const [phone, setPhone] = useState('');
    const [gender, setGender] = useState<'Nam' | 'Nữ'>('Nam');
    const [dob, setDob] = useState(new Date());

    const formatDate = (date: Date) => {
        if (!date || isNaN(date.getTime())) return '';
        return date.toISOString().split('T')[0];
    };

    // --- LOGIC TẢI DỮ LIỆU ---
    const fetchUserInfo = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await loadUserInfo();
            setUserInfo(data);
            setFullname(data.fullname || '');
            setPhone(data.phone || '');
            setGender(data.gender ? 'Nam' : 'Nữ');

            setDob(data.dob ? new Date(data.dob) : new Date());

        } catch (err: any) {
            console.error('Lỗi tải thông tin:', err);
            setError(err.message || 'Không thể tải thông tin người dùng.');
            setUserInfo(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUserInfo();
    }, [fetchUserInfo]);

    const handleSaveChanges = () => {
        const updatedData = {
            fullname,
            phone,
            gender: gender === 'Nam',
            dob: formatDate(dob),
        };

        Alert.alert('Chức năng', `Sẵn sàng gửi dữ liệu chỉnh sửa lên API: ${JSON.stringify(updatedData)}`);
    };

    // --- HÀM XỬ LÝ UPLOAD ẢNH MỚI (ĐÃ CẬP NHẬT) ---
    const handleUploadProfilePicture = async () => {

        // 1. GỌI IMAGE PICKER ĐỂ CHỌN ẢNH
        const options: ImageLibraryOptions = {
            mediaType: 'photo',
            quality: 0.8,
            selectionLimit: 1,
        };

        const response = await launchImageLibrary(options);

        if (response.didCancel) {
            console.log('User cancelled image picker');
            return;
        }
        if (response.errorCode) { // Dùng errorCode của RNImagePicker
            Alert.alert('Lỗi', response.errorMessage || 'Lỗi khi chọn ảnh.');
            return;
        }

        const asset = response.assets?.[0];

        if (!asset || !asset.uri || !asset.type || !asset.fileName) {
            Alert.alert('Lỗi', 'Không thể lấy thông tin file. Vui lòng thử lại.');
            return;
        }

        // Đảm bảo URI là định dạng phù hợp cho iOS (loại bỏ 'file://' cho Android nếu cần)
        const fileUri = Platform.OS === 'ios' ? asset.uri.replace('file://', '') : asset.uri;


        // 2. GỌI API UPLOAD
        setIsUploading(true);
        try {
            const result = await uploadProfilePicture(
                fileUri,
                asset.type,
                asset.fileName
            );

            setUserInfo(prev => prev ? { ...prev, profilepicture: result.url } : null);

            Alert.alert('Thành công', 'Ảnh đại diện đã được cập nhật!');

        } catch (err: any) {
            Alert.alert('Lỗi Upload', err.message || 'Không thể tải ảnh lên server.');
        } finally {
            setIsUploading(false);
        }
    };

    if (loading) {
        return (
            <View style={[styles.flexContainer, styles.center]}>
                <ActivityIndicator size="large" color="#4285F4" />
                <Text style={styles.loadingText}>Đang tải thông tin...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={[styles.flexContainer, styles.center]}>
                <Text style={styles.errorText}>Lỗi: {error}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={fetchUserInfo}>
                    <Text style={styles.retryButtonText}>Thử lại</Text>
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
                    {/* Header */}
                    {/* <View style={styles.header}>
                        <Text style={styles.headerTitle}>Settings</Text>
                        <Text style={styles.headerSubtitle}>
                            {userInfo?.username ? `Hi, ${userInfo.username}` : 'Your Profile'}
                        </Text>
                    </View> */}

                    {/* Avatar Section */}
                    <View style={styles.avatarContainer}>
                        <Image
                            source={{ uri: userInfo?.profilepicture || 'https://placehold.co/150x150/EEEEEE/333333?text=N/A' }}
                            style={styles.avatar}
                        />
                        <TouchableOpacity style={styles.editIconContainer} onPress={handleUploadProfilePicture} disabled={isUploading}>
                            {isUploading ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <MaterialCommunityIcons name="pencil-circle" size={30} color="#4285F4" style={{ backgroundColor: '#fff', borderRadius: 15 }} />
                            )}
                        </TouchableOpacity>
                    </View>

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

                        <CustomInput label="Fullname" placeholder="Nhập Họ & Tên" value={fullname} onChangeText={setFullname} />
                        <CustomInput label="Phone" placeholder="Nhập Số điện thoại" value={phone} onChangeText={setPhone} />

                        <GenderInput label="Gender" value={gender} onChange={setGender} />

                        <DateInput label="Date of Birth (DOB)" value={formatDate(dob)} onChangeDate={setDob} />
                    </View>

                    <View style={styles.buttonWrapperScrolling}>
                        <TouchableOpacity
                            style={styles.saveButton}
                            onPress={handleSaveChanges}
                        >
                            <Text style={styles.saveButtonText}>Save Changes</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

        </View>
    );
}

export default UserScreen;

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
    valueText: {
        fontSize: 16,
        flex: 1,
    }
});

const genderStyles = StyleSheet.create({
    radioGroup: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        marginTop: 5,
    },
    radioButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 20,
        paddingVertical: 5,
    },
    radioOuter: {
        height: 24,
        width: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#4285F4',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 8,
    },
    radioInner: {
        height: 12,
        width: 12,
        borderRadius: 6,
        backgroundColor: '#4285F4',
    },
    radioText: {
        fontSize: 16,
        color: '#333',
    },
});

const inputStyles = StyleSheet.create({
    wrapper: {
        marginBottom: 15,
    },
    label: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 5,
        marginLeft: 5,
    },
    container: {
        backgroundColor: '#f5f5f5',
        borderRadius: 10,
        height: 50,
        justifyContent: 'center',
        paddingHorizontal: 15,
    },
    disabledContainer: {
        backgroundColor: '#e9e9e9',
    }, // Màu nền cho trường bị khóa
    textInput: {
        fontSize: 16,
        color: '#333',
        flex: 1,
        paddingVertical: 0,
    },
});

const styles = StyleSheet.create({
    flexContainer: {
        flex: 1,
        backgroundColor: '#fff',
    },
    center: {
        justifyContent: 'center',
        alignItems: 'center'
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#4285F4'
    },
    errorText: {
        marginTop: 10,
        fontSize: 16,
        color: '#D32F2F',
        textAlign: 'center',
        marginHorizontal: 30
    },
    retryButton: {
        marginTop: 15,
        backgroundColor: '#4285F4',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8
    },
    retryButtonText: {
        color: '#fff',
        fontWeight: 'bold'
    },
    scrollView: {
        flex: 1,
    },
    contentContainer: {
        paddingHorizontal: 20,
    },
    header: {
        marginBottom: 30,
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#333',
    },
    headerSubtitle: {
        fontSize: 16,
        color: '#888',
        marginTop: 5,
    },
    avatarContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 40,
        position: 'relative',
        alignSelf: 'center',
    },
    avatar: {
        width: 200,
        height: 200,
        borderRadius: 50,
        borderWidth: 3,
        borderColor: '#eee',
        backgroundColor: '#f0f0f0', // Thêm màu nền để tránh lỗi loading ảnh
    },
    editIconContainer: {
        position: 'absolute',
        bottom: 0,
        right: -5,
        backgroundColor: 'transparent', // Giữ trong suốt vì icon đã có nền trắng
        borderRadius: 15,
        width: 30,
        height: 30,
        alignItems: 'center',
        justifyContent: 'center',
        borderColor: '#fff',
    },
    editIcon: {
        fontSize: 16,
        lineHeight: 20,
        color: '#fff',
    },
    inputSection: {
        width: '100%',
        marginBottom: 30,
    },

    buttonWrapperScrolling: {
        paddingTop: 30,
        paddingBottom: 20,
    },
    saveButton: {
        backgroundColor: '#4285F4',
        paddingVertical: 15,
        borderRadius: 10,
        width: '100%',
        alignItems: 'center',
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
});
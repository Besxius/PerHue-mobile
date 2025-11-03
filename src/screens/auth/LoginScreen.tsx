import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    StatusBar,
    KeyboardAvoidingView,
    Platform,
    Alert,
    Switch,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CustomTextInput from '../../components/CustomTextInput';
import CustomButton from '../../components/CustomButton';

// THÊM: Để có thể điều hướng quay lại
import { useNavigation } from '@react-navigation/native';

const LoginScreen: React.FC = () => {
    const insets = useSafeAreaInsets();
    // THÊM: Hook navigation
    const navigation = useNavigation();

    const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [rememberMe, setRememberMe] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);

    // THÊM: Trạng thái cho các trường đăng ký
    const [fullName, setFullName] = useState<string>('');
    const [phoneNo, setPhoneNo] = useState<string>('');
    const [licenseNo, setLicenseNo] = useState<string>('');


    // --- Logic Xử lý Login ---
    const handleLogin = async () => {
        setLoading(true);
        console.log('Đăng nhập với:', { email, password, rememberMe });

        try {
            await new Promise((resolve) => setTimeout(resolve, 2000));
            if (email === 'test@example.com' && password === 'password') {
                Alert.alert('Thành công', 'Đăng nhập thành công!');
                // TODO: Chuyển hướng người dùng sang App Flow
            } else {
                Alert.alert('Lỗi', 'Email hoặc mật khẩu không đúng.');
            }
        } catch (error) {
            Alert.alert('Lỗi', 'Có lỗi xảy ra, vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    // --- Logic Xử lý Register ---
    const handleRegister = async () => {
        setLoading(true);
        console.log('Đăng ký với:', { fullName, email, password, phoneNo, licenseNo });

        try {
            await new Promise((resolve) => setTimeout(resolve, 2000));
            // Ví dụ kiểm tra đơn giản
            if (fullName && email && password && phoneNo) {
                Alert.alert('Thành công', 'Đăng ký thành công!');
                // TODO: Chuyển hướng người dùng hoặc tự động đăng nhập
            } else {
                Alert.alert('Lỗi', 'Vui lòng điền đầy đủ các trường bắt buộc.');
            }
        } catch (error) {
            Alert.alert('Lỗi', 'Có lỗi xảy ra trong quá trình đăng ký, vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPassword = () => {
        Alert.alert('Chức năng', 'Chuyển sang màn hình quên mật khẩu.');
    };

    const handleGoogleLogin = () => {
        Alert.alert('Chức năng', 'Đăng nhập bằng Google.');
    };

    return (
        <View style={styles.fullScreen}>
            <StatusBar barStyle="light-content" backgroundColor="#2E3A59" />
            <KeyboardAvoidingView
                style={styles.keyboardAvoidingView}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}
            >
                {/* Header Section */}
                <View style={[styles.headerContainer, { paddingTop: insets.top + 20 }]}>
                    {/* Nút quay lại */}
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        style={styles.backButton}
                    >
                        <Icon name="arrow-left" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.title}>
                        {activeTab === 'login' ? 'Go ahead and set up your account' : 'Create your account'}
                    </Text>
                    <Text style={styles.subtitle}>
                        Sign in-up to enjoy the best managing experience
                    </Text>
                </View>

                {/* Form Section */}
                <View style={styles.formContainer}>
                    {/* Tab Switch */}
                    <View style={styles.tabContainer}>
                        <TouchableOpacity
                            style={[styles.tabButton, activeTab === 'login' && styles.activeTab]}
                            onPress={() => setActiveTab('login')}
                        >
                            <Text style={[styles.tabText, activeTab === 'login' && styles.activeTabText]}>
                                Login
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.tabButton, activeTab === 'register' && styles.activeTab]}
                            onPress={() => setActiveTab('register')}
                        >
                            <Text style={[styles.tabText, activeTab === 'register' && styles.activeTabText]}>
                                Register
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Conditional Rendering của Form */}
                    {activeTab === 'login' ? (
                        <>
                            <CustomTextInput
                                iconName="email-outline"
                                placeholder="E-mail ID"
                                keyboardType="email-address"
                                autoCapitalize="none"
                                value={email}
                                onChangeText={setEmail}
                            />
                            <CustomTextInput
                                iconName="lock-outline"
                                placeholder="Password"
                                secureTextEntry
                                value={password}
                                onChangeText={setPassword}
                            />

                            <View style={styles.optionsRow}>
                                <View style={styles.rememberMeContainer}>
                                    <Switch
                                        trackColor={{ false: "#767577", true: "#81b0ff" }}
                                        thumbColor={rememberMe ? "#f5dd4b" : "#f4f3f4"}
                                        ios_backgroundColor="#3e3e3e"
                                        onValueChange={setRememberMe}
                                        value={rememberMe}
                                        style={styles.switch}
                                    />
                                    <Text style={styles.rememberMeText}>Remember me</Text>
                                </View>
                                <TouchableOpacity onPress={handleForgotPassword}>
                                    <Text style={styles.forgotPasswordText}>Forget Password?</Text>
                                </TouchableOpacity>
                            </View>

                            <CustomButton
                                title="Login"
                                onPress={handleLogin}
                                loading={loading}
                                color="#4a90e2"
                            />

                            <View style={styles.separatorContainer}>
                                <View style={styles.separatorLine} />
                                <Text style={styles.separatorText}>Or login with</Text>
                                <View style={styles.separatorLine} />
                            </View>

                            <CustomButton
                                title="Google"
                                onPress={handleGoogleLogin}
                                iconName="google"
                                color="#fff" // Nền trắng
                                textColor="#333" // Chữ đen
                                style={styles.googleButton}
                                textStyle={styles.googleButtonText}
                            />
                        </>
                    ) : (
                        // GIAO DIỆN ĐĂNG KÝ MỚI
                        <>
                            <CustomTextInput
                                iconName="account-outline" // Icon cho Full Name
                                placeholder="Full Name"
                                autoCapitalize="words"
                                value={fullName}
                                onChangeText={setFullName}
                            />
                            <CustomTextInput
                                iconName="email-outline"
                                placeholder="Email-ID"
                                keyboardType="email-address"
                                autoCapitalize="none"
                                value={email}
                                onChangeText={setEmail}
                            />
                            <CustomTextInput
                                iconName="lock-outline"
                                placeholder="Password"
                                secureTextEntry
                                value={password}
                                onChangeText={setPassword}
                            />
                            <CustomTextInput
                                iconName="phone-outline" // Icon cho Phone No.
                                placeholder="Phone No."
                                keyboardType="phone-pad"
                                value={phoneNo}
                                onChangeText={setPhoneNo}
                            />
                            <CustomTextInput
                                iconName="card-account-details-outline" // Icon cho License No. (hoặc icon phù hợp)
                                placeholder="License No."
                                autoCapitalize="characters"
                                value={licenseNo}
                                onChangeText={setLicenseNo}
                            />

                            <CustomButton
                                title="Register"
                                onPress={handleRegister}
                                loading={loading} // Sử dụng cùng loading state
                                color="#4a90e2" // Màu xanh
                            />
                        </>
                    )}
                </View>
            </KeyboardAvoidingView>
        </View>
    );
};

// Stylesheets (Giữ nguyên phần chung và thêm/chỉnh sửa nếu cần)
const styles = StyleSheet.create({
    fullScreen: {
        flex: 1,
        backgroundColor: '#2E3A59',
    },
    keyboardAvoidingView: {
        flex: 1,
    },
    headerContainer: {
        paddingHorizontal: 20,
        paddingBottom: 50,
        backgroundColor: '#2E3A59',
    },
    backButton: { // Style cho nút quay lại
        marginBottom: 20,
        padding: 5,
        alignSelf: 'flex-start', // Đảm bảo nút ở bên trái
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 16,
        color: '#ccc',
    },
    formContainer: {
        flex: 1,
        backgroundColor: '#fff',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        padding: 20,
        marginTop: -30,
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: '#f0f0f0',
        borderRadius: 10,
        marginBottom: 20,
        padding: 5,
        justifyContent: 'space-around',
    },
    tabButton: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 8,
    },
    activeTab: {
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
    },
    tabText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#888',
    },
    activeTabText: {
        color: '#333',
    },
    optionsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    rememberMeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    switch: {
        transform: [{ scaleX: .8 }, { scaleY: .8 }],
    },
    rememberMeText: {
        marginLeft: 5,
        fontSize: 14,
        color: '#555',
    },
    forgotPasswordText: {
        fontSize: 14,
        color: '#4a90e2',
        fontWeight: 'bold',
    },
    separatorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 20,
    },
    separatorLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#e0e0e0',
    },
    separatorText: {
        marginHorizontal: 10,
        color: '#888',
        fontSize: 14,
    },
    googleButton: {
        borderColor: '#e0e0e0',
        borderWidth: 1,
    },
    googleButtonText: {
        color: '#333',
    },
    registerPlaceholder: { // Không còn sử dụng nhưng giữ lại
        textAlign: 'center',
        fontSize: 16,
        color: '#666',
        marginBottom: 20,
    }
});

export default LoginScreen;

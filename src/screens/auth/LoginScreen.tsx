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
    ScrollView,
    ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CustomTextInput from '../../components/CustomTextInput';
import CustomButton from '../../components/CustomButton';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from './AuthContext';
import { login, signInWithGoogle, register } from '../../api/authApi';
import { configureGoogleSignIn } from '../../api/config/googleAuthConfig';
import DateTimePicker from '@react-native-community/datetimepicker';
import { JwtPayload, RegisterCredentials } from '../../types/dataModels';
import { jwtDecode } from 'jwt-decode';
import CustomConfirmModal, { AlertConfig } from '../../components/CustomConfirmModal';

configureGoogleSignIn();

// 1. Email Validation (Kept as is)
const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

// 2. Password Strength Validation (as required)
const isValidPassword = (password: string): boolean => {
    // Requirements: Min 8, Max 20 chars, at least 1 lowercase, 1 uppercase, 1 number, 1 special character (@$!%*?&)
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$.!%*?&]{8,20}$/;
    return passwordRegex.test(password);
};

// 3. Phone Number Validation (Simple: 8-15 digits)
const isValidPhone = (phone: string): boolean => {
    const phoneRegex = /^\d{8,10}$/;
    return phoneRegex.test(phone);
};

// 4. Date formatting
const formatDate = (date: Date): string => {
    if (!date || isNaN(date.getTime())) return '';

    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');

    return `${year}-${month}-${day}`;
};

const LoginScreen: React.FC = () => {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<any>();

    const { setIsLoggedIn, setUserRole, setUserName } = useAuth();
    const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
    const [loading, setLoading] = useState<boolean>(false);

    const [modalConfig, setModalConfig] = useState<AlertConfig>({
        visible: false,
        title: '',
        message: '',
        type: 'info'
    });

    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [rememberMe, setRememberMe] = useState<boolean>(false);

    const [fullName, setFullName] = useState<string>('');
    const [registerEmail, setRegisterEmail] = useState<string>('');
    const [registerPassword, setRegisterPassword] = useState<string>('');
    const [confirmPassword, setConfirmPassword] = useState<string>('');
    const [phoneNo, setPhoneNo] = useState<string>('');
    const [gender, setGender] = useState<boolean>(true);

    const [dob, setDob] = useState<Date>(new Date(2000, 0, 1));
    const [showDatePicker, setShowDatePicker] = useState<boolean>(false);

    const [profilePicture, setProfilePicture] = useState<string>('');

    const [errors, setErrors] = useState<{
        fullName?: boolean;
        registerEmail?: boolean;
        registerPassword?: boolean;
        confirmPassword?: boolean;
        phoneNo?: boolean;
    }>({});

    const [showToast, setShowToast] = useState<boolean>(false);
    const [toastMessage, setToastMessage] = useState<string>('');

    const showCustomToast = (message: string) => {
        setToastMessage(message);
        setShowToast(true);
        setTimeout(() => {
            setShowToast(false);
        }, 2000);
    };

    // --- Date Picker Logic ---
    const onDateChange = (event: any, selectedDate?: Date) => {
        if (Platform.OS === 'android') {
            setShowDatePicker(false);
        }

        if (event.type === 'set' && selectedDate) {
            setDob(selectedDate);
        }
        if (event.type === 'dismissed') {
            setShowDatePicker(false);
        }
    };
    const handleShowDatePicker = () => {
        setShowDatePicker(true);
    };

    const clearError = (field: keyof typeof errors) => {
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: false }));
        }
    };

    const renderRegisterInput = (
        icon: string,
        placeholder: string,
        value: string,
        setValue: (text: string) => void,
        fieldKey: keyof typeof errors,
        options: { secureTextEntry?: boolean; keyboardType?: any; autoCapitalize?: any } = {}
    ) => {
        let errorText = "";
        if (errors[fieldKey]) {
            switch (fieldKey) {
                case 'fullName': errorText = "Full name is required"; break;
                case 'registerEmail': errorText = "Invalid email Address"; break;
                case 'registerPassword': errorText = "Passwords must be at least 8 characters long and contain at least one digit, one uppercase letter, and one lowercase letter."; break;
                case 'confirmPassword': errorText = "Conmfirm password does not match password"; break;
                case 'phoneNo': errorText = "Invalid Phone Number"; break;
                default: errorText = "This field is required";
            }
        }

        return (
            <View style={styles.inputWrapper}>
                {errors[fieldKey] && (
                    <Text style={styles.topErrorText}>{errorText}</Text>
                )}

                <CustomTextInput
                    iconName={icon}
                    placeholder={placeholder}
                    value={value}
                    onChangeText={(text) => { setValue(text); clearError(fieldKey); }}
                    secureTextEntry={options.secureTextEntry}
                    keyboardType={options.keyboardType}
                    autoCapitalize={options.autoCapitalize}
                    error={!!errors[fieldKey]}
                />
            </View>
        );
    };


    // --- Login Logic ---
    const handleLogin = async () => {
        if (!email || !password) {
            setModalConfig({
                visible: true,
                title: 'Input Required',
                message: 'Please enter your email address.',
                type: 'warning',
                confirmText: 'OK',
                onConfirm: () => setModalConfig(prev => ({ ...prev, visible: false }))
            });
            return;
        }

        if (!isValidEmail(email)) {
            setModalConfig({
                visible: true,
                title: 'Input Required',
                message: 'Please enter your password.',
                type: 'warning',
                confirmText: 'OK',
                onConfirm: () => setModalConfig(prev => ({ ...prev, visible: false }))
            });
            return;
        }

        setLoading(true);

        try {
            const responseData = await login({ email, password });
            showCustomToast('Login successful! Welcome');

            if (responseData && responseData.accessToken) {
                try {
                    const decoded: JwtPayload = jwtDecode(responseData.accessToken);

                    setUserRole(decoded.role || 'User');
                    if (decoded.unique_name) {
                        setUserName(decoded.unique_name);
                    }
                } catch (e) {
                    console.error("Error decoding token at login:", e);
                    setUserRole('User');
                }

                await new Promise(resolve => setTimeout(resolve, 500));
                setIsLoggedIn(true);
            }
        } catch (error: any) {
            const errorMessage = error.message || 'An error occurred, please try again.';
            setModalConfig({
                visible: true,
                title: 'Login Failed',
                message: errorMessage,
                type: 'error',
                confirmText: 'Try Again',
                onConfirm: () => setModalConfig(prev => ({ ...prev, visible: false }))
            });
        } finally {
            setLoading(false);
        }
    };

    // --- Register Logic (Updated to call the actual register function) ---
    const handleRegister = async () => {
        setLoading(true);

        const newErrors: typeof errors = {};
        let hasError = false;

        // 1. Check required fields
        if (!fullName.trim()) {
            newErrors.fullName = true;
            hasError = true;
        }

        // 2. Email Validation
        if (!registerEmail.trim() || !isValidEmail(registerEmail)) {
            newErrors.registerEmail = true;
            hasError = true;
        }

        // 3. Password Validation (strength)
        if (!registerPassword || !isValidPassword(registerPassword)) {
            newErrors.registerPassword = true;
            hasError = true;
            if (registerPassword && !isValidPassword(registerPassword)) {
                // Optional: Still show toast/modal for specific password requirements explanation if user typed something but it's weak
                showCustomToast('Password must have 8-20 chars, uppercase, lowercase, number & special char.');
            }
        }

        // 4. Check Password Match
        if (confirmPassword !== registerPassword) {
            newErrors.confirmPassword = true;
            hasError = true;
        }

        // 5. Check Phone Number
        if (!phoneNo.trim() || !isValidPhone(phoneNo)) {
            newErrors.phoneNo = true;
            hasError = true;
        }

        setErrors(newErrors);

        if (hasError) {
            setLoading(false);
            showCustomToast('Please check the highlighted fields.');
            return;
        }

        // Prepare Credentials for API
        const credentials: RegisterCredentials = {
            email: registerEmail,
            password: registerPassword,
            confirmPassword: confirmPassword,
            fullname: fullName,
            phone: phoneNo,
            gender: gender,
            dob: formatDate(dob),
            profilepicture: profilePicture || '',
        };

        try {
            await register(credentials);

            setModalConfig({
                visible: true,
                title: 'Success',
                message: 'Account registration successful! Please log in.',
                type: 'success',
                confirmText: 'Go to Login',
                onConfirm: () => {
                    setModalConfig(prev => ({ ...prev, visible: false }));
                    setActiveTab('login');
                    setEmail(registerEmail);
                    setPassword('');
                }
            });

        } catch (error: any) {
            const errorMessage = error.message || 'An error occurred during registration, please try again.';
            setModalConfig({
                visible: true,
                title: 'Registration Error',
                message: errorMessage,
                type: 'error',
                confirmText: 'Close',
                onConfirm: () => setModalConfig(prev => ({ ...prev, visible: false }))
            });
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPassword = () => {
        setModalConfig({
            visible: true,
            title: 'Feature Unavailable',
            message: 'Navigate to forgot password screen (Not implemented).',
            type: 'info',
            confirmText: 'Close',
            onConfirm: () => setModalConfig(prev => ({ ...prev, visible: false }))
        });
    };

    const handleGoogleLogin = async () => {
        setLoading(true);
        try {
            const result = await signInWithGoogle();
            if (result.success && result.user && result.loginData) {

                const decoded: JwtPayload = jwtDecode(result.loginData.accessToken);
                setUserRole(decoded.role || 'User');
                if (decoded.unique_name) {
                    setUserName(decoded.unique_name);
                }

                showCustomToast(`Welcome, ${result.user.displayName}! Login successful.`);
                await new Promise(resolve => setTimeout(resolve, 1500));
                setIsLoggedIn(true);
            } else if (result.error) {
                throw new Error(result.error);
            } else {
                throw new Error("Google login successful but no Local Token received.");
            }
        } catch (error: any) {
            const errorMessage = error.message || 'Unknown error.';
            if (!errorMessage.toLowerCase().includes("cancelled")) {
                setModalConfig({
                    visible: true,
                    title: 'Google Login Error',
                    message: errorMessage,
                    type: 'error',
                    confirmText: 'Close',
                    onConfirm: () => setModalConfig(prev => ({ ...prev, visible: false }))
                });
            } else {
                showCustomToast('Login cancelled.');
            }
        } finally {
            setLoading(false);
        }
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

                    {/* Form area with ScrollView to handle long registration form */}
                    <ScrollView contentContainerStyle={styles.formScrollContent}>
                        {/* Conditional Form Rendering */}
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
                                    <TouchableOpacity onPress={handleForgotPassword}>
                                        <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                                    </TouchableOpacity>
                                </View>

                                <CustomButton
                                    title="Login"
                                    onPress={handleLogin}
                                    loading={loading && activeTab === 'login'}
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
                                    loading={loading && activeTab === 'login'}
                                    iconName="google"
                                    color="#fff"
                                    textColor="#333"
                                    style={styles.googleButton}
                                    textStyle={styles.googleButtonText}
                                />
                            </>
                        ) : (
                            <>
                                {renderRegisterInput("account-outline", "Full Name", fullName, setFullName, 'fullName', { autoCapitalize: 'words' })}
                                {renderRegisterInput("email-outline", "Email-ID", registerEmail, setRegisterEmail, 'registerEmail', { keyboardType: 'email-address', autoCapitalize: 'none' })}
                                {renderRegisterInput("lock-outline", "Password", registerPassword, setRegisterPassword, 'registerPassword', { secureTextEntry: true })}
                                {renderRegisterInput("lock-check-outline", "Confirm Password", confirmPassword, setConfirmPassword, 'confirmPassword', { secureTextEntry: true })}
                                {renderRegisterInput("phone-outline", "Phone No.", phoneNo, setPhoneNo, 'phoneNo', { keyboardType: 'phone-pad' })}

                                {/* <CustomTextInput
                                    iconName="account-outline"
                                    error={errors.fullName}
                                    placeholder="Full Name"
                                    autoCapitalize="words"
                                    value={fullName}
                                    onChangeText={(text) => {
                                        setFullName(text);
                                        clearError('fullName');
                                    }}
                                />
                                <CustomTextInput
                                    iconName="email-outline"
                                    error={errors.registerEmail}
                                    placeholder="Email-ID"
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    value={registerEmail}
                                    onChangeText={(text) => {
                                        setRegisterEmail(text);
                                        clearError('registerEmail');
                                    }}
                                />
                                <CustomTextInput
                                    iconName="lock-outline"
                                    error={errors.registerPassword}
                                    placeholder="Password"
                                    secureTextEntry
                                    value={registerPassword}
                                    onChangeText={(text) => {
                                        setRegisterPassword(text);
                                        clearError('registerPassword');
                                    }}
                                />
                                <CustomTextInput
                                    iconName="lock-check-outline"
                                    error={errors.confirmPassword}
                                    placeholder="Confirm Password"
                                    secureTextEntry
                                    value={confirmPassword}
                                    onChangeText={(text) => {
                                        setConfirmPassword(text);
                                        clearError('confirmPassword');
                                    }}
                                />
                                <CustomTextInput
                                    iconName="phone-outline"
                                    error={errors.phoneNo}
                                    placeholder="Phone No."
                                    keyboardType="phone-pad"
                                    value={phoneNo}
                                    onChangeText={(text) => {
                                        setPhoneNo(text);
                                        clearError('phoneNo');
                                    }}
                                /> */}

                                {/* Date Picker */}
                                <TouchableOpacity onPress={handleShowDatePicker} style={styles.fakeDatePicker}>
                                    <Icon name="calendar-range" size={20} color="#888" style={styles.fakeDateIcon} />
                                    <Text style={styles.fakeDateText}>{formatDate(dob)}</Text>
                                    <Text style={styles.fakeDatePlaceholder}>Date of Birth</Text>
                                </TouchableOpacity>

                                {showDatePicker && (
                                    <DateTimePicker
                                        testID="dateTimePicker"
                                        value={dob}
                                        mode="date"
                                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                        onChange={onDateChange}
                                        maximumDate={new Date()}
                                    />
                                )}

                                {/* Gender Radio Button - Simulated by touchables */}
                                <View style={styles.genderContainer}>
                                    <View style={styles.genderOptions}>
                                        <TouchableOpacity
                                            style={[styles.genderButton, gender && styles.genderButtonActive]}
                                            onPress={() => setGender(true)}
                                        >
                                            <Icon name={gender ? "radiobox-marked" : "radiobox-blank"} size={18} color={gender ? "#4a90e2" : "#888"} />
                                            <Text style={[styles.genderButtonText, gender && styles.genderButtonTextActive]}>Male</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[styles.genderButton, !gender && styles.genderButtonActive]}
                                            onPress={() => setGender(false)}
                                        >
                                            <Icon name={!gender ? "radiobox-marked" : "radiobox-blank"} size={18} color={!gender ? "#4a90e2" : "#888"} />
                                            <Text style={[styles.genderButtonText, !gender && styles.genderButtonTextActive]}>Female</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                <CustomButton
                                    title="Register"
                                    onPress={handleRegister}
                                    loading={loading && activeTab === 'register'}
                                    color="#4a90e2"
                                />
                            </>
                        )}
                    </ScrollView>
                </View>
            </KeyboardAvoidingView>

            <CustomConfirmModal
                {...modalConfig}
                onCancel={modalConfig.onCancel}
                onConfirm={() => {
                    if (modalConfig.onConfirm) modalConfig.onConfirm();
                }}
            />

            {showToast && (
                <View style={styles.toastContainer}>
                    <Text style={styles.toastText}>{toastMessage}</Text>
                </View>
            )}

            {loading && (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color="#3b82f6" />
                </View>
            )}
        </View>
    );
};

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
    backButton: {
        marginBottom: 20,
        padding: 5,
        alignSelf: 'flex-start',
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
    formScrollContent: {
        paddingBottom: 40,
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
    inputError: {
        borderColor: 'red',
        borderWidth: 1,
        backgroundColor: '#fff5f5',
    },
    fakeDatePicker: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 10,
        paddingHorizontal: 15,
        paddingVertical: 12,
        marginBottom: 15,
        backgroundColor: '#f9f9f9',
    },
    fakeDateIcon: {
        marginRight: 10,
    },
    fakeDateText: {
        flex: 1,
        fontSize: 16,
        color: '#333',
        fontWeight: 'bold',
    },
    fakeDatePlaceholder: {
        position: 'absolute',
        top: 5,
        right: 15,
        fontSize: 12,
        color: '#aaa',
    },

    genderContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
        paddingVertical: 10,
    },
    genderLabel: {
        fontSize: 16,
        color: '#333',
        fontWeight: '600',
        marginRight: 20,
    },
    genderOptions: {
        flexDirection: 'row',
        flex: 1,
        justifyContent: 'space-around',
    },
    genderButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#f0f0f0',
        borderWidth: 1,
        borderColor: '#f0f0f0',
    },
    genderButtonActive: {
        backgroundColor: '#e6f0ff',
        borderColor: '#4a90e2',
    },
    genderButtonText: {
        marginLeft: 8,
        fontSize: 14,
        color: '#888',
        fontWeight: '500',
    },
    genderButtonTextActive: {
        color: '#4a90e2',
    },

    uploadButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#e6f0ff',
        borderRadius: 10,
        paddingVertical: 15,
        marginBottom: 25,
        borderWidth: 1,
        borderColor: '#4a90e2',
    },
    uploadButtonText: {
        fontSize: 16,
        color: '#4a90e2',
        fontWeight: 'bold',
        marginHorizontal: 10,
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 100,
    },
    toastContainer: {
        position: 'absolute',
        bottom: 50,
        alignSelf: 'center',
        backgroundColor: 'rgba(0,0,0,0.8)',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
        zIndex: 200,
    },
    toastText: {
        color: '#fff',
        fontSize: 14,
    },
    inputWrapper: {
        marginBottom: 2,
    },
    topErrorText: {
        color: '#f87c7cff',
        fontSize: 12,
        fontWeight: 'bold',
        marginLeft: 5,
        marginBottom: 2,
    },
});

export default LoginScreen;
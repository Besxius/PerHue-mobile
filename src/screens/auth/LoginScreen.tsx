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

    // --- Login Logic ---
    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Warning', 'Please enter Email and Password.');
            return;
        }

        if (!isValidEmail(email)) {
            Alert.alert('Format Error', 'Invalid Email. Please check again.');
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
            Alert.alert('Login Error', errorMessage);
            console.error('Error during login:', error);
        } finally {
            setLoading(false);
        }
    };

    // --- Register Logic (Updated to call the actual register function) ---
    const handleRegister = async () => {
        setLoading(true);

        // 1. Check required fields
        if (!fullName || !registerEmail || !registerPassword || !confirmPassword || !phoneNo) {
            Alert.alert('Warning', 'Please fill in all required fields.');
            setLoading(false);
            return;
        }

        // 2. Email Validation
        if (!isValidEmail(registerEmail)) {
            Alert.alert('Format Error', 'Invalid registration Email. Please check again.');
            setLoading(false);
            return;
        }

        // 3. Password Validation (strength)
        if (!isValidPassword(registerPassword)) {
            Alert.alert(
                'Password Error',
                'Password must be 8-20 characters long and include: at least 1 lowercase letter, 1 uppercase letter, 1 number, and 1 special character (@$!%*?&).'
            );
            setLoading(false);
            return;
        }

        // 4. Check if Passwords match
        if (registerPassword !== confirmPassword) {
            Alert.alert('Confirmation Password Error', 'Password and Confirmation Password do not match.');
            setLoading(false);
            return;
        }

        // 5. Phone Number Validation
        if (!isValidPhone(phoneNo)) {
            Alert.alert('Format Error', 'Invalid Phone number. Please check again.');
            setLoading(false);
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

        console.log('Calling Register API with:', credentials);

        try {
            await register(credentials);

            Alert.alert('Success', 'Account registration successful! Please log in.');

            setActiveTab('login');
            setEmail(registerEmail);
            setPassword('');

        } catch (error: any) {
            const errorMessage = error.message || 'An error occurred during registration, please try again.';
            Alert.alert('Registration Error', errorMessage);
            console.error('Error during registration:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPassword = () => {
        Alert.alert('Functionality', 'Navigate to forgot password screen.');
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
            if (errorMessage.toLowerCase().includes("cancelled") || errorMessage.toLowerCase().includes("user cancelled")) {
                showCustomToast('Login cancelled.');
            } else {
                Alert.alert('Google Login Error', errorMessage);
                console.error('Error during Google login:', error);
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
                                        <Text style={styles.forgotPasswordText}>Forget Password?</Text>
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
                            // NEW REGISTRATION INTERFACE
                            <>
                                <CustomTextInput
                                    iconName="account-outline"
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
                                    value={registerEmail}
                                    onChangeText={setRegisterEmail}
                                />
                                <CustomTextInput
                                    iconName="lock-outline"
                                    placeholder="Password"
                                    secureTextEntry
                                    value={registerPassword}
                                    onChangeText={setRegisterPassword}
                                />
                                <CustomTextInput
                                    iconName="lock-check-outline"
                                    placeholder="Confirm Password"
                                    secureTextEntry
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                />
                                <CustomTextInput
                                    iconName="phone-outline"
                                    placeholder="Phone No."
                                    keyboardType="phone-pad"
                                    value={phoneNo}
                                    onChangeText={setPhoneNo}
                                />

                                {/* Date Picker - Mocked interface activated by touch */}
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
            {/* {showToast && <CustomToast message={toastMessage} />} */}
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

    // --- New Registration Form Styles ---
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
    }
});

export default LoginScreen;
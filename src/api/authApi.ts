import { GoogleSignin, User } from '@react-native-google-signin/google-signin';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import axios from 'axios';
import { LoginCredentials, LoginResponseData, RegisterCredentials, SignInResult } from '../types/dataModels';
import { ApiResponse } from '../types/apiTypes';
import apiClient, { clearAuthData, setAuthToken, setRefreshToken } from './apiClient';

const USER_ENDPOINT = '/auth';
export const login = async (credentials: LoginCredentials): Promise<LoginResponseData> => {
    try {
        const response = await apiClient.post<LoginResponseData>(
            `${USER_ENDPOINT}/login`, // Thay thế bằng endpoint đăng nhập thực tế của bạn
            credentials
        );

        const { accessToken, refreshToken } = response.data;

        if (accessToken) {
            await setAuthToken(accessToken);
            await setRefreshToken(refreshToken || null);
            return response.data;
        } else {
            // Trường hợp response 2xx nhưng không có token
            throw new Error('Login failed: No access token returned from server.');
        }

    } catch (error) {
        let errorMessage = 'Error connecting to server during login.';

        if (axios.isAxiosError(error)) {
            const status = error.response?.status;

            switch (status) {
                case 404:
                    // Tài khoản không tồn tại
                    errorMessage = 'Account does not exist.';
                    break;
                case 403:
                    // Tài khoản bị khóa hoặc không có quyền truy cập
                    errorMessage = 'Account is locked or access is forbidden.';
                    break;
                case 401:
                    // Sai email hoặc password
                    errorMessage = 'Incorrect email or password.';
                    break;
                default:
                    // Các lỗi khác (5xx, 400, 422, v.v.)
                    errorMessage = error.response?.data?.message || `Unexpected error: ${error.message}`;
                    break;
            }
        } else if (error instanceof Error) {
            errorMessage = error.message;
        }

        // Luôn ném lỗi với thông báo chi tiết
        throw new Error(errorMessage);
    }
};

export const register = async (credentials: RegisterCredentials): Promise<void> => {
    try {
        const response = await apiClient.post<void>(
            `${USER_ENDPOINT}/register`,
            credentials
        );

        return response.data;

    } catch (error) {
        let errorMessage = 'Error connecting to server during registration.';
        if (axios.isAxiosError(error)) {
            const status = error.response?.status;
            switch (status) {
                case 401:
                    errorMessage = 'Email have already been registered.';
                    break;
                case 404:
                    errorMessage = 'Server endpoint not found.';
                    break;
            }
        } else if (error instanceof Error) {
            errorMessage = error.message;
        }

        throw new Error(errorMessage);
    }
};

export const loginWithGoogleAPI = async (idToken: string): Promise<LoginResponseData> => {
    try {
        // Gửi Google ID Token tới endpoint /auth/google của server
        const response = await apiClient.post<LoginResponseData>(
            `${USER_ENDPOINT}/google`,
            { idToken } // Cấu trúc body: { "idToken": "..." }
        );

        const { accessToken, refreshToken } = response.data;

        if (accessToken) {
            await setAuthToken(accessToken);
            await setRefreshToken(refreshToken || null);
            return response.data;
        } else {
            throw new Error('Login with Google failed: No access token returned from server.');
        }
    } catch (error) {
        let errorMessage = 'Error connecting to server during Google login.';
        if (axios.isAxiosError(error)) {
            errorMessage = error.response?.data?.message || error.message;
        } else if (error instanceof Error) {
            errorMessage = error.message;
        }
        throw new Error(errorMessage);
    }
}
/**
 * Đăng nhập người dùng bằng Google và xác thực với Firebase.
 * @returns Promise<SignInResult>
 */
export async function signInWithGoogle(): Promise<SignInResult> {
    try {
        // 1. Kiểm tra Dịch vụ Google Play (Chỉ Android)
        await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

        // 2. Bắt đầu luồng đăng nhập Google
        const signInResponse = await GoogleSignin.signIn();
        // idToken nằm trong đối tượng user của phản hồi
        const idToken = signInResponse.data?.idToken;

        if (!idToken) {
            return { success: false, error: 'Not received Token Id from Google' };
        }

        // 3. Tạo thông tin xác thực Firebase từ ID Token Google
        const googleCredential = auth.GoogleAuthProvider.credential(idToken);

        // 4. Đăng nhập người dùng vào Firebase
        const userCredential = await auth().signInWithCredential(googleCredential);

        const loginData = await loginWithGoogleAPI(idToken);

        return {
            success: true,
            user: userCredential.user,
            loginData: loginData
        };

    } catch (error: any) {
        if (error.code === 'E_SIGN_IN_CANCELLED') {
            return { success: false, error: 'Account have canceled login' };
        }

        if (error.message.includes('No access token returned')) {
            await clearAuthData();
        }

        // Xử lý các lỗi khác của Google Sign-in
        let errorMessage = `Lỗi đăng nhập: ${error.message}`;
        if (error.code === 'E_NETWORK_ERROR') {
            errorMessage = 'Network error occurred during Google Sign-In.';
        }

        console.error('Detail error', error);

        return { success: false, error: errorMessage };
    }
}
export const logout = async (): Promise<void> => {
    try {
        await apiClient.post<ApiResponse<any>>(`${USER_ENDPOINT}/logout`);
        console.log('User successfully signed out via API.');
    } catch (error) {
        // Vẫn phải xóa token khỏi client ngay cả khi gọi API thất bại.
        if (axios.isAxiosError(error)) {
            console.error('Server Error when logout', error.response?.data?.message || error.message);
        }
    } finally {
        await clearAuthData();
    }
};

/**
 * Đăng xuất người dùng khỏi Firebase và Google Sign-in.
 */
export async function signOutFromGoogleAndFirebase(): Promise<void> {
    try {
        // 1. Đăng xuất khỏi Google Sign-in (quan trọng để chọn tài khoản khác lần sau)
        await GoogleSignin.revokeAccess();
        await GoogleSignin.signOut();

        // 2. Đăng xuất khỏi Firebase
        await auth().signOut();

        console.log('Đăng xuất Google và Firebase thành công.');

    } catch (error) {
        console.error('Lỗi khi đăng xuất:', error);
        throw error;
    }
}

export const unifiedLogout = async (): Promise<void> => {
    const user = auth().currentUser;

    try {
        if (user) {
            // Nếu có session Firebase, thực/Firebase hiện đăng xuất Google trước
            const isGoogleUser = user.providerData.some(
                (provider) => provider.providerId === auth.GoogleAuthProvider.PROVIDER_ID
            );

            if (isGoogleUser) {
                console.log('Đang thực hiện Đăng xuất Google/Firebase...');
                await signOutFromGoogleAndFirebase();
            } else {
                // Đăng xuất khỏi Firebase cho người dùng Email/Pass
                console.log('Đang thực hiện Đăng xuất Email/Password (Firebase)...');
                await auth().signOut();
            }
        }

    } catch (error) {
        // Bỏ qua lỗi Firebase/Google, tiếp tục xóa token local
        console.error('Lỗi đăng xuất Firebase, tiếp tục xóa Local Token:', error);
    } finally {
        await logout();
    }
};
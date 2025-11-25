import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { LoginResponseData } from '../types/dataModels';

const HOST_LAN_IP = '192.168.1.10';
const HTTP_PORT = '5009';
// const HTTP_PORT = '7092';

const HOST =
    (Platform.OS === 'android' && __DEV__)
        ? '10.0.2.2'
        : HOST_LAN_IP;

// --- BASE URL CUỐI CÙNG ---
export const API_BASE_URL = `http://${HOST}:${HTTP_PORT}/api`;
export const AUTH_TOKEN_KEY = 'authToken';
export const REFRESH_TOKEN_KEY = 'refreshToken';

// console.log(`[API Config] Base URL: ${API_BASE_URL}`);

// --- CẤU HÌNH AXIOS INSTANCE ---
export const apiClient: AxiosInstance = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    // timeout: 10000, 
});

// --- QUẢN LÝ TOKEN ---

/**
 * Thiết lập hoặc Xóa Token Authorization mặc định trong Axios Headers và AsyncStorage.
 */
export const setAuthToken = async (token: string | null): Promise<void> => {
    if (token) {
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
    } else {
        delete apiClient.defaults.headers.common['Authorization'];
        await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
    }
};

export const setRefreshToken = async (token: string | null): Promise<void> => {
    if (token) {
        await AsyncStorage.setItem(REFRESH_TOKEN_KEY, token);
    } else {
        await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
    }
};

export const getRefreshToken = async (): Promise<string | null> => {
    return await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
};

/**
 * Tải token từ AsyncStorage và thiết lập lại vào Axios Headers.
 */
export const loadAuthToken = async (): Promise<string | null> => {
    const storedToken = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
    if (storedToken) {
        await setAuthToken(storedToken);
    }
    return storedToken;
};


// --- CƠ CHẾ LÀM MỚI TOKEN TỰ ĐỘNG ---

// Biến cờ và hàng đợi cho token refresh
let isRefreshing = false;
let failedQueue: Array<{
    resolve: (value?: any) => void;
    reject: (reason?: any) => void;
    config: AxiosRequestConfig;
}> = [];

/**
 * Xử lý tất cả các yêu cầu bị lỗi trong hàng đợi.
 */
const processQueue = (token: string | null = null) => {
    failedQueue.forEach(prom => {
        if (token) {
            // Gửi lại request với token mới
            prom.resolve(apiClient(prom.config));
        } else {
            // Từ chối (reject) tất cả nếu không thể lấy token mới
            prom.reject(new Error('Token refresh failed'));
        }
    });
    failedQueue = [];
};

let tokenRefreshFailureCallback: (() => void) | null = null;

/**
 * Thiết lập hàm callback được gọi khi quá trình làm mới token thất bại.
 */
export const setTokenRefreshFailureCallback = (callback: (() => void) | null): void => {
    tokenRefreshFailureCallback = callback;
};

/**
 * Gọi API để lấy Access Token mới bằng Refresh Token và Access Token cũ.
 * @param expiredAccessToken Access Token đã hết hạn.
 */
const refreshAuthToken = async (expiredAccessToken: string): Promise<string | null> => {
    try {
        const refreshToken = await getRefreshToken();

        if (!refreshToken) {
            console.warn('Không có Refresh Token. Yêu cầu đăng nhập lại.');
            if (tokenRefreshFailureCallback) {
                tokenRefreshFailureCallback();
            }
            return null;
        }

        // GỌI API LÀM MỚI TOKEN VỚI CẢ ACCESS TOKEN VÀ REFRESH TOKEN
        const response = await axios.post<LoginResponseData>(
            `${API_BASE_URL}/auth/refresh`,
            {
                accessToken: expiredAccessToken,
                refreshToken: refreshToken
            },
            // Đảm bảo request này không bị chặn bởi interceptor làm mới token
            { skipAuthRefresh: true } as AxiosRequestConfig
        );

        const newAccessToken = response.data.accessToken;
        const newRefreshToken = response.data.refreshToken;

        if (!newAccessToken) {
            throw new Error('Làm mới thất bại: Không nhận được Access Token mới.');
        }

        // Lưu và thiết lập các token mới
        await setAuthToken(newAccessToken);
        await setRefreshToken(newRefreshToken);

        return newAccessToken;

    } catch (error) {
        console.error('Làm mới token thất bại:', axios.isAxiosError(error) ? error.response?.data : error);
        if (tokenRefreshFailureCallback) {
            tokenRefreshFailureCallback();
        }
        return null;
    }
};


// --- INTERCEPTORS (BỘ CHẶN) ---

apiClient.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        // Ép kiểu config để thêm thuộc tính tùy chỉnh
        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean, skipAuthRefresh?: boolean };

        // 1. Kiểm tra lỗi 401 và đảm bảo không phải request làm mới token
        if (error.response?.status !== 401 || originalRequest.skipAuthRefresh) {
            // Xử lý lỗi Network Error
            if (error.message === 'Network Error') {
                console.error(
                    '❌ Network Error: Không thể kết nối đến server. Vui lòng kiểm tra IP/Port hoặc trạng thái server.'
                );
            }
            return Promise.reject(error);
        }

        // 2. Lỗi 401 đã thử lại (để tránh vòng lặp vô hạn)
        if (originalRequest._retry) {
            console.warn('Lỗi 401 lặp lại: Yêu cầu đăng nhập lại.');
            if (tokenRefreshFailureCallback) {
                tokenRefreshFailureCallback();
            }
            return Promise.reject(error);
        }

        originalRequest._retry = true;

        // 3. Xử lý 401 và làm mới token
        // Lấy Access Token cũ (đã hết hạn) từ header của request bị lỗi
        const expiredAccessToken = originalRequest.headers?.Authorization?.split(' ')[1] || await AsyncStorage.getItem(AUTH_TOKEN_KEY);

        if (!expiredAccessToken) {
            console.warn('401: Không có Access Token cũ để làm mới. Đăng xuất.');
            // TODO: Thông báo cho AuthContext đăng xuất
            return Promise.reject(error);
        }

        if (isRefreshing) {
            // Nếu token đang được làm mới, thêm request vào hàng đợi
            return new Promise((resolve, reject) => {
                failedQueue.push({ config: originalRequest, resolve, reject });
            });
        }

        isRefreshing = true;

        return new Promise(async (resolve, reject) => {
            // TRUYỀN ACCESS TOKEN ĐÃ HẾT HẠN CHO HÀM LÀM MỚI
            const newAccessToken = await refreshAuthToken(expiredAccessToken);

            if (newAccessToken) {
                // Đính kèm token mới vào request gốc
                originalRequest.headers = {
                    ...originalRequest.headers,
                    'Authorization': `Bearer ${newAccessToken}`,
                };

                // Xử lý tất cả các request trong hàng đợi
                processQueue(newAccessToken);

                // Gửi lại request gốc
                resolve(apiClient(originalRequest));
            } else {
                // Làm mới thất bại, từ chối request và yêu cầu đăng xuất
                processQueue(null);
                reject(error);
            }

            isRefreshing = false;
        });
    }
);

export default apiClient;
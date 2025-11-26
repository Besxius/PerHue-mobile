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

export const API_BASE_URL = `http://${HOST}:${HTTP_PORT}/api`;
export const AUTH_TOKEN_KEY = 'authToken';
export const REFRESH_TOKEN_KEY = 'refreshToken';

export const apiClient: AxiosInstance = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    // timeout: 10000, 
});

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

export const loadAuthToken = async (): Promise<string | null> => {
    const storedToken = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
    if (storedToken) {
        await setAuthToken(storedToken);
    }
    return storedToken;
};


let isRefreshing = false;
let failedQueue: Array<{
    resolve: (value?: any) => void;
    reject: (reason?: any) => void;
    config: AxiosRequestConfig;
}> = [];

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

export const setTokenRefreshFailureCallback = (callback: (() => void) | null): void => {
    tokenRefreshFailureCallback = callback;
};

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

apiClient.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        // Ép kiểu config để thêm thuộc tính tùy chỉnh
        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean, skipAuthRefresh?: boolean };

        // 1. Kiểm tra lỗi 401 và đảm bảo không phải request làm mới token
        if (error.response?.status !== 401 || originalRequest.skipAuthRefresh) {
            if (error.message === 'Network Error') {
                console.error(
                    'Network Error: Không thể kết nối đến server. Vui lòng kiểm tra IP/Port hoặc trạng thái server.'
                );
            }
            return Promise.reject(error);
        }

        if (originalRequest._retry) {
            console.warn('Lỗi 401 lặp lại: Yêu cầu đăng nhập lại.');
            if (tokenRefreshFailureCallback) {
                tokenRefreshFailureCallback();
            }
            return Promise.reject(error);
        }

        originalRequest._retry = true;

        const expiredAccessToken = originalRequest.headers?.Authorization?.split(' ')[1] || await AsyncStorage.getItem(AUTH_TOKEN_KEY);

        if (!expiredAccessToken) {
            console.warn('401: Không có Access Token cũ để làm mới. Đăng xuất.');
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
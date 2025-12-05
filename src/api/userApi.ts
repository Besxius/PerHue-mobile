import axios from 'axios';
import { AiTestResponse, ExpertTestResponse, ManualTestResult, UserInfo, UserSubscriptionInformation, VerificationPayload } from '../types/dataModels';
import apiClient, { setAuthToken } from './apiClient';

const USER_ENDPOINT = '/users';
const TEST_INFO_ENDPOINT = '/testinformation';
const VERIFICATION_ENDPOINT = '/verification';
const SUBSCRIPTION_ENDPOINT = '/usersubscriptions';

export const loadUserInfo = async (): Promise<UserInfo> => {
    try {
        const response = await apiClient.get<UserInfo>(
            `${USER_ENDPOINT}/information`
        );

        // API trả về trực tiếp đối tượng UserInfo
        return response.data;

    } catch (error) {
        let errorMessage = 'Không thể tải thông tin người dùng.';

        if (axios.isAxiosError(error)) {
            // Lỗi 401 thường xảy ra nếu token hết hạn/không hợp lệ
            if (error.response?.status === 401) {
                errorMessage = 'Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.';
            } else {
                errorMessage = error.response?.data?.message || error.message;
            }
        } else if (error instanceof Error) {
            errorMessage = error.message;
        }

        console.error('Lỗi khi tải User Info:', error);
        // Ném ra lỗi để component UI xử lý (ví dụ: đăng xuất người dùng)
        throw new Error(errorMessage);
    }
};

export const uploadProfilePicture = async (
    fileUri: string,
    mimeType: string,
    fileName: string
): Promise<{ url: string }> => {
    const formData = new FormData();

    // Đảm bảo cấu trúc file object chuẩn của React Native được sử dụng đúng cách:
    // Tên trường: 'file' (theo yêu cầu của API trong ảnh)
    formData.append('file', {
        uri: fileUri,
        type: mimeType,
        name: fileName,
    } as any); // Vẫn dùng 'as any' vì đây là cách React Native xử lý FormData cho file

    try {
        // GỌI POST ĐẾN ĐƯỜNG DẪN TUYỆT ĐỐI: /api/users/upload_profile_picture
        const response = await apiClient.post<{ url: string }>(
            `${USER_ENDPOINT}/upload_profile_picture`,
            formData,
            {
                headers: {
                    // PHẢI CÓ: Cấu hình Header cho file upload
                    'Content-Type': 'multipart/form-data',
                },
            }
        );

        // Trả về đối tượng { url: string }
        return response.data;

    } catch (error) {
        let errorMessage = 'Lỗi khi upload ảnh đại diện.';

        if (axios.isAxiosError(error)) {
            // Thêm log chi tiết lỗi Axios (rất hữu ích cho gỡ lỗi Network)
            console.error('Chi tiết lỗi Axios:', error.toJSON());

            errorMessage = error.response?.data?.message || error.message;

            if (!error.response && error.message === 'Network Error') {
                errorMessage = 'Không thể kết nối đến server. Vui lòng kiểm tra IP/Port hoặc trạng thái server.';
            }

        } else if (error instanceof Error) {
            errorMessage = error.message;
        }

        console.error('Lỗi khi upload ảnh:', error);
        throw new Error(errorMessage);
    }
};

export const submitVerificationRequest = async (
    payload: VerificationPayload
): Promise<void> => {
    const url = VERIFICATION_ENDPOINT;

    try {
        await apiClient.post<void>(url, payload);

        console.log('Yêu cầu xác minh đã được gửi thành công.');

    } catch (error) {
        let errorMessage = 'Lỗi khi gửi yêu cầu xác minh.';

        if (axios.isAxiosError(error)) {
            const serverMessage = error.response?.data?.message;
            if (serverMessage) {
                errorMessage = `Lỗi từ server: ${serverMessage}`;
            } else {
                errorMessage = error.message;
            }

            if (!error.response && error.message === 'Network Error') {
                errorMessage = 'Lỗi mạng: Không thể kết nối đến server.';
            }

        } else if (error instanceof Error) {
            errorMessage = error.message;
        }

        console.error('Lỗi khi gửi yêu cầu xác minh:', error);
        throw new Error(errorMessage);
    }
};

export const getManualTestResults = async (): Promise<ManualTestResult[]> => {
    const url = `${TEST_INFO_ENDPOINT}/manual-test/my-history`;

    try {
        const response = await apiClient.get<ManualTestResult[]>(url);

        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error('Error fetching manual test history:', error.response?.data || error.message);
            throw new Error(error.response?.data?.message || 'Failed to fetch manual test history.');
        } else {
            console.error('An unexpected error occurred while fetching manual test history:', error);
            throw new Error('An unexpected error occurred.');
        }
    }
};

export const getManualTestResultById = async (id: number): Promise<ManualTestResult> => {
    const url = `${TEST_INFO_ENDPOINT}/manual-test/${id}`;

    try {
        const response = await apiClient.get<ManualTestResult>(url);

        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error(`Error fetching manual test result with ID ${id}:`, error.response?.data || error.message);
            throw new Error(error.response?.data?.message || `Failed to fetch manual test result ID ${id}.`);
        } else {
            console.error(`An unexpected error occurred while fetching manual test result ID ${id}:`, error);
            throw new Error('An unexpected error occurred.');
        }
    }
};

export const getAiTestResults = async (): Promise<AiTestResponse[]> => {
    const url = `${TEST_INFO_ENDPOINT}/ai-test/my-history`;

    try {
        const response = await apiClient.get<AiTestResponse[]>(url);

        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error('Error fetching AI test history:', error.response?.data || error.message);
            throw new Error(error.response?.data?.message || 'Failed to fetch AI test history.');
        } else {
            console.error('An unexpected error occurred while fetching AI test history:', error);
            throw new Error('An unexpected error occurred.');
        }
    }
};

export const getAiTestResultById = async (id: number): Promise<AiTestResponse> => {
    // Xây dựng URL: /api/testinformation/ai-test/{id}
    const url = `${TEST_INFO_ENDPOINT}/ai-test/${id}`;

    try {
        const response = await apiClient.get<AiTestResponse>(url);

        // API trả về trực tiếp đối tượng AiTestResultById
        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error(`Error fetching AI test result with ID ${id}:`, error.response?.data || error.message);
            // Ném lỗi với thông báo chi tiết hơn từ server
            throw new Error(error.response?.data?.message || `Failed to fetch AI test result ID ${id}.`);
        } else {
            console.error(`An unexpected error occurred while fetching AI test result ID ${id}:`, error);
            throw new Error('An unexpected error occurred.');
        }
    }
};

export const getExpertTestResults = async (): Promise<ExpertTestResponse[]> => {
    const url = `${TEST_INFO_ENDPOINT}/expert-tests/my-history`;

    try {
        const response = await apiClient.get<ExpertTestResponse[]>(url);

        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error('Error fetching expert test history:', error.response?.data || error.message);
            throw new Error(error.response?.data?.message || 'Failed to fetch expert test history.');
        } else {
            console.error('An unexpected error occurred while fetching expert test history:', error);
            throw new Error('An unexpected error occurred.');
        }
    }
};

export const getUserSubscriptionInformations = async (): Promise<UserSubscriptionInformation[]> => {
    const url = `${SUBSCRIPTION_ENDPOINT}`;

    try {
        const response = await apiClient.get<UserSubscriptionInformation[]>(url);
        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error('Error fetching user subscription:', error.response?.data || error.message);
            throw new Error(error.response?.data?.message || 'Failed to fetch user subscription');
        } else {
            console.error('An unexpected error occurred while fetching user subscription history:', error);
            throw new Error('An unexpected error occurred.');
        }
    }
};



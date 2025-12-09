import axios from 'axios';
import { AiTestResponse, ExpertTestDetailResponse, ExpertTestResponse, ManualTestResult, ReportPayload, ReportResponse, UserInfo, UserSubscriptionInformation, VerificationPayload } from '../types/dataModels';
import apiClient, { setAuthToken } from './apiClient';

const USER_ENDPOINT = '/users';
const TEST_INFO_ENDPOINT = '/testinformation';
const VERIFICATION_ENDPOINT = '/verification';
const SUBSCRIPTION_ENDPOINT = '/usersubscriptions';
const REPORT_ENDPOINT = '/reports';

export const loadUserInfo = async (): Promise<UserInfo> => {
    try {
        const response = await apiClient.get<UserInfo>(
            `${USER_ENDPOINT}/information`
        );

        return response.data;

    } catch (error) {
        let errorMessage = 'Không thể tải thông tin người dùng.';

        if (axios.isAxiosError(error)) {
            if (error.response?.status === 401) {
                errorMessage = 'Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.';
            } else {
                errorMessage = error.response?.data?.message || error.message;
            }
        } else if (error instanceof Error) {
            errorMessage = error.message;
        }

        console.error('Lỗi khi tải User Info:', error);
        throw new Error(errorMessage);
    }
};

export const uploadProfilePicture = async (
    fileUri: string,
    mimeType: string,
    fileName: string
): Promise<{ url: string }> => {
    const formData = new FormData();

    formData.append('file', {
        uri: fileUri,
        type: mimeType,
        name: fileName,
    } as any);

    try {
        const response = await apiClient.post<{ url: string }>(
            `${USER_ENDPOINT}/upload_profile_picture`,
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            }
        );

        return response.data;

    } catch (error) {
        let errorMessage = 'Lỗi khi upload ảnh đại diện.';

        if (axios.isAxiosError(error)) {
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
    const formData = new FormData();

    formData.append('Id', payload.id.toString());
    formData.append('Email', payload.email || '');
    formData.append('Nickname', payload.nickname || '');
    formData.append('Specialization', payload.specialization || '');
    formData.append('Bio', payload.bio || '');
    formData.append('YearsOfExperience', payload.yearsOfExperience.toString());
    formData.append('Languages', payload.languages || '');
    formData.append('Certification', payload.certification || '');
    formData.append('FacebookAccount', payload.facebookAccount || '');
    formData.append('LinkedInAccount', payload.linkedInAccount || '');
    formData.append('InstagramAccount', payload.instagramAccount || '');

    if (payload.Photo && payload.Photo.length > 0) {
        payload.Photo.forEach((file) => {
            formData.append('Photo', {
                uri: file.uri,
                type: file.type,
                name: file.name,
            } as any);
        });
    }

    if (payload.PhotoType && payload.PhotoType.length > 0) {
        payload.PhotoType.forEach((type) => {
            formData.append('PhotoType', type);
        });
    }

    try {
        await apiClient.post<void>(url, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        console.log('Yêu cầu xác minh đã được gửi thành công.');
    } catch (error) {
        let errorMessage = 'Lỗi khi gửi yêu cầu xác minh.';
        if (axios.isAxiosError(error)) {
            console.error('API Error Response:', error.response?.data);
            errorMessage = error.response?.data?.title || error.response?.data?.message || error.message;
        } else if (error instanceof Error) {
            errorMessage = error.message;
        }
        throw new Error(errorMessage);
    }
};

export const checkPendingVerification = async (): Promise<{ hasPending: boolean }> => {
    const url = `${VERIFICATION_ENDPOINT}/pending`;

    try {
        const response = await apiClient.get<{ hasPending: boolean }>(url);

        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error('Error checking pending verification:', error.response?.data || error.message);
            throw new Error(error.response?.data?.message || 'Failed to check verification status.');
        } else {
            console.error('An unexpected error occurred while checking verification status:', error);
            throw new Error('An unexpected error occurred.');
        }
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
    const url = `${TEST_INFO_ENDPOINT}/ai-test/${id}`;

    try {
        const response = await apiClient.get<AiTestResponse>(url);

        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error(`Error fetching AI test result with ID ${id}:`, error.response?.data || error.message);
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

export const getExpertTestResultsById = async (id: number): Promise<ExpertTestDetailResponse> => {
    const url = `${TEST_INFO_ENDPOINT}/expert-test/${id}`;

    try {
        const response = await apiClient.get<ExpertTestDetailResponse>(url);

        return response.data;

    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error(`Error fetching expert test results for ID ${id}:`, error.response?.data || error.message);
            throw new Error(error.response?.data?.message || `Failed to fetch expert test results for ID ${id}.`);
        } else {
            console.error(`An unexpected error occurred while fetching expert test results for ID ${id}:`, error);
            throw new Error('An unexpected error occurred.');
        }
    }
};

export const rateExpertTest = async (
    testResponseId: number,
    rating: number
): Promise<{ testResponseId: number; rating: number }> => {
    const url = '/testresults/expert-test/rate';

    try {
        const response = await apiClient.post<{ testResponseId: number; rating: number }>(url, {
            testResponseId,
            rating,
        });

        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error('Error submitting expert test rating:', error.response?.data || error.message);
            throw new Error(error.response?.data?.message || 'Failed to submit rating.');
        } else {
            console.error('An unexpected error occurred while submitting expert test rating:', error);
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

export const submitReport = async (data: ReportPayload): Promise<ReportResponse> => {
    const url = REPORT_ENDPOINT;

    try {
        const response = await apiClient.post<ReportResponse>(url, data);

        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error('Error submitting report:', error.response?.data || error.message);
            throw new Error(error.response?.data?.message || 'Failed to submit report.');
        } else {
            console.error('An unexpected error occurred while submitting report:', error);
            throw new Error('An unexpected error occurred.');
        }
    }
};


import axios from 'axios';
import { CreateResponseRequest, ExpertInfo, ExpertRequest, ExpertRequestHistoryItem, ExpertTestResponse, ReviewTestRequest, UserInfo, VoteForReviewRequest } from '../types/dataModels';
import apiClient from './apiClient';

const EXPERT_ENDPOINT = '/experts';

export const getExpertListRanked = async (): Promise<ExpertInfo[]> => {
    try {
        const response = await apiClient.get<ExpertInfo[]>(
            `${EXPERT_ENDPOINT}/ranking`
        );

        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error('Error fetching ranked expert list:', error.response?.data || error.message);
        } else {
            console.error('An unexpected error occurred while fetching ranked experts:', error);
        }
        throw error;
    }
};

export const getExpertById = async (expertId: number): Promise<ExpertInfo> => {
    try {
        const response = await apiClient.get<ExpertInfo>(`${EXPERT_ENDPOINT}/${expertId}`);
        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error(`Error fetching expert with ID ${expertId}:`, error.response?.data || error.message);
        } else {
            console.error(`An unexpected error occurred while fetching expert with ID ${expertId}:`, error);
        }
        throw error;
    }
};

export const getRequests = async (): Promise<ExpertRequest[]> => {
    // API endpoint đầy đủ là /api/experts/requests
    const url = `${EXPERT_ENDPOINT}/requests`;

    try {
        const response = await apiClient.get<ExpertRequest[]>(url);

        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error('Error fetching expert requests list:', error.response?.data || error.message);
            // Ném lỗi với thông tin chi tiết hơn
            throw new Error(error.response?.data?.message || 'Failed to fetch expert requests.');
        } else {
            console.error('An unexpected error occurred while fetching expert requests:', error);
            throw new Error('An unexpected error occurred.');
        }
    }
};

export const getRequestById = async (id: number): Promise<ExpertRequest> => {
    // Xây dựng URL: /api/experts/requests/{id}
    const url = `${EXPERT_ENDPOINT}/requests/${id}`;

    try {
        const response = await apiClient.get<ExpertRequest>(url);

        // API trả về trực tiếp đối tượng ExpertRequest
        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error(`Error fetching expert request with ID ${id}:`, error.response?.data || error.message);
            // Ném lỗi với thông báo chi tiết hơn từ server
            throw new Error(error.response?.data?.message || `Failed to fetch expert request ID ${id}.`);
        } else {
            console.error(`An unexpected error occurred while fetching expert request ID ${id}:`, error);
            throw new Error('An unexpected error occurred.');
        }
    }
};

export const createResponse = async (data: CreateResponseRequest): Promise<ExpertTestResponse> => {
    const url = `${EXPERT_ENDPOINT}/respond`;

    try {
        // Gửi dữ liệu dưới dạng JSON (mặc định của apiClient)
        const response = await apiClient.post<ExpertTestResponse>(url, data);

        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error('Error creating expert response:', error.response?.data || error.message);
            throw new Error(error.response?.data?.message || 'Failed to create expert response.');
        } else {
            console.error('An unexpected error occurred while creating expert response:', error);
            throw new Error('An unexpected error occurred.');
        }
    }
};

export const getReviewRequests = async (): Promise<ReviewTestRequest[]> => {
    // API endpoint đầy đủ là /api/experts/review-requests
    const url = `${EXPERT_ENDPOINT}/review-requests`;

    try {
        // Sử dụng generic <ReviewTestRequestModel[]> để xác định kiểu dữ liệu trả về
        const response = await apiClient.get<ReviewTestRequest[]>(url);

        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error('Error fetching review requests:', error.response?.data || error.message);
            // Ném lỗi với thông báo chi tiết hơn
            throw new Error(error.response?.data?.message || 'Failed to fetch review requests.');
        } else {
            console.error('An unexpected error occurred while fetching review requests:', error);
            throw new Error('An unexpected error occurred.');
        }
    }
};

export const sendVoteForReview = async (data: VoteForReviewRequest): Promise<ExpertTestResponse> => {
    // API endpoint đầy đủ là /api/experts/vote
    const url = `${EXPERT_ENDPOINT}/vote`;

    try {
        // Gửi dữ liệu dưới dạng JSON (mặc định của apiClient)
        const response = await apiClient.post<ExpertTestResponse>(url, data);

        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error('Error sending vote:', error.response?.data || error.message);
            // Ném lỗi với thông báo chi tiết hơn từ server
            throw new Error(error.response?.data?.message || 'Failed to send vote for review.');
        } else {
            console.error('An unexpected error occurred while sending vote:', error);
            throw new Error('An unexpected error occurred.');
        }
    }
};

export const getRequestHistory = async (): Promise<ExpertRequestHistoryItem[]> => {
    // API endpoint đầy đủ là /api/experts/all-requests
    const url = `${EXPERT_ENDPOINT}/all-requests`;

    try {
        const response = await apiClient.get<ExpertRequestHistoryItem[]>(url);

        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error('Error fetching expert request history:', error.response?.data || error.message);
            // Ném lỗi với thông báo chi tiết hơn
            throw new Error(error.response?.data?.message || 'Failed to fetch expert request history.');
        } else {
            console.error('An unexpected error occurred while fetching expert request history:', error);
            throw new Error('An unexpected error occurred.');
        }
    }
};

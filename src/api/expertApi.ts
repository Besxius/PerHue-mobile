import axios from 'axios';
import { CreateResponseRequest, ExpertInfo, ExpertRequest, ExpertRequestDetailResponse, ExpertRequestHistoryItem, ExpertTestResponse, ReviewTestRequest, UpdateResponsePayload, UserInfo, VoteForReviewRequest } from '../types/dataModels';
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

export const getExpertInformation = async (): Promise<ExpertInfo> => {
    try {
        const response = await apiClient.get<ExpertInfo>(
            `${EXPERT_ENDPOINT}/information`
        );

        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error('Error fetching current expert information:', error.response?.data || error.message);
            throw new Error(error.response?.data?.message || 'Failed to fetch expert information.');
        } else {
            console.error('An unexpected error occurred while fetching expert information:', error);
            throw new Error('An unexpected error occurred.');
        }
    }
};

export const getRequests = async (): Promise<ExpertRequest[]> => {
    const url = `${EXPERT_ENDPOINT}/requests`;

    try {
        const response = await apiClient.get<ExpertRequest[]>(url);

        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error('Error fetching expert requests list:', error.response?.data || error.message);
            throw new Error(error.response?.data?.message || 'Failed to fetch expert requests.');
        } else {
            console.error('An unexpected error occurred while fetching expert requests:', error);
            throw new Error('An unexpected error occurred.');
        }
    }
};

export const getRequestById = async (id: number): Promise<ExpertRequestDetailResponse> => {
    const url = `${EXPERT_ENDPOINT}/requests/${id}`;

    try {
        const response = await apiClient.get<ExpertRequestDetailResponse>(url);

        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error(`Error fetching expert request with ID ${id}:`, error.response?.data || error.message);
            throw new Error(error.response?.data?.message || `Failed to fetch expert request ID ${id}.`);
        } else {
            console.error(`An unexpected error occurred while fetching expert request ID ${id}:`, error);
            throw new Error('An unexpected error occurred.');
        }
    }
};

export const updateExpertResponse = async (
    id: number,
    data: UpdateResponsePayload
): Promise<ExpertTestResponse> => {

    const url = `${EXPERT_ENDPOINT}/requests/${id}`;

    try {
        console.log(url)
        console.log(data)
        const response = await apiClient.put<ExpertTestResponse>(url, data);

        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error(`Error submitting expert response for ID ${id}:`, error.response?.data || error.message);
            throw new Error(error.response?.data?.message || `Failed to submit response for request ID ${id}.`);
        } else {
            console.error(`An unexpected error occurred while submitting expert response for ID ${id}:`, error);
            throw new Error('An unexpected error occurred.');
        }
    }
};

export const createResponse = async (data: CreateResponseRequest): Promise<ExpertTestResponse> => {
    const url = `${EXPERT_ENDPOINT}/respond`;

    try {
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
    const url = `${EXPERT_ENDPOINT}/review-requests`;

    try {
        const response = await apiClient.get<ReviewTestRequest[]>(url);

        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error('Error fetching review requests:', error.response?.data || error.message);
            throw new Error(error.response?.data?.message || 'Failed to fetch review requests.');
        } else {
            console.error('An unexpected error occurred while fetching review requests:', error);
            throw new Error('An unexpected error occurred.');
        }
    }
};

export const sendVoteForReview = async (data: VoteForReviewRequest): Promise<ExpertTestResponse> => {
    const url = `${EXPERT_ENDPOINT}/vote`;

    try {
        const response = await apiClient.post<ExpertTestResponse>(url, data);

        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error('Error sending vote:', error.response?.data || error.message);
            throw new Error(error.response?.data?.message || 'Failed to send vote for review.');
        } else {
            console.error('An unexpected error occurred while sending vote:', error);
            throw new Error('An unexpected error occurred.');
        }
    }
};

export const getRequestHistory = async (): Promise<ExpertRequestHistoryItem[]> => {
    const url = `${EXPERT_ENDPOINT}/all-requests`;

    try {
        const response = await apiClient.get<ExpertRequestHistoryItem[]>(url);

        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error('Error fetching expert request history:', error.response?.data || error.message);
            throw new Error(error.response?.data?.message || 'Failed to fetch expert request history.');
        } else {
            console.error('An unexpected error occurred while fetching expert request history:', error);
            throw new Error('An unexpected error occurred.');
        }
    }
};

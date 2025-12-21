import axios from 'axios';
import { CreateResponseRequest, ExpertCompletedRequest, ExpertInfo, ExpertRequest, ExpertRequestDetailResponse, ExpertRequestHistoryItem, ExpertSalaryResponse, ExpertTestResponse, ReviewTestRequest, UpdateResponsePayload, VoteForReviewRequest } from '../types/dataModels';
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

export const createResponse = async (data: CreateResponseRequest): Promise<ExpertTestResponse> => {
    const url = `${EXPERT_ENDPOINT}/requests/respond`;

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
export const updateExpertResponse = async (
    testRequestId: number,
    data: UpdateResponsePayload
): Promise<ExpertTestResponse> => {

    const url = `${EXPERT_ENDPOINT}/requests/respond/${testRequestId}`;

    try {
        console.log(url)
        console.log(data)
        const response = await apiClient.put<ExpertTestResponse>(url, data);

        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error(`Error submitting expert response for ID ${testRequestId}:`, error.response?.data || error.message);
            throw new Error(error.response?.data?.message || `Failed to submit response for request ID ${testRequestId}.`);
        } else {
            console.error(`An unexpected error occurred while submitting expert response for ID ${testRequestId}:`, error);
            throw new Error('An unexpected error occurred.');
        }
    }
};

export const getExpertPendingRequests = async (): Promise<ExpertRequest[]> => {
    const url = `${EXPERT_ENDPOINT}/requests/pending`;

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

export const getExpertCompletedRequests = async (): Promise<ExpertCompletedRequest[]> => {
    const url = `${EXPERT_ENDPOINT}/requests/completed`;

    try {
        const response = await apiClient.get<ExpertCompletedRequest[]>(url);
        return response.data;
    } catch (error) {
        let errorMessage = 'An unknown error occurred while fetching completed requests.';

        if (axios.isAxiosError(error) && error.response) {
            const serverMessage = error.response.data?.message || error.response.data?.error;
            if (error.response.status === 401) {
                errorMessage = 'Access denied. Please log in again.';
            } else if (serverMessage) {
                errorMessage = serverMessage;
            } else {
                errorMessage = `Server Error ${error.response.status}: Failed to load completed requests.`;
            }
        } else if (error instanceof Error) {
            errorMessage = error.message;
        }

        console.error('Error calling API getExpertCompletedRequests:', error);
        throw new Error(errorMessage);
    }
};

export const getExpertExpiredRequests = async (): Promise<ExpertCompletedRequest[]> => {
    const url = `${EXPERT_ENDPOINT}/requests/expired`;

    try {
        const response = await apiClient.get<ExpertCompletedRequest[]>(url);
        return response.data;
    } catch (error) {
        let errorMessage = 'An unknown error occurred while fetching completed requests.';

        if (axios.isAxiosError(error) && error.response) {
            const serverMessage = error.response.data?.message || error.response.data?.error;
            if (error.response.status === 401) {
                errorMessage = 'Access denied. Please log in again.';
            } else if (serverMessage) {
                errorMessage = serverMessage;
            } else {
                errorMessage = `Server Error ${error.response.status}: Failed to load completed requests.`;
            }
        } else if (error instanceof Error) {
            errorMessage = error.message;
        }

        console.error('Error calling API getExpertCompletedRequests:', error);
        throw new Error(errorMessage);
    }
};

export const getReviewRequestById = async (testRequestId: number): Promise<ReviewTestRequest> => {
    const url = `${EXPERT_ENDPOINT}/reviews/${testRequestId}`;

    try {
        const response = await apiClient.get<ReviewTestRequest>(url);
        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error(`Error fetching review request for ID ${testRequestId}:`, error.response?.data || error.message);
            throw new Error(error.response?.data?.message || `Failed to fetch review request ${testRequestId}.`);
        } else {
            console.error(`An unexpected error occurred while fetching review request ${testRequestId}:`, error);
            throw new Error('An unexpected error occurred.');
        }
    }
};

export const sendVoteForReview = async (data: VoteForReviewRequest): Promise<ExpertTestResponse> => {
    const url = `${EXPERT_ENDPOINT}/reviews/vote`;

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

export const getExpertPendingReviews = async (): Promise<ReviewTestRequest[]> => {
    const url = `${EXPERT_ENDPOINT}/reviews/pending`;

    try {
        const response = await apiClient.get<ReviewTestRequest[]>(url);
        return response.data;
    } catch (error) {
        let errorMessage = 'An unknown error occurred while fetching pending reviews.';

        if (axios.isAxiosError(error) && error.response) {
            const serverMessage = error.response.data?.message || error.response.data?.error;
            if (error.response.status === 401) {
                errorMessage = 'Access denied. Please log in again.';
            } else if (serverMessage) {
                errorMessage = serverMessage;
            } else {
                errorMessage = `Server Error ${error.response.status}: Failed to load pending reviews.`;
            }
        } else if (error instanceof Error) {
            errorMessage = error.message;
        }

        console.error('Error calling API getExpertPendingReviews:', error);
        throw new Error(errorMessage);
    }
};

export const getExpertCompletedReviews = async (): Promise<ReviewTestRequest[]> => {
    const url = '/experts/reviews/completed';

    try {
        const response = await apiClient.get<ReviewTestRequest[]>(url);
        return response.data;
    } catch (error) {
        let errorMessage = 'An unknown error occurred while fetching completed reviews.';

        if (axios.isAxiosError(error) && error.response) {
            const serverMessage = error.response.data?.message || error.response.data?.error;
            if (error.response.status === 401) {
                errorMessage = 'Access denied. Please log in again.';
            } else if (serverMessage) {
                errorMessage = serverMessage;
            } else {
                errorMessage = `Server Error ${error.response.status}: Failed to load completed reviews.`;
            }
        } else if (error instanceof Error) {
            errorMessage = error.message;
        }

        console.error('Error calling API getExpertCompletedReviews:', error);
        throw new Error(errorMessage);
    }
};

export const getExpertExpiredReviews = async (): Promise<ReviewTestRequest[]> => {
    const url = '/experts/reviews/expired';

    try {
        const response = await apiClient.get<ReviewTestRequest[]>(url);
        return response.data;
    } catch (error) {
        let errorMessage = 'An unknown error occurred while fetching expired reviews.';

        if (axios.isAxiosError(error) && error.response) {
            const serverMessage = error.response.data?.message || error.response.data?.error;
            if (error.response.status === 401) {
                errorMessage = 'Access denied. Please log in again.';
            } else if (serverMessage) {
                errorMessage = serverMessage;
            } else {
                errorMessage = `Server Error ${error.response.status}: Failed to load expired reviews.`;
            }
        } else if (error instanceof Error) {
            errorMessage = error.message;
        }

        console.error('Error calling API getExpertExpiredReviews:', error);
        throw new Error(errorMessage);
    }
};

export const getExpertSalary = async (
    startDate?: Date,
    endDate?: Date
): Promise<ExpertSalaryResponse> => {
    let url = `${EXPERT_ENDPOINT}/my-salary`;
    const queryParams: string[] = [];

    if (startDate) {
        queryParams.push(`startDate=${encodeURIComponent(startDate.toISOString())}`);
    }

    if (endDate) {
        queryParams.push(`endDate=${encodeURIComponent(endDate.toISOString())}`);
    }

    if (queryParams.length > 0) {
        url += `?${queryParams.join('&')}`;
    }

    try {
        const response = await apiClient.get<ExpertSalaryResponse>(url);

        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error('Error fetching expert salary:', error.response?.data || error.message);
            throw new Error(error.response?.data?.message || 'Failed to fetch expert salary.');
        } else {
            console.error('An unexpected error occurred while fetching expert salary:', error);
            throw new Error('An unexpected error occurred.');
        }
    }
};
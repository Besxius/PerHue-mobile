import axios from 'axios';
import { ExpertInfo, UserInfo } from '../types/dataModels';
import apiClient from './apiClient';

const USER_ENDPOINT = '/experts';

export const getExpertListRanked = async (): Promise<ExpertInfo[]> => {
    try {
        const response = await apiClient.get<ExpertInfo[]>(
            `${USER_ENDPOINT}/ranking`
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
        const response = await apiClient.get<ExpertInfo>(`${USER_ENDPOINT}/${expertId}`);
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

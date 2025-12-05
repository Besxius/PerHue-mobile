import apiClient, { API_BASE_URL } from './apiClient';
import { Notification } from '../types/dataModels';
import axios from 'axios';

export const getNotifications = async (): Promise<Notification[]> => {
    const url = `${API_BASE_URL}/notifications`;

    try {
        const response = await apiClient.get<Notification[]>(url);
        return response.data;
    } catch (error) {
        let errorMessage = 'An unknown error occurred while fetching notifications.';

        if (axios.isAxiosError(error) && error.response) {
            const serverMessage = error.response.data?.message || error.response.data?.error;
            if (error.response.status === 401) {
                errorMessage = 'Access denied. Please log in again.';
            } else if (serverMessage) {
                errorMessage = serverMessage;
            } else {
                errorMessage = `Server Error ${error.response.status}: Failed to load notifications.`;
            }
        } else if (error instanceof Error) {
            errorMessage = error.message;
        }

        console.error('Error calling API getNotifications:', error);
        throw new Error(errorMessage);
    }
};

export const getNotificationsUnread = async (): Promise<Notification[]> => {
    const url = `${API_BASE_URL}/notifications/unread`;

    try {
        const response = await apiClient.get<Notification[]>(url);
        return response.data;
    } catch (error) {
        let errorMessage = 'An unknown error occurred while fetching unread notifications.';

        if (axios.isAxiosError(error) && error.response) {
            const serverMessage = error.response.data?.message || error.response.data?.error;
            if (error.response.status === 401) {
                errorMessage = 'Access denied. Please log in again.';
            } else if (serverMessage) {
                errorMessage = serverMessage;
            } else {
                errorMessage = `Server Error ${error.response.status}: Failed to load unread notifications.`;
            }
        } else if (error instanceof Error) {
            errorMessage = error.message;
        }

        console.error('Error calling API getNotificationsUnread:', error);
        throw new Error(errorMessage);
    }
};

export const markNotificationAsRead = async (notificationId: number): Promise<void> => {
    const url = `${API_BASE_URL}/notifications/${notificationId}/read`;

    try {
        await apiClient.put(url);
    } catch (error) {
        let errorMessage = 'Failed to mark notification as read.';

        if (axios.isAxiosError(error) && error.response?.data?.message) {
            errorMessage = error.response.data.message;
        }

        console.error(`Error marking notification ${notificationId} as read:`, error);
        throw new Error(errorMessage);
    }
};

export const markAllNotificationAsRead = async (): Promise<void> => {
    const url = `${API_BASE_URL}/notifications/read-all`;

    try {
        await apiClient.put(url);
    } catch (error) {
        let errorMessage = 'Failed to mark all notifications as read.';

        if (axios.isAxiosError(error) && error.response?.data?.message) {
            errorMessage = error.response.data.message;
        }

        console.error(`Error marking all notifications as read:`, error);
        throw new Error(errorMessage);
    }
};
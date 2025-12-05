import axios from 'axios';
import { ServicePackage, UserPayment, UserSubscriptionInformation } from '../types/dataModels';
import apiClient from './apiClient';

const SERVICE_PACKAGE_ENDPOINT = '/servicepackages';
const SUBSCRIPTION_ENDPOINT = '/usersubscriptions';
const USER_SUBSCRIPTION_ENDPOINT = '/usersubscriptions/user/subscriptions';
const PAYMENT_ENDPOINT = '/payment';

export const getServicePackage = async (): Promise<ServicePackage[]> => {
    try {
        const url = `${SERVICE_PACKAGE_ENDPOINT}`;

        const response = await apiClient.get<ServicePackage[]>(url);

        if (response.data && Array.isArray(response.data)) {
            return response.data;
        }

        throw new Error("Dữ liệu Service Packages trả về không phải là một mảng hợp lệ.");

    } catch (error) {
        let errorMessage = `Không thể tải danh sách Service Packages`;

        if (axios.isAxiosError(error)) {
            errorMessage = error.response?.data?.message || error.message;
        } else if (error instanceof Error) {
            errorMessage = error.message;
        }

        console.error('Lỗi khi tải Service Package :', error);
        throw new Error(errorMessage);
    }
};

export const getActiveSubscriptions = async (): Promise<UserSubscriptionInformation[]> => {
    const url = `${USER_SUBSCRIPTION_ENDPOINT}/active`;

    try {
        const response = await apiClient.get<UserSubscriptionInformation[]>(url);
        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error('Error fetching active subscriptions:', error.response?.data || error.message);
            throw new Error(error.response?.data?.message || 'Failed to fetch active subscriptions.');
        } else {
            console.error('An unexpected error occurred while fetching active subscriptions:', error);
            throw new Error('An unexpected error occurred.');
        }
    }
};

export const getInactiveSubscriptions = async (): Promise<UserSubscriptionInformation[]> => {
    const url = `${USER_SUBSCRIPTION_ENDPOINT}/inactive`;

    try {
        const response = await apiClient.get<UserSubscriptionInformation[]>(url);
        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error('Error fetching inactive subscriptions:', error.response?.data || error.message);
            throw new Error(error.response?.data?.message || 'Failed to fetch inactive subscriptions.');
        } else {
            console.error('An unexpected error occurred while fetching inactive subscriptions:', error);
            throw new Error('An unexpected error occurred.');
        }
    }
};

export const getAllSubscriptions = async (): Promise<UserSubscriptionInformation[]> => {
    // Xây dựng URL endpoint
    const url = `${USER_SUBSCRIPTION_ENDPOINT}/all`;

    try {
        // Gọi API GET, mong đợi trả về mảng UserSubscriptionInformation
        const response = await apiClient.get<UserSubscriptionInformation[]>(url);

        // API trả về trực tiếp mảng
        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error('Error fetching all subscriptions:', error.response?.data || error.message);
            // Ném lỗi chi tiết hơn từ server
            throw new Error(error.response?.data?.message || 'Failed to fetch all subscriptions.');
        } else {
            console.error('An unexpected error occurred while fetching all subscriptions:', error);
            throw new Error('An unexpected error occurred.');
        }
    }
};

export const getAllPayments = async (): Promise<UserPayment[]> => {
    // Xây dựng URL endpoint
    const url = `${PAYMENT_ENDPOINT}/user/all-payments`;

    try {
        // Gọi API GET, mong đợi trả về mảng UserPayment
        const response = await apiClient.get<UserPayment[]>(url);

        // API trả về trực tiếp mảng
        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error('Error fetching all user payments:', error.response?.data || error.message);
            // Ném lỗi chi tiết hơn từ server
            throw new Error(error.response?.data?.message || 'Failed to fetch payment history.');
        } else {
            console.error('An unexpected error occurred while fetching user payments:', error);
            throw new Error('An unexpected error occurred.');
        }
    }
};
import axios from 'axios';
import { ServicePackage } from '../types/dataModels';
import apiClient, { API_BASE_URL } from './apiClient';

export const getServicePackage = async (): Promise<ServicePackage[]> => {
    try {
        const url = `${API_BASE_URL}/servicepackages`;

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
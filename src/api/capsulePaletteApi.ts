import axios from 'axios';
import { CapsulePaletteModel, Color, ColorType, UserInfo } from '../types/dataModels';
import apiClient, { API_BASE_URL, setAuthToken } from './apiClient';
import { PagingResponse } from '../types';

const CAPSULE_PALETTES_ENDPOINT = '/capsulepalettes';
const COLOR_TYPES_ENDPOINT = '/colortypes'

export const getCapsulePalettePaging = async (
    pageIndex: number,
    pageSize: number = 15,
    searchTerm: string = ''
): Promise<PagingResponse<CapsulePaletteModel>> => {
    try {
        let url = `${CAPSULE_PALETTES_ENDPOINT}?pageIndex=${pageIndex}&pageSize=${pageSize}`;

        if (searchTerm) {
            url += `&searchTerm=${encodeURIComponent(searchTerm)}`;
        }
        const response = await apiClient.get<PagingResponse<CapsulePaletteModel>>(url);
        if (response.data && Array.isArray(response.data.items)) {
            return response.data;
        }
        throw new Error("Dữ liệu phân trang Capsule Palettes trả về không hợp lệ.");

    } catch (error) {
        let errorMessage = 'Không thể tải danh sách Capsule Palettes.';

        if (axios.isAxiosError(error)) {
            errorMessage = error.response?.data?.message || error.message;
        } else if (error instanceof Error) {
            errorMessage = error.message;
        }

        console.error('Lỗi khi tải danh sách Capsule Palettes:', error);
        throw new Error(errorMessage);
    }
};

export const getCapsulePalettesByType = async (
    colorTypeId: number
): Promise<CapsulePaletteModel[]> => {
    try {
        const url = `${CAPSULE_PALETTES_ENDPOINT}/by-type/${colorTypeId}/all`;

        const response = await apiClient.get<CapsulePaletteModel[]>(url);

        if (response.data && Array.isArray(response.data)) {
            return response.data;
        }

        throw new Error("Dữ liệu Capsule Palettes theo loại trả về không phải là một mảng hợp lệ.");

    } catch (error) {
        let errorMessage = `Không thể tải danh sách Capsule Palettes cho Color Type ID ${colorTypeId}.`;

        if (axios.isAxiosError(error)) {
            errorMessage = error.response?.data?.message || error.message;
        } else if (error instanceof Error) {
            errorMessage = error.message;
        }

        console.error('Lỗi khi tải Capsule Palettes theo loại:', error);
        throw new Error(errorMessage);
    }
};

export const getCapsulePaletteById = async (
    id: number
): Promise<CapsulePaletteModel> => {
    try {
        const url = `${CAPSULE_PALETTES_ENDPOINT}/${id}`;
        const response = await apiClient.get<CapsulePaletteModel>(url);

        if (response.data && Array.isArray(response.data)) {
            return response.data;
        }

        throw new Error("Dữ liệu Capsule Palettes theo id trả về không hợp lệ.");

    } catch (error) {
        let errorMessage = `Không thể tải Capsule Palettes cho ${id}.`;

        if (axios.isAxiosError(error)) {
            errorMessage = error.response?.data?.message || error.message;
        } else if (error instanceof Error) {
            errorMessage = error.message;
        }

        console.error('Lỗi khi tải Capsule Palettes theo id:', error);
        throw new Error(errorMessage);
    }
};

export const getColorType = async (): Promise<ColorType[]> => {
    try {
        const url = `${COLOR_TYPES_ENDPOINT}`;
        const response = await apiClient.get<ColorType[]>(url);

        if (response.data && Array.isArray(response.data)) {
            return response.data;
        }

        throw new Error("Dữ liệu Color Type trả về không phải là một mảng hợp lệ.");

    } catch (error) {
        let errorMessage = `Không thể tải danh sách Color Type`;

        if (axios.isAxiosError(error)) {
            errorMessage = error.response?.data?.message || error.message;
        } else if (error instanceof Error) {
            errorMessage = error.message;
        }

        console.error('Lỗi khi tải danh sách Color Type theo loại:', error);
        throw new Error(errorMessage);
    }
};

export const getColorTypeById = async (id: number): Promise<ColorType> => {
    try {
        const url = `${COLOR_TYPES_ENDPOINT}/${id}`;

        const response = await apiClient.get<ColorType>(url);

        if (response.data && typeof response.data.id === 'number' && typeof response.data.name === 'string') {
            return response.data;
        }

        if (response.data) {
            return response.data;
        }

        throw new Error("Dữ liệu Color Type trả về rỗng hoặc không hợp lệ.");

    } catch (error) {
        let errorMessage = `Không thể tải Color Type có ID: ${id}`;

        if (axios.isAxiosError(error)) {
            errorMessage = error.response?.data?.message || error.message;
            console.error(`API Error ${error.response?.status} at ${error.config?.url}:`, error.response?.data);
        } else if (error instanceof Error) {
            errorMessage = error.message;
        }

        console.error('Lỗi khi tải Color Type:', error);
        throw new Error(errorMessage);
    }
};
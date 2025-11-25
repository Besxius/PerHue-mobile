import axios from 'axios';
import { CapsulePalette, Color, ColorType, UserInfo } from '../types/dataModels';
import apiClient, { API_BASE_URL, setAuthToken } from './apiClient';
import { PagingResponse } from '../types';
// Giả định bạn đã import các kiểu ở trên từ file types

const CAPSULE_PALETTES_ENDPOINT = '/capsulepalettes';

/**
 * Lấy danh sách Capsule Palettes có phân trang và tùy chọn tìm kiếm.
 * * @param pageIndex - Chỉ số trang muốn tải (bắt đầu từ 1).
 * @param pageSize - Số lượng item trên mỗi trang (mặc định 15).
 * @param searchTerm - Thuật ngữ tìm kiếm tùy chọn.
 * @returns Promise<PagingResponse<CapsulePalette>>
 */
export const getCapsulePalettePaging = async (
    pageIndex: number,
    pageSize: number = 15,
    searchTerm: string = ''
): Promise<PagingResponse<CapsulePalette>> => {
    try {
        // 1. Chuẩn bị tham số truy vấn
        let url = `${CAPSULE_PALETTES_ENDPOINT}?pageIndex=${pageIndex}&pageSize=${pageSize}`;

        // 2. Thêm tham số tìm kiếm nếu có
        if (searchTerm) {
            url += `&searchTerm=${encodeURIComponent(searchTerm)}`;
        }

        // 3. Gọi API
        const response = await apiClient.get<PagingResponse<CapsulePalette>>(url);

        // 4. Kiểm tra dữ liệu hợp lệ cơ bản
        if (response.data && Array.isArray(response.data.items)) {
            return response.data;
        }

        throw new Error("Dữ liệu phân trang Capsule Palettes trả về không hợp lệ.");

    } catch (error) {
        let errorMessage = 'Không thể tải danh sách Capsule Palettes.';

        if (axios.isAxiosError(error)) {
            // Lấy thông báo lỗi từ response data nếu có
            errorMessage = error.response?.data?.message || error.message;
        } else if (error instanceof Error) {
            errorMessage = error.message;
        }

        console.error('Lỗi khi tải danh sách Capsule Palettes:', error);
        // Ném lỗi để component UI có thể xử lý
        throw new Error(errorMessage);
    }
};

export const getCapsulePalettesByType = async (
    colorTypeId: number
): Promise<CapsulePalette[]> => {
    try {
        // 1. Chuẩn bị URL: /api/capsulepalettes/by-type/{colorTypeId}/all
        const url = `${CAPSULE_PALETTES_ENDPOINT}/by-type/${colorTypeId}/all`;

        // 2. Gọi API
        const response = await apiClient.get<CapsulePalette[]>(url);

        // 3. Kiểm tra dữ liệu hợp lệ cơ bản (phải là một mảng)
        if (response.data && Array.isArray(response.data)) {
            return response.data;
        }

        // Nếu API trả về thành công nhưng dữ liệu không phải mảng (lỗi cấu trúc)
        throw new Error("Dữ liệu Capsule Palettes theo loại trả về không phải là một mảng hợp lệ.");

    } catch (error) {
        let errorMessage = `Không thể tải danh sách Capsule Palettes cho Color Type ID ${colorTypeId}.`;

        if (axios.isAxiosError(error)) {
            // Lấy thông báo lỗi từ response data nếu có
            errorMessage = error.response?.data?.message || error.message;
        } else if (error instanceof Error) {
            errorMessage = error.message;
        }

        console.error('Lỗi khi tải Capsule Palettes theo loại:', error);
        // Ném lỗi để component UI có thể xử lý
        throw new Error(errorMessage);
    }
};

export const getCapsulePaletteById = async (
    id: number
): Promise<CapsulePalette> => {
    try {
        // 1. Chuẩn bị URL: /api/capsulepalettes/by-type/{colorTypeId}/all
        const url = `${CAPSULE_PALETTES_ENDPOINT}/${id}`;

        // 2. Gọi API
        const response = await apiClient.get<CapsulePalette>(url);

        // 3. Kiểm tra dữ liệu hợp lệ cơ bản (phải là một mảng)
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
        // 1. Chuẩn bị URL: /api/capsulepalettes/by-type/{colorTypeId}/all
        const url = `${API_BASE_URL}/colortypes`;

        // 2. Gọi API
        const response = await apiClient.get<ColorType[]>(url);

        // 3. Kiểm tra dữ liệu hợp lệ cơ bản (phải là một mảng)
        if (response.data && Array.isArray(response.data)) {
            return response.data;
        }

        // Nếu API trả về thành công nhưng dữ liệu không phải mảng (lỗi cấu trúc)
        throw new Error("Dữ liệu Color Type trả về không phải là một mảng hợp lệ.");

    } catch (error) {
        let errorMessage = `Không thể tải danh sách Color Type`;

        if (axios.isAxiosError(error)) {
            errorMessage = error.response?.data?.message || error.message;
        } else if (error instanceof Error) {
            errorMessage = error.message;
        }

        console.error('Lỗi khi tải Capsule Palettes theo loại:', error);
        throw new Error(errorMessage);
    }
};
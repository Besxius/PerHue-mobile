import axios from 'axios';
import { CapsulePalette, Color, UserInfo } from '../types/dataModels';
import apiClient, { setAuthToken } from './apiClient';
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
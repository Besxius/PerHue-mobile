import axios from 'axios';
import { Color, GetColorRequest, UserInfo } from '../types/dataModels';
import apiClient, { setAuthToken } from './apiClient';
import { PagingResponse } from '../types';

const USER_ENDPOINT = '/colors';

export const getCorlorListSpectrum = async (): Promise<Color[]> => {
    try {
        const response = await apiClient.get<Color[]>(
            `${USER_ENDPOINT}/by-spectrum`
        );
        if (response.data && Array.isArray(response.data)) {
            return response.data;
        }

        throw new Error("Dữ liệu API màu sắc trả về không hợp lệ.");

    } catch (error) {
        let errorMessage = 'Không thể tải danh sách màu sắc.';
        if (axios.isAxiosError(error)) {
            errorMessage = error.response?.data?.message || error.message;
        } else if (error instanceof Error) {
            errorMessage = error.message;
        }

        console.error('Lỗi khi tải danh sách màu sắc:', error);
        throw new Error(errorMessage);
    }
};

export const getColorsPaging = async (
    request: GetColorRequest
): Promise<PagingResponse<Color>> => { // <-- Kiểu trả về đã được sửa
    try {
        const { pageIndex, pageSize, searchTerm } = request;
        const defaultPageIndex = pageIndex ?? 1;
        const defaultPageSize = pageSize ?? 30;

        let url = `${USER_ENDPOINT}?pageIndex=${defaultPageIndex}&pageSize=${defaultPageSize}`;
        if (searchTerm) {
            url += `&searchTerm=${encodeURIComponent(searchTerm)}`;
        }

        // Gọi API với kiểu phản hồi là PagingResponse<Color>
        const response = await apiClient.get<PagingResponse<Color>>(url);

        // 4. Kiểm tra dữ liệu hợp lệ: Kiểm tra xem có trường 'items' và 'items' là mảng không
        if (
            response.data &&
            'items' in response.data &&
            Array.isArray(response.data.items)
        ) {
            return response.data; // <-- Trả về toàn bộ đối tượng PagingResponse
        }

        throw new Error("Dữ liệu phân trang màu sắc trả về không hợp lệ.");

    } catch (error) {
        let errorMessage = 'Không thể tải danh sách màu sắc.';
        if (axios.isAxiosError(error)) {
            errorMessage = error.response?.data?.message || error.message;
        } else if (error instanceof Error) {
            errorMessage = error.message;
        }

        console.error('Lỗi khi tải trang màu sắc:', error);
        throw new Error(errorMessage);
    }
};
import axios from 'axios';
import { UserInfo } from '../types/dataModels';
import apiClient, { setAuthToken } from './apiClient';

const USER_ENDPOINT = '/users';

export const loadUserInfo = async (): Promise<UserInfo> => {
    try {
        const response = await apiClient.get<UserInfo>(
            `${USER_ENDPOINT}/information`
        );

        // API trả về trực tiếp đối tượng UserInfo
        return response.data;

    } catch (error) {
        let errorMessage = 'Không thể tải thông tin người dùng.';

        if (axios.isAxiosError(error)) {
            // Lỗi 401 thường xảy ra nếu token hết hạn/không hợp lệ
            if (error.response?.status === 401) {
                errorMessage = 'Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.';
            } else {
                errorMessage = error.response?.data?.message || error.message;
            }
        } else if (error instanceof Error) {
            errorMessage = error.message;
        }

        console.error('Lỗi khi tải User Info:', error);
        // Ném ra lỗi để component UI xử lý (ví dụ: đăng xuất người dùng)
        throw new Error(errorMessage);
    }
};

export const uploadProfilePicture = async (
    fileUri: string,
    mimeType: string,
    fileName: string
): Promise<{ url: string }> => {
    const formData = new FormData();

    // Đảm bảo cấu trúc file object chuẩn của React Native được sử dụng đúng cách:
    // Tên trường: 'file' (theo yêu cầu của API trong ảnh)
    formData.append('file', {
        uri: fileUri,
        type: mimeType,
        name: fileName,
    } as any); // Vẫn dùng 'as any' vì đây là cách React Native xử lý FormData cho file

    // ĐƯỜNG DẪN MỚI THEO YÊU CẦU TRONG ẢNH
    const ENDPOINT_UPLOAD_PICTURE = '/api/users/upload_profile_picture';

    try {
        // GỌI POST ĐẾN ĐƯỜNG DẪN TUYỆT ĐỐI: /api/users/upload_profile_picture
        const response = await apiClient.post<{ url: string }>(
            `${USER_ENDPOINT}/upload_profile_picture`,
            formData,
            {
                headers: {
                    // PHẢI CÓ: Cấu hình Header cho file upload
                    'Content-Type': 'multipart/form-data',
                },
            }
        );

        // Trả về đối tượng { url: string }
        return response.data;

    } catch (error) {
        let errorMessage = 'Lỗi khi upload ảnh đại diện.';

        if (axios.isAxiosError(error)) {
            // Thêm log chi tiết lỗi Axios (rất hữu ích cho gỡ lỗi Network)
            console.error('Chi tiết lỗi Axios:', error.toJSON());

            errorMessage = error.response?.data?.message || error.message;

            if (!error.response && error.message === 'Network Error') {
                errorMessage = 'Không thể kết nối đến server. Vui lòng kiểm tra IP/Port hoặc trạng thái server.';
            }

        } else if (error instanceof Error) {
            errorMessage = error.message;
        }

        console.error('Lỗi khi upload ảnh:', error);
        throw new Error(errorMessage);
    }
};

import axios from 'axios';
import { ExpertInfo, PaymentCallbackParams, UserInfo } from '../types/dataModels';
import apiClient from './apiClient';

const USER_SUBSCRIPTION_ENDPOINT = '/usersubscriptions';

const BASE_RETURN_URL = 'perhue://payment/success';
const BASE_CANCEL_URL = 'perhue://payment/cancel';

export const getPaymentLink = async (subscriptionId: number): Promise<string> => {
    const encodedReturnUrl = encodeURIComponent(BASE_RETURN_URL);
    const encodedCancelUrl = encodeURIComponent(BASE_CANCEL_URL);

    const paymentUrl = `${USER_SUBSCRIPTION_ENDPOINT}/subscription/${subscriptionId}?returnUrl=${encodedReturnUrl}&cancelUrl=${encodedCancelUrl}`;

    try {
        const response = await apiClient.post(paymentUrl);

        // Giả sử API trả về cấu trúc dữ liệu mà trong đó link thanh toán là một trường trực tiếp,
        // ví dụ: { "paymentLink": "https://pay.payos.vn/web/..." }
        const paymentLink: string = response.data?.paymentLink || response.data;

        if (!paymentLink || typeof paymentLink !== 'string') {
            throw new Error('API response does not contain a valid payment link.');
        }

        return paymentLink;
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            console.error('Lỗi khi gọi API tạo link thanh toán:', error.response.data);
            throw new Error(`Lỗi API: ${error.response.status}`);
        }
        console.error('Lỗi không xác định khi tạo link thanh toán:', error);
        throw new Error('Không thể tạo đường dẫn thanh toán.');
    }
};

export const getPaymentSuccess = async (params: PaymentCallbackParams): Promise<any> => {
    // Xây dựng Query String từ các tham số
    const queryString = `code=${params.code}&id=${params.id}&cancel=${params.cancel}&status=${params.status}&orderCode=${params.orderCode}&servicePackageId=${params.servicePackageId}`;

    // Endpoint Backend cần được gọi
    const apiUrl = `${USER_SUBSCRIPTION_ENDPOINT}/subscription/success?${queryString}`;
    console.log('success url', apiUrl)

    try {
        // Sử dụng phương thức GET/POST tùy thuộc vào cấu hình Backend của bạn (Backend đang dùng GET)
        const response = await apiClient.get(apiUrl);
        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            console.error('Lỗi khi gọi API xác nhận thành công:', error.response.data);
            throw new Error(`Lỗi API: ${error.response.status}`);
        }
        throw new Error('Không thể xác nhận giao dịch thành công.');
    }
};

/**
 * Gọi API Backend để xử lý kết quả thanh toán bị hủy hoặc thất bại.
 * @param params Dữ liệu trả về từ PayOS qua Deep Link Query String.
 */
export const getPaymentCancel = async (params: PaymentCallbackParams): Promise<any> => {
    // Xây dựng Query String từ các tham số
    const queryString = `code=${params.code}&id=${params.id}&cancel=${params.cancel}&status=${params.status}&orderCode=${params.orderCode}&servicePackageId=${params.servicePackageId}`;

    // Endpoint Backend cần được gọi
    const apiUrl = `${USER_SUBSCRIPTION_ENDPOINT}/subscription/cancel?${queryString}`;
    console.log('success url', apiUrl)

    try {
        // Sử dụng phương thức GET/POST tùy thuộc vào cấu hình Backend của bạn (Backend đang dùng GET)
        const response = await apiClient.get(apiUrl);
        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            console.error('Lỗi khi gọi API xác nhận hủy/thất bại:', error.response.data);
            throw new Error(`Lỗi API: ${error.response.status}`);
        }
        throw new Error('Không thể xác nhận giao dịch hủy/thất bại.');
    }
};
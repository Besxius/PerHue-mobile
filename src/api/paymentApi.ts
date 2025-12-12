import axios from 'axios';
import { PaymentCallbackParams } from '../types/dataModels';
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
    const queryString = `code=${params.code}&id=${params.id}&cancel=${params.cancel}&status=${params.status}&orderCode=${params.orderCode}&servicePackageId=${params.servicePackageId}`;

    const apiUrl = `${USER_SUBSCRIPTION_ENDPOINT}/subscription/success?${queryString}`;

    try {
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

export const getPaymentCancel = async (params: PaymentCallbackParams): Promise<any> => {
    const queryString = `code=${params.code}&id=${params.id}&cancel=${params.cancel}&status=${params.status}&orderCode=${params.orderCode}&servicePackageId=${params.servicePackageId}`;

    const apiUrl = `${USER_SUBSCRIPTION_ENDPOINT}/subscription/cancel?${queryString}`;
    console.log('success url', apiUrl)

    try {
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
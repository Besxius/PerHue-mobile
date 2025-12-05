import { AiColorTestResponse, ColorTestRequest, ImageFile, ManualColorTestResponse } from '../types/dataModels';
import apiClient, { API_BASE_URL } from './apiClient';

export const manualColorTest = async (
    selectedColors: string[],
    imageFile: ImageFile
): Promise<ManualColorTestResponse> => {
    const url = `${API_BASE_URL}/testcolors/manual-test`;

    const formData = new FormData();

    selectedColors.forEach(color => {
        formData.append('SelectedColors[]', color);
    });

    if (imageFile && imageFile.uri && imageFile.type && imageFile.name) {
        formData.append('Picture', {
            uri: imageFile.uri,
            type: imageFile.type,
            name: imageFile.name,
        } as any);
    } else {
        throw new Error("Image file information is incomplete or invalid.");
    }

    try {
        const response = await apiClient.post<ManualColorTestResponse>(url, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        return response.data;
    } catch (error) {
        throw new Error("Error in calling API.");
    }
};

export const aiColorTest = async (
    params: ColorTestRequest
): Promise<AiColorTestResponse> => {
    const url = `${API_BASE_URL}/testcolors/ai-test`;

    const formData = new FormData();

    const {
        imageFile,
        hairColor,
        eyesColor,
        lipsColor,
        skinColor,
    } = params;


    if (imageFile && imageFile.uri && imageFile.type && imageFile.name) {
        formData.append('FaceImages', {
            uri: imageFile.uri,
            type: imageFile.type,
            name: imageFile.name,
        } as any);
    } else {
        throw new Error("Image file information is incomplete or invalid for FaceImages.");
    }

    // 4. Thêm các trường dữ liệu khác
    formData.append('HairColor', hairColor);
    formData.append('EyesColor', eyesColor);
    formData.append('LipsColor', lipsColor);
    formData.append('SkinColor', skinColor);

    // 5. Gọi API sử dụng apiClient
    try {
        const response = await apiClient.post<AiColorTestResponse>(url, formData, {
            // Đảm bảo Content-Type là 'multipart/form-data'
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        return response.data;
    } catch (error) {
        // Xử lý lỗi từ việc gọi API
        console.error("Error in calling AI Color Test API:", error);
        throw new Error("Error in calling AI Color Test API.");
    }
};

export const expertColorTest = async (
    params: ColorTestRequest
): Promise<string> => {
    const url = `${API_BASE_URL}/testcolors/expert-test`;

    const formData = new FormData();

    const {
        imageFile,
        hairColor,
        eyesColor,
        lipsColor,
        skinColor,
    } = params;


    if (imageFile && imageFile.uri && imageFile.type && imageFile.name) {
        formData.append('File', {
            uri: imageFile.uri,
            type: imageFile.type,
            name: imageFile.name,
        } as any);
    } else {
        throw new Error("Image file information is incomplete or invalid for FaceImages.");
    }

    // 4. Thêm các trường dữ liệu khác
    formData.append('HairColor', hairColor);
    formData.append('EyesColor', eyesColor);
    formData.append('LipsColor', lipsColor);
    formData.append('SkinColor', skinColor);

    // 5. Gọi API sử dụng apiClient
    try {
        const response = await apiClient.post<string>(url, formData, {
            // Đảm bảo Content-Type là 'multipart/form-data'
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        return response.data;
    } catch (error) {
        // Xử lý lỗi từ việc gọi API
        console.error("Error in calling AI Color Test API:", error);
        throw new Error("Error in calling AI Color Test API.");
    }
};


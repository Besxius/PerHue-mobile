// Kiểu dữ liệu chuẩn cho phản hồi API
// T là kiểu dữ liệu cụ thể (ví dụ: User, User[], string,...)
export interface ApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
}
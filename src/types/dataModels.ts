import { FirebaseAuthTypes } from "@react-native-firebase/auth";

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface LoginResponseData {
    accessToken: string;
    refreshToken: string;
    tokenType: 'Bearer' | string;
    expiresIn: number;
}

export interface RegisterCredentials {
    email: string;
    password: string;
    confirmPassword: string;
    fullname: string;
    phone: string;
    gender: boolean;
    dob: string;
    profilepicture: string;
}

export type SignInResult = {
    success: boolean;
    user?: FirebaseAuthTypes.User | null;
    error?: string;
    loginData?: LoginResponseData;
};

export type RoleInfo = {
    name: string;
};

// Kiểu dữ liệu cho thông tin người dùng trả về từ API /users/information
export type UserInfo = {
    id: number;
    email: string;
    username: string;
    fullname: string;
    phone: string;
    gender: boolean;
    dob: string;
    isactive: boolean;
    profilepicture: string;
    roleId: number;
    role: RoleInfo;
};

export interface ExpertInfo {
    id: number;
    nickname: string;
    specialization: string;
    bio: string;
    yearsOfExperience: number;
    languages: string;
    rating: number;
    certification: string;
    introduction: string;
    facebookAccount: string | null;
    linkedInAccount: string | null;
    instagramAccount: string | null;
    email: string;
    username: string;
    profilePicture: string;
    idNavigation: UserInfo
}

export interface GetColorRequest {
    pageIndex?: number;
    pageSize?: number;
    searchTerm?: string;
}

export type Color = {
    id: number;
    name: string;
    hexCode: string;
}

export interface ColorType {
    id: number;
    name: string;
}

export interface CapsulePalette {
    id: number;
    colorTypeId: number;
    colorType: ColorType;
    colors: Color[];
}
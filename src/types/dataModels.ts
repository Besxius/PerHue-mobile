import { FirebaseAuthTypes } from "@react-native-firebase/auth";

export interface JwtPayload {
    TokenId: string;
    nameid: string;
    email: string;
    unique_name: string;
    role: string;
    nbf: number;
    exp: number;
    iat: number;
    iss: string;
    aud: string;
}

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
    profilepicture?: string;
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

export interface VerificationPayload {
    id: number;
    email: string;
    nickname: string;
    specialization: string;
    bio: string;
    yearsOfExperience: number;
    languages: string;
    certification: string;
    facebookAccount: string;
    linkedInAccount: string;
    instagramAccount: string;
    Photo: ImageFile[];
    PhotoType: string[];
}

export interface VerificationModelPhotoPayload {
    id: number;
    email: string;
    nickname: string;
    specialization: string;
    bio: string;
    yearsOfExperience: number;
    languages: string;
    certification: string;
    facebookAccount: string;
    linkedInAccount: string;
    instagramAccount: string;
    photoAndTypes: Array<{
        photo: string; // Giả định là URL/Base64 string
        type: string; // Ví dụ: "ID_FRONT", "ID_BACK", "CERTIFICATE"
    }>;
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

export interface CapsulePaletteModel {
    id: number;
    colorTypeId: number;
    colorType: ColorType;
    colors: Color[];
}

export interface ServicePackage {
    id: number;
    name: string;
    description: string;
    price: number;
    duration: number;
    uses: number
    createdDate: string;
    updatedDate: string | null;
}
export interface PaymentCallbackParams {
    code: string;
    id: string;
    cancel: boolean;
    status: string;
    orderCode: string;
    servicePackageId: number;
}

export interface CapsulePalette {
    id: number;
    colorTypeId: number;
    colorType: ColorType;
    colors: Color[];
}

export interface ManualColorTestResponse {
    id: number;
    userId: number;
    picture: string;
    type: string;
    colorTypeId: number;
    createdDate: string; // ISO Date string, e.g., "2025-11-28T12:18:18.490Z"
    chosenColor: string;
    suggestedColor: string;
    colorType: ColorType;
    user: UserInfo;
    capsulePalettes: CapsulePalette[];
    colors: Color[];
}
export interface AiColorTestResponse {
    id: number;
    note: string;
    date: string;
    suggestedColor: string;
    avoidedColor: string;
    colorTypeId: number;
}

// Interface cho đối tượng file ảnh đầu vào
export interface ImageFile {
    uri: string;
    type: string; // Ví dụ: 'image/jpeg'
    name: string; // Ví dụ: 'my-picture.jpg'
}

export interface ColorTestRequest {
    imageFile: ImageFile;
    hairColor: string;
    eyesColor: string;
    lipsColor: string;
    skinColor: string;
}

export interface Notification {
    id: number;
    title: string;
    content: string;
    isRead: boolean;
    time: string;
    receiver: number;
    type: string;
    receiverUsername: string;
    testRequestId: number
}
export interface RequestPicture {
    id: number;
    source: string;
    note?: string; // Tồn tại trong aiPictures
}

export interface ExpertRequest {
    id: number;
    hairColor: string;
    eyesColor: string;
    lipsColor: string;
    skinColor: string;
    status: string;
    createdDate: string;
    typeOfTest: string;
    userAccountId: number;
    aiPictures: RequestPicture[];
    pictures: RequestPicture[];
}

export interface CreateResponseRequest {
    testRequestId: number;
    note: string;
    bestColor: string;
    worstColor: string;
    colorTypeId: number;
}

export interface ExpertTestResponse {
    id: number;
    testRequestId: number;
    expertId: number;
    note: string;
    createdDate: string;
    rating: number | null;
    bestColor: string;
    worstColor: string;
    type: string;
    colorTypeId: number;
    colorTypeName: string | null;
}

export interface ExpertTestDetailResponse {
    testRequest: ExpertRequest;
    responses: ExpertTestResponse[];
}

export interface ReviewTestRequest {
    expertTestRequestId: number;
    testRequest: ExpertRequest;
    previousResponses: ExpertTestResponse[];
}

export interface VoteForReviewRequest {
    testRequestId: number;
    votedResponseId: number;
    note: string;
}

export interface ManualTestResult {
    id: number;
    userId: number;
    picture: string | null;
    type: string | null;
    colorTypeId: number;
    createdDate: string;
    chosenColor: string;
    suggestedColor: string;
    colorType: ColorType | null;
    user: UserInfo;
    capsulePalettes: CapsulePalette[];
    colors: Color[];
}

export interface AiTestResult {
    colorType: string;
    colorTypeId: number;
    suggestedColor: string[];
    avoidedColor: string[];
}

export interface AiTestResultModel {
    id: number;
    note: string;
    suggestedColor: string;
    avoidedColor: string;
    colorTypeId: number;
    suggestedColorsBySystem: Color[];
    suggestedCapsulePalletesBySystem: CapsulePalette[];
}

export interface AiTestResponse {
    id: number;
    hairColor: string;
    eyesColor: string;
    lipsColor: string;
    skinColor: string;
    status: string;
    createdDate: string;
    typeOfTest: string;
    fullname: string;
    imageUrl: string;
    newAiTestResultResponseModel: AiTestResultModel;
}

export interface ExpertTestResponse {
    id: number;
    hairColor: string;
    eyesColor: string;
    lipsColor: string;
    skinColor: string;
    status: string;
    createdDate: string;
    typeOfTest: string;
    userAccountId: number;
    aiPictures: RequestPicture[];
    pictures: RequestPicture[];
}

export interface UserSubscriptionInformation {
    startDate: string;
    endDate: string;
    status: boolean;
    remainingUses: number;
    createAt: string;
    updateAt: string;
    userId: number;
    servicePackageId: number;
    servicePackage: ServicePackage;
    user: UserInfo;
}

export interface ExpertRequestHistoryItem {
    id: number;
    hairColor: string;
    eyesColor: string;
    lipsColor: string;
    skinColor: string;
    status: string;
    createdDate: string;
    typeOfTest: string;
    userAccountId: number;
    aiPictures: RequestPicture[];
    pictures: RequestPicture[];
    expertStatus: string;
    assignmentDate: string;
}
export interface UserInfoInSubscription {
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
}

export interface UserSubscriptionInformation {
    startDate: string;
    endDate: string;
    status: boolean;
    remainingUses: number;
    createAt: string;
    updateAt: string;
    userId: number;
    servicePackageId: number;
    servicePackage: ServicePackage;
    user: UserInfoInSubscription; // Hoặc UserInfo nếu đã có
}

export interface UserPayment {
    id: number;
    userId: number;
    userFullname: string;
    userEmail: string;
    amount: number;
    description: string;
    orderCode: string;
    createdAt: string; // ISO DateTime string
    paymentLogs: PaymentLog[];
}

export interface PaymentLog {
    id: number;
    paymentId: number;
    message: string;
    createdAt: string; // ISO DateTime string
    oldStatus: string;
    newStatus: string;
    metadata: string;
}

export interface ReportPayload {
    content: string; // Nội dung báo cáo/phản hồi
    type: string;    // Loại báo cáo (ví dụ: 'BUG', 'FEEDBACK', 'REQUEST')
}

export interface ReportResult {
    id: number;
    content: string;
    type: string;
    status: string;
    notice: string;
    userAccountId: number;
    userEmail: string;
    username: string;
    createdAt: string; // ISO DateTime string
    updatedAt: string; // ISO DateTime string
}

export interface ReportResponse {
    code: number;
    result: ReportResult;
    message: string;
    success: boolean;
}
export interface ExpertRequestDetailResponse {
    testRequest: ExpertRequest;
    responses: ExpertTestResponse[];
}

export interface UpdateResponsePayload {
    bestColor: string;
    worstColor: string;
    colorTypeId: number;
    note: string;
}

export interface ExpertTestImageModel {
    imageFile: ImageFile,
    bestColor: string,
    worstColor: string,
    colorTypeId: number,
}

export interface ExpertSalaryDetail {
    testResponseId: number;
    completedDate: string;
    rating: number;
    amount: number;
}

export interface ExpertSalaryResponse {
    expertId: number;
    totalSalary: number;
    totalRequests: number;
    averageRating: number;
    fromDate: string;
    toDate: string;
    details: ExpertSalaryDetail[];
}
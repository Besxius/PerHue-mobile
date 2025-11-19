import { GoogleSignin } from '@react-native-google-signin/google-signin';

// Lấy WEB_CLIENT_ID từ Google Cloud Console (loại "Web application")
// Đây là Client ID bắt buộc cho việc xác thực.
//google console
// const WEB_CLIENT_ID = '388193903048-l1g9co4ria1i8f9i73bh9jtjenah2423.apps.googleusercontent.com';
//firebase console
const WEB_CLIENT_ID = '1097946555630-a3rgjk6au4k9l8gg3oi7l5k55fcelpt3.apps.googleusercontent.com';

/**
 * Hàm cấu hình Google Sign-in.
 * Nên được gọi MỘT LẦN duy nhất khi ứng dụng khởi động.
 */
export const configureGoogleSignIn = (): void => {
    GoogleSignin.configure({
        webClientId: WEB_CLIENT_ID,
        offlineAccess: true,
        // Nếu bạn cần cấu hình iOS/Android riêng biệt (ví dụ: chỉ cho mục đích khác ngoài Firebase Auth):
        // iosClientId: 'YOUR_IOS_CLIENT_ID_IF_NEEDED',
    });
};
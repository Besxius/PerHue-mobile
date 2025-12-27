import messaging from '@react-native-firebase/messaging';
import { PermissionsAndroid, Platform } from 'react-native';
import apiClient, { API_BASE_URL } from '../api/apiClient';
import { removeDeviceToken, saveDeviceToken } from '../api/userApi';

export const requestUserPermission = async () => {
    if (Platform.OS === 'ios') {
        const authStatus = await messaging().requestPermission();
        const enabled =
            authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
            authStatus === messaging.AuthorizationStatus.PROVISIONAL;
        return enabled;
    } else if (Platform.OS === 'android' && Platform.Version >= 33) {
        const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
        return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    return true;
};

// 2. Lấy FCM Token và gửi lên Backend
export const getFCMToken = async () => {
    try {
        const token = await messaging().getToken();
        console.log('FCM Token:', token);

        if (token) {
            // Gọi API lưu token lên server
            await saveDeviceToken(token);
        }

        return token;
    } catch (error) {
        console.error('Error getting FCM token:', error);
        return null;
    }
};

// 3. Lắng nghe thông báo khi App đang mở (Foreground)
export const onMessageReceived = (callback: (remoteMessage: any) => void) => {
    return messaging().onMessage(async remoteMessage => {
        console.log('A new FCM message arrived!', remoteMessage);
        callback(remoteMessage);
    });
};

// 4. Xử lý khi người dùng nhấn vào thông báo để mở App
export const onNotificationOpenedApp = () => {
    messaging().onNotificationOpenedApp(remoteMessage => {
        console.log('Notification caused app to open from background state:', remoteMessage.notification);
    });

    messaging()
        .getInitialNotification()
        .then(remoteMessage => {
            if (remoteMessage) {
                console.log('Notification caused app to open from quit state:', remoteMessage.notification);
            }
        });
};

export const subscribeToNotifications = async () => {
    try {
        const authStatus = await messaging().requestPermission();
        const enabled =
            authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
            authStatus === messaging.AuthorizationStatus.PROVISIONAL;

        if (enabled) {
            const token = await messaging().getToken();
            if (token) {
                await saveDeviceToken(token);
                return true;
            }
        }
        return false;
    } catch (error) {
        console.error('Subscribe error:', error);
        return false;
    }
};

export const unsubscribeFromNotifications = async () => {
    try {
        // 1. Lấy token hiện tại để gửi lên server xóa
        const token = await messaging().getToken();
        if (token) {
            await removeDeviceToken();
        }

        // 2. Xóa token ở phía Firebase SDK (Optional - để reset)
        await messaging().deleteToken();
        console.log('Unsubscribed from FCM');
        return true;
    } catch (error) {
        console.error('Unsubscribe error:', error);
        return false;
    }
};
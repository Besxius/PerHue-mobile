// src/screen/WelcomeScreen.tsx (Ví dụ đơn giản)
import React from 'react';
import { View, Text, StyleSheet, ImageBackground } from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CustomButton from '../components/CustomButton'; // Giả sử bạn có component này
import { RootStackParamList } from '../navigation/AppNavigator'; // Import RootStackParamList
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const FIRST_LAUNCH_KEY = '@app_is_first_launch';

// Định nghĩa kiểu Props
type WelcomeScreenProps = StackScreenProps<RootStackParamList, 'WelcomeScreen'>;

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ navigation }) => {

    // const handleGetStarted = async () => {
    //     try {
    //         // 1. Đánh dấu rằng người dùng đã xem màn hình chào mừng
    //         await AsyncStorage.setItem(FIRST_LAUNCH_KEY, 'true');

    //         // 2. Chuyển hướng đến màn hình Login (hoặc trực tiếp đến Tabs nếu không cần Login)
    //         // Dùng replace để người dùng không thể quay lại WelcomeScreen
    //         navigation.replace('LoginScreen');

    //     } catch (e) {
    //         console.error("Lỗi khi lưu trạng thái lần đầu chạy:", e);
    //         navigation.replace('LoginScreen'); // Vẫn chuyển hướng nếu có lỗi
    //     }
    // };
    const insets = useSafeAreaInsets();
    const handleGetStarted = () => {
        // Không cần dùng AsyncStorage nữa

        // Chuyển hướng đến màn hình Login
        navigation.navigate('LoginScreen');
    };

    return (
        <View style={[
            styles.container,
            // Áp dụng paddingTop và paddingBottom từ insets
            {
                paddingTop: insets.top,
                paddingBottom: insets.bottom + 50 // Thêm 50 padding cho nút
            }
        ]}>
            {/* Mô phỏng giao diện từ hình ảnh */}
            <View style={styles.logoArea}>
                {/* Thay bằng component Logo thực tế của bạn */}
                <View style={styles.logoCircle}>
                    <Text style={styles.logoText}>PJ</Text>
                </View>
                <Text style={styles.title}>PERHUE</Text>
                <Text style={styles.subtitle}>FIND YOUR COLOR</Text>
                <Text style={styles.subtitle}>MAKE YOU BRIGHTER</Text>
            </View>

            <View style={styles.buttonArea}>
                <CustomButton
                    title="Let get Started"
                    onPress={handleGetStarted}
                    color="#4a7de2"
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#2E3A59', // Màu nền tối
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: 50,
        paddingTop: 100
    },
    logoArea: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoCircle: {
        width: 150,
        height: 150,
        borderRadius: 75,
        backgroundColor: '#E0E0E0',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 30,
    },
    logoText: { // Thay thế bằng Image component thực tế
        fontSize: 30,
        fontWeight: 'bold',
        color: '#000'
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 15,
    },
    subtitle: {
        fontSize: 16,
        color: '#ccc',
        fontWeight: '500',
    },
    buttonArea: {
        width: '80%',
    }
});

export default WelcomeScreen;
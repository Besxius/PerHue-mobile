// src/components/CustomTextInput.tsx
import React, { useState } from 'react'; // THÊM: useState
import { TextInput, View, StyleSheet, TextInputProps, TouchableOpacity } from 'react-native'; // THÊM: TouchableOpacity
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface CustomTextInputProps extends TextInputProps {
    iconName?: string;
}

const CustomTextInput: React.FC<CustomTextInputProps> = ({ iconName, style, secureTextEntry, ...props }) => {
    // 1. Khởi tạo state để ẩn/hiện mật khẩu. Mặc định là secureTextEntry
    const [isSecure, setIsSecure] = useState(secureTextEntry);

    // 2. Xác định xem có phải là trường mật khẩu không
    const isPasswordField = secureTextEntry !== undefined;

    // 3. Chọn icon cho nút chuyển đổi (nếu có)
    const toggleIconName = isSecure ? 'eye-off-outline' : 'eye-outline';

    // 4. Hàm chuyển đổi trạng thái
    const toggleSecureEntry = () => {
        setIsSecure(!isSecure);
    };

    return (
        <View style={styles.container}>
            {iconName && <Icon name={iconName} size={20} color="#888" style={styles.icon} />}
            <TextInput
                style={[styles.input, style]}
                placeholderTextColor="#888"
                // Sử dụng state isSecure cho prop secureTextEntry
                secureTextEntry={isSecure}
                {...props}
            />

            {/* 5. Nút chuyển đổi (chỉ hiển thị nếu là trường mật khẩu) */}
            {isPasswordField && (
                <TouchableOpacity onPress={toggleSecureEntry} style={styles.toggleButton}>
                    <Icon name={toggleIconName} size={20} color="#888" />
                </TouchableOpacity>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        borderRadius: 10,
        paddingHorizontal: 15,
        marginBottom: 15,
        height: 50,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    icon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: '#333',
    },
    // THÊM: Style cho nút chuyển đổi
    toggleButton: {
        paddingLeft: 10,
        paddingVertical: 5,
    }
});

export default CustomTextInput;
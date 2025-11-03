// src/components/CustomTextInput.tsx
import React from 'react';
import { TextInput, View, StyleSheet, TextInputProps } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'; // Cài đặt nếu chưa có: npm install react-native-vector-icons

interface CustomTextInputProps extends TextInputProps {
    iconName?: string;
}

const CustomTextInput: React.FC<CustomTextInputProps> = ({ iconName, style, ...props }) => {
    return (
        <View style={styles.container}>
            {iconName && <Icon name={iconName} size={20} color="#888" style={styles.icon} />}
            <TextInput
                style={[styles.input, style]}
                placeholderTextColor="#888"
                {...props}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f5f5f5', // Nền màu sáng hơn cho input
        borderRadius: 10,
        paddingHorizontal: 15,
        marginBottom: 15,
        height: 50,
        borderWidth: 1, // Thêm border để mô phỏng hình ảnh
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
});

export default CustomTextInput;
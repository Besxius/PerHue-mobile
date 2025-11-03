// src/components/CustomButton.tsx
import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface CustomButtonProps {
    title: string;
    onPress: () => void;
    loading?: boolean;
    style?: ViewStyle;
    textStyle?: TextStyle;
    iconName?: string;
    color?: string; // Màu nền của nút
    textColor?: string; // Màu chữ
}

const CustomButton: React.FC<CustomButtonProps> = ({
    title,
    onPress,
    loading = false,
    style,
    textStyle,
    iconName,
    color = '#4a90e2', // Màu xanh mặc định
    textColor = '#fff', // Màu chữ trắng mặc định
}) => {
    return (
        <TouchableOpacity
            style={[styles.button, { backgroundColor: color }, style]}
            onPress={onPress}
            disabled={loading}
        >
            {loading ? (
                <ActivityIndicator color={textColor} />
            ) : (
                <View style={styles.contentContainer}>
                    {iconName && <Icon name={iconName} size={20} color={textColor} style={styles.icon} />}
                    <Text style={[styles.buttonText, { color: textColor }, textStyle]}>
                        {title}
                    </Text>
                </View>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 15,
        height: 50,
    },
    contentContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    buttonText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    icon: {
        marginRight: 10,
    },
});

export default CustomButton;
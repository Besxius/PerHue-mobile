// src/components/CustomTextInput.tsx
import React, { useState } from 'react'; // THÊM: useState
import { TextInput, View, StyleSheet, TextInputProps, TouchableOpacity } from 'react-native'; // THÊM: TouchableOpacity
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface CustomTextInputProps extends TextInputProps {
    iconName?: string;
    error?: boolean;
}

const CustomTextInput: React.FC<CustomTextInputProps> = ({ iconName, style, secureTextEntry, error, ...props }) => {
    const [isSecure, setIsSecure] = useState(secureTextEntry);

    const isPasswordField = secureTextEntry !== undefined;

    const toggleIconName = isSecure ? 'eye-off-outline' : 'eye-outline';

    const toggleSecureEntry = () => {
        setIsSecure(!isSecure);
    };

    return (
        <View style={[styles.container, error && styles.errorContainer]}>
            {iconName && <Icon name={iconName} size={20} color="#888" style={styles.icon} />}
            <TextInput
                style={[styles.input, style]}
                placeholderTextColor="#888"
                secureTextEntry={isSecure}
                {...props}
            />

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
    errorContainer: {
        borderColor: '#f87c7cff',
        backgroundColor: '#fff5f5',
    },
    icon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: '#333',
    },
    toggleButton: {
        paddingLeft: 10,
        paddingVertical: 5,
    }
});

export default CustomTextInput;
import React, { useState } from 'react';
import {
    Text,
    StyleSheet,
    Animated,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface ToastProps {
    message: string;
    isVisible: boolean;
}

const CustomToast: React.FC<ToastProps> = ({ message, isVisible }) => {
    const animatedValue = React.useRef(new Animated.Value(0)).current;

    React.useEffect(() => {
        if (isVisible) {
            Animated.timing(animatedValue, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }).start();
        } else {
            Animated.timing(animatedValue, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }).start();
        }
    }, [isVisible]);

    const translateY = animatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: [100, 0],
    });

    return (
        <Animated.View style={[
            toastStyles.container,
            { opacity: animatedValue, transform: [{ translateY }] }
        ]}>
            <Icon name="check-circle-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={toastStyles.message}>{message}</Text>
        </Animated.View>
    );
};

const toastStyles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 50,
        left: 20,
        right: 20,
        backgroundColor: '#4CAF50', // Màu xanh lá cây cho thành công
        padding: 12,
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
        zIndex: 1000,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    message: {
        color: '#fff',
        fontWeight: '600',
    }
});

export default CustomToast;
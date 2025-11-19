import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Ionicons, MaterialCommunityIcons, Fontisto } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { UserInfo } from '../types/dataModels';

const logoIcon = require('../assets/logo-icon-black.png'); // Điều chỉnh đường dẫn nếu cần

// --- Định nghĩa Kiểu (Props) ---
export interface CustomHeaderProps { // Đổi tên interface
    title?: string;
    onNavigateToPackage: () => void;
    onNavigateToNotification: () => void;
    // onNavigateToSettings: () => void;
}

// --- Component CustomHeader ---
const CustomHeader: React.FC<CustomHeaderProps> = ({ // Đổi tên component
    title,
    onNavigateToPackage,
    onNavigateToNotification,
    // onNavigateToSettings,
}) => {
    const insets = useSafeAreaInsets();
    const headerTitle = title || 'PERHUE';

    return (
        <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
            {/* 1. Phần Profile & My Activity */}
            <View style={styles.profileContainer}>
                <TouchableOpacity style={styles.activityButton}>
                    <Image source={logoIcon} style={styles.avatar} />
                </TouchableOpacity>
                <Text style={styles.appNameText}>{headerTitle}</Text>
            </View>

            {/* 2. Phần Icon Navigation */}
            <View style={styles.iconGroup}>
                {/* Icon Thông báo */}
                <TouchableOpacity
                    style={styles.iconButton}
                    onPress={onNavigateToNotification}
                >
                    <Ionicons name="notifications" size={30} color="black" />
                </TouchableOpacity>

                {/* Icon Package */}
                <TouchableOpacity
                    style={styles.iconButton}
                    onPress={onNavigateToPackage}
                >
                    <MaterialCommunityIcons name="package" size={30} color="black" />
                </TouchableOpacity>

                {/* Icon Cài đặt */}
                {/* <TouchableOpacity
                    style={styles.iconButton}
                    onPress={onNavigateToSettings}
                >
                    <Fontisto name="player-settings" size={30} color="black" />
                </TouchableOpacity> */}
            </View>
        </View>
    );
};

export default CustomHeader;

// --- Styles (Giữ nguyên) ---
const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 15,
    },
    profileContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        marginRight: 10,
    },
    activityButton: {
    },
    appNameText: {
        color: 'black',
        fontSize: 24,
        fontWeight: '600',
    },
    iconGroup: {
        flexDirection: 'row',
    },
    iconButton: {
        marginLeft: 15,
    },
});
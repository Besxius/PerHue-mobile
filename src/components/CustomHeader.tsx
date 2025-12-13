import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Ionicons, MaterialCommunityIcons, Fontisto } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../screens/auth/AuthContext';
const logoIcon = require('../assets/logo-icon-black.png');

export interface CustomHeaderProps {
    title?: string;
    onNavigateToPackage: () => void;
    onNavigateToNotification: () => void;
}

const CustomHeader: React.FC<CustomHeaderProps> = ({
    title,
    onNavigateToPackage,
    onNavigateToNotification,
}) => {
    const insets = useSafeAreaInsets();
    const { userRole } = useAuth();
    const headerTitle = title || 'PERHUE';

    return (
        <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
            <View style={styles.profileContainer}>
                <TouchableOpacity style={styles.activityButton}>
                    <Image source={logoIcon} style={styles.avatar} />
                </TouchableOpacity>
                <Text style={styles.appNameText}>{headerTitle}</Text>
            </View>

            <View style={styles.iconGroup}>
                <TouchableOpacity
                    style={styles.iconButton}
                    onPress={onNavigateToNotification}
                >
                    <Ionicons name="notifications" size={30} color="black" />
                </TouchableOpacity>

                {userRole === 'User' && (
                    <TouchableOpacity
                        style={styles.iconButton}
                        onPress={onNavigateToPackage}
                    >
                        <MaterialCommunityIcons name="package" size={30} color="black" />
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
};

export default CustomHeader;

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
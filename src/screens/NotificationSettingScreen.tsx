import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, Linking, AppState, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import messaging from '@react-native-firebase/messaging';

import CustomConfirmModal, { AlertConfig } from '../components/CustomConfirmModal';

type Props = NativeStackScreenProps<RootStackParamList, 'NotificationSettingScreen'>;

const NotificationSettingScreen: React.FC<Props> = ({ navigation }) => {
    const insets = useSafeAreaInsets();
    const [isEnabled, setIsEnabled] = useState(false);

    const appState = useRef(AppState.currentState);

    const [modalConfig, setModalConfig] = useState<AlertConfig>({
        visible: false,
        title: '',
        message: '',
        type: 'info'
    });

    const checkSystemPermission = useCallback(async () => {
        try {
            const authStatus = await messaging().hasPermission();
            const enabled =
                authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
                authStatus === messaging.AuthorizationStatus.PROVISIONAL;

            setIsEnabled(enabled);
        } catch (error) {
            console.error("Error checking permission:", error);
        }
    }, []);

    useEffect(() => {
        checkSystemPermission();

        const subscription = AppState.addEventListener('change', nextAppState => {
            if (
                appState.current.match(/inactive|background/) &&
                nextAppState === 'active'
            ) {
                console.log('App has come to the foreground! Checking permissions...');
                checkSystemPermission();
            }

            appState.current = nextAppState;
        });

        return () => {
            subscription.remove();
        };
    }, [checkSystemPermission]);

    const handleToggleSwitch = () => {

        const action = isEnabled ? "disable" : "enable";

        setModalConfig({
            visible: true,
            title: 'System Settings',
            message: `To ${action} notifications, you need to change the permission in your device settings.`,
            type: 'info',
            confirmText: 'Go to Settings',
            cancelText: 'Cancel',
            onConfirm: () => {
                setModalConfig(prev => ({ ...prev, visible: false }));
                Linking.openSettings().catch(() => {
                    setModalConfig({
                        visible: true,
                        title: 'Error',
                        message: 'Unable to open settings. Please open Settings manually.',
                        type: 'error',
                        confirmText: 'OK',
                        onConfirm: () => setModalConfig(p => ({ ...p, visible: false }))
                    });
                });
            },
            onCancel: () => setModalConfig(prev => ({ ...prev, visible: false }))
        });
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Notification Settings</Text>
                <View style={{ width: 24 }} />
            </View>

            <View style={styles.content}>
                <View style={styles.settingItem}>
                    <View style={styles.textContainer}>
                        <Text style={styles.itemTitle}>Push Notifications</Text>
                        <Text style={styles.itemDescription}>
                            {isEnabled
                                ? "You are receiving notifications."
                                : "Notifications are currently disabled."}
                        </Text>
                    </View>

                    <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={handleToggleSwitch}
                    >
                        <View pointerEvents="none">
                            <Switch
                                trackColor={{ false: "#767577", true: "#4C7BE2" }}
                                thumbColor={isEnabled ? "#fff" : "#f4f3f4"}
                                ios_backgroundColor="#3e3e3e"
                                value={isEnabled}
                            />
                        </View>
                    </TouchableOpacity>
                </View>

                <Text style={styles.noteText}>
                    Note: This setting is controlled by your device's operating system.
                </Text>
            </View>

            <CustomConfirmModal
                {...modalConfig}
                onCancel={modalConfig.onCancel}
                onConfirm={() => {
                    if (modalConfig.onConfirm) modalConfig.onConfirm();
                }}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f9f9f9' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 15,
        paddingVertical: 15,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    backButton: { padding: 5 },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
    content: { padding: 20 },
    settingItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    textContainer: { flex: 1, paddingRight: 10 },
    itemTitle: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 4 },
    itemDescription: { fontSize: 13, color: '#666', lineHeight: 18 },
    noteText: {
        marginTop: 15,
        fontSize: 12,
        color: '#999',
        fontStyle: 'italic',
        textAlign: 'center'
    }
});

export default NotificationSettingScreen;
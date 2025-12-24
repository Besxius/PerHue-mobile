import React from 'react';
import {
    Modal,
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const BLUE_COLOR = '#3b82f6';

export interface AlertConfig {
    visible: boolean;
    title: string;
    message: string;
    type: 'warning' | 'error' | 'info' | 'success';
    confirmText?: string;
    cancelText?: string;
    onConfirm?: () => void;
    onCancel?: () => void;
}

const CustomConfirmModal: React.FC<AlertConfig> = ({
    visible,
    title,
    message,
    type,
    confirmText = 'OK',
    cancelText,
    onConfirm,
    onCancel
}) => {
    if (!visible) return null;

    let iconName: keyof typeof Ionicons.glyphMap = 'information-circle';
    let iconColor = BLUE_COLOR;
    let iconBgColor = `${BLUE_COLOR}20`;

    switch (type) {
        case 'warning':
            iconName = 'warning';
            iconColor = '#F59E0B';
            iconBgColor = '#FEF3C7';
            break;
        case 'error':
            iconName = 'alert-circle';
            iconColor = '#EF4444';
            iconBgColor = '#FEE2E2';
            break;
        case 'success':
            iconName = 'checkmark-circle';
            iconColor = '#10B981';
            iconBgColor = '#D1FAE5';
            break;
        default:
            iconName = 'information-circle';
            iconColor = BLUE_COLOR;
            iconBgColor = '#DBEAFE';
            break;
    }

    return (
        <Modal
            transparent
            visible={visible}
            animationType="fade"
            onRequestClose={onCancel}
        >
            <View style={styles.overlay}>
                <View style={styles.alertContainer}>
                    <View style={[styles.iconWrapper, { backgroundColor: iconBgColor }]}>
                        <Ionicons name={iconName} size={32} color={iconColor} />
                    </View>

                    <Text style={styles.alertTitle}>{title}</Text>
                    <Text style={styles.alertMessage}>{message}</Text>

                    <View style={styles.alertBtnContainer}>
                        {cancelText && onCancel && (
                            <TouchableOpacity style={styles.alertBtnCancel} onPress={onCancel}>
                                <Text style={styles.alertBtnCancelText}>{cancelText}</Text>
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity
                            style={[styles.alertBtnConfirm, { backgroundColor: iconColor }]}
                            onPress={onConfirm}
                        >
                            <Text style={styles.alertBtnConfirmText}>{confirmText}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    alertContainer: {
        width: width * 0.85,
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
        elevation: 5,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    iconWrapper: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15,
    },
    alertTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111',
        marginBottom: 8,
        textAlign: 'center',
    },
    alertMessage: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginBottom: 20,
        lineHeight: 20,
    },
    alertBtnContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        gap: 12,
    },
    alertBtnCancel: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        backgroundColor: '#f3f4f6',
        alignItems: 'center',
    },
    alertBtnCancelText: {
        color: '#4b5563',
        fontWeight: '600',
    },
    alertBtnConfirm: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    alertBtnConfirmText: {
        color: 'white',
        fontWeight: 'bold',
    },
});

export default CustomConfirmModal;
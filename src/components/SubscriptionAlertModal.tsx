import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface SubscriptionAlertModalProps {
    isVisible: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

const SubscriptionAlertModal: React.FC<SubscriptionAlertModalProps> = ({ isVisible, onClose, onConfirm }) => {
    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={isVisible}
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.container}>
                    <View style={styles.iconContainer}>
                        <MaterialCommunityIcons name="youtube-subscription" size={50} color="#d1862fff" />
                    </View>

                    <Text style={styles.title}>Out of Uses</Text>

                    <Text style={styles.message}>
                        You do not have any remaining uses for this feature. Please purchase a package to continue using AI & Expert analysis.
                    </Text>

                    <View style={styles.buttonContainer}>
                        <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.confirmButton} onPress={onConfirm}>
                            <Text style={styles.confirmButtonText}>Buy Package</Text>
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
        backgroundColor: 'rgba(0, 0, 0, 0.7)', // Màu nền tối mờ
        justifyContent: 'center',
        alignItems: 'center',
    },
    container: {
        width: width * 0.85,
        backgroundColor: '#1E1E1E', // Nền Modal màu tối
        borderRadius: 20,
        padding: 25,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 10,
    },
    iconContainer: {
        marginBottom: 15,
        backgroundColor: 'rgba(255, 215, 0, 0.1)', // Nền vàng nhạt cho icon
        padding: 15,
        borderRadius: 50,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: 'white',
        textAlign: 'center',
        marginBottom: 10,
    },
    message: {
        fontSize: 15,
        color: '#E0E0E0',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 25,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        gap: 15,
    },
    cancelButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#555',
        backgroundColor: 'transparent',
        alignItems: 'center',
    },
    cancelButtonText: {
        color: '#A0A0A0',
        fontSize: 16,
        fontWeight: '600',
    },
    confirmButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        backgroundColor: '#4C7BE2', // Màu xanh chủ đạo của app
        alignItems: 'center',
    },
    confirmButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default SubscriptionAlertModal;
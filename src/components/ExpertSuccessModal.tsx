// components/ExpertSuccessModal.tsx
import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

const { height: screenHeight } = Dimensions.get('window');

interface ExpertSuccessModalProps {
    isVisible: boolean;
    onClose: () => void;
}

const ExpertSuccessModal: React.FC<ExpertSuccessModalProps> = ({ isVisible, onClose }) => {
    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={isVisible}
            onRequestClose={onClose}
        >
            <View style={modalStyles.overlay}>
                <View style={modalStyles.container}>

                    <Ionicons name="checkmark-circle-outline" size={60} color="#7AC943" style={modalStyles.icon} />

                    <Text style={modalStyles.title}>Request Sent Successfully!</Text>

                    <Text style={modalStyles.message}>
                        You will receive analysis results from our experts within 1 week from the date of request submission.
                    </Text>

                    <Text style={modalStyles.messageSmall}>
                        In the meantime, explore and enjoy the app's other features.
                    </Text>

                    <TouchableOpacity style={modalStyles.okButton} onPress={onClose}>
                        <Text style={modalStyles.okButtonText}>GOT IT</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const modalStyles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    container: {
        width: '80%',
        backgroundColor: '#1E1E1E',
        borderRadius: 15,
        padding: 25,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 10,
    },
    icon: {
        marginBottom: 15,
    },
    title: {
        fontSize: 20,
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
        marginBottom: 15,
    },
    messageSmall: {
        fontSize: 13,
        color: '#A0A0A0',
        textAlign: 'center',
        marginBottom: 25,
    },
    okButton: {
        backgroundColor: '#4A90E2', // Màu xanh dương nổi bật
        paddingVertical: 10,
        paddingHorizontal: 30,
        borderRadius: 8,
        width: '100%',
    },
    okButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
    },
});

export default ExpertSuccessModal;
import React from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    FlatList,
    Modal,
    TouchableWithoutFeedback,
    Platform,
    ToastAndroid,
    Alert
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { Color, CapsulePaletteModel } from '../types/dataModels';

interface ColorDetailProps {
    color: Color;
}

const ColorDetailCard: React.FC<ColorDetailProps> = ({ color }) => {
    const hexToRgb = (hex: string): [number, number, number] => {
        let r = 0, g = 0, b = 0;
        if (hex && hex.length === 7) {
            r = parseInt(hex.slice(1, 3), 16);
            g = parseInt(hex.slice(3, 5), 16);
            b = parseInt(hex.slice(5, 7), 16);
        }
        return [r, g, b];
    };

    const [r, g, b] = hexToRgb(color.hexCode);
    const cmyk = '8, 0, 28, 25';

    const handleCopy = async () => {
        await Clipboard.setStringAsync(color.hexCode);

        if (Platform.OS === 'android') {
            ToastAndroid.show(`Copied ${color.hexCode} to clipboard!`, ToastAndroid.SHORT);
        } else {
            Alert.alert("Copied", `Color code ${color.hexCode} copied!`);
        }
    };

    return (
        <View style={styles.colorCard}>
            <View style={[styles.colorSwatch, { backgroundColor: color.hexCode }]} />

            <View style={styles.colorInfo}>
                <Text style={styles.colorName}>{color.name || color.hexCode}</Text>
                <Text style={styles.colorValue}>
                    <Text style={styles.colorLabel}>HEX:</Text> {color.hexCode}
                </Text>
                <Text style={styles.colorValue}>
                    <Text style={styles.colorLabel}>RGB:</Text> {r}, {g}, {b}
                </Text>
                <Text style={styles.colorValue}>
                    <Text style={styles.colorLabel}>CMYK:</Text> {cmyk}
                </Text>
            </View>
            <TouchableOpacity style={styles.copyButton} onPress={handleCopy}>
                <Ionicons name="copy-outline" size={24} color="gray" />
            </TouchableOpacity>
        </View>
    );
};

interface PaletteDetailModalProps {
    isVisible: boolean;
    palette: CapsulePaletteModel | null;
    onClose: () => void;
}

const PaletteDetailModal: React.FC<PaletteDetailModalProps> = ({ isVisible, palette, onClose }) => {
    const insets = useSafeAreaInsets();

    if (!palette) return null;

    // const title = palette.colorType?.name ? `${palette.colorType.name.toUpperCase()} PALETTE` : 'PALETTE DETAIL';
    const title = 'PALETTE DETAIL';

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={isVisible}
            onRequestClose={onClose}
        >
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={styles.centeredView}>
                    <TouchableWithoutFeedback>
                        <View style={[styles.modalView, { paddingBottom: insets.bottom }]}>
                            <View style={styles.headerContainer}>
                                <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                                    <Ionicons name="arrow-back" size={24} color="#333" />
                                </TouchableOpacity>
                                <Text style={styles.headerTitle}>{title}</Text>
                            </View>

                            <FlatList
                                data={palette.colors}
                                renderItem={({ item }) => <ColorDetailCard color={item} />}
                                keyExtractor={(item, index) => item.id ? item.id.toString() : index.toString()}
                                contentContainerStyle={styles.colorListContent}
                                showsVerticalScrollIndicator={false}
                            />
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
};

const styles = StyleSheet.create({
    centeredView: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
    },
    modalView: {
        width: '100%',
        height: '75%',
        backgroundColor: 'white',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        overflow: 'hidden',
    },
    headerContainer: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 15,
        paddingTop: 40,
        position: 'relative',
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    closeButton: {
        position: 'absolute',
        left: 20,
        top: 40,
        zIndex: 10,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'center',
    },
    colorListContent: {
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 30,
    },
    colorCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F7F7F7',
        borderRadius: 10,
        padding: 15,
        marginBottom: 15,
        minHeight: 100,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    colorSwatch: {
        width: 80,
        height: '100%',
        minHeight: 70,
        borderRadius: 8,
        marginRight: 15,
        borderWidth: 1,
        borderColor: '#DDD',
    },
    colorInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    colorName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 5,
    },
    colorValue: {
        fontSize: 13,
        color: '#666',
        lineHeight: 18,
    },
    colorLabel: {
        fontWeight: 'bold',
        marginRight: 5,
        color: '#333',
    },
    copyButton: {
        position: 'absolute',
        right: 15,
        top: 15,
        padding: 10,
        borderRadius: 50,
        backgroundColor: 'rgba(66, 133, 244, 0.1)',
    }
});

export default PaletteDetailModal;
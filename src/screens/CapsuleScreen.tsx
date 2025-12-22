import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    StatusBar,
    FlatList,
    ActivityIndicator,
    Modal,
    TouchableWithoutFeedback,
    TextInput,
    RefreshControl,
    Platform,
    ToastAndroid,
    Alert
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from '@expo/vector-icons';
import CustomHeader from '../components/CustomHeader';
import CapsulePaletteComponent from '../components/CapsulePalette';
import * as Clipboard from 'expo-clipboard';

import { ColorType, CapsulePaletteModel, Color } from '../types/dataModels';
import { getCapsulePalettesByType, getColorType } from '../api/capsulePaletteApi';

interface TabItem extends ColorType { }

interface ColorDetailProps {
    color: Color;
}

const ColorDetailCard: React.FC<ColorDetailProps> = ({ color }) => {
    const hexToRgb = (hex: string): [number, number, number] => {
        let r = 0, g = 0, b = 0;
        if (hex.length === 7) {
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
        <View style={modalStyles.colorCard}>
            <View style={[modalStyles.colorSwatch, { backgroundColor: color.hexCode }]} />

            <View style={modalStyles.colorInfo}>
                <Text style={modalStyles.colorName}>{color.name}</Text>
                <Text style={modalStyles.colorValue}>
                    <Text style={modalStyles.colorLabel}>HEX:</Text> {color.hexCode}
                </Text>
                <Text style={modalStyles.colorValue}>
                    <Text style={modalStyles.colorLabel}>RGB:</Text> {r}, {g}, {b}
                </Text>
                <Text style={modalStyles.colorValue}>
                    <Text style={modalStyles.colorLabel}>CMYK:</Text> {cmyk}
                </Text>
            </View>
            <TouchableOpacity style={modalStyles.copyButton} onPress={handleCopy}>
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

    const title = palette.colorType?.name ? `${palette.colorType.name.toUpperCase()} PALETTE` : 'PALETTE DETAIL';

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={isVisible}
            onRequestClose={onClose}
        >
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={modalStyles.centeredView}>

                    <TouchableWithoutFeedback>
                        <View style={[modalStyles.modalView, { paddingBottom: insets.bottom }]}>

                            <View style={modalStyles.headerContainer}>
                                <TouchableOpacity style={modalStyles.closeButton} onPress={onClose}>
                                    <Ionicons name="arrow-back" size={24} color="#333" />
                                </TouchableOpacity>
                                <Text style={modalStyles.headerTitle}>{title}</Text>
                            </View>

                            <FlatList
                                data={palette.colors}
                                renderItem={({ item }) => <ColorDetailCard color={item} />}
                                keyExtractor={(item) => item.id.toString()}
                                contentContainerStyle={modalStyles.colorListContent}
                                showsVerticalScrollIndicator={false}
                            />

                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
};

const CapsuleScreen: React.FC<any> = ({ navigation }) => {
    const insets = useSafeAreaInsets();

    const [colorTypes, setColorTypes] = useState<TabItem[]>([]);
    const [tabLoading, setTabLoading] = useState(true);
    const [tabError, setTabError] = useState<string | null>(null);

    const [activeTabId, setActiveTabId] = useState<number | null>(null);

    const [palettes, setPalettes] = useState<CapsulePaletteModel[]>([]);
    const [paletteLoading, setPaletteLoading] = useState(false);
    const [paletteError, setPaletteError] = useState<string | null>(null);
    const [selectedPaletteId, setSelectedPaletteId] = useState<number | null>(null);

    const [searchText, setSearchText] = useState('');
    const [refreshing, setRefreshing] = useState(false);

    const [isModalVisible, setIsModalVisible] = useState(false);
    const [selectedDetailPalette, setSelectedDetailPalette] = useState<CapsulePaletteModel | null>(null);

    const filteredPalettes = useMemo(() => {
        if (!searchText) {
            return palettes;
        }

        const lowerCaseSearch = searchText.toLowerCase();

        return palettes.filter(palette => {
            return palette.colors.some(color =>
                color.name.toLowerCase().includes(lowerCaseSearch) ||
                color.hexCode.toLowerCase().includes(lowerCaseSearch)
            );
        });
    }, [palettes, searchText]);

    useEffect(() => {
        const fetchColorTypes = async () => {
            try {
                setTabLoading(true);
                const data = await getColorType();
                setColorTypes(data);
                setTabError(null);

                if (data.length > 0) {
                    setActiveTabId(data[0].id);
                }
            } catch (e: any) {
                console.error("Lỗi tải Color Types:", e);
                setTabError(e.message || "Không thể tải các loại màu.");
            } finally {
                setTabLoading(false);
            }
        };

        fetchColorTypes();
    }, []);

    const fetchPalettesData = useCallback(async (isRefresh = false) => {
        if (activeTabId === null) return;

        try {
            // Nếu đang refresh thì không hiện loading giữa màn hình, chỉ hiện spinner ở trên
            if (!isRefresh) {
                setPaletteLoading(true);
            }
            // Nếu refresh thì setPalettes([]) hoặc giữ lại tùy UX. 
            // Ở đây giữ lại data cũ để không bị nháy màn hình.
            if (!isRefresh) {
                setPalettes([]);
            }

            const data = await getCapsulePalettesByType(activeTabId);
            const activeColorType = colorTypes.find(t => t.id === activeTabId);

            const palettesWithColorType = data.map(p => ({
                ...p,
                colorType: p.colorType || activeColorType
            }));

            setPalettes(palettesWithColorType);
            setPaletteError(null);
            setSelectedPaletteId(null);

        } catch (e: any) {
            console.error(`Lỗi tải Palettes cho ID ${activeTabId}:`, e);
            setPaletteError(e.message || "Không thể tải bảng màu.");
            setPalettes([]);
        } finally {
            if (!isRefresh) {
                setPaletteLoading(false);
            }
        }
    }, [activeTabId, colorTypes]);


    useEffect(() => {
        fetchPalettesData(false);
    }, [fetchPalettesData]);


    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchPalettesData(true);
        setRefreshing(false);
    }, [fetchPalettesData]);


    const handlePalettePress = useCallback((palette: CapsulePaletteModel) => {
        setSelectedDetailPalette(palette);
        setIsModalVisible(true);
        setSelectedPaletteId(palette.id);
    }, []);

    const handleModalClose = useCallback(() => {
        setIsModalVisible(false);
        setSelectedDetailPalette(null);
    }, []);


    const navigateToPackageScreen = () => {
        navigation.navigate('PackageScreen');
    };
    const navigateToNotificationScreen = () => {
        navigation.navigate("NotificationScreen");
    };

    const renderTabItem = useCallback(({ item }: { item: TabItem }) => {
        const isActive = activeTabId === item.id;
        return (
            <TouchableOpacity
                style={[
                    styles.tabButton,
                    isActive && styles.tabButtonActive
                ]}
                onPress={() => {
                    setActiveTabId(item.id);
                }}
            >
                <Text
                    style={[
                        styles.tabText,
                        isActive && styles.tabTextActive
                    ]}
                >
                    {item.name}
                </Text>
            </TouchableOpacity>
        );
    }, [activeTabId]);

    const renderPaletteItem = useCallback(({ item }: { item: CapsulePaletteModel }) => {
        const hexCodes = item.colors.map(color => color.hexCode);

        const paddedColors: [string, string, string, string] = [
            hexCodes[0] || '#FFFFFF',
            hexCodes[1] || '#FFFFFF',
            hexCodes[2] || '#FFFFFF',
            hexCodes[3] || '#FFFFFF',
        ];

        return (
            <View style={styles.paletteItemContainer}>
                <CapsulePaletteComponent
                    colors={paddedColors}
                    isSelected={selectedPaletteId === item.id}
                    onSelect={() => handlePalettePress(item)}
                />
            </View>
        );
    }, [selectedPaletteId, handlePalettePress]);

    const renderEmptyComponent = () => {
        if (paletteError) {
            return <Text style={styles.errorText}>Lỗi tải bảng màu: {paletteError}</Text>;
        }
        if (palettes.length > 0 && searchText) {
            return <Text style={styles.noDataText}>Không tìm thấy kết quả tìm kiếm "{searchText}" trong mùa này.</Text>;
        }
        return (
            <Text style={styles.noDataText}>
                Chưa có bảng màu nào cho loại màu này.
            </Text>
        );
    };

    const renderPaletteLoading = () => (
        <ActivityIndicator
            size="large"
            color="#4285F4"
            style={styles.loadingIndicator}
        />
    );


    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />

            <CustomHeader
                title='Capsule Palette'
                onNavigateToPackage={navigateToPackageScreen}
                onNavigateToNotification={navigateToNotificationScreen}
            />

            <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Tìm kiếm theo tên màu hoặc mã hex..."
                    placeholderTextColor="#999"
                    value={searchText}
                    onChangeText={setSearchText}
                />
                {searchText.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchText('')} style={styles.clearSearchButton}>
                        <Ionicons name="close-circle" size={20} color="#999" />
                    </TouchableOpacity>
                )}
            </View>

            {tabLoading ? (
                <ActivityIndicator
                    size="small"
                    color="#4285F4"
                    style={styles.tabLoadingIndicator}
                />
            ) : tabError ? (
                <Text style={styles.errorTextSmall}>{tabError}</Text>
            ) : (
                <FlatList
                    horizontal
                    data={colorTypes}
                    renderItem={renderTabItem}
                    keyExtractor={(item) => item.id.toString()}
                    showsHorizontalScrollIndicator={false}
                    style={styles.tabScrollContainer}
                    contentContainerStyle={styles.tabScrollContent}
                />
            )}

            {paletteLoading ? (
                renderPaletteLoading()
            ) : (
                <FlatList
                    data={filteredPalettes}
                    renderItem={renderPaletteItem}
                    keyExtractor={(item) => item.id.toString()}
                    numColumns={2}
                    style={styles.paletteListWrapper}
                    contentContainerStyle={styles.paletteList}
                    ListEmptyComponent={renderEmptyComponent}
                    showsVerticalScrollIndicator={false}
                    ListFooterComponent={<View style={{ height: 60 + insets.bottom }} />}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={["#4285F4"]} //android
                            tintColor="#4285F4" //ios
                        />
                    }
                />
            )}

            <PaletteDetailModal
                isVisible={isModalVisible}
                palette={selectedDetailPalette}
                onClose={handleModalClose}
            />

        </View>
    );
}

export default CapsuleScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        borderRadius: 10,
        marginHorizontal: 20,
        marginTop: 10,
        marginBottom: 10,
        paddingHorizontal: 10,
        height: 40,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
        color: '#333',
        paddingVertical: 0,
    },
    clearSearchButton: {
        marginLeft: 8,
    },
    loadingIndicator: {
        marginTop: 50,
    },
    tabLoadingIndicator: {
        marginTop: 15,
        marginBottom: 10,
    },
    errorText: {
        width: '100%',
        textAlign: 'center',
        marginTop: 50,
        fontSize: 16,
        color: 'red',
        paddingHorizontal: 20,
    },
    errorTextSmall: {
        textAlign: 'center',
        paddingHorizontal: 20,
        fontSize: 14,
        color: 'red',
        marginTop: 10,
        marginBottom: 10,
    },
    tabScrollContainer: {
        height: 50,
        flexGrow: 0,
    },
    tabScrollContent: {
        paddingHorizontal: 20,
        alignItems: 'center',
    },
    tabButton: {
        backgroundColor: '#f5f5f5',
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 10,
    },
    tabButtonActive: {
        backgroundColor: '#e6f0ff',
        borderWidth: 1,
        borderColor: '#4285F4',
    },
    tabText: {
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
    },
    tabTextActive: {
        color: '#4285F4',
        fontWeight: 'bold',
    },
    paletteList: {
        paddingHorizontal: 20,
        paddingBottom: 50,
    },
    paletteItemContainer: {
        width: '50%',
        paddingHorizontal: 5,
        marginBottom: 15,
    },
    noDataText: {
        width: '100%',
        textAlign: 'center',
        marginTop: 50,
        fontSize: 16,
        color: '#999',
    },
    paletteListWrapper: {
        flex: 1,
    }
});

const modalStyles = StyleSheet.create({
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
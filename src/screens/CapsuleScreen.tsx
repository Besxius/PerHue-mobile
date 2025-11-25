import React, { useState, useMemo, useCallback } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    StatusBar,
    FlatList, // 💡 Sử dụng FlatList cho cả 2 danh sách
    Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import CustomHeader from '../components/CustomHeader';
import CapsulePalette from '../components/CapsulePalette';

// Lấy kích thước màn hình
const { width } = Dimensions.get('window');

// 💡 Dữ liệu MỚI cho các bảng màu và loại mùa
const SEASON_TYPES = [
    'Cool Winter',
    'Deep Winter',
    'Clear Winter',
    'Cool Summer',
    'Soft Summer',
    'Light Summer',
    'Warm Autumn',
    'Soft Autumn',
    'Deep Autumn',
    'Warm Spring',
    'Light Spring',
    'Clear Spring',
];

interface Palette {
    id: string;
    colors: [string, string, string, string];
    season: string;
}

const mockPalettes: Palette[] = [
    { id: 'cw1', season: 'Cool Winter', colors: ['#5F9EA0', '#D8BFD8', '#B0E0E6', '#90EE90'] },
    { id: 'cw2', season: 'Cool Winter', colors: ['#9932CC', '#DC143C', '#F08080', '#DDA0DD'] },
    { id: 'cw3', season: 'Cool Winter', colors: ['#BDB76B', '#FF7F50', '#87CEFA', '#F0E68C'] },
    { id: 'cw4', season: 'Cool Winter', colors: ['#BDB76B', '#FF7F50', '#87CEFA', '#F0E68C'] },
    { id: 'cw5', season: 'Cool Winter', colors: ['#BDB76B', '#FF7F50', '#87CEFA', '#F0E68C'] },
    { id: 'cw6', season: 'Cool Winter', colors: ['#BDB76B', '#FF7F50', '#87CEFA', '#F0E68C'] },
    { id: 'cw7', season: 'Cool Winter', colors: ['#BDB76B', '#FF7F50', '#87CEFA', '#F0E68C'] },
    { id: 'cw8', season: 'Cool Winter', colors: ['#BDB76B', '#FF7F50', '#87CEFA', '#F0E68C'] },
    { id: 'cw9', season: 'Cool Winter', colors: ['#BDB76B', '#FF7F50', '#87CEFA', '#F0E68C'] },
    { id: 'cw10', season: 'Cool Winter', colors: ['#BDB76B', '#FF7F50', '#87CEFA', '#F0E68C'] },
    { id: 'cw11', season: 'Cool Winter', colors: ['#BDB76B', '#FF7F50', '#87CEFA', '#F0E68C'] },
    { id: 'cw12', season: 'Cool Winter', colors: ['#BDB76B', '#FF7F50', '#87CEFA', '#F0E68C'] },
    { id: 'dw1', season: 'Deep Winter', colors: ['#5F014F', '#A31350', '#FCEECF', '#2E004F'] },
    { id: 'dw2', season: 'Deep Winter', colors: ['#1C2A48', '#8A2BE2', '#F08080', '#000080'] },
    { id: 'dw3', season: 'Deep Winter', colors: ['#4682B4', '#FFA07A', '#F0F8FF', '#4B0082'] },
    { id: 'clr1', season: 'Clear Winter', colors: ['#FF00FF', '#00FFFF', '#E6E6FA', '#00FA9A'] },
    { id: 'clr2', season: 'Clear Winter', colors: ['#C71585', '##FFD700', '#ADD8E6', '#FFB6C1'] },
    { id: 'clr3', season: 'Clear Winter', colors: ['#D2B48C', '#808000', '#8FBC8F', '#20B2AA'] },
    { id: 'cs1', season: 'Cool Summer', colors: ['#D6A8E8', '#F3F4F6', '#B0D3F8', '#7EC0EE'] },
    { id: 'cs2', season: 'Cool Summer', colors: ['#9DCFEE', '#E8F5FF', '#C4D8EE', '#B4D9FF'] },
    { id: 'cs3', season: 'Cool Summer', colors: ['#9DCFEE', '#E8F5FF', '#C4D8EE', '#B4D9FF'] },
    { id: 'cs4', season: 'Cool Summer', colors: ['#D6A8E8', '#F3F4F6', '#B0D3F8', '#7EC0EE'] },
    { id: 'cs5', season: 'Cool Summer', colors: ['#9DCFEE', '#E8F5FF', '#C4D8EE', '#B4D9FF'] },
];

const CapsuleScreen: React.FC<any> = ({ navigation }) => {
    const insets = useSafeAreaInsets();
    const [activeTab, setActiveTab] = useState(SEASON_TYPES[0]);
    const [selectedPalette, setSelectedPalette] = useState('');

    // Lọc danh sách bảng màu theo Tab đang hoạt động
    const filteredPalettes = useMemo(() => {
        return mockPalettes.filter(palette => palette.season === activeTab);
    }, [activeTab]);

    // Định nghĩa các hàm điều hướng (giữ nguyên)
    const navigateToPackageScreen = () => {
        navigation.navigate('PackageScreen');
    };
    const navigateToNotificationScreen = () => {
        navigation.navigate("NotificationScreen");
    };
    const navigateToSettingsScreen = () => {
        navigation.navigate("SettingScreen");
    };

    // 💡 HÀM RENDER ITEM CHO FLATLIST NGANG (Tab Selector)
    const renderTabItem = useCallback(({ item: tabName }: { item: string }) => {
        const isActive = activeTab === tabName;
        return (
            <TouchableOpacity
                style={[
                    styles.tabButton,
                    isActive && styles.tabButtonActive
                ]}
                onPress={() => setActiveTab(tabName)}
            >
                <Text
                    style={[
                        styles.tabText,
                        isActive && styles.tabTextActive
                    ]}
                >
                    {tabName}
                </Text>
            </TouchableOpacity>
        );
    }, [activeTab]); // Phụ thuộc vào activeTab để render lại khi trạng thái thay đổi

    // 💡 HÀM RENDER ITEM CHO FLATLIST DỌC (Palette List)
    const renderPaletteItem = useCallback(({ item }: { item: Palette }) => {
        return (
            <View style={styles.paletteItemContainer}>
                <CapsulePalette
                    colors={item.colors}
                    isSelected={selectedPalette === item.id}
                    onSelect={() => setSelectedPalette(item.id)}
                />
            </View>
        );
    }, [selectedPalette]);

    // Component hiển thị khi danh sách trống
    const renderEmptyComponent = () => (
        <Text style={styles.noDataText}>
            Chưa có bảng màu nào cho "{activeTab}".
        </Text>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />

            {/* 1. CustomHeader (giữ nguyên) */}
            <CustomHeader
                title='Capsule palette'
                onNavigateToPackage={navigateToPackageScreen}
                onNavigateToNotification={navigateToNotificationScreen}
            // onNavigateToSettings={navigateToSettingsScreen}
            />

            {/* 2. Thanh Tab Selector Cuộn Ngang - SỬ DỤNG FLATLIST */}
            <FlatList
                horizontal
                data={SEASON_TYPES}
                renderItem={renderTabItem}
                keyExtractor={(item) => item}
                showsHorizontalScrollIndicator={false}
                style={styles.tabScrollContainer} // Dùng để giới hạn chiều cao
                contentContainerStyle={styles.tabScrollContent} // Dùng để thêm padding
            />

            {/* 3. Vùng hiển thị các Bảng màu (FlatList Dọc) */}
            <FlatList
                data={filteredPalettes}
                renderItem={renderPaletteItem}
                keyExtractor={(item) => item.id}
                numColumns={2}
                style={styles.paletteListWrapper}
                contentContainerStyle={styles.paletteList}
                ListEmptyComponent={renderEmptyComponent}
                showsVerticalScrollIndicator={false}
                // Thêm padding cho phần cuối của FlatList để tránh Tab Bar
                ListFooterComponent={<View style={{ height: 60 + insets.bottom }} />}
            />

            {/* ⚠️ Đã loại bỏ View đệm dưới cùng vì nó đã được tích hợp vào ListFooterComponent của FlatList */}
        </View>
    );
}

export default CapsuleScreen;

// Style chung cho màn hình
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    // 2. Tab Selector FlatList
    tabScrollContainer: {
        height: 50,
        flexGrow: 0,
    },
    tabScrollContent: {
        paddingHorizontal: 20,
        alignItems: 'center', // Canh giữa các nút bấm theo chiều dọc
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
    // Style cho FlatList Dọc Content Container
    paletteList: {
        paddingHorizontal: 20,
        paddingBottom: 50, // Padding đáy mặc định
        justifyContent: 'space-between',
    },
    // Style cho từng item (Đảm bảo item chiếm đúng 50% chiều rộng trừ đi padding)
    paletteItemContainer: {
        width: '50%',
        paddingHorizontal: 5,
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
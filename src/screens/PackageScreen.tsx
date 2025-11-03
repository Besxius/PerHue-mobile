import React, { useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    Image,
    StyleSheet,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import CustomTabBar from '../components/CustomTabBar';
// --- DATA MOCK ---
interface Package {
    id: number;
    title: string;
    count: number;
    description: string;
    isChecked?: boolean;
}

const aiTestPackages: Package[] = [
    {
        id: 1,
        title: 'AI Test 1',
        count: 3,
        description:
            'Lorem ipsum dolor sit amet, consectetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore',
        // isChecked: true,
    },
    {
        id: 2,
        title: 'AI Test 2',
        count: 10,
        description:
            'Lorem ipsum dolor sit amet, consectetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore',
    },
    {
        id: 3,
        title: 'AI Test 3',
        count: 5,
        description:
            'Lorem ipsum dolor sit amet, consectetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore',
    },
];

const expertPackages: Package[] = [
    {
        id: 1,
        title: 'Expert Suggestion 1',
        count: 3,
        description:
            'Lorem ipsum dolor sit amet, consectetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore',
        // isChecked: true,
    },
    {
        id: 2,
        title: 'Expert Suggestion 2',
        count: 10,
        description:
            'Lorem ipsum dolor sit amet, consectetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore',
    },
    {
        id: 3,
        title: 'Expert Suggestion 3',
        count: 5,
        description:
            'Lorem ipsum dolor sit amet, consectetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore',
    },
];

interface PackageItemProps {
    pkg: Package;
    style?: object;
}

const PackageItem: React.FC<PackageItemProps> = ({ pkg, style }) => (
    <View style={[styles.packageCard, style]}>
        <View style={styles.iconCircle}>
            <Text style={styles.circleNumber}>{pkg.count}</Text>
            {pkg.isChecked && (
                <View style={styles.checkMark}>
                    <Feather name="check-circle" size={20} color="#3b82f6" />
                </View>
            )}
        </View>
        <Text style={styles.packageTitle}>{pkg.title}</Text>
        <Text style={styles.packageDescription}>{pkg.description}</Text>
    </View>
);

const chunkPackages = (packages: Package[], size: number) => {
    const chunked: Package[][] = [];
    for (let i = 0; i < packages.length; i += size) {
        chunked.push(packages.slice(i, i + size));
    }
    return chunked;
};


const PackageScreen: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'AI Test' | 'Expert suggestion'>(
        'AI Test'
    );

    const aiTestRows = chunkPackages(aiTestPackages, 2);
    const expertRows = chunkPackages(expertPackages, 2);

    const renderPackages = (packages: Package[][]) => {
        return packages.map((row, index) => (
            <View key={index} style={styles.cardRow}>
                {row.map((pkg, pkgIndex) => (
                    // Mỗi package chiếm flex: 1 để đảm bảo chia đều trong View row
                    <PackageItem
                        key={pkg.id}
                        pkg={pkg}
                        style={{ flex: 1 }}
                    />
                ))}
                {/* Nếu hàng chỉ có 1 phần tử, thêm một View rỗng để căn chỉnh */}
                {row.length === 1 && <View style={{ flex: 1 }} />}
            </View>
        ));
    };

    return (
        <View style={styles.container}>
            {/* Tab Bar */}
            <View style={styles.tabBar}>
                <TouchableOpacity
                    style={[
                        styles.tabButton,
                        activeTab === 'AI Test' && styles.tabButtonActive,
                    ]}
                    onPress={() => setActiveTab('AI Test')}>
                    <Text
                        style={[
                            styles.tabText,
                            activeTab === 'AI Test' && styles.tabTextActive,
                        ]}>
                        AI Test
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[
                        styles.tabButton,
                        activeTab === 'Expert suggestion' && styles.tabButtonActive,
                    ]}
                    onPress={() => setActiveTab('Expert suggestion')}>
                    <Text
                        style={[
                            styles.tabText,
                            activeTab === 'Expert suggestion' && styles.tabTextActive,
                        ]}>
                        Expert suggestion
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Main Content (Packages) */}
            <ScrollView
                style={styles.mainContent}
                showsVerticalScrollIndicator={false}>
                {activeTab === 'AI Test' ? (
                    renderPackages(aiTestRows)
                ) : (
                    renderPackages(expertRows)
                )}
            </ScrollView>

            {/* Bottom Navigation */}
            <View>
                <CustomTabBar activeTab="home" onTabPress={() => { }} />
            </View>
        </View>
    );
};

// --- STYLESHEET ---

const BLUE_COLOR = '#3b82f6';

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },

    // --- Header Styles ---
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 10,
        paddingHorizontal: 15,
        borderBottomWidth: 0.5,
        borderBottomColor: '#eee',
    },
    profileContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 10,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#000',
    },
    iconGroup: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerIcon: {
        marginLeft: 15,
    },

    // --- Tab Bar Styles ---
    tabBar: {
        flexDirection: 'row',
        padding: 10,
        paddingHorizontal: 15,
        justifyContent: 'center',
        alignItems: 'center',
    },
    tabButton: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: 'transparent',
        marginHorizontal: 5,
    },
    tabButtonActive: {
        backgroundColor: '#f0f0f0',
    },
    tabText: {
        textAlign: 'center',
        fontSize: 16,
        fontWeight: '600',
        color: '#888',
    },
    tabTextActive: {
        color: '#000',
    },
    tabTextExpert: {
        color: BLUE_COLOR,
    },

    // --- Main Content & Package Card Styles ---
    mainContent: {
        paddingVertical: 10,
    },
    cardRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: 10,
    },
    packageCard: {
        alignItems: 'center',
        marginBottom: 30,
        maxWidth: '50%', // Giới hạn chiều rộng
    },
    iconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 3,
        borderColor: BLUE_COLOR,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
        position: 'relative',
    },
    circleNumber: {
        fontSize: 24,
        fontWeight: 'bold',
        color: BLUE_COLOR,
    },
    checkMark: {
        position: 'absolute',
        top: 0,
        right: 0,
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 2,
    },
    packageTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#000',
        marginBottom: 5,
        textAlign: 'center',
    },
    packageDescription: {
        fontSize: 14,
        color: '#555',
        textAlign: 'center',
        maxWidth: 200, // Đảm bảo mô tả không quá dài
    },

    // --- Bottom Bar Styles ---
    bottomBar: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        height: 60,
        borderTopWidth: 0.5,
        borderTopColor: '#ccc',
    },
    bottomIcon: {
        padding: 10,
    },
});

export default PackageScreen;
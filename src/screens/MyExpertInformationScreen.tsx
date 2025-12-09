import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    ScrollView,
    ActivityIndicator,
    TouchableOpacity,
    Linking
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { getExpertInformation } from '../api/expertApi';
import { ExpertInfo } from '../types/dataModels';

type Props = NativeStackScreenProps<RootStackParamList, 'MyExpertInformationScreen'>;

const MyExpertInformationScreen: React.FC<Props> = ({ navigation }) => {
    const insets = useSafeAreaInsets();
    const [expertInfo, setExpertInfo] = useState<ExpertInfo | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchExpertInfo = async () => {
            try {
                setIsLoading(true);
                const data = await getExpertInformation();
                setExpertInfo(data);
            } catch (err) {
                console.error("Failed to load expert info:", err);
                setError("Không thể tải thông tin chuyên gia.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchExpertInfo();
    }, []);

    const openLink = (url: string | null) => {
        if (url) {
            Linking.openURL(url).catch(err => console.error("Couldn't load page", err));
        }
    };

    if (isLoading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#4C7BE2" />
                <Text style={styles.loadingText}>Đang tải hồ sơ chuyên gia...</Text>
            </View>
        );
    }

    if (error || !expertInfo) {
        return (
            <View style={styles.centered}>
                <Text style={styles.errorText}>{error || "Không tìm thấy thông tin."}</Text>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Text style={styles.backButtonText}>Quay lại</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>My Expert Profile</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {/* Profile Header */}
                <View style={styles.profileHeader}>
                    <Image
                        source={{ uri: expertInfo.profilePicture || expertInfo.idNavigation?.profilepicture || 'https://via.placeholder.com/150' }}
                        style={styles.avatar}
                    />
                    <Text style={styles.name}>{expertInfo.nickname || expertInfo.idNavigation?.fullname}</Text>
                    <Text style={styles.specialization}>{expertInfo.specialization}</Text>

                    <View style={styles.ratingBadge}>
                        <Ionicons name="star" size={16} color="#FFD700" />
                        <Text style={styles.ratingText}>{expertInfo.rating.toFixed(1)} Rating</Text>
                        <Text style={styles.expText}>• {expertInfo.yearsOfExperience} Years Exp</Text>
                    </View>
                </View>

                {/* Details Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>About Me</Text>
                    <Text style={styles.bodyText}>{expertInfo.bio}</Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Introduction</Text>
                    <Text style={styles.bodyText}>{expertInfo.introduction}</Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Professional Info</Text>
                    <View style={styles.infoRow}>
                        <MaterialCommunityIcons name="translate" size={20} color="#666" />
                        <Text style={styles.infoText}>Languages: {expertInfo.languages}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <MaterialCommunityIcons name="certificate" size={20} color="#666" />
                        <Text style={styles.infoText}>Certification: {expertInfo.certification}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <MaterialCommunityIcons name="email-outline" size={20} color="#666" />
                        <Text style={styles.infoText}>{expertInfo.email}</Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Social Media</Text>
                    <View style={styles.socialRow}>
                        {expertInfo.facebookAccount && (
                            <TouchableOpacity onPress={() => openLink(expertInfo.facebookAccount)} style={styles.socialBtn}>
                                <FontAwesome5 name="facebook" size={24} color="#1877F2" />
                            </TouchableOpacity>
                        )}
                        {expertInfo.linkedInAccount && (
                            <TouchableOpacity onPress={() => openLink(expertInfo.linkedInAccount)} style={styles.socialBtn}>
                                <FontAwesome5 name="linkedin" size={24} color="#0A66C2" />
                            </TouchableOpacity>
                        )}
                        {expertInfo.instagramAccount && (
                            <TouchableOpacity onPress={() => openLink(expertInfo.instagramAccount)} style={styles.socialBtn}>
                                <FontAwesome5 name="instagram" size={24} color="#C13584" />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f9f9f9' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 10, color: '#666' },
    errorText: { color: 'red', marginBottom: 20 },
    backButton: { padding: 10, backgroundColor: '#eee', borderRadius: 8 },
    backButtonText: { fontWeight: 'bold' },

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 15,
        paddingVertical: 10,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    headerBtn: { padding: 5 },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },

    content: { padding: 20 },

    profileHeader: {
        alignItems: 'center',
        marginBottom: 20,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        marginBottom: 10,
        borderWidth: 2,
        borderColor: '#4C7BE2',
    },
    name: { fontSize: 22, fontWeight: 'bold', color: '#333' },
    specialization: { fontSize: 16, color: '#4C7BE2', fontWeight: '600', marginTop: 2 },
    ratingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        marginTop: 10,
        elevation: 1,
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2,
    },
    ratingText: { marginLeft: 5, fontWeight: 'bold', color: '#333' },
    expText: { marginLeft: 5, color: '#666' },

    section: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 15,
        marginBottom: 15,
        elevation: 1,
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2,
    },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 10 },
    bodyText: { fontSize: 14, color: '#555', lineHeight: 22 },

    infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    infoText: { marginLeft: 10, fontSize: 14, color: '#555' },

    socialRow: { flexDirection: 'row', gap: 20 },
    socialBtn: { padding: 5 },
});

export default MyExpertInformationScreen;
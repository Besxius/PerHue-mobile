import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    Image,
    TouchableOpacity,
    Dimensions,
    StatusBar,
    Linking,
    ActivityIndicator,
    ImageSourcePropType,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, Feather, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { RootStackParamList } from '../navigation/AppNavigator';
import { ExpertInfo } from '../types/dataModels';
import { getExpertById } from '../api/expertApi';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

const DEFAULT_MAN_AVATAR = require('../assets/avatar/men/men.png');
const DEFAULT_WOMAN_AVATAR = require('../assets/avatar/women/women.png');

type ExpertDetailScreenProps = NativeStackScreenProps<RootStackParamList, 'ExpertDetailScreen'>;

const openLink = (url: string | null) => {
    if (url) {
        Linking.openURL(url).catch((err) => console.error("Couldn't open link", err));
    }
};

const ExpertDetailScreen: React.FC<ExpertDetailScreenProps> = ({ route, navigation }) => {
    const insets = useSafeAreaInsets();

    const expertId = route.params?.expert?.id;

    const [expertData, setExpertData] = useState<ExpertInfo | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const [isBioExpanded, setIsBioExpanded] = useState(false);
    const [isServicesExpanded, setIsServicesExpanded] = useState(false);

    useEffect(() => {
        if (!expertId) {
            setError("Không tìm thấy ID chuyên gia.");
            setIsLoading(false);
            return;
        }

        const fetchExpert = async () => {
            try {
                setIsLoading(true);
                const data = await getExpertById(expertId);
                setExpertData(data);
                setError(null);
            } catch (e) {
                console.error(`Failed to fetch expert ${expertId}:`, e);
                setError("Không thể tải thông tin chi tiết chuyên gia. Vui lòng kiểm tra kết nối.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchExpert();
    }, [expertId]);

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#3B82F6" />
                <Text style={{ marginTop: 10 }}>Đang tải hồ sơ chuyên gia...</Text>
            </View>
        );
    }

    if (error || !expertData) {
        return (
            <View style={styles.loadingContainer}>
                <Text style={styles.errorText}>Lỗi: {error || "Không tìm thấy dữ liệu chuyên gia."}</Text>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.requestButton}>
                    <Text style={styles.requestButtonText}>Quay lại</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const expert = expertData;

    const displayName = expert.idNavigation?.fullname || expert.nickname;

    const gender = expert.idNavigation?.gender;
    let pronounText = '(They/Them)';

    if (gender !== undefined && gender !== null) {
        pronounText = gender === true ? '(He/Him)' : '(She/Her)';
    }

    let profileImageSource: ImageSourcePropType;

    if (expert.profilePicture) {
        profileImageSource = { uri: expert.profilePicture };
    } else if (expert.idNavigation?.profilepicture) {
        profileImageSource = { uri: expert.idNavigation.profilepicture };
    } else {
        const isMale = gender === true;
        profileImageSource = isMale ? DEFAULT_MAN_AVATAR : DEFAULT_WOMAN_AVATAR;
    }

    const fullBioText = `${expert.bio}`;
    const fullServicesText = `${expert.introduction}`;


    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

            {/* Custom Back Button & Share Button */}
            <View style={[styles.absoluteHeader, { paddingTop: insets.top + 5 }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                {/* <TouchableOpacity>
                    <Ionicons name="share-outline" size={24} color="#fff" />
                </TouchableOpacity> */}
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.headerContainer}>
                    <LinearGradient
                        colors={['#4c669f', '#3b5998', '#192f6a']}
                        style={styles.coverGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    />

                    <View style={styles.profileSection}>
                        <View style={styles.avatarWrapper}>
                            <Image
                                source={profileImageSource}
                                style={styles.avatar}
                            />
                        </View>

                        <View style={styles.nameContainer}>
                            <Text style={styles.nameText}>{displayName}</Text>
                            <Text style={styles.pronounText}>{pronounText}</Text>
                        </View>

                        <Text style={styles.titleText}>{expert.specialization}</Text>

                        <View style={styles.locationContainer}>
                            <Feather name="message-square" size={14} color="#666" />
                            <Text style={styles.locationText}>{expert.languages}</Text>
                        </View>

                        <Text style={styles.connectionsText}>
                            {expert.rating.toFixed(1)} <Ionicons name="star" size={14} color="#FFD700" /> Rating • {expert.yearsOfExperience} years of experience
                        </Text>



                        <View style={styles.buttonGroup}>
                            <TouchableOpacity
                                style={styles.messageButton}
                                onPress={() => openLink(`mailto:${expert.email}`)}
                            >
                                <Feather name="mail" size={18} color="white" />
                                <Text style={styles.messageButtonText}>Send Email</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Introduction</Text>
                    <Text
                        style={styles.bodyText}
                        numberOfLines={isServicesExpanded ? 0 : 2}
                    >
                        {fullServicesText}
                    </Text>
                    <TouchableOpacity onPress={() => setIsServicesExpanded(!isServicesExpanded)}>
                        <Text style={styles.seeMoreText}>
                            {isServicesExpanded ? '...see less' : '...see more'}
                        </Text>
                    </TouchableOpacity>

                    {/* <TouchableOpacity style={styles.requestButton}>
                        <Text style={styles.requestButtonText}>Request services</Text>
                    </TouchableOpacity> */}
                </View>

                <View style={styles.card}>
                    <Text style={styles.cardTitle}>About</Text>
                    <Text
                        style={styles.bodyText}
                        numberOfLines={isBioExpanded ? 0 : 4}
                    >
                        {fullBioText}
                    </Text>
                    <TouchableOpacity onPress={() => setIsBioExpanded(!isBioExpanded)}>
                        <Text style={styles.seeMoreText}>
                            {isBioExpanded ? '...see less' : '...see more'}
                        </Text>
                    </TouchableOpacity>

                    {/* <View style={styles.skillCard}>
                        <View style={styles.skillIcon}>
                            <MaterialCommunityIcons name="diamond" size={20} color="#3B82F6" />
                        </View>
                        <View style={styles.skillContent}>
                            <Text style={styles.skillTitle}>Top skills</Text>
                            <Text style={styles.skillBody}>
                                {skills.slice(0, 3).join(' • ')}...
                            </Text>
                            <Text style={styles.skillBodySmall}>
                                Certification: **{expert.certification}**
                            </Text>
                        </View>
                        <Ionicons name="arrow-forward" size={24} color="#3B82F6" />
                    </View> */}
                </View>

                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Contact & Info</Text>
                    <View style={styles.infoRow}>
                        <Feather name="mail" size={18} color="#666" />
                        <Text style={styles.infoText}>Email: {expert.email}</Text>
                    </View>

                    <View style={styles.socialGroupHeader}>
                        {expert.facebookAccount && (
                            <TouchableOpacity style={styles.socialButton} onPress={() => openLink(expert.facebookAccount)}>
                                <FontAwesome5 name="facebook" size={24} color="#1877F2" />
                            </TouchableOpacity>
                        )}
                        {expert.linkedInAccount && (
                            <TouchableOpacity style={styles.socialButton} onPress={() => openLink(expert.linkedInAccount)}>
                                <FontAwesome5 name="linkedin" size={24} color="#0A66C2" />
                            </TouchableOpacity>
                        )}
                        {expert.instagramAccount && (
                            <TouchableOpacity style={styles.socialButton} onPress={() => openLink(expert.instagramAccount)}>
                                <FontAwesome5 name="instagram" size={24} color="#C13584" />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                <View style={{ height: 50 }} />
            </ScrollView>
        </View>
    );
};

export default ExpertDetailScreen;

// **********************************
// STYLES (Cập nhật coverGradient và avatarWrapper)
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f0f2f5',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    errorText: {
        color: 'red',
        fontSize: 16,
        marginBottom: 20,
        textAlign: 'center',
        paddingHorizontal: 20,
    },
    absoluteHeader: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 15,
        paddingBottom: 10,
    },
    backButton: {
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: 20,
        padding: 5,
    },
    headerContainer: {
        backgroundColor: '#fff',
        marginBottom: 8,
    },
    // CẬP NHẬT: Thêm style cho gradient cover
    coverGradient: {
        width: '100%',
        height: 150,
        // Không cần resizeMode cho gradient
    },
    profileSection: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    // CẬP NHẬT: Thêm wrapper cho avatar với nền trắng
    avatarWrapper: {
        width: 108, // 100 (avatar) + 2*4 (border) = 108, hoặc 100 + 2*margin/padding
        height: 108,
        borderRadius: 54, // 108 / 2
        backgroundColor: '#fff', // Nền trắng
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: -50, // Vẫn giữ vị trí lên trên
        marginBottom: 10,
        // Có thể thêm shadow nếu muốn
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 5,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 2, // Giảm border của avatar để viền trắng rõ hơn
        borderColor: '#eee', // Màu viền của avatar
    },
    nameContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    nameText: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
    },
    pronounText: {
        fontSize: 14,
        color: '#666',
        marginLeft: 5,
    },
    titleText: {
        fontSize: 16,
        color: '#444',
        marginTop: 2,
    },
    locationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 5,
    },
    locationText: {
        fontSize: 14,
        color: '#666',
        marginLeft: 5,
        fontWeight: '500',
    },
    contactInfoText: {
        fontSize: 14,
        color: '#3B82F6',
        fontWeight: '500',
    },
    connectionsText: {
        fontSize: 14,
        color: '#333',
        fontWeight: '600',
        marginTop: 5,
        marginBottom: 15,
    },
    buttonGroup: {
        flexDirection: 'row',
        marginTop: 15,
    },
    messageButton: {
        flexDirection: 'row',
        backgroundColor: '#3B82F6',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 25,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },
    messageButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
        marginLeft: 8,
    },
    moreButton: {
        borderWidth: 1,
        borderColor: '#3B82F6',
        paddingHorizontal: 25,
        paddingVertical: 10,
        borderRadius: 25,
        alignItems: 'center',
        justifyContent: 'center',
    },
    moreButtonText: {
        color: '#3B82F6',
        fontWeight: 'bold',
        fontSize: 16,
    },
    card: {
        backgroundColor: '#fff',
        padding: 20,
        marginBottom: 8,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
    },
    bodyText: {
        fontSize: 14,
        color: '#555',
        lineHeight: 22,
    },
    seeMoreText: {
        color: '#3B82F6',
        marginTop: 5,
        marginBottom: 15,
        fontWeight: '600',
    },
    skillCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f8f8',
        borderRadius: 10,
        padding: 15,
        marginTop: 10,
        justifyContent: 'space-between',
    },
    skillIcon: {
        marginRight: 15,
    },
    skillContent: {
        flex: 1,
        marginRight: 10,
    },
    skillTitle: {
        fontWeight: 'bold',
        color: '#333',
        fontSize: 16,
        marginBottom: 4,
    },
    skillBody: {
        fontSize: 14,
        color: '#555',
    },
    skillBodySmall: {
        fontSize: 12,
        color: '#777',
        marginTop: 4,
    },
    servicesList: {
        fontSize: 14,
        fontWeight: '600',
        color: '#444',
        marginBottom: 15,
    },
    requestButton: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#3B82F6',
        borderRadius: 25,
        paddingVertical: 10,
        alignItems: 'center',
        marginTop: 10,
    },
    requestButtonText: {
        color: '#3B82F6',
        fontWeight: 'bold',
        fontSize: 16,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    infoText: {
        fontSize: 14,
        color: '#555',
        marginLeft: 10,
    },
    socialGroupHeader: {
        flexDirection: 'row',
        marginBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        paddingBottom: 10,
    },
    socialButton: {
        marginRight: 20,
    }
});
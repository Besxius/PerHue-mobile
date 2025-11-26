import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Alert,
    Modal,
    TouchableWithoutFeedback,
    Linking, // Import Linking cho Deep Link Listener
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, AntDesign, MaterialCommunityIcons } from '@expo/vector-icons';
// Giả định các import API và Types này đã tồn tại
import { PaymentCallbackParams, ServicePackage } from '../types/dataModels';
import { getServicePackage } from '../api/dataApi';
import WebView from 'react-native-webview';
import { getPaymentLink, getPaymentSuccess, getPaymentCancel } from '../api/paymentApi';

interface PackageUI extends ServicePackage {
    isAITest: boolean;
    isExpert: boolean;
    isChecked?: boolean;
}

interface PackageItemProps {
    pkg: PackageUI;
    style?: object;
    onPress: (pkg: PackageUI) => void;
}

const BLUE_COLOR = '#3b82f6';

const formatPrice = (price: number): string => {
    if (price === 0) {
        return 'Miễn phí';
    }
    return `${price.toLocaleString('vi-VN')}₫`;
};

interface PaymentModalProps {
    visible: boolean;
    packageDetails: PackageUI | null;
    onClose: (refetchData?: boolean) => void; // Thêm tham số refetchData
    onDeepLinkDetected: (url: string) => void; // Thêm prop để báo Deep Link đã được phát hiện
}


// =========================================================
// PAYMENT MODAL COMPONENT
// =========================================================
const PaymentModal: React.FC<PaymentModalProps> = ({ visible, packageDetails, onClose, onDeepLinkDetected }) => {
    // =========================================================
    // HOOKS
    // =========================================================
    const [paymentLink, setPaymentLink] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isWebViewOpen, setIsWebViewOpen] = useState(false);
    const [isLoadingWebView, setIsLoadingWebView] = useState(true);

    const APP_SCHEME = 'perhue'; // Deep Link Schema

    // Hàm xử lý Deep Link và gọi API xác nhận
    const handleDeepLinkProcessing = useCallback(async (url: string) => {
        console.log('Processing Deep Link:', url);

        // Ngăn chặn gọi API nếu không có package
        if (!packageDetails) return;

        // Tách URL để lấy path và Query String
        const urlParts = url.split('?');
        const fullPath = urlParts[0].replace(`${APP_SCHEME}://`, '');
        const isSuccess = fullPath.includes('success');

        // ✨ BƯỚC 1: Lọc bỏ các Deep Link không liên quan đến thanh toán (ví dụ: expo-development-client)
        if (!fullPath.startsWith('payment/')) {
            console.log('Deep Link bị bỏ qua do không phải kết quả thanh toán.');
            return;
        }

        // Đóng WebView nếu nó còn mở (quan trọng để ứng dụng hiển thị)
        setIsWebViewOpen(false);

        let params: PaymentCallbackParams = { code: '', id: '', cancel: false, status: '', orderCode: '', packageId: 0 };

        try {
            // Sử dụng URLSearchParams an toàn hơn
            const query = new URLSearchParams(urlParts[1]);

            params = {
                code: query.get('code') || '',
                id: query.get('id') || '',
                cancel: query.get('cancel') === 'true',
                status: query.get('status') || '',
                orderCode: query.get('orderCode') || '',
                packageId: packageDetails.id,
            };

            console.log('Parsed Callback Params:', params);

            // ✨ BƯỚC 2: Kiểm tra tính hợp lệ tối thiểu của tham số trước khi gọi API
            if (!params.code && !params.id && !params.orderCode) {
                throw new Error("Tham số Deep Link không hợp lệ hoặc bị thiếu.");
            }

            let apiResult;
            if (isSuccess) {
                apiResult = await getPaymentSuccess(params);
                Alert.alert('Thành Công', apiResult.message || 'Thanh toán thành công. Dịch vụ đã được kích hoạt!', [{ text: 'OK', onPress: () => onClose(true) }]);
            } else {
                apiResult = await getPaymentCancel(params);
                Alert.alert('Đã Hủy', apiResult.message || 'Giao dịch đã bị hủy hoặc không thành công.', [{ text: 'OK', onPress: () => onClose(false) }]);
            }

        } catch (e) {
            console.error('Lỗi khi phân tích hoặc gọi API xử lý Deep Link:', e);
            Alert.alert('Lỗi Xử Lý', 'Không thể xác nhận kết quả thanh toán. Vui lòng kiểm tra lại trạng thái.', [{ text: 'OK', onPress: () => onClose(false) }]);
        }

    }, [packageDetails, onClose]);


    // HÀM XỬ LÝ CHẶN TẢI URL TRONG WEBVIEW
    const handleShouldStartLoad = useCallback((request: any): boolean => {
        const url = request.url;
        console.log('onShouldStartLoadWithRequest URL:', url);
        getPaymentSuccess
        // Bắt Deep Link: Nếu URL bắt đầu bằng Scheme của ứng dụng
        if (url.startsWith(`${APP_SCHEME}://`)) {
            console.log('Deep Link Intercepted in WebView:', url);

            // 1. Gửi URL ra ngoài để xử lý
            onDeepLinkDetected(url);

            // 2. Kích hoạt xử lý API trực tiếp trong modal (vì nó đang mở)
            handleDeepLinkProcessing(url);

            // 3. Ngăn WebView tải URL này
            return false;
        }

        // 4. Cho phép WebView tiếp tục tải các URL khác (trang thanh toán PayOS)
        return true;
    }, [onDeepLinkDetected, handleDeepLinkProcessing]);


    // Hàm gọi API lấy link và mở WebView (Giữ nguyên)
    const handleCheckout = useCallback(async () => {
        if (!packageDetails) return;

        if (packageDetails.price === 0) {
            Alert.alert('Kích hoạt gói', `Bạn đã kích hoạt gói "${packageDetails.name}" miễn phí.`);
            onClose(true); // Cần refetch data sau khi kích hoạt miễn phí
            return;
        }

        setIsProcessing(true);
        setPaymentLink(null);

        try {
            const link = await getPaymentLink(packageDetails.id);
            setPaymentLink(link);
            setIsWebViewOpen(true);
            setIsLoadingWebView(true);
        } catch (error) {
            Alert.alert('Lỗi Thanh Toán', 'Không thể tạo đường dẫn thanh toán. Vui lòng thử lại.');
            console.error(error);
            onClose(false);
        } finally {
            setIsProcessing(false);
        }
    }, [packageDetails, onClose]);

    // Lắng nghe sự kiện Deep Link được phát hiện từ bên ngoài (từ App)
    useEffect(() => {
        if (visible) {
            // Thiết lập listener Deep Link toàn cục (cho trường hợp thoát WebView)
            const handleLinkingEvent = ({ url }: { url: string }) => {
                if (url && url.startsWith(`${APP_SCHEME}://`)) {
                    console.log('Global Deep Link Detected:', url);
                    handleDeepLinkProcessing(url);
                }
            };

            // Xử lý Deep Link khi ứng dụng được mở qua Deep Link
            Linking.getInitialURL().then(url => {
                if (url && url.startsWith(`${APP_SCHEME}://`)) {
                    handleDeepLinkProcessing(url);
                }
            });

            const subscription = Linking.addEventListener('url', handleLinkingEvent);

            return () => {
                subscription.remove();
            };
        }
    }, [visible, handleDeepLinkProcessing]);

    // =========================================================
    // KẾT THÚC CÁC HOOKS

    if (!packageDetails) return null;

    // --- Giao diện WebView ---
    if (isWebViewOpen && paymentLink) {
        return (
            <Modal
                animationType="slide"
                transparent={false}
                visible={isWebViewOpen}
                // XỬ LÝ HỦY: Bắt nút back vật lý/yêu cầu đóng
                onRequestClose={() => {
                    Alert.alert(
                        'Xác nhận Hủy',
                        'Giao dịch thanh toán chưa hoàn tất. Bạn có muốn hủy?',
                        [
                            { text: 'Tiếp tục', style: 'cancel', onPress: () => setIsWebViewOpen(true) },
                            { text: 'Hủy giao dịch', onPress: () => onClose(false), style: 'destructive' },
                        ]
                    );
                }}
            >
                <SafeAreaView style={{ flex: 1 }}>
                    <View style={modalStyles.webViewHeader}>
                        <TouchableOpacity
                            onPress={() => {
                                setIsWebViewOpen(false); // Đóng tạm thời
                                Alert.alert(
                                    'Xác nhận Hủy',
                                    'Bạn có chắc chắn muốn hủy giao dịch đang tiến hành?',
                                    [
                                        { text: 'Tiếp tục thanh toán', style: 'cancel', onPress: () => setIsWebViewOpen(true) },
                                        { text: 'Hủy giao dịch', onPress: () => onClose(false), style: 'destructive' },
                                    ]
                                );
                            }}
                            style={modalStyles.closeButton}>
                            <AntDesign name="close" size={24} color="#333" />
                        </TouchableOpacity>
                        <Text style={modalStyles.webViewHeaderText}>Thanh toán PayOS</Text>
                        <View style={{ width: 34 }} />
                    </View>

                    {/* Hiển thị Loading indicator nếu đang tải */}
                    {isLoadingWebView && (
                        <View style={StyleSheet.absoluteFill} pointerEvents="none">
                            <ActivityIndicator size="large" color={BLUE_COLOR} style={{ flex: 1, marginTop: 50 }} />
                        </View>
                    )}

                    <WebView
                        source={{ uri: paymentLink }}
                        // Sử dụng onShouldStartLoadWithRequest
                        onShouldStartLoadWithRequest={handleShouldStartLoad}
                        onLoadEnd={() => setIsLoadingWebView(false)} // Ẩn loading khi trang PayOS load xong
                        startInLoadingState={true}
                        style={{ flex: 1 }}
                    />
                </SafeAreaView>
            </Modal>
        );
    }

    // Giao diện xác nhận cuối cùng
    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={() => onClose(false)}
        >
            <TouchableWithoutFeedback onPress={() => onClose(false)}>
                <View style={modalStyles.overlay}>
                    <TouchableWithoutFeedback>
                        <View style={modalStyles.modalContainer}>
                            <View style={modalStyles.header}>
                                <Text style={modalStyles.headerText}>Xác nhận thanh toán</Text>
                                <TouchableOpacity onPress={() => onClose(false)} style={modalStyles.closeButton}>
                                    <AntDesign name="close" size={24} color="#333" />
                                </TouchableOpacity>
                            </View>

                            <ScrollView style={modalStyles.content}>
                                {/* Chi tiết gói */}
                                <View style={modalStyles.packageInfo}>
                                    <Text style={modalStyles.packageName}>{packageDetails.name}</Text>
                                    <Text style={modalStyles.packagePrice}>{formatPrice(packageDetails.price)}</Text>
                                    <Text style={modalStyles.packageDescription}>
                                        {packageDetails.description.replace(/\r\n/g, ' ')}
                                    </Text>
                                </View>

                                <View style={modalStyles.divider} />

                                <Text style={modalStyles.sectionTitle}>Phương thức thanh toán</Text>
                                <View style={modalStyles.infoBox}>
                                    <MaterialCommunityIcons name="link-variant" size={24} color={BLUE_COLOR} />
                                    <Text style={modalStyles.infoText}>
                                        Hệ thống sẽ chuyển bạn đến cổng thanh toán PayOS (Momo, Thẻ, Ngân hàng,...) để hoàn tất giao dịch.
                                    </Text>
                                </View>

                                {isProcessing && (
                                    <ActivityIndicator size="small" color={BLUE_COLOR} style={{ marginVertical: 10 }} />
                                )}

                            </ScrollView>

                            {/* Footer Checkout */}
                            <View style={modalStyles.footer}>
                                <TouchableOpacity style={modalStyles.cancelBtn} onPress={() => onClose(false)} disabled={isProcessing}>
                                    <Text style={modalStyles.cancelBtnText}>Hủy</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[modalStyles.checkoutBtn, isProcessing && { opacity: 0.7 }]}
                                    onPress={handleCheckout}
                                    disabled={isProcessing}
                                >
                                    <Text style={modalStyles.checkoutBtnText}>
                                        {isProcessing
                                            ? 'Đang tạo link...'
                                            : packageDetails.price === 0
                                                ? 'Kích hoạt'
                                                : `Thanh toán ${formatPrice(packageDetails.price)}`
                                        }
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
};


// =========================================================
// PACKAGE SCREEN COMPONENT (Parent)
// =========================================================
const PackageItem: React.FC<PackageItemProps> = ({ pkg, style, onPress }) => (
    <TouchableOpacity style={[styles.packageCard, style]} onPress={() => onPress(pkg)}>
        <View style={styles.iconCircle}>
            <Text style={styles.circleNumber}>
                {formatPrice(pkg.price)}
            </Text>
            {pkg.isChecked && (
                <View style={styles.checkMark}>
                    <Feather name="check-circle" size={20} color={BLUE_COLOR} />
                </View>
            )}
        </View>
        <Text style={styles.packageTitle}>{pkg.name}</Text>
        <Text style={styles.packageDescription}>
            {pkg.description.replace(/\r\n/g, ' ')}
        </Text>
    </TouchableOpacity>
);

const chunkPackages = (packages: PackageUI[], size: number): PackageUI[][] => {
    const chunked: PackageUI[][] = [];
    for (let i = 0; i < packages.length; i += size) {
        chunked.push(packages.slice(i, i + size));
    }
    return chunked;
};


const PackageScreen: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'AI Test' | 'Expert suggestion'>(
        'AI Test'
    );
    const [servicePackages, setServicePackages] = useState<PackageUI[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const [isModalVisible, setIsModalVisible] = useState(false);
    const [selectedPackage, setSelectedPackage] = useState<PackageUI | null>(null);

    const handlePackagePress = (pkg: PackageUI) => {
        setSelectedPackage(pkg);
        setIsModalVisible(true);
    };

    // Hàm này sẽ nhận URL Deep Link từ Modal và xử lý
    const handleDeepLinkDetected = useCallback((url: string) => {
        // Cần đóng Modal nếu Deep Link được kích hoạt từ WebView
        if (url.startsWith('perhue://')) {
            // Logic xử lý chính đã nằm trong Modal, nhưng ta đóng Modal ở đây.
            setIsModalVisible(false);
        }
    }, []);

    const fetchServicePackages = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            // Giả định getServicePackage() hoạt động và trả về data
            const data: ServicePackage[] = await getServicePackage();

            const mappedData: PackageUI[] = data.map((pkg, index) => ({
                ...pkg,
                isAITest: pkg.name.toLowerCase().includes('test') || pkg.name.toLowerCase().includes('freemium'),
                isExpert: pkg.name.toLowerCase().includes('expert') || pkg.name.toLowerCase().includes('suggestion'),
                // Giả định gói 0đ là gói đã được kích hoạt/kiểm tra
                isChecked: pkg.price === 0,
            }));

            setServicePackages(mappedData);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Đã xảy ra lỗi không xác định.';
            setError(message);
            Alert.alert('Lỗi tải dữ liệu', message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchServicePackages();
    }, [fetchServicePackages]);

    // Hàm đóng Modal và tùy chọn tải lại dữ liệu
    const handleModalClose = useCallback((refetchData = false) => {
        setIsModalVisible(false);
        setSelectedPackage(null);
        if (refetchData) {
            fetchServicePackages();
        }
    }, [fetchServicePackages]);

    const aiTestPackages = servicePackages.filter(pkg => pkg.isAITest);
    const expertPackages = servicePackages.filter(pkg => pkg.isExpert);

    const aiTestRows = chunkPackages(aiTestPackages, 2);
    const expertRows = chunkPackages(expertPackages, 2);

    const renderPackages = (packages: PackageUI[][]) => {
        if (packages.length === 0) {
            return <Text style={styles.noDataText}>Không có gói dịch vụ nào để hiển thị.</Text>;
        }

        return packages.map((row, index) => (
            <View key={index} style={styles.cardRow}>
                {row.map((pkg, pkgIndex) => (
                    <PackageItem
                        key={pkg.id}
                        pkg={pkg}
                        style={{ flex: 1 }}
                        onPress={handlePackagePress}
                    />
                ))}
                {row.length === 1 && <View style={{ flex: 1 }} />}
            </View>
        ));
    };

    if (isLoading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={BLUE_COLOR} />
                    <Text style={styles.loadingText}>Đang tải gói dịch vụ...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (error && servicePackages.length === 0) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>Lỗi: {error}</Text>
                    <TouchableOpacity onPress={fetchServicePackages} style={styles.retryButton}>
                        <Text style={styles.retryButtonText}>Thử lại</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

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
                        AI Test ({aiTestPackages.length})
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
                        Expert suggestion ({expertPackages.length})
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Main Content (Packages) */}
            <ScrollView
                style={styles.mainContent}
                contentContainerStyle={styles.scrollViewContent}
                showsVerticalScrollIndicator={false}>
                {activeTab === 'AI Test' ? (
                    renderPackages(aiTestRows)
                ) : (
                    renderPackages(expertRows)
                )}
            </ScrollView>

            {/* Payment Modal */}
            <PaymentModal
                visible={isModalVisible}
                packageDetails={selectedPackage}
                onClose={handleModalClose}
                onDeepLinkDetected={handleDeepLinkDetected}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
    loadingText: { marginTop: 10, fontSize: 16, color: '#555' },
    errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    errorText: { fontSize: 16, color: 'red', textAlign: 'center', marginBottom: 15 },
    retryButton: { backgroundColor: BLUE_COLOR, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 5 },
    retryButtonText: { color: '#fff', fontWeight: 'bold' },
    noDataText: { textAlign: 'center', marginTop: 30, fontSize: 16, color: '#888' },

    tabBar: { flexDirection: 'row', padding: 10, paddingHorizontal: 15, justifyContent: 'center', alignItems: 'center', borderBottomWidth: 0.5, borderBottomColor: '#eee' },
    tabButton: { flex: 1, paddingVertical: 10, borderRadius: 20, backgroundColor: 'transparent', borderWidth: 1, borderColor: 'transparent', marginHorizontal: 5 },
    tabButtonActive: { backgroundColor: '#f0f0f0' },
    tabText: { textAlign: 'center', fontSize: 16, fontWeight: '600', color: '#888' },
    tabTextActive: { color: '#000' },

    mainContent: { flex: 1 },
    scrollViewContent: { paddingVertical: 10, paddingHorizontal: 10 },
    cardRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10 },

    // Package Item Styles
    packageCard: { alignItems: 'center', marginBottom: 30, maxWidth: '50%', paddingHorizontal: 5 },
    iconCircle: { width: 90, height: 90, borderRadius: 45, borderWidth: 3, borderColor: BLUE_COLOR, alignItems: 'center', justifyContent: 'center', marginBottom: 10, position: 'relative' },
    circleNumber: { fontSize: 14, fontWeight: 'bold', color: BLUE_COLOR, textAlign: 'center' },
    checkMark: { position: 'absolute', top: 0, right: 0, backgroundColor: '#fff', borderRadius: 10, padding: 2 },
    packageTitle: { fontSize: 18, fontWeight: 'bold', color: '#000', marginBottom: 5, textAlign: 'center' },
    packageDescription: { fontSize: 14, color: '#555', textAlign: 'center', maxWidth: 180 },
});


const modalStyles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContainer: {
        backgroundColor: 'white',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '80%', // Giới hạn chiều cao
        paddingTop: 10,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    headerText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    closeButton: {
        padding: 5,
    },
    content: {
        paddingHorizontal: 20,
        paddingVertical: 10,
    },
    divider: {
        height: 1,
        backgroundColor: '#eee',
        marginVertical: 20,
    },

    packageInfo: {
        alignItems: 'center',
        marginBottom: 10,
    },
    packageName: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#000',
        marginBottom: 5,
    },
    packagePrice: {
        fontSize: 24,
        fontWeight: 'bold',
        color: BLUE_COLOR,
        marginBottom: 10,
    },
    packageDescription: {
        fontSize: 14,
        color: '#555',
        textAlign: 'center',
        marginTop: 5,
    },

    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 10,
    },

    // THÊM Styles cho thông báo
    infoBox: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        backgroundColor: '#e5f3ff',
        borderRadius: 8,
        borderLeftWidth: 4,
        borderLeftColor: BLUE_COLOR,
        marginBottom: 10,
    },
    infoText: {
        flex: 1,
        marginLeft: 10,
        fontSize: 14,
        color: '#333',
    },

    // THÊM Styles cho Header của WebView
    webViewHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        backgroundColor: '#fff',
    },
    webViewHeaderText: {
        fontSize: 17,
        fontWeight: 'bold',
        color: '#333',
    },

    footer: {
        flexDirection: 'row',
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#eee',
        // Đảm bảo footer không bị che bởi phím ảo Android
        paddingBottom: Platform.OS === 'android' ? 20 : 0,
    },
    cancelBtn: {
        flex: 1,
        padding: 15,
        borderRadius: 10,
        backgroundColor: '#f0f0f0',
        marginRight: 10,
        alignItems: 'center',
    },
    cancelBtnText: {
        color: '#555',
        fontWeight: 'bold',
        fontSize: 16,
    },
    checkoutBtn: {
        flex: 2,
        padding: 15,
        borderRadius: 10,
        backgroundColor: BLUE_COLOR,
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkoutBtnText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
});

export default PackageScreen;
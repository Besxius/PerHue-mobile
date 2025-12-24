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
    Linking,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, AntDesign, MaterialCommunityIcons } from '@expo/vector-icons';
import { PaymentCallbackParams, ServicePackage, UserSubscriptionInformation } from '../types/dataModels';
import { getActiveSubscriptions, getServicePackage } from '../api/dataApi';
import WebView from 'react-native-webview';
import { getPaymentLink, getPaymentSuccess, getPaymentCancel } from '../api/paymentApi';
import Toast from 'react-native-toast-message';
import CustomConfirmModal, { AlertConfig } from '../components/CustomConfirmModal';

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

const chunkPackages = (packages: PackageUI[], size: number): PackageUI[][] => {
    const chunked: PackageUI[][] = [];
    for (let i = 0; i < packages.length; i += size) {
        chunked.push(packages.slice(i, i + size));
    }
    return chunked;
};

interface PaymentModalProps {
    visible: boolean;
    packageDetails: PackageUI | null;
    activeSubscriptions: UserSubscriptionInformation[];
    onClose: (refetchData?: boolean) => void;
    onDeepLinkDetected: (url: string) => void;
}


const PaymentModal: React.FC<PaymentModalProps> = ({ visible, packageDetails, activeSubscriptions, onClose, onDeepLinkDetected }) => {
    const [paymentLink, setPaymentLink] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isWebViewOpen, setIsWebViewOpen] = useState(false);
    const [isLoadingWebView, setIsLoadingWebView] = useState(true);

    const [internalAlert, setInternalAlert] = useState<AlertConfig>({
        visible: false, title: '', message: '', type: 'info'
    });

    const APP_SCHEME = 'perhue';
    const handleDeepLinkProcessing = useCallback(async (url: string) => {
        console.log('Processing Deep Link:', url);

        if (!packageDetails) return;

        const urlParts = url.split('?');
        const fullPath = urlParts[0].replace(`${APP_SCHEME}://`, '');
        const isSuccess = fullPath.includes('success');

        if (!fullPath.startsWith('payment/')) {
            console.log('Deep Link was ignored because it was not a payment result.');
            return;
        }

        setIsWebViewOpen(false);

        let params: PaymentCallbackParams = { code: '', id: '', cancel: false, status: '', orderCode: '', servicePackageId: 0 };

        try {
            const query = new URLSearchParams(urlParts[1]);

            params = {
                code: query.get('code') || '',
                id: query.get('id') || '',
                cancel: query.get('cancel') === 'true',
                status: query.get('status') || '',
                orderCode: query.get('orderCode') || '',
                servicePackageId: packageDetails.id,
            };

            if (!params.code && !params.id && !params.orderCode) {
                throw new Error("The Deep Link parameter is invalid or missing.");
            }

            let apiResult;
            if (isSuccess) {
                apiResult = await getPaymentSuccess(params);
                Toast.show({
                    type: 'success',
                    text1: 'Payment Successful!',
                    text2: apiResult.message || 'Service activated successfully.',
                    visibilityTime: 4000,
                });
                onClose(true);
            } else {
                apiResult = await getPaymentCancel(params);
                Toast.show({
                    type: 'error',
                    text1: 'Payment Failed or Cancelled',
                    text2: apiResult.message || 'Transaction was cancelled or unsuccessful.',
                    visibilityTime: 4000,
                });
                onClose(false);
            }

        } catch (e) {
            console.error('Error when parsing or calling the Deep Link processing API:', e);
            Toast.show({
                type: 'error',
                text1: 'Processing Error',
                text2: 'Could not confirm payment result. Please check status.',
                visibilityTime: 4000,
            });
            onClose(false);
        }

    }, [packageDetails, onClose]);


    const handleShouldStartLoad = useCallback((request: any): boolean => {
        const url = request.url;
        console.log('onShouldStartLoadWithRequest URL:', url);
        getPaymentSuccess
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

    const proceedPayment = async () => {
        if (!packageDetails) return;

        setInternalAlert(prev => ({ ...prev, visible: false }));

        if (packageDetails.price === 0) {
            Toast.show({
                type: 'info',
                text1: 'Package Activation',
                text2: `Successfully activated the free package "${packageDetails.name}".`,
                visibilityTime: 4000,
            });
            onClose(true);
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
            Toast.show({
                type: 'error',
                text1: 'Checkout Error',
                text2: 'Could not generate payment link. Please try again.',
                visibilityTime: 4000,
            });
            console.error(error);
            onClose(false);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleCheckout = useCallback(() => {
        if (!packageDetails) return;

        const duplicateSubscription = activeSubscriptions.find(
            sub => sub.servicePackage.type === packageDetails.type && sub.status === true
        );

        if (duplicateSubscription) {
            setInternalAlert({
                visible: true,
                title: 'Duplicate Subscription',
                message: 'You are currently using a package of the same type. Please consider that if you continue, the old package will be deactivated.',
                type: 'warning',
                confirmText: 'Continue',
                cancelText: 'Cancel',
                onConfirm: () => proceedPayment(),
                onCancel: () => setInternalAlert(prev => ({ ...prev, visible: false }))
            });
        } else {
            proceedPayment();
        }
    }, [packageDetails, activeSubscriptions, onClose]);

    useEffect(() => {
        if (visible) {
            const handleLinkingEvent = ({ url }: { url: string }) => {
                if (url && url.startsWith(`${APP_SCHEME}://`)) {
                    console.log('Global Deep Link Detected:', url);
                    handleDeepLinkProcessing(url);
                }
            };

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

    if (!packageDetails) return null;

    // --- Giao diện WebView ---
    if (isWebViewOpen && paymentLink) {
        return (
            <Modal
                animationType="slide"
                transparent={false}
                visible={isWebViewOpen}
                onRequestClose={() => {
                    setInternalAlert({
                        visible: true,
                        title: 'Cancellation Confirmation',
                        message: 'The payment transaction has not been completed. Are you sure you want to cancel?',
                        type: 'error',
                        confirmText: 'Cancel Transaction',
                        cancelText: 'Continue',
                        onConfirm: () => {
                            setInternalAlert(prev => ({ ...prev, visible: false }));
                            setIsWebViewOpen(false);
                            onClose(false);
                        },
                        onCancel: () => setInternalAlert(prev => ({ ...prev, visible: false }))
                    });
                }}
            >
                <SafeAreaView style={{ flex: 1 }}>
                    <View style={modalStyles.webViewHeader}>
                        <TouchableOpacity
                            onPress={() => {
                                setInternalAlert({
                                    visible: true,
                                    title: 'Cancellation Confirmation',
                                    message: 'The payment transaction has not been completed. Are you sure you want to cancel?',
                                    type: 'error',
                                    confirmText: 'Cancel Transaction',
                                    cancelText: 'Continue',
                                    onConfirm: () => {
                                        setInternalAlert(prev => ({ ...prev, visible: false }));
                                        setIsWebViewOpen(false);
                                        onClose(false);
                                    },
                                    onCancel: () => setInternalAlert(prev => ({ ...prev, visible: false }))
                                });
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
                        onShouldStartLoadWithRequest={handleShouldStartLoad}
                        onLoadEnd={() => setIsLoadingWebView(false)}
                        startInLoadingState={true}
                        style={{ flex: 1 }}
                    />

                    <CustomConfirmModal {...internalAlert} />
                </SafeAreaView>
            </Modal>
        );
    }

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

                                <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginBottom: 20 }}>
                                    <View style={{ alignItems: 'center' }}>
                                        <Text style={{ color: '#888', fontSize: 12 }}>Duration</Text>
                                        <Text style={{ fontWeight: 'bold', fontSize: 16 }}>{packageDetails.duration || 1} Month</Text>
                                    </View>
                                    <View style={{ alignItems: 'center' }}>
                                        <Text style={{ color: '#888', fontSize: 12 }}>Uses</Text>
                                        <Text style={{ fontWeight: 'bold', fontSize: 16 }}>{packageDetails.uses || 'Unlimited'}</Text>
                                    </View>
                                </View>

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
                                            ? 'Creating link...'
                                            : packageDetails.price === 0
                                                ? 'Activate'
                                                : `Checkout ${formatPrice(packageDetails.price)}`
                                        }
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            <CustomConfirmModal {...internalAlert} />
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
};


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
        <View style={styles.specsContainer}>
            <View style={styles.specItem}>
                <Text style={styles.specLabel}>Duration</Text>
                <Text style={styles.specValue}>{pkg.duration || 1} Month</Text>
            </View>
            <View style={styles.verticalDivider} />
            <View style={styles.specItem}>
                <Text style={styles.specLabel}>Uses</Text>
                <Text style={styles.specValue}>{pkg.uses || 'Unl.'}</Text>
            </View>
        </View>
    </TouchableOpacity>
);

const PackageScreen: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'AI Test' | 'Expert suggestion'>(
        'AI Test'
    );
    const [servicePackages, setServicePackages] = useState<PackageUI[]>([]);
    const [activeSubscriptions, setActiveSubscriptions] = useState<UserSubscriptionInformation[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const [isModalVisible, setIsModalVisible] = useState(false);
    const [selectedPackage, setSelectedPackage] = useState<PackageUI | null>(null);

    const [globalAlert, setGlobalAlert] = useState<AlertConfig>({
        visible: false, title: '', message: '', type: 'error'
    });

    const handlePackagePress = (pkg: PackageUI) => {
        setSelectedPackage(pkg);
        setIsModalVisible(true);
    };

    const handleDeepLinkDetected = useCallback((url: string) => {
        if (url.startsWith('perhue://')) {
            setIsModalVisible(false);
        }
    }, []);

    const fetchServicePackages = useCallback(async () => {
        setIsLoading(true);
        try {
            const [data, subscriptions] = await Promise.all([
                getServicePackage(),
                getActiveSubscriptions()
            ]);
            setActiveSubscriptions(subscriptions);

            const mappedData: PackageUI[] = data.map((pkg) => {
                const typeLC = pkg.type?.toLowerCase() || '';
                const isAITest = typeLC.includes('ai') || typeLC.includes('test');
                const isExpert = typeLC.includes('expert') || typeLC.includes('suggestion') || typeLC.includes('manual');
                return { ...pkg, isAITest, isExpert: isExpert || (!isAITest), isChecked: pkg.price === 0 };
            });
            setServicePackages(mappedData);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'An unknown error has occurred.';
            setGlobalAlert({
                visible: true,
                title: 'Data loading error',
                message: message,
                type: 'error',
                confirmText: 'Try again',
                onConfirm: () => {
                    setGlobalAlert(prev => ({ ...prev, visible: false }));
                    fetchServicePackages();
                }
            });
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchServicePackages();
    }, [fetchServicePackages]);

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

    const renderRows = (rows: PackageUI[][]) => {
        if (rows.length === 0 && rows.length === 0) {
            return <Text style={styles.noDataText}>No service packages are available to display.</Text>;
        }

        return rows.map((row, index) => (
            <View key={index} style={styles.rowContainer}>
                {row.map((pkg) => (
                    <PackageItem
                        key={pkg.id}
                        pkg={pkg}
                        style={styles.gridItem}
                        onPress={handlePackagePress}
                    />
                ))}
                {row.length === 1 && <View style={[styles.gridItem, { backgroundColor: 'transparent', borderWidth: 0, shadowOpacity: 0 }]} />}
            </View>
        ));
    };

    if (isLoading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={BLUE_COLOR} />
                    <Text style={styles.loadingText}>Loading Service Package</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (error && servicePackages.length === 0) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>Erorr: {error}</Text>
                    <TouchableOpacity onPress={fetchServicePackages} style={styles.retryButton}>
                        <Text style={styles.retryButtonText}>Try Aggain</Text>
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
                {activeTab === 'AI Test' ? renderRows(aiTestRows) : renderRows(expertRows)}
            </ScrollView>

            {/* Payment Modal */}
            <PaymentModal
                visible={isModalVisible}
                packageDetails={selectedPackage}
                activeSubscriptions={activeSubscriptions}
                onClose={handleModalClose}
                onDeepLinkDetected={handleDeepLinkDetected}
            />

            <CustomConfirmModal
                {...globalAlert}
                onCancel={globalAlert.type === 'error' ? undefined : () => setGlobalAlert(prev => ({ ...prev, visible: false }))}
                onConfirm={() => {
                    globalAlert.onConfirm?.();
                    setGlobalAlert(prev => ({ ...prev, visible: false }));
                }}
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
    scrollViewContent: { paddingVertical: 20, paddingHorizontal: 16 },

    // --- Grid Styles ---
    rowContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
        gap: 12,
    },
    gridItem: {
        flex: 1,
    },

    // --- Package Card Updated ---
    packageCard: {
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#f0f0f0',
        minHeight: 220,
        justifyContent: 'space-between'
    },
    iconCircle: {
        width: 60,
        height: 60,
        borderRadius: 30,
        borderWidth: 2,
        borderColor: BLUE_COLOR,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
        position: 'relative',
        backgroundColor: '#f9fcff'
    },
    circleNumber: { fontSize: 12, fontWeight: 'bold', color: BLUE_COLOR, textAlign: 'center' },
    checkMark: { position: 'absolute', top: -2, right: -2, backgroundColor: '#fff', borderRadius: 10 },
    packageTitle: { fontSize: 16, fontWeight: 'bold', color: '#000', marginBottom: 4, textAlign: 'center' },
    packageDescription: { fontSize: 12, color: '#666', textAlign: 'center', lineHeight: 16, paddingHorizontal: 4, marginBottom: 12, height: 32 },

    // --- Styles cho phần Duration/Uses ---
    specsContainer: {
        flexDirection: 'row',
        backgroundColor: '#f5f7fa',
        borderRadius: 8,
        paddingVertical: 8,
        paddingHorizontal: 4,
        width: '100%',
        alignItems: 'center',
        justifyContent: 'space-around'
    },
    specItem: {
        alignItems: 'center',
        flex: 1,
    },
    verticalDivider: {
        width: 1,
        height: '80%',
        backgroundColor: '#ddd',
    },
    specLabel: {
        fontSize: 10,
        color: '#888',
        marginBottom: 2,
        textTransform: 'uppercase'
    },
    specValue: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#333'
    },
});

const modalStyles = StyleSheet.create({
    overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0, 0, 0, 0.5)' },
    modalContainer: { backgroundColor: 'white', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '85%', paddingTop: 10 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#eee' },
    headerText: { fontSize: 18, fontWeight: 'bold', color: '#333' },
    closeButton: { padding: 5 },
    content: { paddingHorizontal: 20, paddingVertical: 10 },
    divider: { height: 1, backgroundColor: '#eee', marginVertical: 20 },
    packageInfo: { alignItems: 'center', marginBottom: 10 },
    packageName: { fontSize: 22, fontWeight: 'bold', color: '#000', marginBottom: 5 },
    packagePrice: { fontSize: 24, fontWeight: 'bold', color: BLUE_COLOR, marginBottom: 10 },
    packageDescription: { fontSize: 14, color: '#555', textAlign: 'center', marginTop: 5 },
    sectionTitle: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 10 },
    infoBox: { flexDirection: 'row', alignItems: 'center', padding: 15, backgroundColor: '#e5f3ff', borderRadius: 8, borderLeftWidth: 4, borderLeftColor: BLUE_COLOR, marginBottom: 10 },
    infoText: { flex: 1, marginLeft: 10, fontSize: 14, color: '#333' },
    webViewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#eee', backgroundColor: '#fff' },
    webViewHeaderText: { fontSize: 17, fontWeight: 'bold', color: '#333' },
    footer: { flexDirection: 'row', padding: 20, borderTopWidth: 1, borderTopColor: '#eee', paddingBottom: Platform.OS === 'android' ? 20 : 0 },
    cancelBtn: { flex: 1, padding: 15, borderRadius: 10, backgroundColor: '#f0f0f0', marginRight: 10, alignItems: 'center' },
    cancelBtnText: { color: '#555', fontWeight: 'bold', fontSize: 16 },
    checkoutBtn: { flex: 2, padding: 15, borderRadius: 10, backgroundColor: BLUE_COLOR, alignItems: 'center', justifyContent: 'center' },
    checkoutBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
});

export default PackageScreen;
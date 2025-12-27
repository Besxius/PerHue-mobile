import React, { FC, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    ImageSourcePropType,
} from 'react-native';
import { BaseHistoryItem } from '../types';

// --- Định nghĩa Kiểu (Types) ---
// Tái định nghĩa các kiểu cần thiết từ HistoryScreen.tsx
interface ImageSource { uri: string; }

interface HistoryItemProps {
    item: BaseHistoryItem;
    onPressAction: (item: BaseHistoryItem) => void;
}

// Hàm render ảnh thumbnail
const renderImageThumbnails = (imageSources: ImageSource[]) => {
    // Chỉ lấy tối đa 4 ảnh
    const displayedImages = imageSources.slice(0, 4);
    const imageCount = displayedImages.length;

    if (imageCount === 0) {
        return (
            <View style={styles.imageGrid}>
                <Text style={styles.noImageText}>No Image</Text>
            </View>
        );
    }

    if (imageCount === 1) {
        return (
            <View style={styles.imageGrid}>
                <Image
                    source={{ uri: displayedImages[0].uri }}
                    style={styles.fullImage}
                    resizeMode="cover"
                />
            </View>
        );
    }

    // Hiển thị dạng lưới 2x2 cho 2, 3 hoặc 4 ảnh
    return (
        <View style={styles.imageGrid}>
            {displayedImages.map((source, index) => (
                <Image
                    key={index}
                    source={{ uri: source.uri }}
                    style={styles.gridImage}
                    resizeMode="cover"
                />
            ))}
        </View>
    );
};

// ======================================================================
// COMPONENT HISTORY ITEM
// ======================================================================
const HistoryItem: FC<HistoryItemProps> = ({ item, onPressAction }) => {
    const isCompleted = item.status === 'Completed' || item.status === 'Reviewing';
    const isPending = item.status === 'Pending' || item.status === 'PendingReview';
    const isEnabled = isCompleted || (item.isExpert && isPending);
    const isDisabled = !isEnabled;
    const buttonStyleOverride = item.isExpert && isPending ? styles.reviewButton : styles.trackButton;

    const handlePress = useCallback(() => {
        if (!isDisabled) {
            onPressAction(item);
        }
    }, [item, onPressAction, isDisabled]);

    return (
        <View style={styles.itemContainer}>
            {/* 1. Image Thumbnail */}
            {renderImageThumbnails(item.imageSources)}

            {/* 2. Content */}
            <View style={styles.itemContent}>
                {/* ID & Type */}
                <Text style={styles.itemTitle}>
                    {item.title}
                </Text>

                {/* Color Type Name (Result) */}
                {item.subTitle && (
                    <Text style={styles.itemMethod}>
                        {item.subTitle}
                    </Text>
                )}

                {/* Date and Status */}
                <View style={styles.statusRow}>
                    <Text style={styles.dateText}>
                        Date: {item.date}
                    </Text>
                    <View style={styles.statusIndicator}>
                        {isCompleted && (
                            <View style={styles.checkIconContainer}>
                                <Text style={styles.checkIcon}>✓</Text>
                            </View>
                        )}
                        <Text style={[
                            styles.itemStatus,
                            isCompleted ? styles.completedStatus : styles.processingStatus
                        ]}>
                            {item.status}
                        </Text>
                    </View>
                </View>
            </View>

            {/* 3. Action Button */}
            <View style={styles.itemActions}>
                <TouchableOpacity
                    style={[
                        styles.actionButton,
                        isDisabled ? styles.disabledButton : buttonStyleOverride
                    ]}
                    onPress={handlePress}
                    disabled={isDisabled}
                >
                    <Text style={[
                        styles.buttonText,
                        isDisabled ? styles.disabledButtonText : (item.isExpert && isPending ? styles.reviewButtonText : styles.trackButtonText)
                    ]}>
                        {item.buttonText}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

export default HistoryItem;

// ======================================================================
// STYLES (Sao chép từ HistoryScreen.tsx để đảm bảo đồng bộ)
// ======================================================================
const styles = StyleSheet.create({
    // --- Container ---
    itemContainer: {
        flexDirection: 'row',
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        alignItems: 'center',
    },

    // --- Image Grid ---
    imageGrid: {
        width: 80,
        height: 80,
        marginRight: 15,
        flexDirection: 'row',
        flexWrap: 'wrap',
        overflow: 'hidden',
        borderRadius: 8,
        backgroundColor: '#f0f0f0', // Thêm nền cho trường hợp không có ảnh
        justifyContent: 'center',
        alignItems: 'center',
    },
    noImageText: {
        fontSize: 12,
        color: '#aaa',
        textAlign: 'center',
    },
    gridImage: {
        width: '50%',
        height: '50%',
    },
    fullImage: {
        width: '100%',
        height: '100%',
        borderRadius: 8, // Thêm lại border radius cho ảnh đơn
    },

    // --- Content ---
    itemContent: {
        flex: 1,
    },
    itemTitle: {
        fontSize: 14,
        color: '#333',
        fontWeight: '500',
    },
    itemNumber: {
        fontWeight: 'bold',
    }, // Không dùng
    itemMethod: {
        fontSize: 16,
        fontWeight: '600',
        marginTop: 2,
        color: '#333'
    },
    extraInfoText: {
        fontSize: 12,
        color: '#888',
        marginTop: 4,
    },
    dateText: {
        fontSize: 12,
        color: '#888',
        marginRight: 10,
    },

    // --- Status ---
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 5,
        flexWrap: 'wrap',
    },
    statusIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    itemStatus: {
        fontSize: 14,
        fontWeight: '500',
        marginRight: 8,
    },
    processingStatus: {
        color: '#888',
    },
    completedStatus: {
        color: '#333',
    },
    checkIconContainer: {
        backgroundColor: '#4C7BE2',
        width: 16,
        height: 16,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 5,
    },
    checkIcon: {
        color: '#fff',
        fontSize: 10,
        lineHeight: 12,
        fontWeight: 'bold',
    },

    // --- Actions ---
    itemActions: {
        marginLeft: 10,
        alignItems: 'flex-end',
    },
    responseCount: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8,
    },
    actionButton: {
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderRadius: 25,
        minWidth: 90,
        alignItems: 'center',
        justifyContent: 'center',
    },
    trackButton: {
        backgroundColor: '#4C7BE2',
    },
    reviewButton: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#4C7BE2',
    }, // Không dùng
    buttonText: {
        fontSize: 14,
        fontWeight: '600',
    },
    trackButtonText: {
        color: '#fff',
    },
    reviewButtonText: {
        color: '#4C7BE2',
    },
    disabledButton: {
        backgroundColor: '#ccc', // Màu nền xám khi disabled
    },
    disabledButtonText: {
        color: '#888', // Màu chữ xám khi disabled
    },

});
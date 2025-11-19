import React, { FC, memo } from "react";
import { StyleSheet, View, Text, TouchableOpacity, Image } from "react-native";

// ======================================================================
// 1. ĐỊNH NGHĨA TYPESCRIPT INTERFACE
// ======================================================================
interface ImageSource {
    uri: string;
}

export interface HistoryItemType { // Export interface để sử dụng bên ngoài
    id: number;
    type: "Request" | "Order";
    number: string;
    method: string;
    status: "Processing" | "Completed";
    responses: number;
    buttonText: string;
    isOrder: boolean;
    imageSources: ImageSource[];
}

interface HistoryItemProps {
    item: HistoryItemType;
    onPressAction?: (item: HistoryItemType) => void; // Thêm prop xử lý sự kiện
}

// ======================================================================
// 2. COMPONENT HISTORY ITEM (Sử dụng React.memo)
// ======================================================================
const HistoryItem: FC<HistoryItemProps> = memo(({ item, onPressAction }) => {
    const isProcessing = item.status === "Processing";
    const isCompleted = item.status === "Completed";

    // 💡 Logic cho Style Button
    const buttonStyle = [
        styles.actionButton,
        isProcessing ? styles.trackButton : styles.reviewButton,
    ];

    // 💡 Logic cho Icon trạng thái
    const statusIcon = isCompleted ? (
        <View style={styles.checkIconContainer}>
            <Text style={styles.checkIcon}>✓</Text>
        </View>
    ) : null;

    // Xử lý sự kiện khi nhấn nút hành động
    const handleActionPress = () => {
        if (onPressAction) {
            onPressAction(item);
        } else {
            console.log(`${item.buttonText} action for ${item.number}`);
        }
    };

    return (
        <View style={styles.itemContainer}>
            {/* Cột trái: Hình ảnh (Grid/Full) */}
            <View style={styles.imageGrid}>
                {item.imageSources.slice(0, 4).map((source, index) => (
                    <Image
                        key={index}
                        source={source}
                        // Điều kiện render: nếu có > 2 ảnh thì chia 4 ô (grid), ngược lại dùng full size
                        style={item.imageSources.length > 2 ? styles.gridImage : styles.fullImage}
                        resizeMode="cover"
                    />
                ))}
            </View>

            {/* Cột giữa: Thông tin */}
            <View style={styles.itemContent}>
                <Text style={styles.itemTitle}>
                    {item.type} <Text style={styles.itemNumber}>{item.number}</Text>
                </Text>
                <Text style={styles.itemMethod}>{item.method}</Text>
                <View style={styles.statusRow}>
                    <Text style={[styles.itemStatus, isProcessing ? styles.processingStatus : styles.completedStatus]}>
                        {item.status}
                    </Text>
                    {statusIcon}
                </View>
            </View>

            {/* Cột phải: Response & Action Button */}
            <View style={styles.itemActions}>
                <Text style={styles.responseCount}>
                    {item.responses} {item.responses === 1 ? 'response' : 'responses'}
                </Text>
                <TouchableOpacity
                    style={buttonStyle}
                    onPress={handleActionPress}
                >
                    <Text style={[
                        styles.buttonText,
                        isProcessing ? styles.trackButtonText : styles.reviewButtonText
                    ]}>
                        {item.buttonText}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
});

export default HistoryItem;

// ======================================================================
// 3. STYLES (Giữ nguyên từ code cũ)
// ======================================================================
const styles = StyleSheet.create({
    itemContainer: {
        flexDirection: 'row',
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        alignItems: 'center',
    },

    // --- Image Grid Styles ---
    imageGrid: {
        width: 80,
        height: 80,
        marginRight: 15,
        flexDirection: 'row',
        flexWrap: 'wrap',
        overflow: 'hidden',
        borderRadius: 8,
    },
    gridImage: {
        width: '50%',
        height: '50%',
    },
    fullImage: {
        width: '100%',
        height: '100%',
        borderRadius: 8,
    },

    // --- Content Styles ---
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
    },
    itemMethod: {
        fontSize: 16,
        fontWeight: '600',
        marginTop: 2,
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 5,
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
    },
    checkIcon: {
        color: '#fff',
        fontSize: 10,
        lineHeight: 12,
        fontWeight: 'bold',
    },

    // --- Actions Styles ---
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
    },
    buttonText: {
        fontSize: 14,
        fontWeight: '600',
    },
    trackButtonText: {
        color: '#fff',
    },
    reviewButtonText: {
        color: '#4C7BE2',
    }
});
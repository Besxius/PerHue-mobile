import { StyleSheet, View, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const HistoryScreen = () => {
    const insets = useSafeAreaInsets();
    return (
        <View style={styles.container}>
            <Text>
                Trongle History Screen
            </Text>
        </View>
    );
}

export default HistoryScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
    },
});
import { StyleSheet, View, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const CameraScreen = () => {
    const insets = useSafeAreaInsets();
    return (
        <View style={styles.container}>
            <Text>
                Trongle Camera Screen
            </Text>
        </View>
    );
}

export default CameraScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
    },
});
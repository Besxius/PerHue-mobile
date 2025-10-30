import { StyleSheet, View, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const UserScreen = () => {
    const insets = useSafeAreaInsets();
    return (
        <View style={styles.container}>
            <Text>
                Trongle User Screen
            </Text>
        </View>
    );
}

export default UserScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
    },
});
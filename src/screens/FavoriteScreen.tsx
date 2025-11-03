import { StyleSheet, View, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const FavoriteScreen = () => {
    const insets = useSafeAreaInsets();
    return (
        <View style={styles.container}>
            <Text>
                Trongle Favorite Screen
            </Text>
        </View>
    );
}

export default FavoriteScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
    },
});
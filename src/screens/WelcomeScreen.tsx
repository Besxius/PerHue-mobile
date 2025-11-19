import React from 'react';
import { View, Text, StyleSheet, ImageBackground, Image } from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import CustomButton from '../components/CustomButton';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthStackParamList } from '../navigation/AuthNavigator';

type WelcomeScreenProps = StackScreenProps<AuthStackParamList, 'WelcomeScreen'>;
const logoIcon = require('../assets/logo-icon-black.png');

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ navigation }) => {

    const insets = useSafeAreaInsets();
    const handleGetStarted = () => {
        navigation.navigate('LoginScreen');
    };

    return (
        <View style={[
            styles.container,
            {
                paddingTop: insets.top,
                paddingBottom: insets.bottom + 50
            }
        ]}>
            <View style={styles.logoArea}>
                <View style={styles.logoCircle}>
                    <Image source={logoIcon} style={styles.avatar} />
                </View>
                <Text style={styles.title}>PERHUE</Text>
                <Text style={styles.subtitle}>FIND YOUR COLOR</Text>
                <Text style={styles.subtitle}>MAKE YOU BRIGHTER</Text>
            </View>

            <View style={styles.buttonArea}>
                <CustomButton
                    title="Let get Started"
                    onPress={handleGetStarted}
                    color="#4a7de2"
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#2E3A59',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: 50,
        paddingTop: 100
    },
    logoArea: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoCircle: {
        width: 150,
        height: 150,
        borderRadius: 75,
        backgroundColor: '#E0E0E0',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 30,
    },
    avatar: {
        width: 125,
        height: 125,
        borderRadius: 24,
    },
    logoText: {
        fontSize: 30,
        fontWeight: 'bold',
        color: '#000'
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 15,
    },
    subtitle: {
        fontSize: 16,
        color: '#ccc',
        fontWeight: '500',
    },
    buttonArea: {
        width: '80%',
    }
});

export default WelcomeScreen;
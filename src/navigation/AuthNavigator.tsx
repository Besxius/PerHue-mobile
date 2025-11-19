
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import WelcomeScreen from '../screens/WelcomeScreen';
import LoginScreen from '../screens/auth/LoginScreen';

export type AuthStackParamList = {
    WelcomeScreen: undefined;
    LoginScreen: undefined;
};

const AuthStack = createNativeStackNavigator<AuthStackParamList>();

const AuthNavigator = () => (
    <AuthStack.Navigator
        initialRouteName="WelcomeScreen"
        screenOptions={{ headerShown: false }}
    >
        <AuthStack.Screen name="WelcomeScreen" component={WelcomeScreen} />
        <AuthStack.Screen name="LoginScreen" component={LoginScreen} />
        {/* Thêm màn hình Đăng ký/Quên mật khẩu nếu có */}
    </AuthStack.Navigator>
);

export default AuthNavigator;
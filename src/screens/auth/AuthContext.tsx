import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { loadAuthToken, setTokenRefreshFailureCallback } from '../../api/apiClient';
import { unifiedLogout } from '../../api/authApi';

interface AuthContextType {
    isLoggedIn: boolean | null; // null: đang tải, false: chưa đăng nhập, true: đã đăng nhập
    setIsLoggedIn: (status: boolean) => void;
    logout: () => Promise<void>;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
    isLoggedIn: null,
    setIsLoggedIn: () => { },
    logout: async () => { },
    isLoading: true,
});

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const logout = useCallback(async () => {
        setIsLoading(true);
        try {
            await unifiedLogout(); // Xử lý đăng xuất Firebase/Google/API/Xóa token local
            setIsLoggedIn(false);
        } catch (e) {
            console.error("Lỗi khi đăng xuất hoàn chỉnh:", e);
            // Vẫn set về false dù có lỗi để đảm bảo chuyển sang màn hình đăng nhập
            setIsLoggedIn(false);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        setTokenRefreshFailureCallback(logout);

        const checkAuthStatus = async () => {
            try {
                const storedToken = await loadAuthToken();
                setIsLoggedIn(!!storedToken);
            } catch (e) {
                console.error("Lỗi khi kiểm tra token:", e);
                setIsLoggedIn(false);
            } finally {
                setIsLoading(false);
            }
        };

        checkAuthStatus();
        return () => {
            setTokenRefreshFailureCallback(null);
        };
    }, [logout]);

    const value = {
        isLoggedIn,
        setIsLoggedIn,
        logout,
        isLoading,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
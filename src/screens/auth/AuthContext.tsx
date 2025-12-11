import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { loadAuthToken, setTokenRefreshFailureCallback, getAuthRole, getUserName } from '../../api/apiClient'; // 👈 Thêm getUserName
import { unifiedLogout } from '../../api/authApi';
import { jwtDecode } from 'jwt-decode';
import { JwtPayload } from '../../types/dataModels';

interface AuthContextType {
    isLoggedIn: boolean | null;
    setIsLoggedIn: (status: boolean) => void;
    userRole: string | null;
    setUserRole: (role: string | null) => void;
    userName: string | null; // 👈 THÊM: State userName
    setUserName: (name: string | null) => void; // 👈 THÊM: Hàm set userName
    logout: () => Promise<void>;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
    isLoggedIn: null,
    setIsLoggedIn: () => { },
    userRole: null,
    setUserRole: () => { },
    userName: null, // Default
    setUserName: () => { }, // Default
    logout: async () => { },
    isLoading: true,
});

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
    const [userRole, setUserRole] = useState<string | null>(null);
    const [userName, setUserName] = useState<string | null>(null); // 👈 Khởi tạo state userName
    const [isLoading, setIsLoading] = useState(true);

    const logout = useCallback(async () => {
        setIsLoading(true);
        try {
            await unifiedLogout();
            setIsLoggedIn(false);
            setUserRole(null);
            setUserName(null); // 👈 Reset userName khi logout
        } catch (e) {
            console.error("Lỗi khi đăng xuất hoàn chỉnh:", e);
            setIsLoggedIn(false);
            setUserRole(null);
            setUserName(null);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        setTokenRefreshFailureCallback(logout);

        const checkAuthStatus = async () => {
            try {
                const storedToken = await loadAuthToken();
                if (storedToken) {
                    setIsLoggedIn(true);

                    // Lấy Role
                    try {
                        const decoded: JwtPayload = jwtDecode(storedToken);
                        setUserRole(decoded.role || 'User');
                    } catch (err) {
                        const role = await getAuthRole();
                        setUserRole(role);
                    }

                    // 👈 Lấy UserName từ bộ nhớ (đã được lưu khi login/loadAuthToken)
                    const name = await getUserName();
                    setUserName(name);

                } else {
                    setIsLoggedIn(false);
                    setUserRole(null);
                    setUserName(null);
                }
            } catch (e) {
                console.error("Lỗi khi kiểm tra token:", e);
                setIsLoggedIn(false);
                setUserRole(null);
                setUserName(null);
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
        userRole,
        setUserRole,
        userName,      // 👈 Export
        setUserName,   // 👈 Export
        logout,
        isLoading,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
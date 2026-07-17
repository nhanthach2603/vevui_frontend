// context/AuthContext.jsx — JWT-based authentication
import { createContext, useContext, useState, useCallback } from 'react';
import { authApi, saveTokens, clearTokens, getToken, ApiError } from '../services/api';

const AuthContext = createContext(null);

const loadUser = () => {
  try {
    const saved = localStorage.getItem('vevui_user');
    return saved ? JSON.parse(saved) : null;
  } catch { return null; }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(loadUser);

  // ── Đăng nhập ──
  const login = useCallback(async (email, password) => {
    const data = await authApi.login({ email, password });
    // data: { id, fullName, email, phone, role, accessToken, refreshToken }
    saveTokens(data.accessToken, data.refreshToken);
    const userData = {
      id: data.id,
      name: data.fullName,
      email: data.email,
      phone: data.phone,
      role: data.role,
    };
    setUser(userData);
    localStorage.setItem('vevui_user', JSON.stringify(userData));
    return userData;
  }, []);

  // ── Đăng ký ──
  const register = useCallback(async (fullName, email, password, phone) => {
    const data = await authApi.register({ fullName, email, password, phone });
    saveTokens(data.accessToken, data.refreshToken);
    const userData = {
      id: data.id,
      name: data.fullName,
      email: data.email,
      phone: data.phone,
      role: data.role,
    };
    setUser(userData);
    localStorage.setItem('vevui_user', JSON.stringify(userData));
    return userData;
  }, []);

  // ── Đăng xuất ──
  const logout = useCallback(() => {
    setUser(null);
    clearTokens();
  }, []);

  // ── Cập nhật thông tin user trong context + localStorage ──
  const updateUser = useCallback((newData) => {
    setUser(prev => {
      const updated = { ...prev, ...newData };
      localStorage.setItem('vevui_user', JSON.stringify(updated));
      return updated;
    });
  }, []);

  // ── Lấy auth header (dùng cho các component cần truyền token) ──
  const getAuthToken = useCallback(() => getToken(), []);

  return (
    <AuthContext.Provider value={{
      user,
      login,
      register,
      logout,
      updateUser,
      getAuthToken,
      isLoggedIn: !!user,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

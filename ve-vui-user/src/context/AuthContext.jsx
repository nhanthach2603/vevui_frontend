// context/AuthContext.jsx
import { createContext, useContext, useState, useCallback } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('vevui_user');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });

  const login = useCallback((userData) => {
    const u = { ...userData, id: `u_${Date.now()}` };
    setUser(u);
    localStorage.setItem('vevui_user', JSON.stringify(u));
    return true;
  }, []);

  const register = useCallback((userData) => {
    const u = { ...userData, id: `u_${Date.now()}`, joinedAt: new Date().toISOString() };
    setUser(u);
    localStorage.setItem('vevui_user', JSON.stringify(u));
    return true;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('vevui_user');
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isLoggedIn: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

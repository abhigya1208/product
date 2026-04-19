import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('ags_token');
    const savedUser = localStorage.getItem('ags_user');
    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('ags_token');
        localStorage.removeItem('ags_user');
      }
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (username, password, role) => {
    const res = await api.post('/auth/login', { username, password, role });
    const { token: newToken, user: newUser } = res.data;
    localStorage.setItem('ags_token', newToken);
    localStorage.setItem('ags_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
    return newUser;
  }, []);

  const logout = useCallback(async () => {
    try { await api.post('/auth/logout'); } catch (e) { /* ignore */ }
    localStorage.removeItem('ags_token');
    localStorage.removeItem('ags_user');
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, isLoggedIn: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};

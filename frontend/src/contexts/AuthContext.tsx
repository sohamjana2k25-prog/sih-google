import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api, setAuthToken, clearAuthToken, getAuthToken } from '../services/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginAsDemoUser: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    const token = getAuthToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const data = await api.getMe();
      setUser(data.user);
    } catch (err) {
      console.warn('Failed to restore session:', err);
      clearAuthToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const res = await api.login({ email, password });
      setAuthToken(res.token);
      setUser(res.user);
    } finally {
      setLoading(false);
    }
  };

  const loginAsDemoUser = async (email: string, password: string) => {
    await login(email, password);
  };

  const logout = () => {
    clearAuthToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, loginAsDemoUser, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

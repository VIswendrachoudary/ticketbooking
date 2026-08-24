import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiRequest } from '../api';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'ORGANISER' | 'CUSTOMER';
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('ticket_app_token'));
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function fetchMe() {
      if (token) {
        try {
          const res = await apiRequest('/auth/me');
          setUser(res.user);
        } catch {
          logout();
        }
      }
      setLoading(false);
    }
    fetchMe();
  }, [token]);

  const login = (newToken: string, newUser: User) => {
    localStorage.setItem('ticket_app_token', newToken);
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem('ticket_app_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

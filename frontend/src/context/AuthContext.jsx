import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('medbook_token') || null);
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('medbook_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      if (token) {
        try {
          const res = await api.get('/auth/me');
          if (res.data.user) {
            setUser(res.data.user);
            localStorage.setItem('medbook_user', JSON.stringify(res.data.user));
          }
        } catch (err) {
          console.error("Auth check failed:", err);
          logout();
        }
      }
      setLoading(false);
    };

    fetchCurrentUser();
  }, [token]);

  const saveAuthData = (newToken, newUser) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('medbook_token', newToken);
    localStorage.setItem('medbook_user', JSON.stringify(newUser));
  };

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.data.access_token && res.data.user) {
      saveAuthData(res.data.access_token, res.data.user);
    }
    return res.data;
  };

  const register = async (userData) => {
    const res = await api.post('/auth/register', userData);
    if (res.data.access_token && res.data.user) {
      saveAuthData(res.data.access_token, res.data.user);
    }
    return res.data;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('medbook_token');
    localStorage.removeItem('medbook_user');
  };

  return (
    <AuthContext.Provider value={{ token, user, loading, login, register, logout, setUser }}>
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

import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, getStoredUser, getAuthToken } from '../api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getStoredUser());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function initAuth() {
      const token = getAuthToken();
      if (token) {
        try {
          const profile = await api.getMe();
          setUser(profile);
        } catch (err) {
          console.warn('Stored token expired, switching to demo Intern account');
          try {
            const data = await api.switchDemoRole('INTERN');
            setUser(data.user);
          } catch (e) {
            setUser(null);
          }
        }
      } else {
        // Auto sign-in to demo intern on first launch for zero-friction demo
        try {
          const data = await api.switchDemoRole('INTERN');
          setUser(data.user);
        } catch (e) {
          console.error('Failed to auto-sign-in demo user', e);
        }
      }
      setLoading(false);
    }
    initAuth();
  }, []);

  const login = async (email, password) => {
    const data = await api.login(email, password);
    setUser(data.user);
    return data.user;
  };

  const switchRole = async (targetRole) => {
    setLoading(true);
    try {
      const data = await api.switchDemoRole(targetRole);
      setUser(data.user);
      return data.user;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    api.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, switchRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

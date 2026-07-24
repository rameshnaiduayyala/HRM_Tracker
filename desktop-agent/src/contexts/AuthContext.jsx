import React, { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '../api/apiClient';
import { LOCAL_STORAGE_JWT_KEY, LOCAL_STORAGE_REFRESH_KEY } from '../constants/appConstants';
import { invoke } from '@tauri-apps/api/core';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      // In a real application, fetch user profile from the profile endpoint.
      // We can also ask Rust for current system device registration details.
      const response = await apiClient.get('/work-sessions/profile');
      setUser(response.data);
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem(LOCAL_STORAGE_JWT_KEY);
    if (token) {
      fetchProfile();
    } else {
      setLoading(false);
    }

    const handleExpired = () => {
      setUser(null);
    };
    window.addEventListener('auth-session-expired', handleExpired);
    return () => window.removeEventListener('auth-session-expired', handleExpired);
  }, []);

  const login = async (email, password, rememberMe) => {
    setLoading(true);
    try {
      // Register/get device details from Rust first
      const sysInfo = await invoke('get_system_info');
      
      const response = await apiClient.post('/auth/login', {
        email,
        password,
        deviceFingerprint: sysInfo.deviceId,
        deviceName: sysInfo.hostname
      });

      const { token, refreshToken, user: userData } = response.data;
      localStorage.setItem(LOCAL_STORAGE_JWT_KEY, token);
      localStorage.setItem(LOCAL_STORAGE_REFRESH_KEY, refreshToken);
      setUser(userData);
      return userData;
    } catch (err) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem(LOCAL_STORAGE_JWT_KEY);
    localStorage.removeItem(LOCAL_STORAGE_REFRESH_KEY);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

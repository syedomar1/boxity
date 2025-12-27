import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { useEffect, useState } from 'react';
import type { User, UserRole } from '@/types';

const AUTH_KEY = '@boxity_auth';
const USER_KEY = '@boxity_user';

export const [AuthProvider, useAuth] = createContextHook(() => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAuth();
  }, []);

  const loadAuth = async () => {
    try {
      const [authToken, userData] = await Promise.all([
        AsyncStorage.getItem(AUTH_KEY),
        AsyncStorage.getItem(USER_KEY),
      ]);

      if (authToken && userData) {
        setUser(JSON.parse(userData));
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Failed to load auth:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, role: UserRole, name: string) => {
    try {
      const newUser: User = {
        id: `user_${Date.now()}`,
        email,
        role,
        name,
      };

      const token = `demo_token_${Date.now()}`;

      await Promise.all([
        AsyncStorage.setItem(AUTH_KEY, token),
        AsyncStorage.setItem(USER_KEY, JSON.stringify(newUser)),
      ]);

      setUser(newUser);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Failed to login:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await Promise.all([
        AsyncStorage.removeItem(AUTH_KEY),
        AsyncStorage.removeItem(USER_KEY),
      ]);

      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  };

  const getAuthToken = async () => {
    return AsyncStorage.getItem(AUTH_KEY);
  };

  return {
    isAuthenticated,
    user,
    isLoading,
    login,
    logout,
    getAuthToken,
  };
});

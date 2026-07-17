import { useCallback } from 'react';
import { useAuthStore } from '../store/authStore.js';
import { authApi } from '../services/authApi.js';

export function useAuth() {
  const { user, accessToken, isAuthenticated, loading, hydrated } = useAuthStore();
  const { setAuth, clearAuth } = useAuthStore();

  const login = useCallback(async (email, password) => {
    const data = await authApi.login(email, password);
    setAuth(data.accessToken, data.user);
    return data;
  }, [setAuth]);

  const googleLogin = useCallback(async (credential) => {
    const data = await authApi.googleAuth(credential);
    setAuth(data.accessToken, data.user);
    return data;
  }, [setAuth]);

  const signup = useCallback(async (name, email, password) => {
    const data = await authApi.signup(name, email, password);
    return data;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      clearAuth();
    }
  }, [clearAuth]);

  return { user, accessToken, isAuthenticated, loading, hydrated, login, googleLogin, signup, logout };
}

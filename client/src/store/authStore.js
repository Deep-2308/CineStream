import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  loading: true,
  hydrated: false,

  setAuth: (accessToken, user) => set({
    accessToken,
    user,
    isAuthenticated: true,
    loading: false,
    hydrated: true,
  }),

  clearAuth: () => set({
    user: null,
    accessToken: null,
    isAuthenticated: false,
    loading: false,
    hydrated: true,
  }),

  setLoading: (loading) => set({ loading }),
}));

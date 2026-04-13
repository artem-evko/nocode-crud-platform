import { create } from 'zustand';
import { apiClient } from '../api/client';

interface AuthState {
    user: string | null;
    isAuthenticated: boolean;
    setUser: (user: string | null) => void;
    checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    isAuthenticated: false,
    setUser: (user) => set({ user, isAuthenticated: !!user }),
    checkAuth: async () => {
        try {
            const res = await apiClient.get('/auth/me');
            set({ user: res.data, isAuthenticated: true });
        } catch {
            set({ user: null, isAuthenticated: false });
        }
    }
}));

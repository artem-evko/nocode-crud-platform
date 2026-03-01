import { create } from 'zustand';

interface AuthState {
    user: string | null;
    isAuthenticated: boolean;
    setUser: (user: string | null) => void;
    checkAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    isAuthenticated: false,
    setUser: (user) => set({ user, isAuthenticated: !!user }),
    // checkAuth will be called on app init to see if we still have a valid session
    checkAuth: () => {
        // Here we could call an endpoint (e.g. /api/auth/me) to verify the session
    }
}));

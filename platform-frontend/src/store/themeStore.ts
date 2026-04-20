import { create } from 'zustand';

type Theme = 'light' | 'dark';

interface ThemeState {
    theme: Theme;
    toggleTheme: () => void;
    initTheme: () => void;
}

const applyTheme = (theme: Theme) => {
    if (theme === 'dark') {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
};

export const useThemeStore = create<ThemeState>((set, get) => ({
    theme: 'dark',
    toggleTheme: () => {
        const newTheme = get().theme === 'dark' ? 'light' : 'dark';
        localStorage.setItem('nocode-theme', newTheme);
        applyTheme(newTheme);
        set({ theme: newTheme });
    },
    initTheme: () => {
        const saved = localStorage.getItem('nocode-theme') as Theme | null;
        const theme = saved || 'dark';
        applyTheme(theme);
        set({ theme });
    },
}));

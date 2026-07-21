import { create } from 'zustand';

export const useThemeStore = create((set, get) => ({
  theme: typeof window !== 'undefined' ? localStorage.getItem('theme') || 'dark' : 'dark',
  
  toggleTheme: () => {
    const newTheme = get().theme === 'dark' ? 'light' : 'dark';
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', newTheme);
      document.documentElement.setAttribute('data-theme', newTheme);
    }
    set({ theme: newTheme });
  },
  
  initTheme: () => {
    if (typeof window === 'undefined') return;
    const saved = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', saved);
    set({ theme: saved });
  },
}));

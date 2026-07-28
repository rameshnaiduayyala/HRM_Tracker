import { create } from 'zustand';

export const useAuthStore = create((set, get) => ({
  token: localStorage.getItem('token') || null,
  refreshToken: localStorage.getItem('refreshToken') || null,
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  company: JSON.parse(localStorage.getItem('user') || 'null')?.company || JSON.parse(localStorage.getItem('company') || 'null'),

  setAuth: (token, user, refreshToken) => {
    localStorage.setItem('token', token);
    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken);
    }
    localStorage.setItem('user', JSON.stringify(user));
    if (user?.company) {
      localStorage.setItem('company', JSON.stringify(user.company));
    }
    set({ token, user, company: user?.company || get().company, ...(refreshToken && { refreshToken }) });
  },

  setCompany: (company) => {
    localStorage.setItem('company', JSON.stringify(company));
    const updatedUser = get().user ? { ...get().user, company } : null;
    if (updatedUser) {
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
    set({ company, user: updatedUser });
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('company');
    set({ token: null, refreshToken: null, user: null, company: null });
  },
}));

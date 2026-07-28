import { createSlice } from '@reduxjs/toolkit';

const initialTheme = typeof window !== 'undefined' ? localStorage.getItem('theme') || 'dark' : 'dark';
const initialUser = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || 'null') : null;
const initialCompany = typeof window !== 'undefined' ? (initialUser?.company || JSON.parse(localStorage.getItem('company') || 'null')) : null;

const initialState = {
  token: typeof window !== 'undefined' ? localStorage.getItem('token') || null : null,
  refreshToken: typeof window !== 'undefined' ? localStorage.getItem('refreshToken') || null : null,
  user: initialUser,
  company: initialCompany,
  theme: initialTheme,
  isAuthenticated: !!(typeof window !== 'undefined' ? localStorage.getItem('token') : false),
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuthCredentials: (state, action) => {
      const { token, refreshToken, user, company } = action.payload;
      state.token = token;
      state.user = user;
      state.isAuthenticated = true;

      if (refreshToken) {
        state.refreshToken = refreshToken;
        localStorage.setItem('refreshToken', refreshToken);
      }
      if (company || user?.company) {
        state.company = company || user.company;
        localStorage.setItem('company', JSON.stringify(state.company));
      }

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
    },

    setGlobalCompany: (state, action) => {
      state.company = action.payload;
      if (state.user) {
        state.user.company = action.payload;
        localStorage.setItem('user', JSON.stringify(state.user));
      }
      localStorage.setItem('company', JSON.stringify(action.payload));
    },

    setGlobalTheme: (state, action) => {
      const newTheme = action.payload;
      state.theme = newTheme;
      localStorage.setItem('theme', newTheme);
      document.documentElement.setAttribute('data-theme', newTheme);
      if (newTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    },

    logoutSession: (state) => {
      state.token = null;
      state.refreshToken = null;
      state.user = null;
      state.company = null;
      state.isAuthenticated = false;

      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      localStorage.removeItem('company');
    },
  },
});

export const { setAuthCredentials, setGlobalCompany, setGlobalTheme, logoutSession } = authSlice.actions;
export default authSlice.reducer;

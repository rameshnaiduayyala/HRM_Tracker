import axios from 'axios';
import { API_URL, LOCAL_STORAGE_JWT_KEY, LOCAL_STORAGE_REFRESH_KEY } from '../constants/appConstants';

const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(LOCAL_STORAGE_JWT_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor with token refresh mechanism
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem(LOCAL_STORAGE_REFRESH_KEY);
        if (refreshToken) {
          const response = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
          const { accessToken, newRefreshToken } = response.data;
          
          localStorage.setItem(LOCAL_STORAGE_JWT_KEY, accessToken);
          if (newRefreshToken) {
            localStorage.setItem(LOCAL_STORAGE_REFRESH_KEY, newRefreshToken);
          }
          
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // Clear tokens and dispatch logout event/redirect
        localStorage.removeItem(LOCAL_STORAGE_JWT_KEY);
        localStorage.removeItem(LOCAL_STORAGE_REFRESH_KEY);
        window.dispatchEvent(new Event('auth-session-expired'));
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;

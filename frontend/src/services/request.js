import axios from 'axios';
import toast from 'react-hot-toast';

const BASE_URL = 'http://localhost:5000/api/v1';

// Create Axios Instance
export const axiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Generates simple unique correlation ID
const generateCorrelationId = () => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
};

// Request Interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    // 1. Inject Auth token
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    // 2. Inject Tenant ID from logged-in user if available
    const userJson = localStorage.getItem('user');
    if (userJson) {
      try {
        const user = JSON.parse(userJson);
        if (user && user.tenantId) {
          config.headers['x-tenant-id'] = user.tenantId;
        }
      } catch (e) {
        // Ignore parse error
      }
    }

    // 3. Inject Correlation ID
    config.headers['x-correlation-id'] = generateCorrelationId();

    // 4. Inject Idempotency Key for mutating requests
    if (['post', 'put', 'patch', 'delete'].includes(config.method?.toLowerCase())) {
      config.headers['x-idempotency-key'] = `${config.method?.toUpperCase()}-${generateCorrelationId()}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor with Token Refresh and Offline handling
axiosInstance.interceptors.response.use(
  (response) => {
    return response.data;
  },
  async (error) => {
    const originalRequest = error.config;

    // 1. Offline Detection
    if (!window.navigator.onLine) {
      toast.error('You are currently offline. Please check your network connection.', { id: 'network-offline' });
      return Promise.reject(new Error('Network error: Offline'));
    }

    // Check if company deactivated
    const errMsg = error.response?.data?.message || '';
    const isDeactivated = 
      errMsg.toLowerCase().includes('deactivated') || 
      errMsg.toLowerCase().includes('not active') ||
      errMsg.toLowerCase().includes('suspended');

    if (isDeactivated) {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      toast.error('Your company workspace has been deactivated.', { id: 'workspace-deactivated', duration: 5000 });
      setTimeout(() => {
        window.location.href = '/login?deactivated=1';
      }, 1500);
      return Promise.reject(error);
    }

    // 2. Token Expired (401) handling
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers['Authorization'] = `Bearer ${token}`;
            return axiosInstance(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        // No refresh token, force logout
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login?expired=1';
        return Promise.reject(error);
      }

      try {
        const refreshResponse = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
        const { accessToken: newAccessToken, refreshToken: newRefreshToken } = refreshResponse.data.data;

        localStorage.setItem('token', newAccessToken);
        localStorage.setItem('refreshToken', newRefreshToken);

        processQueue(null, newAccessToken);
        isRefreshing = false;

        originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        isRefreshing = false;

        // Refresh failed, clear session
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        toast.error('Session expired. Please log in again.', { id: 'session-expired' });
        setTimeout(() => {
          window.location.href = '/login?expired=1';
        }, 1500);
        return Promise.reject(refreshError);
      }
    }

    // Reject with api response message and attach original error details
    const apiErr = new Error(errMsg || 'API request failed');
    apiErr.response = error.response;
    return Promise.reject(apiErr);
  }
);

// Map old fetch-like `api` interface to Axios client calls
export const api = {
  get:    (path, options) => axiosInstance.get(path, options),
  post:   (path, data, options) => axiosInstance.post(path, data, options),
  put:    (path, data, options) => axiosInstance.put(path, data, options),
  patch:  (path, data, options) => axiosInstance.patch(path, data, options),
  delete: (path, options) => axiosInstance.delete(path, options),
};

export const request = async (path, options = {}) => {
  const method = options.method || 'GET';
  const data = options.body ? JSON.parse(options.body) : undefined;
  return axiosInstance({
    url: path,
    method,
    data,
    headers: options.headers,
  });
};

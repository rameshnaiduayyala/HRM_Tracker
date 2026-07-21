import toast from 'react-hot-toast';

const BASE_URL = 'http://localhost:5000/api/v1';

// Prevent multiple simultaneous 401s from triggering multiple toasts/redirects
let isRedirectingToLogin = false;

const handleTokenExpired = (isDeactivated = false) => {
  if (isRedirectingToLogin) return;
  isRedirectingToLogin = true;

  // Clear auth data
  localStorage.removeItem('token');
  localStorage.removeItem('user');

  if (isDeactivated) {
    toast.error('Your company workspace has been deactivated.', {
      id: 'workspace-deactivated',
      duration: 5000,
    });
  } else {
    toast.error('Your session has expired. Please log in again.', {
      id: 'session-expired',
      duration: 4000,
    });
  }

  // Hard redirect after a short delay so the toast is visible
  setTimeout(() => {
    isRedirectingToLogin = false;
    window.location.href = isDeactivated ? '/login?deactivated=1' : '/login?expired=1';
  }, 1500);
};

export const request = async (path, options = {}) => {
  const token = localStorage.getItem('token');

  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    const errMsg = errData.message || '';

    const isDeactivated = 
      errMsg.toLowerCase().includes('deactivated') || 
      errMsg.toLowerCase().includes('not active') ||
      errMsg.toLowerCase().includes('suspended');

    if (response.status === 401 || isDeactivated) {
      handleTokenExpired(isDeactivated);
      throw new Error(errMsg || 'Session expired. Redirecting to login...');
    }

    throw new Error(errMsg || 'API request failed');
  }

  return response.json();
};

export const api = {
  get:    (path, options) => request(path, { method: 'GET', ...options }),
  post:   (path, data, options) => request(path, { method: 'POST', body: JSON.stringify(data), ...options }),
  put:    (path, data, options) => request(path, { method: 'PUT', body: JSON.stringify(data), ...options }),
  patch:  (path, data, options) => request(path, { method: 'PATCH', body: JSON.stringify(data), ...options }),
  delete: (path, options) => request(path, { method: 'DELETE', ...options }),
};


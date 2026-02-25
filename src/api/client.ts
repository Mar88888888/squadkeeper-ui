import axios from 'axios';
import { config } from '../config';

export const apiClient = axios.create({
  baseURL: config.apiBaseUrl,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const setAuthToken = (token: string | null) => {
  if (token) {
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete apiClient.defaults.headers.common['Authorization'];
  }
};

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const method = error.config?.method?.toUpperCase() ?? 'UNKNOWN';
    const url = error.config?.url ?? 'unknown';
    const status = error.response?.status;
    const message = error.response?.data?.message ?? error.message;

    if (status === 401) {
      console.warn(`[API] ${method} ${url} - 401 Unauthorized, redirecting to login`);
      sessionStorage.removeItem('token');
      setAuthToken(null);
      window.location.href = '/login';
    } else if (status) {
      console.error(`[API] ${method} ${url} - ${status}: ${message}`);
    } else {
      console.error(`[API] ${method} ${url} - Network error: ${message}`);
    }

    return Promise.reject(error);
  }
);

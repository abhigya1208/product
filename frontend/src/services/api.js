import axios from 'axios';
import { API_URL } from '../utils/constants';

const api = axios.create({ baseURL: API_URL });

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ags_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally — redirect to login
// EXCEPT for /ai/ routes which use optionalAuth and should not force redirect
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      const requestUrl = err.config?.url || '';
      // Don't redirect for AI chat routes — they use optional authentication
      if (!requestUrl.includes('/ai/')) {
        localStorage.removeItem('ags_token');
        localStorage.removeItem('ags_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export default api;

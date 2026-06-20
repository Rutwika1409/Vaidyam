import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
});

api.interceptors.request.use(config => {
  const user = JSON.parse(localStorage.getItem('vaidyam_user') || '{}');
  if (user?.id) {
    config.headers['X-User-Id'] = user.id;
  }
  return config;
});

api.interceptors.response.use(
  response => response,
  err => {
    if (err.response?.status === 404 && err.config.url.includes('/users/') && window.location.pathname !== '/auth') {
      localStorage.clear();
      window.location.href = '/auth';
    }
    return Promise.reject(err);
  }
);

export default api;

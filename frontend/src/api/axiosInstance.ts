import axios from 'axios';

const API_BASE_URL = 'http://localhost:5243/api'; // Make sure this matches your backend port

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
});

// Request interceptor: add JWT token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor: handle global errors like 401
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized, could log out user or clear token
      console.warn("Unauthorized access - maybe token expired.");
      // Optional: window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;

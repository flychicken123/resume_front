import axios from 'axios';
import { getAPIBaseURL } from '../api';

// Create axios instance
const axiosInstance = axios.create({
  baseURL: getAPIBaseURL(),
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to add auth token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('resumeToken');
    if (token && token !== 'undefined' && token !== 'null') {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle 401 errors
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      // Session expired or invalid token
      console.log('Session expired - logging out user');
      
      // Clear localStorage
      localStorage.removeItem('resumeUser');
      localStorage.removeItem('resumeToken');
      
      // Redirect to login page
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
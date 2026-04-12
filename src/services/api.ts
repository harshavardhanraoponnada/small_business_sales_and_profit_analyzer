import axios, { AxiosInstance, AxiosError, AxiosResponse } from 'axios';
import { ApiResponse, ApiError } from '@/types';

/**
 * API Base URL configuration
 */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

let isRedirectingToLogin = false;

const clearAuthSession = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

const redirectToLogin = () => {
  if (typeof window === 'undefined') {
    return;
  }

  if (window.location.pathname === '/login' || isRedirectingToLogin) {
    return;
  }

  isRedirectingToLogin = true;
  window.location.assign('/login');
};

const isAuthFailure = (error: AxiosError<ApiResponse>): boolean => {
  const status = error?.response?.status;
  const message = String(error?.response?.data?.message || '').toLowerCase();

  if (status === 401) {
    return true;
  }

  // Backend uses 403 for expired JWT in auth middleware.
  return status === 403 && message.includes('invalid or expired token');
};

/**
 * Create Axios instance with default configuration
 */
const createApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  /**
   * Request interceptor - Add JWT token to Authorization header
   */
  client.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('token');
      if (token && token !== 'undefined' && token !== 'null') {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  /**
   * Response interceptor - Handle errors and redirect on 401
   */
  client.interceptors.response.use(
    (response) => response,
    (error: AxiosError<ApiResponse>) => {
      if (isAuthFailure(error)) {
        clearAuthSession();
        redirectToLogin();
        return Promise.reject(error);
      }

      // Handle 403 Forbidden
      if (error?.response?.status === 403) {
        console.error('Access denied:', error.response.data?.message);
      }

      // Handle 500 Server errors
      if (error?.response?.status === 500) {
        console.error('Server error:', error.response.data?.message);
      }

      return Promise.reject(error);
    }
  );

  return client;
};

/**
 * Singleton API client instance
 */
export const apiClient = createApiClient();

/**
 * Typed GET request
 */
export const apiGet = async <T = any>(
  url: string,
  config?: any
): Promise<ApiResponse<T>> => {
  try {
    const response = await apiClient.get<ApiResponse<T>>(url, config);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Typed POST request
 */
export const apiPost = async <T = any, D = any>(
  url: string,
  data?: D,
  config?: any
): Promise<ApiResponse<T>> => {
  try {
    const response = await apiClient.post<ApiResponse<T>>(url, data, config);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Typed PUT request
 */
export const apiPut = async <T = any, D = any>(
  url: string,
  data?: D,
  config?: any
): Promise<ApiResponse<T>> => {
  try {
    const response = await apiClient.put<ApiResponse<T>>(url, data, config);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Typed DELETE request
 */
export const apiDelete = async <T = any>(
  url: string,
  config?: any
): Promise<ApiResponse<T>> => {
  try {
    const response = await apiClient.delete<ApiResponse<T>>(url, config);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Typed PATCH request
 */
export const apiPatch = async <T = any, D = any>(
  url: string,
  data?: D,
  config?: any
): Promise<ApiResponse<T>> => {
  try {
    const response = await apiClient.patch<ApiResponse<T>>(url, data, config);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Error handler - Convert axios errors to typed ApiError
 */
const handleApiError = (error: any): ApiError => {
  if (axios.isAxiosError(error)) {
    return {
      message:
        error.response?.data?.message ||
        (error.response?.data as any)?.error ||
        error.message ||
        'An error occurred',
      status: error.response?.status || 500,
      code: error.code,
      details: error.response?.data,
    };
  }

  return {
    message: error?.message || 'An unexpected error occurred',
    status: 500,
  };
};

/**
 * Typed API endpoints object for better organization
 */
export const endpoints = {
  // Auth
  auth: {
    login: '/auth/login',
    logout: '/auth/logout',
    register: '/auth/register',
    me: '/auth/me',
  },

  // Products
  products: {
    list: '/products',
    get: (id: string | number) => `/products/${id}`,
    create: '/products',
    update: (id: string | number) => `/products/${id}`,
    delete: (id: string | number) => `/products/${id}`,
  },

  // Sales
  sales: {
    list: '/sales',
    get: (id: string | number) => `/sales/${id}`,
    create: '/sales',
    update: (id: string | number) => `/sales/${id}`,
    delete: (id: string | number) => `/sales/${id}`,
  },

  // Expenses
  expenses: {
    list: '/expenses',
    get: (id: string | number) => `/expenses/${id}`,
    create: '/expenses',
    update: (id: string | number) => `/expenses/${id}`,
    delete: (id: string | number) => `/expenses/${id}`,
    upload: '/expenses/upload',
    categories: '/expenses/categories',
    metadata: '/expenses/metadata',
  },

  // Categories
  categories: {
    list: '/categories',
    get: (id: string | number) => `/categories/${id}`,
    create: '/categories',
    update: (id: string | number) => `/categories/${id}`,
    delete: (id: string | number) => `/categories/${id}`,
  },

  // Brands
  brands: {
    list: '/brands',
    get: (id: string | number) => `/brands/${id}`,
    create: '/brands',
    update: (id: string | number) => `/brands/${id}`,
    delete: (id: string | number) => `/brands/${id}`,
  },

  // Variants
  variants: {
    list: '/variants',
    get: (id: string | number) => `/variants/${id}`,
    create: '/variants',
    update: (id: string | number) => `/variants/${id}`,
    delete: (id: string | number) => `/variants/${id}`,
  },

  // Users
  users: {
    list: '/auth/users',
    get: (id: string | number) => `/auth/users/${id}`,
    create: '/auth/add-user',
    update: (id: string | number) => `/auth/update-user/${id}`,
    delete: (id: string | number) => `/auth/delete-user/${id}`,
  },

  // User Preferences
  userPreferences: {
    current: '/users/preferences/reports',
    get: (id: string | number) => `/users/${id}/preferences/reports`,
    update: (id: string | number) => `/users/${id}/preferences/reports`,
  },

  // Audit Logs
  auditLogs: {
    list: '/audit',
    get: (id: string | number) => `/audit/${id}`,
  },

  // ML/Predictions
  predictions: {
    list: '/predictions',
    forecast: '/predictions/forecast',
    generate: '/predictions/generate',
  },

  // Reports
  reports: {
    generate: '/reports/generate',
    schedule: '/reports/schedule',
    list: '/reports',
  },
};

/**
 * Default export for backwards compatibility
 */
export default apiClient;

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DEFAULT_API_URL = 'https://api-qrcode-8clv.onrender.com';

async function resolveBaseUrl() {
  try {
    const stored = await AsyncStorage.getItem('api_url');
    return stored || DEFAULT_API_URL;
  } catch (e) {
    return DEFAULT_API_URL;
  }
}

const api = axios.create({
  baseURL: DEFAULT_API_URL,
  timeout: 10000,
});

export async function setApiUrl(url) {
  await AsyncStorage.setItem('api_url', url);
  api.defaults.baseURL = url;
}

resolveBaseUrl().then((url) => {
  api.defaults.baseURL = url;
});

// Interceptor para adicionar token automaticamente
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('qr_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor para tratar erros
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expirado
      await AsyncStorage.removeItem('qr_token');
      await AsyncStorage.removeItem('device_id');
      // Redirecionar para login seria aqui
    }
    return Promise.reject(error);
  }
);

export default api;
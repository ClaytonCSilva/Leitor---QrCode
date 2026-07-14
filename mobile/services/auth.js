import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const authService = {
  async login(username, password) {
    try {
      const response = await api.post('/api/auth/login', {
        username,
        password,
      });

      return response.data;
    } catch (error) {
      console.log('========== LOGIN ERROR ==========');
      console.log(error);
      console.log('response:', error.response?.data);
      console.log('status:', error.response?.status);
      console.log('request:', error.request);
      console.log('config:', error.config);
      console.log('=================================');

      throw new Error(error.response?.data?.error || 'Erro ao autenticar com a API');
    }
  },

  async registerDevice(name) {
    try {
      const response = await api.post('/api/devices/register', {
        name,
        device_type: 'mobile'
      });
      const { device_id } = response.data;

      await AsyncStorage.setItem('device_id', device_id);

      return device_id;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Erro ao registrar dispositivo');
    }
  },

  async logout() {
    await AsyncStorage.removeItem('qr_token');
    await AsyncStorage.removeItem('device_id');
  },

  async getStoredToken() {
    return await AsyncStorage.getItem('qr_token');
  },

  async getStoredDeviceId() {
    return await AsyncStorage.getItem('device_id');
  },
};
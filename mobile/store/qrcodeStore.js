import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useQRCodeStore = create((set) => ({
  // State
  token: null,
  deviceId: null,
  readings: [],
  isLoading: false,
  error: null,
  apiUrl: process.env.EXPO_PUBLIC_API_URL || process.env.REACT_APP_API_URL || null,

  // Actions
  setToken: (token) => set({ token }),
  setDeviceId: (deviceId) => set({ deviceId }),
  setReadings: (readings) => set({ readings }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),

  addReading: (reading) => set((state) => ({
    readings: [reading, ...state.readings].filter(Boolean)
  })),

  clearError: () => set({ error: null }),

  // Persistência
  loadFromStorage: async () => {
    try {
      const token = await AsyncStorage.getItem('qr_token');
      const deviceId = await AsyncStorage.getItem('device_id');
      const storedReadings = await AsyncStorage.getItem('readings');
      set({ token, deviceId, readings: storedReadings ? JSON.parse(storedReadings) : [] });
    } catch (error) {
      console.error('Error loading from storage:', error);
    }
  },

  saveToStorage: async (token, deviceId) => {
    try {
      await AsyncStorage.setItem('qr_token', token);
      await AsyncStorage.setItem('device_id', deviceId);
      set({ token, deviceId });
    } catch (error) {
      console.error('Error saving to storage:', error);
    }
  }
}));
useQRCodeStore.subscribe((state) => {
  AsyncStorage.setItem('readings', JSON.stringify(state.readings || [])).catch(() => {});
});

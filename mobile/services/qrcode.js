import api from './api';

export const qrcodeService = {
  async registerQRCode(qrData, deviceId, latitude, longitude, token) {
    try {
      const response = await api.post('/api/qr/register', {
        qr_data: qrData,
        device_id: deviceId,
        latitude,
        longitude,
      }, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || error.message || 'Erro ao registrar QR code');
    }
  },

  async getHistory(deviceId, limit = 50, offset = 0) {
    try {
      const response = await api.get('/api/qr/history', {
        params: { device_id: deviceId, limit, offset },
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Erro ao buscar histórico');
    }
  },

  async getStats(deviceId) {
    try {
      const response = await api.get('/api/qr/stats', {
        params: { device_id: deviceId },
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Erro ao buscar estatísticas');
    }
  },

  async deleteReading(readingId) {
    try {
      const response = await api.delete(`/api/qr/${readingId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Erro ao deletar leitura');
    }
  },

  async searchByDate(startDate, endDate, deviceId) {
    try {
      const response = await api.get('/api/qr/search', {
        params: {
          start_date: startDate,
          end_date: endDate,
          device_id: deviceId,
        },
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Erro ao buscar por data');
    }
  },
};
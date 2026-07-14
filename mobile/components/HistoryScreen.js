import React, { useState, useEffect } from 'react';
import {
  View,
  FlatList,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import api from '../services/api';
import { useQRCodeStore } from '../store/qrcodeStore';

export function HistoryScreen() {
  const { readings, token, deviceId, setReadings, isLoading, setLoading } = useQRCodeStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchReadings();
  }, [deviceId, token]);

  const fetchReadings = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/qr/history', {
        params: { device_id: deviceId, limit: 100 },
        headers: { Authorization: `Bearer ${token}` }
      });
      setReadings(response.data.data);
    } catch (error) {
      console.error('Erro ao buscar histórico:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchReadings();
    setRefreshing(false);
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString('pt-BR');
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/api/qr/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReadings(readings.filter(r => r.id !== id));
    } catch (error) {
      console.error('Erro ao deletar:', error);
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {item.qr_data}
        </Text>
      </View>

      <Text style={styles.cardMeta}>
        📅 {formatDate(item.timestamp)}
      </Text>

      {item.latitude && item.longitude && (
        <Text style={styles.cardMeta}>
          📍 {item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}
        </Text>
      )}

      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDelete(item.id)}
      >
        <Text style={styles.deleteButtonText}>Deletar</Text>
      </TouchableOpacity>
    </View>
  );

  if (isLoading && readings.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={readings}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.centerContainer}>
            <Text style={styles.emptyText}>Nenhum QR code escaneado</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  cardHeader: {
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  cardMeta: {
    fontSize: 12,
    color: '#666',
    marginTop: 6,
  },
  deleteButton: {
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#FF3B30',
    borderRadius: 6,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
});
import React, {useState, useEffect} from 'react';
import {View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView} from 'react-native';
import {useQRCodeStore} from '../store/qrcodeStore';

export function DashboardScreen() {
  const {readings} = useQRCodeStore();
  const [sortedReadings, setSortedReadings] = useState([]);
  const [filter, setFilter] = useState('all'); // all | today | week | month
  const [filteredReadings, setFilteredReadings] = useState([]);

  useEffect(() => {
    const sorted = [...readings].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    setSortedReadings(sorted);
  }, [readings]);

  useEffect(() => {
    const now = new Date();

    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const filtered = sortedReadings.filter((r) => {
      const ts = new Date(r.timestamp);
      if (filter === 'today') return ts >= startOfToday;
      if (filter === 'week') return ts >= startOfWeek;
      if (filter === 'month') return ts >= startOfMonth;
      return true; // all
    });

    setFilteredReadings(filtered);
  }, [sortedReadings, filter]);

  const renderItem = ({item}) => (
    <View style={styles.item}>
      <Text style={styles.text}>Data: {new Date(item.timestamp).toLocaleDateString('pt-BR')}</Text>
      <Text style={styles.text}>Horário: {new Date(item.timestamp).toLocaleTimeString('pt-BR')}</Text>
      {item.latitude && item.longitude && (
        <Text style={styles.text}>Location: {item.latitude}, {item.longitude}</Text>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dashboard</Text>

      <View style={styles.countRow}>
        <Text style={styles.countText}>Total: {filteredReadings.length}</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
        {[
          {key: 'all', label: 'Todos'},
          {key: 'today', label: 'Hoje'},
          {key: 'week', label: 'Semana'},
          {key: 'month', label: 'Mês'},
        ].map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterBtn, filter === f.key && styles.filterBtnActive]}
            onPress={() => setFilter(f.key)}
          >
            <Text style={[styles.filterText, filter === f.key && styles.filterTextActive]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        data={filteredReadings}
        renderItem={renderItem}
        keyExtractor={(item, index) => index.toString()}
        ListEmptyComponent={<Text style={styles.text}>Nenhum QR Code lido no período selecionado.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  item: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  text: {
    fontSize: 16,
  },
  countRow: {
    marginBottom: 10,
  },
  countText: {
    fontSize: 18,
    fontWeight: '600',
  },
  filterRow: {
    marginBottom: 12,
  },
  filterBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ccc',
    marginRight: 8,
    backgroundColor: '#fff',
  },
  filterBtnActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  filterText: {
    fontSize: 14,
    color: '#333',
  },
  filterTextActive: {
    color: '#fff',
  },
});
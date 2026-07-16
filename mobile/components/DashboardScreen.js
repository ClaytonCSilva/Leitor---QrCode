import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useQRCodeStore } from '../store/qrcodeStore';

const COLORS = {
  primary: '#2563EB',
  primaryDark: '#1E40AF',
  success: '#10B981',
  background: '#F8FAFC',
  card: '#FFFFFF',
  text: '#1E293B',
  textSecondary: '#64748B',
  border: '#E2E8F0',
  divider: '#CBD5E1',
};

export function DashboardScreen() {
  const { readings } = useQRCodeStore();
  const [sortedReadings, setSortedReadings] = useState([]);
  const [filter, setFilter] = useState('all');
  const [filteredReadings, setFilteredReadings] = useState([]);
  const [stats, setStats] = useState({
    today: 0,
    week: 0,
    month: 0,
    total: 0,
  });

  useEffect(() => {
    const sorted = [...readings].sort(
      (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
    );
    setSortedReadings(sorted);

    // Calcular estatísticas
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const todayCount = sorted.filter((r) => new Date(r.timestamp) >= startOfToday).length;
    const weekCount = sorted.filter((r) => new Date(r.timestamp) >= startOfWeek).length;
    const monthCount = sorted.filter((r) => new Date(r.timestamp) >= startOfMonth).length;

    setStats({
      today: todayCount,
      week: weekCount,
      month: monthCount,
      total: sorted.length,
    });
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
      return true;
    });

    setFilteredReadings(filtered);
  }, [sortedReadings, filter]);

  const StatCard = ({ label, value, subtext }) => (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      {subtext && <Text style={styles.statSubtext}>{subtext}</Text>}
    </View>
  );

  const renderItem = ({ item }) => (
    <View style={styles.itemContainer}>
      <View style={styles.itemHeader}>
        <View style={styles.itemIndexCircle}>
          <Text style={styles.itemIndex}>📱</Text>
        </View>
        <View style={styles.itemHeaderContent}>
          <Text style={styles.itemDate}>
            {new Date(item.timestamp).toLocaleDateString('pt-BR', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
          <Text style={styles.itemTime}>
             {new Date(item.timestamp).toLocaleTimeString('pt-BR', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            })}
          </Text>
        </View>
      </View>

      {item.latitude && item.longitude && (
        <View style={styles.itemLocation}>
          <Text style={styles.itemLocationIcon}>📍</Text>
          <Text style={styles.itemLocationText}>
            {item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}
          </Text>
        </View>
      )}

      {item.data && (
        <View style={styles.itemData}>
          <Text style={styles.itemDataLabel}>Dados:</Text>
          <Text style={styles.itemDataValue} numberOfLines={2}>
            {item.data}
          </Text>
        </View>
      )}

      <View style={styles.itemStatus}>
        <View style={styles.statusBadge}>
          <Text style={styles.statusDot}>✓</Text>
          <Text style={styles.statusText}>Leitura Bem-sucedida</Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Análise de QR Codes</Text>
          <Text style={styles.headerSubtitle}>
            Acompanhe todas as leituras realizadas
          </Text>
        </View>

        {/* Statistics Cards */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.statsContainer}
        >
          <StatCard
            label="Total de Leituras"
            value={stats.total}
            subtext="Desde o início"
          />
          <StatCard
            label="Este Mês"
            value={stats.month}
            subtext={`${stats.month} leitura${stats.month !== 1 ? 's' : ''}`}
          />
          <StatCard
            label="Esta Semana"
            value={stats.week}
            subtext={`${stats.week} leitura${stats.week !== 1 ? 's' : ''}`}
          />
          <StatCard
            label="Hoje"
            value={stats.today}
            subtext={`${stats.today} leitura${stats.today !== 1 ? 's' : ''}`}
          />
        </ScrollView>

        {/* Filter Section */}
        <View style={styles.filterSection}>
          <Text style={styles.filterLabel}>Filtrar por período:</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterRow}
          >
            {[
              { key: 'all', label: 'Todos', icon: '📋' },
              { key: 'today', label: 'Hoje', icon: '📅' },
              { key: 'week', label: 'Semana', icon: '📆' },
              { key: 'month', label: 'Mês', icon: '🗓️' },
            ].map((f) => (
              <TouchableOpacity
                key={f.key}
                style={[
                  styles.filterBtn,
                  filter === f.key && styles.filterBtnActive,
                ]}
                onPress={() => setFilter(f.key)}
                activeOpacity={0.7}
              >
                <Text style={styles.filterIcon}>{f.icon}</Text>
                <Text
                  style={[
                    styles.filterText,
                    filter === f.key && styles.filterTextActive,
                  ]}
                >
                  {f.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Results Summary */}
        <View style={styles.summaryContainer}>
          <Text style={styles.summaryText}>
            Mostrando{' '}
            <Text style={styles.summaryHighlight}>
              {filteredReadings.length}
            </Text>{' '}
            {filteredReadings.length !== 1 ? 'leitura' : 'leitura'}
          </Text>
        </View>

        {/* List */}
        {filteredReadings.length > 0 ? (
          <FlatList
            scrollEnabled={false}
            data={filteredReadings}
            renderItem={renderItem}
            keyExtractor={(item, index) => `${item.timestamp}-${index}`}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🔍</Text>
            <Text style={styles.emptyText}>
              Nenhum QR Code lido neste período
            </Text>
            <Text style={styles.emptySubtext}>
              Escaneie um código QR para começar
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // Header
  header: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 6,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },

  // Statistics
  statsContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
    gap: 12,
  },
  statCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 16,
    minWidth: 140,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  statSubtext: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },

  // Filter Section
  filterSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  filterLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  filterRow: {
    gap: 10,
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  filterBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterIcon: {
    fontSize: 16,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  filterTextActive: {
    color: COLORS.card,
  },

  // Summary
  summaryContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  summaryText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  summaryHighlight: {
    color: COLORS.primary,
    fontWeight: '700',
  },

  // List Items
  itemContainer: {
    marginHorizontal: 20,
    marginBottom: 12,
    backgroundColor: COLORS.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  itemIndexCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  itemIndex: {
    fontSize: 20,
  },
  itemHeaderContent: {
    flex: 1,
  },
  itemDate: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    textTransform: 'capitalize',
    marginBottom: 4,
  },
  itemTime: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },

  // Item Location
  itemLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.background,
    gap: 8,
  },
  itemLocationIcon: {
    fontSize: 16,
  },
  itemLocationText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
    flex: 1,
  },

  // Item Data
  itemData: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  itemDataLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  itemDataValue: {
    fontSize: 13,
    color: COLORS.text,
    fontFamily: 'Courier New',
    backgroundColor: COLORS.background,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
  },

  // Item Status
  itemStatus: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    fontSize: 16,
    color: COLORS.success,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.success,
  },

  // Empty State
  emptyContainer: {
    marginHorizontal: 20,
    marginTop: 40,
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});
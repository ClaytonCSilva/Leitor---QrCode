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
  Dimensions,
  Image,
} from 'react-native';
import { useQRCodeStore } from '../store/qrcodeStore';

const COLORS = {
  primary: '#2D5A3D',      // Verde floresta
  primaryLight: '#4A7C59',  // Verde claro
  success: '#10B981',       // Verde sucesso
  warning: '#F59E0B',       // Âmbar (médio)
  danger: '#EF4444',        // Vermelho (grave)
  background: '#F9FAFB',
  card: '#FFFFFF',
  text: '#1F2937',
  textSecondary: '#6B7280',
  border: '#E5E7EB',
  divider: '#D1D5DB',
  badge: '#E0F2FE',
};

const MARKER_CONFIG = {
  grave: { label: 'Grave', color: COLORS.danger, icon: '⚠️' },
  medio: { label: 'Médio', color: COLORS.warning, icon: '📋' },
  curto: { label: 'Curto', color: COLORS.success, icon: '✓' },
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
    byMarker: { grave: 0, medio: 0, curto: 0 },
    byCollaborator: {},
  });
  const [selectedCollaborator, setSelectedCollaborator] = useState(null);

  // Ordenar leituras por timestamp
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

    // Por marcador
    const byMarker = { grave: 0, medio: 0, curto: 0 };
    sorted.forEach((r) => {
      if (r.marker in byMarker) byMarker[r.marker]++;
    });

    // Por colaborador
    const byCollaborator = {};
    sorted.forEach((r) => {
      if (!byCollaborator[r.name]) {
        byCollaborator[r.name] = { count: 0, markers: { grave: 0, medio: 0, curto: 0 } };
      }
      byCollaborator[r.name].count++;
      if (r.marker in byCollaborator[r.name].markers) {
        byCollaborator[r.name].markers[r.marker]++;
      }
    });

    setStats({
      today: todayCount,
      week: weekCount,
      month: monthCount,
      total: sorted.length,
      byMarker,
      byCollaborator,
    });
  }, [readings]);

  // Filtrar leituras
  useEffect(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    let filtered = [...sortedReadings];

    // Filtro por período
    if (filter === 'today') {
      filtered = filtered.filter((r) => new Date(r.timestamp) >= startOfToday);
    } else if (filter === 'week') {
      filtered = filtered.filter((r) => new Date(r.timestamp) >= startOfWeek);
    } else if (filter === 'month') {
      filtered = filtered.filter((r) => new Date(r.timestamp) >= startOfMonth);
    }

    // Filtro por colaborador
    if (selectedCollaborator) {
      filtered = filtered.filter((r) => r.name === selectedCollaborator);
    }

    setFilteredReadings(filtered);
  }, [sortedReadings, filter, selectedCollaborator]);

  const KPICard = ({ label, value, unit = '', icon = '📊', trend = null }) => (
    <View style={styles.kpiCard}>
      <View style={styles.kpiHeader}>
        <Text style={styles.kpiIcon}>{icon}</Text>
        <Text style={styles.kpiLabel}>{label}</Text>
      </View>
      <View style={styles.kpiValue}>
        <Text style={styles.kpiNumber}>{value}</Text>
        {unit && <Text style={styles.kpiUnit}>{unit}</Text>}
      </View>
      {trend && <Text style={styles.kpiTrend}>{trend}</Text>}
    </View>
  );

  const MarkerBadge = ({ marker, count }) => {
    const config = MARKER_CONFIG[marker];
    return (
      <View style={[styles.markerBadge, { borderLeftColor: config.color }]}>
        <Text style={styles.markerIcon}>{config.icon}</Text>
        <View style={styles.markerContent}>
          <Text style={styles.markerLabel}>{config.label}</Text>
          <Text style={styles.markerCount}>{count} bandeja{count !== 1 ? 's' : ''}</Text>
        </View>
      </View>
    );
  };

  const CollaboratorCard = ({ name, data, photoUrl }) => (
    <TouchableOpacity
      style={[styles.collaboratorCard, selectedCollaborator === name && styles.collaboratorCardActive]}
      onPress={() => setSelectedCollaborator(selectedCollaborator === name ? null : name)}
    >
      <View style={styles.collaboratorHeader}>
        {photoUrl ? (
          <Image source={{ uri: photoUrl }} style={styles.collaboratorAvatarImage} />
        ) : (
          <View style={styles.collaboratorAvatar}>
            <Text style={styles.collaboratorInitial}>
              {name?.charAt(0)?.toUpperCase() || '?'}
            </Text>
          </View>
        )}
        <View style={styles.collaboratorInfo}>
          <Text style={styles.collaboratorName}>{name}</Text>
          <Text style={styles.collaboratorTotal}>
            {data.count} bandeja{data.count !== 1 ? 's' : ''}
          </Text>
        </View>
      </View>
      <View style={styles.collaboratorMarkers}>
        {Object.entries(data.markers).map(([marker, count]) => 
          count > 0 && (
            <View
              key={marker}
              style={[
                styles.markerIndicator,
                { backgroundColor: MARKER_CONFIG[marker].color },
              ]}
            >
              <Text style={styles.markerIndicatorText}>{count}</Text>
            </View>
          )
        )}
      </View>
    </TouchableOpacity>
  );

  const renderReadingItem = ({ item }) => {
    const markerConfig = MARKER_CONFIG[item.marker] || {};
    return (
      <View style={styles.readingCard}>
        <View style={styles.readingHeader}>
          <View style={styles.readingInfo}>
            <Text style={styles.readingName}>{item.name}</Text>
            <Text style={styles.readingTime}>
              {new Date(item.timestamp).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>
          <View
            style={[styles.markerPill, { backgroundColor: markerConfig.color }]}
          >
            <Text style={styles.markerPillText}>{markerConfig.label}</Text>
          </View>
        </View>

        {item.matricula && (
          <View style={styles.readingMeta}>
            <Text style={styles.readingMetaLabel}>Matrícula:</Text>
            <Text style={styles.readingMetaValue}>{item.matricula}</Text>
          </View>
        )}

        {item.qr_data && (
          <View style={styles.readingMeta}>
            <Text style={styles.readingMetaLabel}>QR Code:</Text>
            <Text style={styles.readingMetaValue} numberOfLines={1}>
              {item.qr_data}
            </Text>
          </View>
        )}

        <View style={styles.readingFooter}>
          <Text style={styles.readingDate}>
            {new Date(item.timestamp).toLocaleDateString('pt-BR')}
          </Text>
        </View>
      </View>
    );
  };

  const collaboratorList = Object.entries(stats.byCollaborator)
    .map(([name, data]) => {
      const firstReading = [...readings].find((reading) => reading.name === name);
      return {
        name,
        data,
        photoUrl: firstReading?.foto_url || firstReading?.photo_url || null,
      };
    })
    .sort((a, b) => b.data.count - a.data.count);

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
          <View style={styles.headerBrand}>
            <Image
              source={require('../assets/logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.headerTitle}>Viveiro Eucapinus</Text>
          </View>
          <Text style={styles.headerSubtitle}>
            Rastreabilidade de plantações
          </Text>
        </View>

        {/* KPI Section */}
        <View style={styles.kpiSection}>
          <View style={styles.kpiRow}>
            <View style={styles.kpiHalf}>
              <KPICard
                label="Hoje"
                value={stats.today}
                unit="bandejas"
                icon="📅"
              />
            </View>
            <View style={styles.kpiHalf}>
              <KPICard
                label="Total"
                value={stats.total}
                unit="rastreadas"
                icon="🎯"
              />
            </View>
          </View>
          <View style={styles.kpiRow}>
            <View style={styles.kpiHalf}>
              <KPICard
                label="Esta Semana"
                value={stats.week}
                unit="rastreadas"
                icon="📊"
              />
            </View>
            <View style={styles.kpiHalf}>
              <KPICard
                label="Este Mês"
                value={stats.month}
                unit="rastreadas"
                icon="📈"
              />
            </View>
          </View>
        </View>

        {/* Distribution by Marker */}
        {stats.total > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Distribuição por Tipo de Plantio</Text>
            <View style={styles.markerDistribution}>
              {Object.entries(MARKER_CONFIG).map(([key, config]) => (
                <View key={key} style={styles.markerRow}>
                  <MarkerBadge marker={key} count={stats.byMarker[key]} />
                  <View style={styles.markerBar}>
                    <View
                      style={[
                        styles.markerBarFill,
                        {
                          width: `${(stats.byMarker[key] / stats.total) * 100}%`,
                          backgroundColor: config.color,
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.markerPercent}>
                    {Math.round((stats.byMarker[key] / stats.total) * 100)}%
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Productivity by Collaborator */}
        {collaboratorList.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Colaborador</Text>
            <View style={styles.collaboratorsList}>
              {collaboratorList.map((item) => (
                <CollaboratorCard
                  key={item.name}
                  name={item.name}
                  data={item.data}
                  photoUrl={item.photoUrl}
                />
              ))}
            </View>
          </View>
        )}

        {/* Filter Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Histórico de Rastreabilidade</Text>
          
          <View style={styles.filterGroup}>
            <Text style={styles.filterGroupLabel}>Período:</Text>
            <View style={styles.filterRow}>
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
            </View>
          </View>

          {selectedCollaborator && (
            <TouchableOpacity
              style={styles.clearFilter}
              onPress={() => setSelectedCollaborator(null)}
            >
              <Text style={styles.clearFilterText}>
                ✕ Limpar filtro por colaborador
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Summary */}
        {filteredReadings.length > 0 && (
          <View style={styles.summaryBar}>
            <Text style={styles.summaryText}>
              Mostrando{' '}
              <Text style={styles.summaryHighlight}>
                {filteredReadings.length}
              </Text>{' '}
              de {stats.total} bandeja{stats.total !== 1 ? 's' : ''}
            </Text>
          </View>
        )}

        {/* List */}
        {filteredReadings.length > 0 ? (
          <FlatList
            scrollEnabled={false}
            data={filteredReadings}
            renderItem={renderReadingItem}
            keyExtractor={(item, index) => `${item.timestamp}-${index}`}
            contentContainerStyle={styles.listContent}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🔍</Text>
            <Text style={styles.emptyText}>Nenhuma bandeja encontrada</Text>
            <Text style={styles.emptySubtext}>
              {filter !== 'all'
                ? 'Tente alterar o período'
                : 'Escaneie o QR Code de uma bandeja para começar'}
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
  headerBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
  },
  logo: {
    width: 40,
    height: 80,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
  },
  headerSubtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },

  // KPI Section
  kpiSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
    gap: 12,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 12,
  },
  kpiHalf: {
    flex: 1,
  },
  kpiCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  kpiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  kpiIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  kpiLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  kpiValue: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  kpiNumber: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.primary,
  },
  kpiUnit: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  kpiTrend: {
    fontSize: 11,
    color: COLORS.success,
    marginTop: 8,
    fontWeight: '500',
  },

  // Section
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 16,
  },

  // Marker Distribution
  markerDistribution: {
    gap: 12,
  },
  markerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  markerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 110,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: COLORS.background,
    borderRadius: 12,
    borderLeftWidth: 4,
    gap: 8,
  },
  markerIcon: {
    fontSize: 20,
  },
  markerContent: {
    flex: 1,
  },
  markerLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
  },
  markerCount: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  markerBar: {
    flex: 1,
    height: 8,
    backgroundColor: COLORS.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  markerBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  markerPercent: {
    width: 45,
    textAlign: 'right',
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
  },

  // Collaborator Card
  collaboratorsList: {
    gap: 12,
  },
  collaboratorCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  collaboratorCardActive: {
    backgroundColor: COLORS.badge,
    borderColor: COLORS.primary,
  },
  collaboratorHeader: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  collaboratorAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  collaboratorAvatarImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.background,
  },
  collaboratorInitial: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  collaboratorInfo: {
    flex: 1,
  },
  collaboratorName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  collaboratorTotal: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  collaboratorMarkers: {
    flexDirection: 'row',
    gap: 6,
  },
  markerIndicator: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  markerIndicatorText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },

  // Filter
  filterGroup: {
    marginBottom: 16,
  },
  filterGroupLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
  },
  filterBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    gap: 4,
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
    fontSize: 14,
  },
  filterText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  filterTextActive: {
    color: '#fff',
  },
  clearFilter: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: COLORS.background,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.warning,
  },
  clearFilterText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.warning,
    textAlign: 'center',
  },

  // Summary
  summaryBar: {
    marginHorizontal: 20,
    marginBottom: 16,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: COLORS.badge,
    borderRadius: 10,
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

  // Reading Card
  listContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  readingCard: {
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
  readingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  readingInfo: {
    flex: 1,
  },
  readingName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  readingTime: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  markerPill: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  markerPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  readingMeta: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  readingMetaLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  readingMetaValue: {
    fontSize: 12,
    color: COLORS.text,
    fontFamily: 'monospace',
  },
  readingFooter: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: COLORS.background,
  },
  readingDate: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },

  // Empty State
  emptyContainer: {
    marginTop: 40,
    paddingHorizontal: 20,
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
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
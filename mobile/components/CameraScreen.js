import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, ActivityIndicator, Image } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useQRCodeStore } from '../store/qrcodeStore';
import { qrcodeService } from '../services/qrcode';

const isValidQRCode = (data) => {
  return typeof data === 'string' && data.trim().length > 0;
};

const MARKER_OPTIONS = [
  { value: 'grave', label: 'Grave' },
  { value: 'medio', label: 'Médio' },
  { value: 'curto', label: 'Curto' },
];

export function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('info');
  const [collaborator, setCollaborator] = useState(null);
  const [selectedMarker, setSelectedMarker] = useState('medio');
  const { deviceId, addReading, token, setLoading, setError } = useQRCodeStore();
  const flashAnim = useRef(new Animated.Value(0)).current;
  const [flashColor, setFlashColor] = useState(null);
  const scanningRef = useRef(false);

  const resetScan = () => {
    setScanned(false);
    scanningRef.current = false;
  };

  if (!permission) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Precisamos da sua permissão para usar a câmera</Text>
        <TouchableOpacity onPress={requestPermission} style={styles.button}>
          <Text style={styles.buttonText}>Conceder Permissão</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleBarCodeScanned = async ({ data }) => {
    if (scanned || scanningRef.current || !data) return;

    scanningRef.current = true;
    setScanned(true);
    setCollaborator(null);
    setMessage('');
    setError(null);
    setLoading(true);

    if (!isValidQRCode(data)) {
      setLoading(false);
      setMessageType('error');
      setMessage('QrCode inválido / não lido');
      setTimeout(() => {
        resetScan();
      }, 2000);
      return;
    }

    if (!deviceId) {
      setLoading(false);
      setMessageType('error');
      setMessage('Dispositivo não registrado');
      setTimeout(() => {
        resetScan();
      }, 2000);
      return;
    }

    try {
      const response = await qrcodeService.verifyQRCode(data, token);
      const collaboratorData = response?.collaborator;

      if (!collaboratorData) {
        setMessageType('error');
        setMessage('Colaborador não encontrado para este QR Code');
        setFlashColor('error');
        setTimeout(() => {
          resetScan();
        }, 2000);
        return;
      }

      setCollaborator({
        id: collaboratorData.id,
        name: collaboratorData.name,
        matricula: collaboratorData.matricula,
        foto_url: collaboratorData.foto_url,
        qr_data: response.qr_data || data,
      });
      setSelectedMarker('medio');
      setMessageType('success');
      setMessage('Colaborador encontrado');
      setFlashColor('success');
      Animated.sequence([
        Animated.timing(flashAnim, { toValue: 1, duration: 120, useNativeDriver: true }),
        Animated.timing(flashAnim, { toValue: 0, duration: 300, delay: 700, useNativeDriver: true }),
      ]).start(() => setFlashColor(null));
    } catch (error) {
      console.log('QRCode verify error:', error);
      setMessageType('error');
      setMessage(error.message || 'Erro ao verificar o QR Code');
      setFlashColor('error');
      Animated.sequence([
        Animated.timing(flashAnim, { toValue: 1, duration: 120, useNativeDriver: true }),
        Animated.timing(flashAnim, { toValue: 0, duration: 300, delay: 700, useNativeDriver: true }),
      ]).start(() => setFlashColor(null));
      setTimeout(() => {
        resetScan();
      }, 2000);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    if (!collaborator) return;

    addReading({
      ...collaborator,
      marker: selectedMarker,
      timestamp: Date.now(),
      saved_at: new Date().toISOString(),
    });

    setMessageType('success');
    setMessage('Registro salvo');
    setCollaborator(null);
    resetScan();
  };

  const handleCancel = () => {
    setMessageType('info');
    setMessage('Registro cancelado');
    setCollaborator(null);
    resetScan();
  };

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      />
      {flashColor ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.flashOverlay,
            {
              borderColor: flashColor === 'success' ? '#28a745' : '#dc3545',
              opacity: flashAnim,
              transform: [
                {
                  scale: flashAnim.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1.03] }),
                },
              ],
            },
          ]}
        />
      ) : null}

      {collaborator ? (
        <View style={styles.card}>
          <View style={styles.avatarContainer}>
            {collaborator.foto_url ? (
              <Image source={{ uri: collaborator.foto_url }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarPlaceholderText}>{collaborator.name?.charAt(0)?.toUpperCase() || '?'}</Text>
              </View>
            )}
          </View>

          <Text style={styles.cardTitle}>Dados do colaborador</Text>
          <Text style={styles.cardName}>{collaborator.name}</Text>
          <Text style={styles.cardInfo}>Matrícula: {collaborator.matricula}</Text>
          <Text style={styles.cardInfo}>QR: {collaborator.qr_data}</Text>

          <Text style={styles.markerLabel}>Impacto no desenvolvimento:</Text>
          <View style={styles.markerGroup}>
            {MARKER_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[styles.markerOption, selectedMarker === option.value && styles.markerOptionSelected]}
                onPress={() => setSelectedMarker(option.value)}
              >
                <Text style={[styles.markerOptionText, selectedMarker === option.value && styles.markerOptionTextSelected]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.actionsRow}>
            <TouchableOpacity style={[styles.actionButton, styles.saveButton]} onPress={handleSave}>
              <Text style={styles.actionButtonText}>Salvar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, styles.cancelButton]} onPress={handleCancel}>
              <Text style={styles.actionButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}

      {message ? (
        <View style={[styles.messageBox, messageType === 'success' ? styles.success : styles.error]}>
          <Text style={styles.messageText}>{message}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  text: { marginBottom: 20 },
  button: { backgroundColor: '#007AFF', padding: 15, borderRadius: 10 },
  buttonText: { color: 'white', fontWeight: 'bold' },
  card: {
    position: 'absolute',
    top: 80,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderRadius: 18,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: '#e8f0fe',
  },
  avatarPlaceholder: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: '#1f6feb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarPlaceholderText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '700',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  cardName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 4,
  },
  cardInfo: {
    fontSize: 14,
    color: '#4b5563',
    textAlign: 'center',
    marginBottom: 2,
  },
  markerLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginTop: 12,
    marginBottom: 8,
  },
  markerGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  markerOption: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  markerOptionSelected: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  markerOptionText: {
    color: '#334155',
    fontWeight: '600',
  },
  markerOptionTextSelected: {
    color: '#fff',
  },
  actionsRow: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 10,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: '#16a34a',
  },
  cancelButton: {
    backgroundColor: '#dc2626',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  messageBox: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  flashOverlay: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 12,
    borderWidth: 6,
    left: '50%',
    top: '35%',
    marginLeft: -110,
    marginTop: -110,
    backgroundColor: 'transparent',
  },
  success: {
    backgroundColor: '#28a745',
  },
  error: {
    backgroundColor: '#dc3545',
  },
  messageText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
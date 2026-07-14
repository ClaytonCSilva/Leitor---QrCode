import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useQRCodeStore } from '../store/qrcodeStore';
import * as Location from 'expo-location';
import { qrcodeService } from '../services/qrcode';

const isValidQRCode = (data) => {
  return typeof data === 'string' && data.trim().length > 0;
};

export function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('info');
  const { deviceId, addReading, token, setLoading, setError } = useQRCodeStore();
  const flashAnim = useRef(new Animated.Value(0)).current;
  const [flashColor, setFlashColor] = useState(null);

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

  const handleBarCodeScanned = async ({ data, type }) => {
    if (scanned || !data) return;

    console.log('onBarCodeScanned type:', type, 'data:', data);
    setScanned(true);
    setMessage('');
    setError(null);
    setLoading(true);

    if (!isValidQRCode(data)) {
      setLoading(false);
      setMessageType('error');
      setMessage('QrCode Invalido/ Lido');
      setTimeout(() => setScanned(false), 2000);
      return;
    }

    if (!deviceId) {
      setLoading(false);
      setMessageType('error');
      setMessage('Dispositivo não registrado');
      setTimeout(() => setScanned(false), 2000);
      return;
    }

    let location = null;
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status === 'granted') {
      location = await Location.getCurrentPositionAsync({});
    }

    try {
      const response = await qrcodeService.registerQRCode(
        data,
        deviceId,
        location?.coords.latitude,
        location?.coords.longitude,
        token
      );

      const normalized = {
        ...response,
        id: response.id || `local-${Date.now()}`,
        qr_data: response.qr_data || data,
        device_id: response.device_id || deviceId,
        timestamp: response.timestamp || Date.now(),
      };

      addReading(normalized);
      setMessageType('success');
      setMessage('QrCode Lido com sucesso');
      setFlashColor('success');
      Animated.sequence([
        Animated.timing(flashAnim, { toValue: 1, duration: 120, useNativeDriver: true }),
        Animated.timing(flashAnim, { toValue: 0, duration: 300, delay: 700, useNativeDriver: true }),
      ]).start(() => setFlashColor(null));
    } catch (error) {
      console.log('QRCode register error:', error);
      const msg = (error.message || '').toLowerCase();
      if (msg.includes('already') || msg.includes('já') || msg.includes('lido')) {
        setMessageType('error');
        setMessage('QrCode Já Lido');
        setFlashColor('error');
      } else {
        setMessageType('error');
        setMessage(error.message || 'QrCode Invalido/ Lido');
        setFlashColor('error');
      }
      Animated.sequence([
        Animated.timing(flashAnim, { toValue: 1, duration: 120, useNativeDriver: true }),
        Animated.timing(flashAnim, { toValue: 0, duration: 300, delay: 700, useNativeDriver: true }),
      ]).start(() => setFlashColor(null));
    } finally {
      setLoading(false);
      setTimeout(() => setScanned(false), 1200);
    }
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
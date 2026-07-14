import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  Alert,
  ActivityIndicator,
  // DeviceInfo foi importado, mas não está sendo usado diretamente do react-native
} from 'react-native';
import * as Device from 'expo-device';
import { authService } from '../services/auth';
import { useQRCodeStore } from '../store/qrcodeStore';
 
export function RegisterDeviceScreen({ navigation }) {
  const [deviceName, setDeviceName] = useState('');
  const [loading, setLoading] = useState(false);
  const { setDeviceId } = useQRCodeStore();
 
  // Pré-preencher com nome do dispositivo
  React.useEffect(() => {
    if (!deviceName && Device.modelName) {
      setDeviceName(`${Device.manufacturer || 'Device'} ${Device.modelName}`);
    }
  }, []);
 
  const handleRegister = async () => {
    if (!deviceName.trim()) {
      Alert.alert('Erro', 'Informe um nome para o dispositivo');
      return;
    }
 
    try {
      setLoading(true);
      const device_id = await authService.registerDevice(deviceName);
      setDeviceId(device_id);
 
      Alert.alert(
        'Sucesso!',
        `Dispositivo registrado: ${deviceName}\nID: ${device_id}`,
        [
          {
            text: 'OK',
            onPress: () => navigation.replace('App'),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Erro ao registrar', error.message);
    } finally {
      setLoading(false);
    }
  };
 
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Registrar Dispositivo</Text>
        <Text style={styles.subtitle}>
          Configure seu dispositivo para começar a escanear QR codes
        </Text>
      </View>
 
      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>Informações do Dispositivo</Text>
        <Text style={styles.infoText}>
          Modelo: {Device.modelName || 'Desconhecido'}
        </Text>
        <Text style={styles.infoText}>
          SO: {Device.osName} {Device.osVersion}
        </Text>
      </View>
 
      <View style={styles.formContainer}>
        <Text style={styles.label}>Nome do Dispositivo</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: Meu Celular, Dispositivo 01"
          value={deviceName}
          onChangeText={setDeviceName}
          editable={!loading}
          placeholderTextColor="#999"
        />
 
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.buttonText}>Registrar Dispositivo</Text>
          )}
        </TouchableOpacity>
      </View>
 
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Seu dispositivo receberá um ID único para sincronização segura
        </Text>
      </View>
    </View>
  );
}
 
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 20,
  },
  header: {
    marginTop: 40,
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  infoBox: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    fontFamily: 'System',
  },
  formContainer: {
    marginBottom: 30,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    color: '#333',
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  footerText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
});
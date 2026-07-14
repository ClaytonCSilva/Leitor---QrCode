import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, TextInput } from 'react-native';
import { useQRCodeStore } from '../store/qrcodeStore';
import AsyncStorage from '@react-native-async-storage/async-storage';

export function SettingsScreen() {
  const { token, deviceId, setToken, setDeviceId, apiUrl } = useQRCodeStore();
  const { setApiUrl } = useQRCodeStore();
  const [editUrl, setEditUrl] = React.useState(apiUrl || '');

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Tem certeza que deseja sair?',
      [
        { text: 'Cancelar', onPress: () => {} },
        {
          text: 'Logout',
          onPress: async () => {
            await AsyncStorage.removeItem('qr_token');
            await AsyncStorage.removeItem('device_id');
            setToken(null);
            setDeviceId(null);
          },
          style: 'destructive',
        },
      ]
    );
  };

  const handleClearData = async () => {
    Alert.alert(
      'Limpar dados',
      'Isso vai limpar todo o histórico local. Continuar?',
      [
        { text: 'Cancelar', onPress: () => {} },
        {
          text: 'Limpar',
          onPress: async () => {
            await AsyncStorage.removeItem('readings');
            Alert.alert('✅ Dados limpos com sucesso');
          },
          style: 'destructive',
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Informações do Dispositivo</Text>
        <View style={styles.infoBox}>
          <Text style={styles.label}>ID do Dispositivo:</Text>
          <Text style={styles.value} selectable>{deviceId}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Servidor</Text>
        <View style={styles.infoBox}>
          <Text style={styles.label}>API URL:</Text>
          <TextInput
            style={[styles.value, styles.input]}
            value={editUrl}
            onChangeText={setEditUrl}
            placeholder="http://192.168.x.y:3000/api"
            autoCapitalize="none"
          />
          <TouchableOpacity
            style={[styles.button, { marginTop: 8 }]}
            onPress={async () => {
              await setApiUrl(editUrl);
              Alert.alert('Sucesso', 'API URL atualizada');
            }}
          >
            <Text style={styles.buttonText}>Salvar API URL</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ações</Text>
        <TouchableOpacity style={styles.button} onPress={handleClearData}>
          <Text style={styles.buttonText}>Limpar Histórico Local</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.logoutButton]}
          onPress={handleLogout}
        >
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.version}>v1.0.0</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  section: {
    backgroundColor: 'white',
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },
  infoBox: {
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  label: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  value: {
    fontSize: 13,
    color: '#007AFF',
    fontFamily: 'Courier New',
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    color: '#007AFF',
    fontSize: 13,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  logoutButton: {
    backgroundColor: '#FF3B30',
  },
  logoutButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  version: {
    color: '#999',
    fontSize: 12,
  },
});
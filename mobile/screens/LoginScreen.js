import React, { useState } from 'react';
import {
  Image,
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { authService } from '../services/auth';
import { useQRCodeStore } from '../store/qrcodeStore';
import AsyncStorage from '@react-native-async-storage/async-storage';

export function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { setToken } = useQRCodeStore();

  const handleLogin = async () => {
  if (!username || !password) {
    Alert.alert('Erro', 'Usuário e senha são obrigatórios');
    return;
  }

  try {
    setLoading(true);

    const { token } = await authService.login(username, password);

    setToken(token);

  } catch (error) {
    Alert.alert('Erro de Login', error.message);
  } finally {
    setLoading(false);
  }
};

  return (
    // ESTE É O CONTAINER PRINCIPAL ÚNICO
    <View style={styles.container}> 
      
      {/* Container da Logo */}
      <View style={styles.logoContainer}>
        <Image 
           source={require('../assets/logo.png')} 
           style={styles.logo} 
           resizeMode="contain" 
        />
      </View>

      <Text style={styles.title}>Smart - QR Code</Text>

      <TextInput
        style={styles.input}
        placeholder="Usuário"
        value={username}
        onChangeText={setUsername}
        editable={!loading}
      />

      <TextInput
        style={styles.input}
        placeholder="Senha"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        editable={!loading}
      />

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleLogin}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.buttonText}>Login</Text>
        )}
      </TouchableOpacity>
      
    </View> // FECHAMENTO DO CONTAINER PRINCIPAL
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 30,
    backgroundColor: '#F5F5F5',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 40,
    color: '#333',
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logo: {
    width: 140,
    height: 140,
  },
});
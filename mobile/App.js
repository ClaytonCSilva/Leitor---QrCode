import React, { useEffect } from 'react';
import { StyleSheet, LogBox } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
// IMPORTANTE: Ajuste o caminho abaixo se você não usou a pasta 'src' para 'navigation' e 'store'
import { RootNavigator } from './navigation'; 
import { useQRCodeStore } from './store/qrcodeStore';
 
// Suprimir warnings não críticos (remover em produção)
LogBox.ignoreLogs(['Non-serializable values were found']);
 
export default function App() {
  const loadFromStorage = useQRCodeStore((state) => state.loadFromStorage);
 
  useEffect(() => {
    loadFromStorage();
  }, []);
 
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <RootNavigator />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
 
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
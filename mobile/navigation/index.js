import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, View } from 'react-native';

import { CameraScreen } from '../components/CameraScreen';
import { DashboardScreen } from '../components/DashboardScreen';
import { HistoryScreen } from '../components/HistoryScreen';
import { SettingsScreen } from '../components/SettingsScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { RegisterDeviceScreen } from '../screens/RegisterDeviceScreen';

import { useQRCodeStore } from '../store/qrcodeStore';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function DashboardTab() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="DashboardStack"
        component={DashboardScreen}
        options={{ title: 'Dashboard' }}
      />
    </Stack.Navigator>
  );
}

function CameraTab() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="CameraStack"
        component={CameraScreen}
        options={{ title: 'Leitor de QR Code' }}
      />
    </Stack.Navigator>
  );
}

function HistoryTab() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="HistoryStack"
        component={HistoryScreen}
        options={{ title: 'Histórico' }}
      />
    </Stack.Navigator>
  );
}

function SettingsTab() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="SettingsStack"
        component={SettingsScreen}
        options={{ title: 'Configurações' }}
      />
    </Stack.Navigator>
  );
}

function AppTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Camera') {
            iconName = focused ? 'camera' : 'camera-outline';
          } else if (route.name === 'History') {
            iconName = focused ? 'list' : 'list-outline';
          } else if (route.name === 'Settings') {
            iconName = focused ? 'settings' : 'settings-outline';
          } else if (route.name === 'Dashboard') {
            iconName = focused ? 'home' : 'home-outline';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#999',
        headerShown: false,
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardTab}
        options={{ title: 'Dashboard' }}
      />
      <Tab.Screen
        name="Camera"
        component={CameraTab}
        options={{ title: 'Câmera' }}
      />
      <Tab.Screen
        name="History"
        component={HistoryTab}
        options={{ title: 'Histórico' }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsTab}
        options={{ title: 'Configurações' }}
      />
    </Tab.Navigator>
  );
}

export function RootNavigator() {
  const { token, deviceId, loadFromStorage } = useQRCodeStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      await loadFromStorage();
      setIsLoading(false);
    })();
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {token ? (
          // Usuário autenticado: se deviceId ausente mostrar RegisterDevice, senão App
          !deviceId ? (
            <Stack.Screen name="RegisterDevice" component={RegisterDeviceScreen} />
          ) : (
            <Stack.Screen name="App" component={AppTabs} />
          )
        ) : (
          // Não autenticado: mostrar fluxo de login
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
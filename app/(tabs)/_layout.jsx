import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import React from 'react';
import { TouchableOpacity } from 'react-native';

import { useAuth } from '@/providers/auth-provider';

function HeaderLogout() {
  const { signOut } = useAuth();
  return (
    <TouchableOpacity onPress={signOut} style={{ paddingHorizontal: 12, paddingVertical: 8 }}>
      <Ionicons name="log-out-outline" size={22} color="#FFF" />
    </TouchableOpacity>
  );
}

export default function TabLayout() {
  const red = '#e53935';
  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: red },
        headerTintColor: '#ffffff',
        headerTitleStyle: { fontWeight: '800', letterSpacing: 1.1, color: '#ffffff' },
        tabBarStyle: { backgroundColor: red, borderTopColor: red },
        tabBarActiveTintColor: '#ffffff',
        tabBarInactiveTintColor: '#ffe0e0',
      }}>
      <Tabs.Screen
        name="chat"
        options={{
          title: 'FIRECHAT',
          headerTitleAlign: 'center',
          tabBarLabel: 'แชท',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubbles-outline" color={color} size={size} />
          ),
          headerRight: () => <HeaderLogout />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'โปรไฟล์',
          headerTitleAlign: 'center',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-circle-outline" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}

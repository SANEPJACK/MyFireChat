import { Tabs } from 'expo-router';
import React from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { TouchableOpacity } from 'react-native';

import { useAuth } from '@/providers/auth-provider';

function HeaderLogout() {
  const { signOut } = useAuth();
  return (
    <TouchableOpacity onPress={signOut} style={{ paddingHorizontal: 12, paddingVertical: 8 }}>
      <Ionicons name="log-out-outline" size={22} color="#0b132b" />
    </TouchableOpacity>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: '#0a7ea4',
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
          headerStyle: { backgroundColor: '#f5f6fb' },
          headerTitleStyle: { fontWeight: '800', letterSpacing: 1.1 },
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

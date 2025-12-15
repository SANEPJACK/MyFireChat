import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { AuthProvider } from '@/providers/auth-provider';

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="light" backgroundColor="#e53935" />
      <Stack
        screenOptions={{
          headerShown: false,
          headerTitle: '',
          headerBackTitleVisible: false,
        }}
      />
    </AuthProvider>
  );
}

import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { useAuth } from '@/providers/auth-provider';

export default function LoginScreen() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('กรุณากรอกอีเมลและรหัสผ่าน');
      return;
    }
    try {
      setLoading(true);
      await signIn(email, password);
      router.replace('/chat');
    } catch (err) {
      Alert.alert('ล็อกอินไม่สำเร็จ', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>เข้าสู่ระบบ</Text>
      <TextInput
        style={styles.input}
        placeholder="อีเมล"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <View style={styles.passwordRow}>
        <TextInput
          style={[styles.input, { flex: 1 }]}
          placeholder="รหัสผ่าน"
          secureTextEntry={!showPassword}
          value={password}
          onChangeText={setPassword}
        />
        <TouchableOpacity onPress={() => setShowPassword((v) => !v)} style={styles.eyeButton}>
          <Text style={{ color: '#0a7ea4' }}>{showPassword ? 'ซ่อน' : 'แสดง'}</Text>
        </TouchableOpacity>
      </View>
      <View style={{ height: 16 }} />
      <Text style={styles.button} onPress={handleLogin}>
        {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
      </Text>
      {loading && <ActivityIndicator style={{ marginTop: 12 }} />}
      <View style={styles.links}>
        <Link href="/signup">สมัครสมาชิก</Link>
        <Link href="/forgot-password">ลืมรหัสผ่าน?</Link>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    gap: 10,
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  eyeButton: {
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#0a7ea4',
    color: '#fff',
    textAlign: 'center',
    paddingVertical: 14,
    borderRadius: 10,
    fontWeight: '700',
    fontSize: 16,
  },
  links: {
    marginTop: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});

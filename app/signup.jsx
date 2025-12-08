import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { useAuth } from '@/providers/auth-provider';

export default function SignupScreen() {
  const router = useRouter();
  const { signUp } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!email || !password || !displayName) {
      Alert.alert('กรุณากรอกข้อมูลให้ครบ');
      return;
    }
    try {
      setLoading(true);
      const result = await signUp({ email, password, displayName, fullName });
      if (result?.requiresConfirmation) {
        Alert.alert(
          'สมัครสำเร็จ',
          'เราได้ส่งอีเมลยืนยันให้แล้ว โปรดกดลิงก์ยืนยันก่อนเข้าสู่ระบบ'
        );
        router.replace('/login');
        return;
      }
      router.replace('/chat');
    } catch (err) {
      Alert.alert('สมัครไม่สำเร็จ', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>สร้างบัญชีใหม่</Text>
        <TextInput
          style={styles.input}
          placeholder="ชื่อที่แสดง (ID)"
          value={displayName}
          onChangeText={setDisplayName}
        />
        <TextInput
          style={styles.input}
          placeholder="ชื่อ-นามสกุล"
          value={fullName}
          onChangeText={setFullName}
        />
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
        <Text style={styles.button} onPress={handleSignup}>
          {loading ? 'กำลังสมัคร...' : 'สมัครสมาชิก'}
        </Text>
        <View style={styles.links}>
          <Link href="/login">มีบัญชีแล้ว? เข้าสู่ระบบ</Link>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    gap: 10,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    textAlign: 'center',
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
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'center',
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
});

import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
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
      Alert.alert('กรุณากรอกชื่อผู้ใช้ อีเมล และรหัสผ่าน');
      return;
    }
    try {
      setLoading(true);
      const result = await signUp({ email, password, displayName, fullName });
      if (result?.requiresConfirmation) {
        Alert.alert('โปรดยืนยันอีเมล', 'เราได้ส่งลิงก์ยืนยันไปยังอีเมลของคุณ');
        router.replace('/login');
        return;
      }
      router.replace('/chat');
    } catch (err) {
      Alert.alert('สมัครสมาชิกไม่สำเร็จ', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 16 : 0}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            contentContainerStyle={styles.container}
            keyboardShouldPersistTaps="handled"
            contentInsetAdjustmentBehavior="automatic">
            <Text style={styles.title}>สมัครสมาชิก</Text>
            <TextInput
              style={styles.input}
              placeholder="ชื่อผู้ใช้ (ID)"
              value={displayName}
              onChangeText={setDisplayName}
              returnKeyType="next"
            />
            <TextInput
              style={styles.input}
              placeholder="ชื่อ-นามสกุล"
              value={fullName}
              onChangeText={setFullName}
              returnKeyType="next"
            />
            <TextInput
              style={styles.input}
              placeholder="อีเมล"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              returnKeyType="next"
            />
            <View style={styles.passwordRow}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="รหัสผ่าน"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                returnKeyType="done"
              />
              <TouchableOpacity onPress={() => setShowPassword((v) => !v)} style={styles.eyeButton}>
                <Text style={{ color: '#0a7ea4' }}>{showPassword ? 'ซ่อน' : 'แสดง'}</Text>
              </TouchableOpacity>
            </View>
            <View style={{ height: 16 }} />
            <Text style={styles.button} onPress={handleSignup}>
              {loading ? 'กำลังสมัครสมาชิก...' : 'สมัครสมาชิก'}
            </Text>
            <View style={styles.links}>
              <Link href="/login">มีบัญชีแล้ว? เข้าสู่ระบบ</Link>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
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

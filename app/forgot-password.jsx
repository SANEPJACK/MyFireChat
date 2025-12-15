import { Link } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

import { useAuth } from '@/providers/auth-provider';

export default function ForgotPasswordScreen() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    if (!email) {
      Alert.alert('กรุณากรอกอีเมล');
      return;
    }
    try {
      setLoading(true);
      await resetPassword(email);
      Alert.alert('ส่งลิงก์รีเซ็ตรหัสผ่านแล้ว', 'โปรดตรวจสอบอีเมลของคุณ');
    } catch (err) {
      Alert.alert('รีเซ็ตรหัสผ่านไม่สำเร็จ', err.message);
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
          <View style={styles.container}>
            <Text style={styles.title}>รีเซ็ตรหัสผ่าน</Text>
            <TextInput
              style={styles.input}
              placeholder="อีเมล"
              placeholderTextColor="#9ca3af"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              returnKeyType="done"
            />
            <Text style={styles.button} onPress={handleReset}>
              {loading ? 'กำลังส่ง...' : 'ส่งลิงก์รีเซ็ต'}
            </Text>
            <View style={{ marginTop: 12 }}>
              <Link href="/login" style={{ color: '#e53935', fontWeight: '700' }}>
                กลับไปเข้าสู่ระบบ
              </Link>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
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
  title: {
    fontSize: 26,
    fontWeight: '700',
    textAlign: 'center',
    color: '#e53935',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    color: '#111827',
  },
  button: {
    backgroundColor: '#e53935',
    color: '#fff',
    textAlign: 'center',
    paddingVertical: 14,
    borderRadius: 10,
    fontWeight: '700',
    fontSize: 16,
  },
});

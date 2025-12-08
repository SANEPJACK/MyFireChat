import { Link } from 'expo-router';
import { useState } from 'react';
import { Alert, SafeAreaView, StyleSheet, Text, TextInput, View } from 'react-native';

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
      Alert.alert('ส่งลิงก์รีเซ็ตแล้ว', 'โปรดตรวจสอบอีเมลของคุณ');
    } catch (err) {
      Alert.alert('ไม่สามารถส่งลิงก์รีเซ็ต', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>ลืมรหัสผ่าน</Text>
      <TextInput
        style={styles.input}
        placeholder="อีเมล"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <Text style={styles.button} onPress={handleReset}>
        {loading ? 'กำลังส่ง...' : 'ส่งลิงก์รีเซ็ต'}
      </Text>
      <View style={{ marginTop: 12 }}>
        <Link href="/login">กลับไปหน้าเข้าสู่ระบบ</Link>
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
});

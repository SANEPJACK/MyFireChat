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
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'react-native';

import { useAuth } from '@/providers/auth-provider';

export default function SignupScreen() {
  const router = useRouter();
  const { signUp } = useAuth();
  const insets = useSafeAreaInsets();
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
      router.replace('/(tabs)/chat');
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
            contentContainerStyle={[styles.container, { paddingTop: insets.top + 12 }]}
            keyboardShouldPersistTaps="handled"
            contentInsetAdjustmentBehavior="automatic">
            <Image source={require('@/assets/images/FireChat.png')} style={styles.logo} resizeMode="contain" />
            <Text style={styles.title}>สมัครสมาชิก</Text>
            <TextInput
              style={styles.input}
              placeholder="ชื่อผู้ใช้ (ID)"
              placeholderTextColor="#9ca3af"
              value={displayName}
              onChangeText={setDisplayName}
              returnKeyType="next"
            />
            <TextInput
              style={styles.input}
              placeholder="ชื่อ-นามสกุล"
              placeholderTextColor="#9ca3af"
              value={fullName}
              onChangeText={setFullName}
              returnKeyType="next"
            />
            <TextInput
              style={styles.input}
              placeholder="อีเมล"
              placeholderTextColor="#9ca3af"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              returnKeyType="next"
            />
            <View style={styles.passwordRow}>
              <TextInput
                style={[styles.input, styles.inputWithIcon]}
                placeholder="รหัสผ่าน"
                placeholderTextColor="#9ca3af"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                returnKeyType="done"
              />
              <TouchableOpacity onPress={() => setShowPassword((v) => !v)} style={styles.eyeButton}>
                <Ionicons
                  name={showPassword ? 'eye-off-sharp' : 'eye-outline'}
                  size={20}
                  color="#e53935"
                />
              </TouchableOpacity>
            </View>
            <View style={{ height: 16 }} />
            <Text style={styles.button} onPress={handleSignup}>
              {loading ? 'กำลังสมัครสมาชิก...' : 'สมัครสมาชิก'}
            </Text>
            <View style={styles.links}>
              <Link href="/login" style={{ color: '#e53935', fontWeight: '700' }}>
                มีบัญชีแล้ว? เข้าสู่ระบบ
              </Link>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    gap: 10,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    textAlign: 'center',
    color: '#e53935',
  },
  logo: {
    width: '100%',
    height: 140,
    marginBottom: 12,
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
  links: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  passwordRow: {
    position: 'relative',
  },
  eyeButton: {
    position: 'absolute',
    right: 12,
    top: '50%',
    transform: [{ translateY: -10 }],
  },
  inputWithIcon: {
    paddingRight: 40,
  },
});

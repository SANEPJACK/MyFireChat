import * as ImagePicker from 'expo-image-picker';
import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/providers/auth-provider';

export default function ProfileScreen() {
  const { user, profile, updateProfile, testStorageConnectivity } = useAuth();
  const insets = useSafeAreaInsets();
  const [displayName, setDisplayName] = useState('');
  const [fullName, setFullName] = useState('');
  const [bio, setBio] = useState('');
  const [age, setAge] = useState('');
  const [avatar, setAvatar] = useState(null);
  const [cover, setCover] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || '');
      setFullName(profile.full_name || '');
      setBio(profile.bio || '');
      setAge(profile.age ? String(profile.age) : '');
      setAvatar(profile.avatar_url || null);
      setCover(profile.cover_url || null);
    }
  }, [profile]);

  if (!user) {
    return <Redirect href="/login" />;
  }

  const pickImage = async (setUri) => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('กรุณาอนุญาตเข้าถึงคลังภาพ');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      quality: 0.7,
    });
    if (!result.canceled) {
      setUri(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      await updateProfile(
        {
          displayName,
          fullName,
          bio,
          age: age ? Number(age) : undefined,
        },
        avatar,
        cover
      );
      Alert.alert('บันทึกโปรไฟล์แล้ว');
    } catch (err) {
      Alert.alert('บันทึกโปรไฟล์ไม่สำเร็จ', err.message);
    } finally {
      setLoading(false);
    }
  };


const Test = async () => {
    try {
      setLoading(true);
      await testStorageConnectivity(
        {
         
        },
      
      );
      Alert.alert('สำเร็จ');
    } catch (err) {
      Alert.alert('error', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, paddingTop: insets.top + 8 }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 16 : 0}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            contentContainerStyle={styles.container}
            keyboardShouldPersistTaps="handled"
            contentInsetAdjustmentBehavior="automatic">
            <Text style={styles.title}>โปรไฟล์ของฉัน</Text>
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
              placeholder="อายุ"
              keyboardType="number-pad"
              value={age}
              onChangeText={setAge}
              returnKeyType="next"
            />
            <TextInput
              style={[styles.input, { height: 100 }]}
              placeholder="เกี่ยวกับฉัน"
              multiline
              value={bio}
              onChangeText={setBio}
              returnKeyType="default"
            />
            <View style={styles.imageRow}>
              <View style={{ flex: 1, alignItems: 'center' }}>
                <Text>อวาตาร์</Text>
                {avatar ? <Image source={{ uri: avatar }} style={styles.avatar} /> : null}
                <Text style={styles.link} onPress={() => pickImage(setAvatar)}>
                  เลือกอวาตาร์
                </Text>
              </View>
              <View style={{ flex: 1, alignItems: 'center' }}>
                <Text>ภาพปก</Text>
                {cover ? <Image source={{ uri: cover }} style={styles.cover} /> : null}
                <Text style={styles.link} onPress={() => pickImage(setCover)}>
                  เลือกรูปปก
                </Text>
              </View>
            </View>
            <Text style={styles.button} onPress={handleSave}>
              {loading ? 'กำลังบันทึก...' : 'บันทึก'}
            </Text>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
  },
  imageRow: {
    flexDirection: 'row',
    gap: 12,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    marginTop: 8,
  },
  cover: {
    width: '100%',
    height: 90,
    borderRadius: 12,
    marginTop: 8,
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
  link: {
    color: '#e53935',
    marginTop: 8,
    fontWeight: '600',
  },
});

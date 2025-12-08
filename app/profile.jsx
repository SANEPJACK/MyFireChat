import * as ImagePicker from 'expo-image-picker';
import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Image, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { useAuth } from '@/providers/auth-provider';

export default function ProfileScreen() {
  const { user, profile, updateProfile } = useAuth();
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
      Alert.alert('ต้องการสิทธิ์เข้าถึงรูปภาพ');
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
      Alert.alert('บันทึกแล้ว');
    } catch (err) {
      Alert.alert('บันทึกไม่สำเร็จ', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>โปรไฟล์ของฉัน</Text>
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
          placeholder="อายุ"
          keyboardType="number-pad"
          value={age}
          onChangeText={setAge}
        />
        <TextInput
          style={[styles.input, { height: 100 }]}
          placeholder="คำอธิบายตัวเอง"
          multiline
          value={bio}
          onChangeText={setBio}
        />
        <View style={styles.imageRow}>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text>รูปโปรไฟล์</Text>
            {avatar ? <Image source={{ uri: avatar }} style={styles.avatar} /> : null}
            <Text style={styles.link} onPress={() => pickImage(setAvatar)}>
              เลือกรูป
            </Text>
          </View>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text>ภาพหน้าปก</Text>
            {cover ? <Image source={{ uri: cover }} style={styles.cover} /> : null}
            <Text style={styles.link} onPress={() => pickImage(setCover)}>
              เลือกภาพหน้าปก
            </Text>
          </View>
        </View>
        <Text style={styles.button} onPress={handleSave}>
          {loading ? 'กำลังบันทึก...' : 'บันทึกโปรไฟล์'}
        </Text>
      </ScrollView>
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
    backgroundColor: '#0a7ea4',
    color: '#fff',
    textAlign: 'center',
    paddingVertical: 14,
    borderRadius: 10,
    fontWeight: '700',
    fontSize: 16,
  },
  link: {
    color: '#0a7ea4',
    marginTop: 8,
    fontWeight: '600',
  },
});

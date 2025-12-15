import { Ionicons } from '@expo/vector-icons';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  ImageBackground,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/auth-provider';

export default function FriendDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [friend, setFriend] = useState(null);

  useEffect(() => {
    if (!user || !id) return;
    const load = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (!error) setFriend(data);
    };
    load();
  }, [user, id]);

  if (!user) return <Redirect href="/login" />;

  const handleDeleteFriend = async () => {
    if (!id) return;
    const roomId = [user.id, id].sort().join(':');
    Alert.alert('ลบเพื่อน', 'ต้องการลบเพื่อนและประวัติการสนทนาทั้งหมดหรือไม่?', [
      { text: 'ยกเลิก', style: 'cancel' },
      {
        text: 'ลบ',
        style: 'destructive',
        onPress: async () => {
          try {
            // ลบคำขอ/สถานะเพื่อน
            await supabase
              .from('friend_requests')
              .delete()
              .or(`and(from_user_id.eq.${user.id},to_user_id.eq.${id}),and(from_user_id.eq.${id},to_user_id.eq.${user.id})`);
            // ลบข้อความในห้องนี้
            await supabase.from('messages').delete().eq('room_id', roomId);
            // ลบ read receipts ของห้องนี้
            await supabase.from('room_reads').delete().eq('room_id', roomId);
            Alert.alert('ลบเพื่อนแล้ว', 'ข้อมูลการสนทนาถูกลบเรียบร้อย');
            router.replace('/(tabs)/chat');
          } catch (err) {
            Alert.alert('ลบไม่สำเร็จ', err.message);
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="light" backgroundColor="#e53935" />
      <View style={styles.headerBar}>
        <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.title}>ข้อมูลเพื่อน</Text>
        <View style={styles.iconButton} />
      </View>
      <ScrollView
        contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 140, minHeight: '100%' }}
        style={{ backgroundColor: '#f5f6fb' }}>
        {friend?.cover_url ? (
          <ImageBackground
            source={{ uri: friend.cover_url }}
            style={styles.cover}
            imageStyle={{ borderRadius: 16 }}
          />
        ) : (
          <View style={[styles.cover, { backgroundColor: '#e5e7eb' }]} />
        )}
        <View style={styles.profileRow}>
          {friend?.avatar_url ? (
            <Image source={{ uri: friend.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, { backgroundColor: '#e5e7eb' }]}>
              <Text style={{ fontWeight: '800', color: '#0a7ea4' }}>
                {(friend?.display_name || friend?.full_name || 'F').slice(0, 1).toUpperCase()}
              </Text>
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{friend?.display_name || 'ไม่ทราบชื่อ'}</Text>
            <Text style={styles.sub}>{friend?.full_name || ''}</Text>
            <Text style={styles.sub}>{friend?.email || ''}</Text>
          </View>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>คำอธิบายตัวเอง</Text>
          <Text style={styles.cardText}>{friend?.bio || '—'}</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>อายุ</Text>
          <Text style={styles.cardText}>{friend?.age ?? '—'}</Text>
        </View>
      </ScrollView>
      <View style={[styles.deleteBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteFriend}>
          <Text style={styles.deleteText}>ลบเพื่อน</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#e53935' },
  headerBar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#e53935',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#c62828',
  },
  iconButton: { width: 32, alignItems: 'center' },
  title: { fontSize: 18, fontWeight: '800', color: '#ffffff' },
  cover: { height: 150, borderRadius: 16, backgroundColor: '#f1f5f9' },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 70, height: 70, borderRadius: 35, alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 20, fontWeight: '800', color: '#111827' },
  sub: { color: '#374151' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  cardLabel: { fontWeight: '700', marginBottom: 4, color: '#111827' },
  cardText: { color: '#374151' },
  deleteBar: {
    backgroundColor: '#f5f6fb',
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  deleteButton: {
    backgroundColor: '#ef4444',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  deleteText: { color: '#fff', fontWeight: '800' },
});

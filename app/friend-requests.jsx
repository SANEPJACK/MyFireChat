import { useEffect, useState } from 'react';
import { Alert, FlatList, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Redirect, useRouter } from 'expo-router';

import { useAuth } from '@/providers/auth-provider';
import { supabase } from '@/lib/supabase';

export default function FriendRequestsScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let active = true;

    const load = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('friend_requests')
        .select('*')
        .eq('to_user_id', user.id)
        .eq('status', 'pending');
      if (error) {
        Alert.alert('โหลดคำขอไม่สำเร็จ', error.message);
        setLoading(false);
        return;
      }
      const fromIds = data?.map((r) => r.from_user_id).filter(Boolean);
      let profiles = [];
      if (fromIds?.length) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, display_name, full_name')
          .in('id', fromIds);
        profiles = profilesData || [];
      }
      const merged = data?.map((r) => ({
        ...r,
        from_profile: profiles.find((p) => p.id === r.from_user_id),
      }));
      if (active) {
        setRequests(merged || []);
        setLoading(false);
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [user]);

  if (!user) {
    return <Redirect href="/login" />;
  }

  const handleAction = async (requestId, status) => {
    const { error } = await supabase
      .from('friend_requests')
      .update({ status })
      .eq('id', requestId)
      .eq('to_user_id', user.id);
    if (error) {
      Alert.alert('อัปเดตไม่สำเร็จ', error.message);
      return;
    }
    setRequests((prev) => prev.filter((r) => r.id !== requestId));
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>‹ กลับ</Text>
        </TouchableOpacity>
        <Text style={styles.title}>คำขอเป็นเพื่อน</Text>
      </View>
      {loading ? (
        <Text style={styles.info}>กำลังโหลด...</Text>
      ) : requests.length === 0 ? (
        <Text style={styles.info}>ยังไม่มีคำขอค้างอยู่</Text>
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 12, gap: 10 }}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.name}>
                {item.from_profile?.display_name || item.from_profile?.full_name || 'เพื่อนใหม่'}
              </Text>
              <View style={styles.actions}>
                <TouchableOpacity
                  style={[styles.button, styles.accept]}
                  onPress={() => handleAction(item.id, 'accepted')}>
                  <Text style={styles.buttonText}>ยอมรับ</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.decline]}
                  onPress={() => handleAction(item.id, 'declined')}>
                  <Text style={styles.buttonText}>ปฏิเสธ</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f6fb' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  back: { color: '#0a7ea4', fontWeight: '700', fontSize: 16 },
  title: { fontSize: 20, fontWeight: '800', color: '#0b132b' },
  info: { paddingHorizontal: 16, color: '#6b7280' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  name: { fontSize: 16, fontWeight: '700', marginBottom: 10 },
  actions: { flexDirection: 'row', gap: 10 },
  button: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  accept: { backgroundColor: '#22c55e' },
  decline: { backgroundColor: '#ef4444' },
  buttonText: { color: '#fff', fontWeight: '700' },
});

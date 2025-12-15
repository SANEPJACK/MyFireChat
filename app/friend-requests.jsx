import { useEffect, useState } from 'react';
import { Alert, FlatList, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { RefreshControl } from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { useAuth } from '@/providers/auth-provider';
import { supabase } from '@/lib/supabase';

export default function FriendRequestsScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadRequests = async () => {
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
        Alert.alert('โหลดคำขอเพื่อนไม่สำเร็จ', error.message);
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
  };

  useEffect(() => {
    loadRequests();
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
      Alert.alert('อัปเดตคำขอไม่สำเร็จ', error.message);
      return;
    }
    setRequests((prev) => prev.filter((r) => r.id !== requestId));
  };

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}> 
      <StatusBar style="light" backgroundColor="#e53935" translucent={false} />
      <View style={styles.headerBar}>
        <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.title}>คำขอเป็นเพื่อน</Text>
        <View style={styles.iconButton} />
      </View>
      <View style={{ flex: 1, backgroundColor: '#f5f6fb' }}>
        {loading ? (
          <Text style={styles.info}>กำลังโหลด...</Text>
        ) : requests.length === 0 ? (
          <Text style={styles.info}>ยังไม่มีคำขอ</Text>
        ) : (
          <FlatList
            data={requests}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 12, gap: 10 }}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={async () => {
                setRefreshing(true);
                await loadRequests();
                setRefreshing(false);
              }} />
            }
            renderItem={({ item }) => (
              <View style={styles.card}>
                <Text style={styles.name}>
                  {item.from_profile?.display_name || item.from_profile?.full_name || 'ไม่ทราบชื่อ'}
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
    borderBottomColor: '#c62828',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconButton: { width: 32, alignItems: 'center' },
  title: { fontSize: 18, fontWeight: '800', color: '#ffffff', textAlign: 'center' },
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

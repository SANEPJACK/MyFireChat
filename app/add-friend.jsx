import { useState } from 'react';
import {
  Alert,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { useAuth } from '@/providers/auth-provider';
import { supabase } from '@/lib/supabase';

export default function AddFriendScreen() {
  const { user, sendFriendRequest } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [relations, setRelations] = useState({}); // id -> friend | pending_out | pending_in

  if (!user) {
    return <Redirect href="/login" />;
  }

  const handleSearch = async () => {
    const term = searchTerm.trim();
    if (term.length < 2) {
      Alert.alert('พิมพ์อย่างน้อย 2 ตัวอักษร');
      return;
    }
    try {
      setSearching(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('id, display_name, full_name, email')
        .or(`display_name.ilike.%${term}%,email.ilike.%${term}%`)
        .neq('id', user.id)
        .limit(20);
      if (error) throw error;
      const found = data || [];
      setResults(found);

      // Load relation statuses
      const ids = found.map((p) => p.id);
      if (ids.length) {
        const [outRes, inRes] = await Promise.all([
          supabase
            .from('friend_requests')
            .select('id,to_user_id,status')
            .eq('from_user_id', user.id)
            .in('to_user_id', ids),
          supabase
            .from('friend_requests')
            .select('id,from_user_id,status')
            .eq('to_user_id', user.id)
            .in('from_user_id', ids),
        ]);

        const relationMap = {};

        (outRes.data || []).forEach((r) => {
          if (r.status === 'accepted') relationMap[r.to_user_id] = 'friend';
          else if (r.status === 'pending') relationMap[r.to_user_id] = 'pending_out';
        });

        (inRes.data || []).forEach((r) => {
          if (r.status === 'accepted') relationMap[r.from_user_id] = 'friend';
          else if (r.status === 'pending') relationMap[r.from_user_id] = 'pending_in';
        });

        setRelations(relationMap);
      } else {
        setRelations({});
      }
    } catch (err) {
      Alert.alert('ค้นหาไม่สำเร็จ', err.message);
    } finally {
      setSearching(false);
    }
  };

  const handleSendFromResult = async (toUserId) => {
    try {
      setSearching(true);
      await sendFriendRequest(toUserId);
      Alert.alert('ส่งคำขอเพื่อนแล้ว', 'ส่งคำขอเพื่อนเรียบร้อย');
      setRelations((prev) => ({ ...prev, [toUserId]: 'pending_out' }));
    } catch (err) {
      Alert.alert('ส่งคำขอเพื่อนไม่สำเร็จ', err.message);
    } finally {
      setSearching(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff', paddingTop: insets.top }}>
      <StatusBar style="dark" backgroundColor="#fff" translucent={false} />
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: '#f5f6fb' }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 16 : 0}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={{ flex: 1 }}>
            <View style={styles.headerBar}>
              <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
                <Ionicons name="chevron-back" size={24} color="#0a7ea4" />
              </TouchableOpacity>
              <Text style={styles.title}>ค้นหาเพื่อน</Text>
              <View style={styles.iconButton} />
            </View>
            <View style={styles.container}>
              <View style={styles.searchRow}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="ค้นหาด้วยชื่อหรืออีเมล"
                  value={searchTerm}
                  onChangeText={setSearchTerm}
                  returnKeyType="search"
                  onSubmitEditing={handleSearch}
                />
                <TouchableOpacity onPress={handleSearch} style={styles.searchButton} disabled={searching}>
                  <Text style={{ color: '#fff', fontWeight: '700' }}>{searching ? '...' : 'ค้นหา'}</Text>
                </TouchableOpacity>
              </View>
              <FlatList
                data={results}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ gap: 8 }}
                keyboardDismissMode="on-drag"
                keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <View style={styles.resultRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.resultName}>
                      {item.display_name || item.full_name || 'ไม่ทราบชื่อ'}
                    </Text>
                    <Text style={styles.resultEmail}>{item.full_name || item.email}</Text>
                  </View>
                  {relations[item.id] === 'friend' ? (
                    <Text style={styles.friendText}>เป็นเพื่อนกันแล้ว</Text>
                  ) : relations[item.id] === 'pending_out' ? (
                    <Text style={styles.pendingText}>กำลังรอการยอมรับ</Text>
                  ) : relations[item.id] === 'pending_in' ? (
                    <TouchableOpacity
                      style={[styles.addButton, { backgroundColor: '#0ea5e9' }]}
                      onPress={() => router.push('/friend-requests')}>
                      <Text style={{ color: '#fff', fontWeight: '700' }}>ดูคำขอ</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={styles.addButton}
                      onPress={() => handleSendFromResult(item.id)}
                      disabled={searching}>
                      <Text style={{ color: '#fff', fontWeight: '700' }}>ขอเป็นเพื่อน</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
                ListEmptyComponent={
                  <Text style={{ color: '#6b7280' }}>
                    {searching ? 'กำลังค้นหา...' : 'ไม่พบผลลัพธ์'}
                  </Text>
                }
              />
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
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 10,
  },
  headerBar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 12,
    marginHorizontal: -20,
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e5e7eb',
  },
  iconButton: { width: 40, alignItems: 'center' },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0b132b',
    textAlign: 'center',
    flex: 1,
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
  sectionTitle: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '700',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchButton: {
    backgroundColor: '#0a7ea4',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  resultName: {
    fontWeight: '700',
    fontSize: 15,
  },
  resultEmail: {
    color: '#6b7280',
    fontSize: 13,
  },
  addButton: {
    backgroundColor: '#0a7ea4',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  pendingText: {
    color: '#6b7280',
    fontWeight: '700',
  },
  friendText: {
    color: '#16a34a',
    fontWeight: '700',
  },
});

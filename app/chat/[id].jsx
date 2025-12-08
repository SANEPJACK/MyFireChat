import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';

import { useAuth } from '@/providers/auth-provider';
import { supabase } from '@/lib/supabase';

export default function ChatDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user, profile } = useAuth();
  const [friendProfile, setFriendProfile] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const roomId = useMemo(() => {
    if (!user || !id) return null;
    return [user.id, id].sort().join(':');
  }, [user, id]);

  useEffect(() => {
    if (!user || !id) return;
    const loadFriend = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (!error) setFriendProfile(data);
    };
    loadFriend();
  }, [user, id]);

  useEffect(() => {
    if (!user || !roomId) return;
    let mounted = true;

    const loadMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) {
        console.warn(error.message);
        return;
      }
      if (mounted) setMessages(data || []);
    };

    loadMessages();

    const channel = supabase
      .channel(`public:messages:${roomId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages', filter: `room_id=eq.${roomId}` },
        (payload) => {
          if (!payload.new) return;
          setMessages((prev) => [{ ...payload.new, id: payload.new.id }, ...prev]);
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [user, roomId]);

  if (!user) {
    return <Redirect href="/login" />;
  }

  const handleSend = async () => {
    if (!message.trim() || !roomId) return;
    try {
      setSending(true);
      const { error } = await supabase.from('messages').insert({
        text: message.trim(),
        room_id: roomId,
        user_id: user.id,
        display_name: profile?.display_name || profile?.full_name || user.email,
      });
      if (error) throw error;
      setMessage('');
    } catch (err) {
      Alert.alert('ส่งข้อความไม่สำเร็จ', err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>{'‹'}</Text>
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <View style={styles.avatar}>
            {friendProfile?.avatar_url ? (
              <Image source={{ uri: friendProfile.avatar_url }} style={styles.avatarImg} />
            ) : (
              <Text style={styles.avatarText}>
                {(friendProfile?.display_name || 'F').slice(0, 1).toUpperCase()}
              </Text>
            )}
          </View>
          <View>
            <Text style={styles.name}>{friendProfile?.display_name || 'เพื่อน'}</Text>
            <Text style={styles.sub}>{friendProfile?.full_name || friendProfile?.email}</Text>
          </View>
        </View>
      </View>

      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 12 }}
        inverted
        renderItem={({ item }) => (
          <View
            style={[
              styles.messageRow,
              item.user_id === user.id ? styles.messageMine : styles.messageFriend,
            ]}>
            <Text style={styles.messageAuthor}>{item.display_name || 'ไม่ระบุ'}</Text>
            <Text style={styles.messageText}>{item.text}</Text>
          </View>
        )}
      />

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="พิมพ์ข้อความ..."
          value={message}
          onChangeText={setMessage}
        />
        <TouchableOpacity
          onPress={sending ? undefined : handleSend}
          style={styles.sendButton}
          disabled={sending}>
          <Text style={{ color: '#fff', fontWeight: '700' }}>{sending ? '...' : 'ส่ง'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: '#e5e7eb',
    gap: 10,
  },
  back: { fontSize: 24, color: '#0a7ea4', paddingHorizontal: 4 },
  headerInfo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#e0f2fe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontWeight: '800', color: '#0a7ea4' },
  avatarImg: { width: 44, height: 44, borderRadius: 22 },
  name: { fontSize: 16, fontWeight: '800', color: '#0b132b' },
  sub: { color: '#6b7280', fontSize: 13 },
  messageRow: {
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
  },
  messageMine: { backgroundColor: '#e0f2fe', alignSelf: 'flex-end' },
  messageFriend: { backgroundColor: '#f1f5f9', alignSelf: 'flex-start' },
  messageAuthor: { fontWeight: '700', marginBottom: 4 },
  messageText: { fontSize: 16 },
  inputRow: {
    flexDirection: 'row',
    padding: 10,
    borderTopWidth: 1,
    borderColor: '#e5e7eb',
    gap: 8,
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    backgroundColor: '#f9fafb',
  },
  sendButton: {
    backgroundColor: '#0a7ea4',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
    alignSelf: 'center',
  },
});

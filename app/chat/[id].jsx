import { useEffect, useLayoutEffect, useMemo, useState, useCallback } from 'react';
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
  Image,
} from 'react-native';
import { Redirect, useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';

import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/auth-provider';

export default function ChatDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const navigation = useNavigation();
  const { user, profile, setActiveChatId } = useAuth();
  const insets = useSafeAreaInsets();
  const [friendProfile, setFriendProfile] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [markingRead, setMarkingRead] = useState(false);

  const roomId = useMemo(() => {
    if (!user || !id) return null;
    return [user.id, id].sort().join(':');
  }, [user, id]);

  const markRoomRead = useCallback(async () => {
    if (!user || !roomId) return;
    if (markingRead) return;
    setMarkingRead(true);
    try {
      await supabase.from('room_reads').upsert(
        { room_id: roomId, user_id: user.id, last_read_at: new Date().toISOString() },
        { onConflict: 'room_id,user_id' }
      );
    } catch (_) {
      // ignore
    } finally {
      setMarkingRead(false);
    }
  }, [user, roomId, markingRead]);

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
      await markRoomRead();
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
          // ถ้าอยู่ในห้องนี้ ให้ mark อ่านทันที
          markRoomRead();
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [user, roomId, markRoomRead]);

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  // ตั้ง active chat เพื่อใช้ตัดแจ้งเตือน (ให้ backend เช็กได้)
  useFocusEffect(
    useCallback(() => {
      if (roomId) {
        setActiveChatId(roomId);
        (async () => {
          try {
            await supabase.rpc('set_active_room', { room_id: roomId });
            await markRoomRead(); // mark read whenเข้าห้อง
          } catch (_) {
            // ignore
          }
        })();
      }
      return () => {
        setActiveChatId(null);
        (async () => {
          try {
            await supabase.rpc('set_active_room', { room_id: null });
          } catch (_) {
            // ignore
          }
        })();
      };
    }, [roomId, setActiveChatId, markRoomRead])
  );

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
    <SafeAreaView style={[styles.container, { paddingTop: insets.top, backgroundColor: '#e53935' }]}>
      <StatusBar style="light" backgroundColor="#e53935" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={{ flex: 1, backgroundColor: '#fff' }}>
            <View style={styles.headerBar}>
              <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
                <Ionicons name="chevron-back" size={26} color="#ffffff" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.headerInfo}
                activeOpacity={0.7}
                onPress={() => friendProfile?.id && router.push(`/friend/${friendProfile.id}`)}>
                {friendProfile?.avatar_url ? (
                  <Image source={{ uri: friendProfile.avatar_url }} style={styles.avatarImage} />
                ) : (
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {friendProfile?.display_name?.[0]?.toUpperCase() ||
                        friendProfile?.full_name?.[0]?.toUpperCase() ||
                        '?'}
                    </Text>
                  </View>
                )}
                <View>
                  <Text style={styles.name} numberOfLines={1}>
                    {friendProfile?.display_name || friendProfile?.full_name || 'เพื่อน'}
                  </Text>
                  <Text style={styles.subName} numberOfLines={1}>
                    {friendProfile?.full_name || friendProfile?.display_name || ''}
                  </Text>
                </View>
              </TouchableOpacity>
              <View style={styles.iconButton} />
            </View>
            <FlatList
              data={messages}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ padding: 12, paddingBottom: 120 }}
              style={{ flex: 1 }}
              inverted
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              renderItem={({ item }) => (
                <View
                  style={[
                    styles.messageRow,
                    item.user_id === user.id ? styles.messageMine : styles.messageFriend,
                  ]}>
                  <Text style={styles.messageAuthor}>{item.display_name || 'ไม่ทราบชื่อ'}</Text>
                  <Text style={styles.messageText}>{item.text}</Text>
                </View>
              )}
            />

            <View style={[styles.inputRow, { paddingBottom: Math.max(insets.bottom, 10) }]}>
              <TextInput
                style={styles.input}
                placeholder="พิมพ์ข้อความ..."
                placeholderTextColor="#9ca3af"
                value={message}
                onChangeText={setMessage}
                returnKeyType="send"
                onSubmitEditing={sending ? undefined : handleSend}
              />
              <TouchableOpacity
                onPress={sending ? undefined : handleSend}
                style={styles.sendButton}
                disabled={sending}>
                <Text style={{ color: '#fff', fontWeight: '700' }}>
                  {sending ? '...' : 'ส่ง'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  headerBar: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    backgroundColor: '#e53935',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#c62828',
  },
  iconButton: { width: 36, alignItems: 'flex-start' },
  headerInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e0f2fe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e5e7eb',
  },
  avatarText: { fontWeight: '800', color: '#0b132b' },
  name: { fontSize: 16, fontWeight: '800', color: '#ffffff', maxWidth: 180 },
  subName: { color: '#ffeded', fontSize: 12, maxWidth: 180 },
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
    paddingHorizontal: 10,
    paddingTop: 10,
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
    backgroundColor: '#e53935',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
    alignSelf: 'center',
  },
});

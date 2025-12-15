import { useFocusEffect } from '@react-navigation/native';
import { Redirect, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  Image,
  ImageBackground,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/auth-provider';

export default function ChatScreen() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const insets = useSafeAreaInsets();
  const [friends, setFriends] = useState([]);
  const [loadingFriends, setLoadingFriends] = useState(true);
  const [lastMessages, setLastMessages] = useState({});
  const [unreadCounts, setUnreadCounts] = useState({});
  const [pendingRequests, setPendingRequests] = useState(0);
  const coverUri =
    profile?.cover_url ||
    'https://images.unsplash.com/photo-1520671458121-9b47f3b9b64a?auto=format&fit=crop&w=1200&q=80';
  const [refreshing, setRefreshing] = useState(false);

  const loadFriends = useCallback(async () => {
    if (!user) return;
    let mounted = true;
    try {
      const { data, error } = await supabase
        .from('friend_requests')
        .select('*')
        .eq('status', 'accepted')
        .or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`);
      if (error) {
        console.warn(error.message);
        return;
      }
      const otherIds = data
        ?.map((fr) => (fr.from_user_id === user.id ? fr.to_user_id : fr.from_user_id))
        .filter(Boolean);
      if (!otherIds?.length) {
        if (mounted) setFriends([]);
        setLoadingFriends(false);
        return;
      }
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url, cover_url')
        .in('id', otherIds);
      const mapped = otherIds.map(
        (id) => {
          const roomId = [user.id, id].sort().join(':');
          return profilesData?.find((p) => p.id === id) || { id, display_name: 'ไม่ทราบชื่อ', roomId };
        }
      );
      const mappedWithRoom = mapped.map((p, idx) => {
        const fid = otherIds[idx];
        const roomId = [user.id, fid].sort().join(':');
        return { ...p, roomId };
      });
      if (mounted) {
        setFriends(mappedWithRoom);
        setLoadingFriends(false);
      }

      // ดึงข้อความล่าสุดและคำนวณ unread ของทุกห้อง
      const roomIds = mappedWithRoom.map((f) => f.roomId).filter(Boolean);
      if (roomIds.length) {
        const [{ data: reads }, { data: msgs, error: msgErr }] = await Promise.all([
          supabase.from('room_reads').select('room_id,last_read_at').in('room_id', roomIds),
          supabase
            .from('messages')
            .select('room_id,text,created_at,user_id')
            .in('room_id', roomIds)
            .order('created_at', { ascending: false }),
        ]);
        if (!msgErr && msgs) {
          const latest = {};
          const unreadMap = {};
          const readMap = {};
          const latestTimeMap = {};
          reads?.forEach((r) => {
            readMap[r.room_id] = r.last_read_at ? new Date(r.last_read_at) : null;
          });
          msgs.forEach((m) => {
            const readAt = readMap[m.room_id];
            if (!latest[m.room_id]) latest[m.room_id] = m;
            if (!latestTimeMap[m.room_id]) latestTimeMap[m.room_id] = m.created_at || null;
            if (!unreadMap[m.room_id]) unreadMap[m.room_id] = 0;
            const created = m.created_at ? new Date(m.created_at) : null;
            // นับเฉพาะข้อความของฝั่งตรงข้ามเท่านั้น
            if (m.user_id === user.id) return;
            if (!readAt || (created && created > readAt)) {
              unreadMap[m.room_id] += 1;
            }
          });
          if (mounted) {
            // จัดเรียงเพื่อนตามเวลาข้อความล่าสุด
            const sorted = [...mappedWithRoom].sort((a, b) => {
              const ta = latestTimeMap[a.roomId] ? new Date(latestTimeMap[a.roomId]).getTime() : 0;
              const tb = latestTimeMap[b.roomId] ? new Date(latestTimeMap[b.roomId]).getTime() : 0;
              return tb - ta;
            });
            setFriends(sorted);
            setLastMessages(latest);
            setUnreadCounts(unreadMap);
          }
        }
      } else {
        // ถ้าไม่มี room ให้เซ็ต friends ตามข้อมูลที่มี
        if (mounted) setFriends(mappedWithRoom);
      }
    } finally {
      // no-op
    }
    return () => {
      mounted = false;
    };
  }, [user]);

  const loadPendingRequests = useCallback(async () => {
    if (!user) {
      setPendingRequests(0);
      return;
    }
    const { data, error } = await supabase
      .from('friend_requests')
      .select('id')
      .eq('status', 'pending')
      .eq('to_user_id', user.id);
    if (!error) {
      setPendingRequests(data?.length || 0);
    }
  }, [user]);

  useEffect(() => {
    loadFriends();
    loadPendingRequests();
  }, [loadFriends, loadPendingRequests]);

  useFocusEffect(
    useCallback(() => {
      // รีเฟรชเมื่อกลับมาหน้านี้
      loadFriends();
      loadPendingRequests();
    }, [loadFriends, loadPendingRequests])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadFriends(), loadPendingRequests()]);
    setRefreshing(false);
  };

  if (!user) {
    return <Redirect href="/login" />;
  }

  return (
    <SafeAreaView
      style={[styles.container, { paddingTop: 10 }]}>
      <View style={styles.header}>
        {profile?.cover_url ? (
          <ImageBackground source={{ uri: coverUri }} style={styles.headerContent} imageStyle={styles.headerImage}>
            <View style={styles.headerOverlayTransparent}>
              {profile?.avatar_url ? (
                <Image source={{ uri: profile.avatar_url }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {(profile?.display_name || profile?.full_name || 'U').slice(0, 1).toUpperCase()}
                  </Text>
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>{profile?.display_name || 'ผู้ใช้ใหม่'}</Text>
                <Text style={styles.subtitle}>{profile?.full_name || user.email}</Text>
              </View>
            </View>
          </ImageBackground>
        ) : (
          <View style={[styles.headerContent, styles.headerFallback]}>
            {profile?.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {(profile?.display_name || profile?.full_name || 'U').slice(0, 1).toUpperCase()}
                </Text>
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{profile?.display_name || 'ผู้ใช้ใหม่'}</Text>
              <Text style={styles.subtitle}>{profile?.full_name || user.email}</Text>
            </View>
          </View>
        )}
      </View>

      <View style={styles.body}>
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.actionChip} onPress={() => router.push('/friend-requests')}>
            <Text style={styles.actionChipText}>
              คำขอ{pendingRequests > 0 ? ` (${pendingRequests})` : ''}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionChip} onPress={() => router.push('/add-friend')}>
            <Text style={styles.actionChipText}>เพิ่มเพื่อน</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.chatListWrapper}>
          <View style={styles.chatListContainer}>
            <Text style={styles.sectionTitle}>เพื่อน</Text>
            {loadingFriends ? (
              <Text style={{ color: '#6b7280' }}>กำลังโหลดเพื่อน...</Text>
            ) : friends.length === 0 ? (
              <Text style={{ color: '#6b7280' }}>ยังไม่มีเพื่อน กด เพิ่มเพื่อน</Text>
            ) : (
              <FlatList
                data={friends}
                keyExtractor={(item) => item.id}
                refreshControl={
                  <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#e53935" />
                }
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.friendRow}
                    onPress={() => router.push(`/chat/${item.id}`)}>
                    <ImageBackground
                      source={
                        item.cover_url
                          ? { uri: item.cover_url }
                          : { uri: 'https://images.unsplash.com/photo-1520671458121-9b47f3b9b64a?auto=format&fit=crop&w=1200&q=80' }
                      }
                      style={styles.friendCard}
                      imageStyle={styles.friendCoverImage}>
                      <View style={styles.friendOverlay}>
                        {item.avatar_url ? (
                          <Image source={{ uri: item.avatar_url }} style={styles.friendAvatarImage} />
                        ) : (
                          <View style={styles.friendAvatar}>
                            <Text style={styles.friendAvatarText}>
                              {(item.display_name || 'F').slice(0, 1).toUpperCase()}
                            </Text>
                          </View>
                        )}
                        <View style={{ flex: 1 }}>
                          <Text style={styles.friendName}>{item.display_name || 'ไม่ทราบชื่อ'}</Text>
                          <Text style={styles.friendStatus}>
                            {lastMessages[item.roomId]?.text || 'แตะเพื่อเริ่มคุย'}
                          </Text>
                          {unreadCounts[item.roomId] > 0 && (
                            <View style={styles.unreadBadge}>
                              <Text style={styles.unreadText}>{unreadCounts[item.roomId]}</Text>
                            </View>
                          )}
                        </View>
                      </View>
                    </ImageBackground>
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6fb',
  },
  header: {
    paddingHorizontal: 12,
    paddingTop: 0,
    paddingBottom: 6,
    // backgroundColor: '#ffffff',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 14,
    padding: 12,
  },
  headerFallback: {
    backgroundColor: '#ffffff',
  },
  headerImage: {
    borderRadius: 14,
  },
  headerOverlay: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 6,
    paddingHorizontal: 6,
  },
  headerOverlayTransparent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 14,
    paddingVertical: 6,
    paddingHorizontal: 6,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  avatarImage: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#e5e7eb',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0a7ea4',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0b132b',
    textShadowColor: 'rgba(0,0,0,0.25)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  subtitle: {
    color: '#1f2937',
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  body: {
    flex: 1,
    flexDirection: 'column',
    paddingHorizontal: 12,
    paddingBottom: 12,
    gap: 12,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionChip: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 14,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  actionChipText: {
    fontWeight: '700',
    color: '#e53935',
  },
  chatListContainer: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    gap: 8,
  },
  chatListWrapper: {
    flex: 1,
    backgroundColor: '#f5f6fb',
    borderRadius: 16,
    paddingBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  friendRow: {
    marginBottom: 10,
  },
  friendCard: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  friendCoverImage: {
    borderRadius: 12,
  },
  friendOverlay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 6,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 12,
  },
  friendAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  friendAvatarImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e5e7eb',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  friendAvatarText: {
    fontWeight: '800',
    color: '#0a7ea4',
  },
  friendName: {
    fontWeight: '700',
    color: '#0b132b',
  },
  friendStatus: {
    color: '#6b7280',
    fontSize: 12,
  },
  unreadBadge: {
    marginTop: 4,
    alignSelf: 'flex-start',
    backgroundColor: '#e53935',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  unreadText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 11,
  },
});

import { useEffect, useState } from 'react';
import {
  FlatList,
  ImageBackground,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Redirect, useRouter } from 'expo-router';

import { useAuth } from '@/providers/auth-provider';
import { supabase } from '@/lib/supabase';

export default function ChatScreen() {
  const router = useRouter();
  const { user, profile, signOut } = useAuth();
  const [friends, setFriends] = useState([]);
  const [loadingFriends, setLoadingFriends] = useState(true);

  useEffect(() => {
    if (!user) return;

    let mounted = true;
    const loadFriends = async () => {
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
        .select('id, display_name, avatar_url')
        .in('id', otherIds);
      const mapped = otherIds
        .map((id) => profilesData?.find((p) => p.id === id) || { id, display_name: 'เพื่อน' });
      if (mounted) {
        setFriends(mapped);
        setLoadingFriends(false);
      }
    };

    loadFriends();
  }, [user]);

  if (!user) {
    return <Redirect href="/login" />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <ImageBackground
        source={{
          uri:
            profile?.cover_url ||
            'https://images.unsplash.com/photo-1520671458121-9b47f3b9b64a?auto=format&fit=crop&w=1200&q=80',
        }}
        style={styles.header}
        imageStyle={{ opacity: 0.35 }}>
        <View style={styles.headerContent}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(profile?.display_name || profile?.full_name || 'U').slice(0, 1).toUpperCase()}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{profile?.display_name || 'เพื่อนๆ'}</Text>
            <Text style={styles.subtitle}>{profile?.full_name || user.email}</Text>
          </View>
          <View style={styles.actions}>
            <TouchableOpacity onPress={() => router.push('/friend-requests')}>
              <Text style={styles.iconButton}>🤝</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/add-friend')}>
              <Text style={styles.iconButton}>➕</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/profile')}>
              <Text style={styles.iconButton}>⚙️</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={signOut}>
              <Text style={styles.iconButton}>🚪</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ImageBackground>

      <View style={styles.body}>
        <View style={styles.chatListContainer}>
          <Text style={styles.sectionTitle}>แชท</Text>
          {loadingFriends ? (
            <Text style={{ color: '#6b7280' }}>กำลังโหลดรายชื่อเพื่อน...</Text>
          ) : friends.length === 0 ? (
            <Text style={{ color: '#6b7280' }}>ยังไม่มีเพื่อน กด ➕ เพื่อเพิ่ม</Text>
          ) : (
            <FlatList
              data={friends}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.friendRow}
                  onPress={() => router.push(`/chat/${item.id}`)}>
                  <View style={styles.friendAvatar}>
                    <Text style={styles.friendAvatarText}>
                      {(item.display_name || 'F').slice(0, 1).toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.friendName}>{item.display_name || 'เพื่อน'}</Text>
                    <Text style={styles.friendStatus}>แตะเพื่อเริ่มแชท</Text>
                  </View>
                </TouchableOpacity>
              )}
            />
          )}
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
    padding: 16,
    paddingTop: 28,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
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
  },
  subtitle: {
    color: '#1f2937',
  },
  messageRow: {
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
  },
  messageAuthor: {
    fontWeight: '700',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 16,
  },
  body: {
    flex: 1,
    flexDirection: 'column',
    paddingHorizontal: 12,
    paddingBottom: 12,
    gap: 12,
  },
  chatListContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    gap: 8,
  },
  chatContainer: {
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  friendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 12,
  },
  friendAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
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
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyText: {
    color: '#6b7280',
    fontSize: 16,
  },
  messageMine: {
    backgroundColor: '#e0f2fe',
    alignSelf: 'flex-end',
  },
  messageFriend: {
    backgroundColor: '#f1f5f9',
    alignSelf: 'flex-start',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  iconButton: {
    fontSize: 18,
  },
});

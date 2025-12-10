import { useEffect, useState } from 'react';
import {
  FlatList,
  ImageBackground,
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/providers/auth-provider';
import { supabase } from '@/lib/supabase';

export default function ChatScreen() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const insets = useSafeAreaInsets();
  const [friends, setFriends] = useState([]);
  const [loadingFriends, setLoadingFriends] = useState(true);
  const coverUri =
    profile?.cover_url ||
    'https://images.unsplash.com/photo-1520671458121-9b47f3b9b64a?auto=format&fit=crop&w=1200&q=80';

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
        .select('id, display_name, avatar_url, cover_url')
        .in('id', otherIds);
      const mapped = otherIds.map(
        (id) => profilesData?.find((p) => p.id === id) || { id, display_name: 'ไม่ทราบชื่อ' }
      );
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
            <Text style={styles.actionChipText}>คำขอ</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionChip} onPress={() => router.push('/add-friend')}>
            <Text style={styles.actionChipText}>เพิ่มเพื่อน</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.chatListContainer}>
          <Text style={styles.sectionTitle}>เพื่อน</Text>
          {loadingFriends ? (
            <Text style={{ color: '#6b7280' }}>กำลังโหลดเพื่อน...</Text>
          ) : friends.length === 0 ? (
            <Text style={{ color: '#6b7280' }}>ยังไม่มีเพื่อน กด + เพื่อเพิ่ม</Text>
          ) : (
            <FlatList
              data={friends}
              keyExtractor={(item) => item.id}
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
                        <Text style={styles.friendStatus}>แตะเพื่อเริ่มคุย</Text>
                      </View>
                    </View>
                  </ImageBackground>
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
    paddingHorizontal: 12,
    paddingTop: 0,
    paddingBottom: 6,
    backgroundColor: '#ffe9e9',
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
    color: '#0b132b',
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
});

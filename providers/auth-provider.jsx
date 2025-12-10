import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import * as FileSystem from 'expo-file-system/legacy';

import { supabase, SUPABASE_URL } from '@/lib/supabase';
import { registerForPushNotificationsAsync } from '@/lib/notifications';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pushToken, setPushToken] = useState(null);
  const [activeChatId, setActiveChatId] = useState(null);

  useEffect(() => {
    let active = true;

    const fetchSession = async () => {
      const { data } = await supabase.auth.getSession();
      const currentUser = data.session?.user ?? null;
      if (!active) return;
      setUser(currentUser);
      if (currentUser) {
        await loadProfile(currentUser);
      } else {
        setProfile(null);
      }
      setLoading(false);
    };

    fetchSession();

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        loadProfile(currentUser);
      } else {
        setProfile(null);
      }
    });

    return () => {
      active = false;
      subscription?.subscription?.unsubscribe();
    };
  }, []);

  // ลงทะเบียน push token เมื่อมี user
  useEffect(() => {
    const ensurePushToken = async () => {
      if (!user) {
        setPushToken(null);
        return;
      }
      const token = await registerForPushNotificationsAsync();
      if (token && token !== pushToken) {
        setPushToken(token);
        // บันทึกลงโปรไฟล์ (ต้องมีคอลัมน์ push_token ในตาราง profiles)
        await supabase.from('profiles').update({ push_token: token }).eq('id', user.id);
      }
    };
    ensurePushToken();
  }, [user, pushToken]);

  const loadProfile = async (userObj) => {
    const userId = userObj?.id;
    if (!userId) return;
    const { data, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    if (profileError) {
      console.warn('โหลดโปรไฟล์ไม่สำเร็จ', profileError.message);
      setProfile(null);
      return;
    }
    if (!data) {
      console.warn('ยังไม่มีโปรไฟล์ในตาราง profiles ของ user', userId, 'จะสร้างให้ใหม่');
      const meta = userObj.user_metadata || {};
      const { data: inserted, error: createError } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          email: userObj.email,
          display_name: meta.display_name || meta.name || userObj.email,
          full_name: meta.full_name || meta.name || '',
        })
        .select()
        .maybeSingle();
      if (createError) {
        console.warn('สร้างโปรไฟล์ไม่สำเร็จ', createError.message);
        setProfile(null);
        return;
      }
      setProfile(inserted);
      return;
    }
    setProfile(data);
  };

  const uriToBase64DataUrl = async (uri) => {
    if (!uri) return null;
    // ถ้าเป็น data URL อยู่แล้ว ไม่ต้องอ่านไฟล์ซ้ำ
    if (uri.startsWith('data:')) return uri;
    const base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
    const mime = uri?.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';
    return `data:${mime};base64,${base64}`;
  };

  const signUp = async ({ email, password, displayName, fullName }) => {
    setError(null);
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { display_name: displayName, full_name: fullName },
      },
    });
    if (signUpError) throw signUpError;
    const createdUser = data.user ?? data.session?.user;
    const userId = createdUser?.id;
    if (userId) {
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: userId,
        display_name: displayName,
        full_name: fullName,
        email: email.trim(),
      });
      if (profileError) setError(profileError);
      await loadProfile(createdUser);
    }
    const requiresConfirmation = !data.session;
    return { requiresConfirmation };
  };

  const signIn = async (email, password) => {
    setError(null);
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (signInError) throw signInError;
  };

  const signOutUser = async () => {
    setError(null);
    await supabase.auth.signOut();
  };

  const resetPassword = async (email) => {
    setError(null);
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: 'https://example.com/reset-complete',
    });
    if (resetError) throw resetError;
  };

  const updateProfileData = async ({ displayName, fullName, bio, age }, avatarUri, coverUri) => {
    if (!user) throw new Error('ไม่พบผู้ใช้');
    // เก็บรูปเป็น Base64 data URL เพื่อตัดปัญหา Storage
    const avatarDataUrl = avatarUri ? await uriToBase64DataUrl(avatarUri) : null;
    const coverDataUrl = coverUri ? await uriToBase64DataUrl(coverUri) : null;
    const updates = {
      ...(displayName ? { display_name: displayName } : {}),
      ...(fullName ? { full_name: fullName } : {}),
      ...(bio ? { bio } : {}),
      ...(age ? { age } : {}),
      ...(avatarDataUrl ? { avatar_url: avatarDataUrl } : {}),
      ...(coverDataUrl ? { cover_url: coverDataUrl } : {}),
    };
    const { error: profileError } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id);
    if (profileError) throw profileError;
    if (displayName || fullName) {
      await supabase.auth.updateUser({
        data: {
          ...(displayName ? { display_name: displayName } : {}),
          ...(fullName ? { full_name: fullName } : {}),
        },
      });
    }
    await loadProfile(user);
  };

  // Debug: ตรวจ storage endpoint + token
  const testStorageConnectivity = async () => {
    const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();
    if (sessionErr || !sessionData?.session?.access_token) {
      throw new Error('ไม่มี session token สำหรับทดสอบ storage');
    }
    const token = sessionData.session.access_token;
    const url = `${SUPABASE_URL}/storage/v1/object/profiles/test-check.txt`;
    const res = await fetch(url, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = await res.text().catch(() => '');
    console.log('Storage probe', res.status, body);
    return { status: res.status, ok: res.ok, body };
  };

  // Debug: upload ไฟล์ทดสอบ (text) ไปที่ bucket profiles/avatars
  const testStorageUpload = async () => {
    if (!user) throw new Error('ต้องล็อกอินก่อน');
    const blob = new Blob(['ping'], { type: 'text/plain' });
    const path = `avatars/${user.id}-test.txt`;
    const { data, error } = await supabase.storage
      .from('profiles')
      .upload(path, blob, { upsert: true, cacheControl: '3600' });
    if (error) throw error;
    return data;
  };

  const sendFriendRequest = async (friendId) => {
    if (!user) throw new Error('ต้องล็อกอินก่อน');
    const trimmed = friendId.trim();
    if (!trimmed) throw new Error('กรุณาใส่ Friend ID หรืออีเมล');
    const { error: frError } = await supabase.from('friend_requests').insert({
      to_user_id: trimmed,
      from_user_id: user.id,
      status: 'pending',
    });
    if (frError) throw frError;
  };

  const value = useMemo(
    () => ({
      user,
      profile,
      loading,
      error,
      signUp,
      signIn,
      signOut: signOutUser,
      resetPassword,
      updateProfile: updateProfileData,
      sendFriendRequest,
      testStorageConnectivity,
      testStorageUpload,
      pushToken,
      activeChatId,
      setActiveChatId,
    }),
    [user, profile, loading, error, pushToken, activeChatId]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('ใช้ useAuth ภายใน AuthProvider เท่านั้น');
  }
  return ctx;
}

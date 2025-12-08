import { createContext, useContext, useEffect, useMemo, useState } from 'react';

import { supabase } from '@/lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  const uploadImage = async (uri, path) => {
    if (!uri) return null;
    const response = await fetch(uri);
    const blob = await response.blob();
    const bucket = 'profiles';
    const { data, error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(path, blob, {
        cacheControl: '3600',
        upsert: true,
        contentType: blob.type || 'image/jpeg',
      });
    if (uploadError) {
      console.warn('Upload error', uploadError);
      throw uploadError;
    }
    const { data: publicUrl, error: publicErr } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);
    if (publicErr) throw publicErr;
    return publicUrl.publicUrl;
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
    const avatarUrl = avatarUri ? await uploadImage(avatarUri, `avatars/${user.id}.jpg`) : null;
    const coverUrl = coverUri ? await uploadImage(coverUri, `covers/${user.id}.jpg`) : null;
    const updates = {
      ...(displayName ? { display_name: displayName } : {}),
      ...(fullName ? { full_name: fullName } : {}),
      ...(bio ? { bio } : {}),
      ...(age ? { age } : {}),
      ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
      ...(coverUrl ? { cover_url: coverUrl } : {}),
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
    }),
    [user, profile, loading, error]
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

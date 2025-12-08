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
import { Redirect } from 'expo-router';

import { useAuth } from '@/providers/auth-provider';
import { supabase } from '@/lib/supabase';

export default function AddFriendScreen() {
  const { user, sendFriendRequest } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);

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
      setResults(data || []);
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
    } catch (err) {
      Alert.alert('ส่งคำขอเพื่อนไม่สำเร็จ', err.message);
    } finally {
      setSearching(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 16 : 0}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.container}>
            <Text style={styles.title}>ค้นหาเพื่อน</Text>
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
                    <Text style={styles.resultEmail}>{item.email}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => handleSendFromResult(item.id)}
                    disabled={searching}>
                    <Text style={{ color: '#fff', fontWeight: '700' }}>ขอเป็นเพื่อน</Text>
                  </TouchableOpacity>
                </View>
              )}
              ListEmptyComponent={
                <Text style={{ color: '#6b7280' }}>
                  {searching ? 'กำลังค้นหา...' : 'ไม่พบผลลัพธ์'}
                </Text>
              }
            />
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    gap: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
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
});

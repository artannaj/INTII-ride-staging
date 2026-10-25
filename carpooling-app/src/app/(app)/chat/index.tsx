import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { MessageCircle } from 'lucide-react-native';
import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/components/app-header';
import { BottomNav } from '@/components/bottom-nav';
import { Avatar } from '@/components';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/auth';
import { usePolling } from '@/hooks/use-polling';
import { ApiError, getConversations, type Conversation } from '@/lib/api';
import { BOOKING_STATUS, formatDay, formatTime } from '@/lib/status';

export default function ChatListScreen() {
  const { token } = useAuth();
  const [conversations, setConversations] = useState<Conversation[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  usePolling(async () => {
    if (!token) return;
    try {
      setConversations(await getConversations(token));
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load chats.');
    }
  }, 10000);

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <AppHeader title="Chats" showBack={false} />

      <FlatList
        data={conversations ?? []}
        keyExtractor={(c) => String(c.bookingId)}
        contentContainerStyle={styles.list}
        ListHeaderComponent={error ? <Text style={styles.error}>{error}</Text> : null}
        ListEmptyComponent={
          conversations ? (
            <View style={styles.empty}>
              <MessageCircle size={36} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>No chats yet</Text>
              <Text style={styles.emptySub}>
                A chat opens for every ride booking, so you can coordinate pickup with your driver or passengers.
              </Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => {
          const status = BOOKING_STATUS[item.bookingStatus];
          const name = item.otherName ?? (item.otherRole === 'DRIVER' ? 'Driver' : 'Passenger');
          return (
            <Pressable
              style={styles.row}
              onPress={() => router.push({ pathname: '/(app)/chat/[bookingId]', params: { bookingId: String(item.bookingId), name } })}>
              <Avatar name={name} size={46} />
              <View style={styles.rowBody}>
                <View style={styles.rowTop}>
                  <Text style={styles.name} numberOfLines={1}>{name}</Text>
                  <Text style={styles.time}>
                    {item.lastMessageAt ? formatTime(item.lastMessageAt) : formatDay(item.departureTime)}
                  </Text>
                </View>
                <Text style={styles.route} numberOfLines={1}>
                  {item.otherRole === 'DRIVER' ? 'Driver' : 'Passenger'} · {item.origin} → {item.destination}
                </Text>
                <View style={styles.rowBottom}>
                  <Text style={[styles.preview, !item.lastMessage && styles.previewEmpty]} numberOfLines={1}>
                    {item.lastMessage ?? 'Say hi and confirm the pickup point'}
                  </Text>
                  <View style={[styles.pill, { backgroundColor: status.bg }]}>
                    <Text style={[styles.pillText, { color: status.color }]}>{status.label}</Text>
                  </View>
                </View>
              </View>
            </Pressable>
          );
        }}
      />

      <BottomNav active="chat" />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#E0E0E0' },
  list: { padding: 16, gap: 10, flexGrow: 1 },
  row: { flexDirection: 'row', gap: 12, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14, alignItems: 'center' },
  rowBody: { flex: 1, gap: 2 },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  name: { flex: 1, fontSize: 15, fontWeight: '800', color: Colors.light.text },
  time: { fontSize: 11, color: '#9CA3AF' },
  route: { fontSize: 12, color: '#6B7280' },
  rowBottom: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  preview: { flex: 1, fontSize: 13, color: Colors.light.text },
  previewEmpty: { color: '#9CA3AF', fontStyle: 'italic' },
  pill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  pillText: { fontSize: 10, fontWeight: '800' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: Colors.light.text },
  emptySub: { fontSize: 13, color: '#6B7280', textAlign: 'center' },
  error: { color: Colors.light.danger, textAlign: 'center', marginBottom: 8 },
});

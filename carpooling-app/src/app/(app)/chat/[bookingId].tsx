import { useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Send } from 'lucide-react-native';
import { useCallback, useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/app-header';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/auth';
import { usePolling } from '@/hooks/use-polling';
import { ApiError, getBooking, getMessages, sendMessage, type Booking, type ChatMessage } from '@/lib/api';
import { formatTime } from '@/lib/status';

const POLL_MS = 3000;
const QUICK_REPLIES = ["I'm at the pickup point", 'Running 5 min late', 'On my way!', 'Thank you!'];

export default function ChatThreadScreen() {
  const { token, user } = useAuth();
  const insets = useSafeAreaInsets();
  // `name` is passed by the screen that opened the chat; the app doesn't know user ids
  const params = useLocalSearchParams<{ bookingId: string; name?: string }>();
  const bookingId = Number(params.bookingId);

  const [booking, setBooking] = useState<Booking | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<FlatList<ChatMessage>>(null);
  const lastIdRef = useRef<number | undefined>(undefined);

  const appendMessages = useCallback((incoming: ChatMessage[]) => {
    if (incoming.length === 0) return;
    setMessages((prev) => {
      const seen = new Set(prev.map((m) => m.id));
      const merged = [...prev, ...incoming.filter((m) => !seen.has(m.id))];
      lastIdRef.current = merged[merged.length - 1]?.id;
      return merged;
    });
  }, []);

  usePolling(async () => {
    if (!token || !bookingId) return;
    try {
      if (!booking) setBooking(await getBooking(token, bookingId));
      // Only fetch messages newer than what we already have
      appendMessages(await getMessages(token, bookingId, lastIdRef.current));
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load messages.');
    }
  }, POLL_MS);

  async function onSend(text = draft) {
    const message = text.trim();
    if (!token || !message || sending) return;
    setSending(true);
    try {
      const sent = await sendMessage(token, bookingId, message);
      appendMessages([sent]);
      setDraft('');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Message not sent.');
    } finally {
      setSending(false);
    }
  }

  const otherName =
    params.name ??
    (booking ? (user?.role === 'DRIVER' ? booking.passengerName : booking.driverName) : null) ??
    'Chat';
  const closed = booking?.status === 'CANCELLED' || booking?.status === 'REJECTED';

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <AppHeader title={otherName} />

      {booking ? (
        <View style={styles.banner}>
          <Text style={styles.bannerText} numberOfLines={1}>
            {booking.origin} → {booking.destination}
          </Text>
        </View>
      ) : null}

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}>
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => String(m.id)}
          contentContainerStyle={styles.list}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          ListEmptyComponent={
            <Text style={styles.empty}>No messages yet. Agree on the pickup spot here.</Text>
          }
          renderItem={({ item }) => (
            <View style={[styles.bubbleRow, item.mine && styles.bubbleRowMine]}>
              <View style={[styles.bubble, item.mine ? styles.bubbleMine : styles.bubbleTheirs]}>
                <Text style={[styles.bubbleText, item.mine && styles.bubbleTextMine]}>{item.message}</Text>
                <Text style={[styles.bubbleTime, item.mine && styles.bubbleTimeMine]}>{formatTime(item.createdAt)}</Text>
              </View>
            </View>
          )}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {closed ? (
          <Text style={[styles.closed, { paddingBottom: Math.max(insets.bottom, 12) }]}>
            This booking is closed, so the chat is read-only.
          </Text>
        ) : (
          <View style={[styles.composer, { paddingBottom: Math.max(insets.bottom, 10) }]}>
            <FlatList
              horizontal
              data={QUICK_REPLIES}
              keyExtractor={(q) => q}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.quickList}
              renderItem={({ item }) => (
                <Pressable style={styles.quick} onPress={() => onSend(item)}>
                  <Text style={styles.quickText}>{item}</Text>
                </Pressable>
              )}
            />
            <View style={styles.inputRow}>
              <TextInput
                value={draft}
                onChangeText={setDraft}
                placeholder="Type a message"
                placeholderTextColor="#9CA3AF"
                style={styles.input}
                multiline
                maxLength={1000}
              />
              <Pressable
                style={[styles.sendBtn, (!draft.trim() || sending) && { opacity: 0.5 }]}
                onPress={() => onSend()}
                disabled={!draft.trim() || sending}>
                <Send size={18} color="#FFFFFF" />
              </Pressable>
            </View>
          </View>
        )}
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F3F4F6' },
  banner: { backgroundColor: '#FFFFFF', paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  bannerText: { fontSize: 12, fontWeight: '600', color: '#6B7280', textAlign: 'center' },
  list: { padding: 16, gap: 8, flexGrow: 1 },
  empty: { textAlign: 'center', color: '#9CA3AF', marginTop: 40, fontSize: 13 },
  bubbleRow: { flexDirection: 'row' },
  bubbleRowMine: { justifyContent: 'flex-end' },
  bubble: { maxWidth: '78%', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 8 },
  bubbleMine: { backgroundColor: Colors.light.primary, borderBottomRightRadius: 4 },
  bubbleTheirs: { backgroundColor: '#FFFFFF', borderBottomLeftRadius: 4 },
  bubbleText: { fontSize: 15, color: Colors.light.text },
  bubbleTextMine: { color: '#FFFFFF' },
  bubbleTime: { fontSize: 10, color: '#9CA3AF', marginTop: 2, alignSelf: 'flex-end' },
  bubbleTimeMine: { color: 'rgba(255,255,255,0.75)' },
  error: { color: Colors.light.danger, textAlign: 'center', fontSize: 12, paddingVertical: 4 },
  closed: { textAlign: 'center', color: '#6B7280', backgroundColor: '#FFFFFF', paddingTop: 12, fontSize: 13 },
  composer: { backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#E5E7EB', paddingTop: 8, gap: 8 },
  quickList: { paddingHorizontal: 12, gap: 8 },
  quick: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6 },
  quickText: { fontSize: 12, fontWeight: '600', color: Colors.light.text },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, paddingHorizontal: 12 },
  input: {
    flex: 1,
    maxHeight: 110,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 15,
    color: Colors.light.text,
  },
  sendBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: Colors.light.primary, alignItems: 'center', justifyContent: 'center' },
});

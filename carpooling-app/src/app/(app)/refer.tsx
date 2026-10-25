import * as Clipboard from 'expo-clipboard';
import { StatusBar } from 'expo-status-bar';
import { Share2, User, Wallet } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Pressable, Share, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/components/app-header'; // <-- Use the perfect header
import {
    Button,
    MenuRow,
    ScreenScroll,
    SectionGroup,
} from '@/components';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/auth';
import { ApiError, getReferrals, type ReferralSummary } from '@/lib/api';

export default function ReferScreen() {
  const { token } = useAuth();
  const [summary, setSummary] = useState<ReferralSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!token) return;
    getReferrals(token)
      .then(setSummary)
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : 'Could not load referrals.')
      );
  }, [token]);

  const code = summary?.code || '———————';
  const invited = summary?.invitedCount ?? 0;
  const completed = summary?.completedCount ?? 0;
  const earned = summary?.totalEarned ?? 0;
  const goal = 5;
  const progressDots = Array(goal)
    .fill(0)
    .map((_, i) => i < invited);

  async function copyCode() {
    try {
      await Clipboard.setStringAsync(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  }

  async function shareInvite() {
    try {
      await Share.share({
        message: `Join me on INTI Ride — use code ${code} for RM5 off your first ride. inti.ride/join/${code}`,
      });
    } catch {}
  }

  return (
    <View style={styles.safe}>
      <StatusBar style="light" />
      <AppHeader title="Refer & earn" />

      <ScreenScroll>
        {/* Hero card */}
        <View style={styles.hero}>
          <Text style={styles.heroKicker}>Give RM5, get RM5</Text>
          <Text style={styles.heroTitle}>Invite friends to INTI Ride</Text>

          <Pressable onPress={copyCode} style={styles.codeBox}>
            <Text style={styles.code}>{code}</Text>
          </Pressable>

          <Text style={styles.copyHint}>
            {copied ? 'Copied!' : 'Tap to copy'}
          </Text>
        </View>

        {/* Progress card */}
        <View style={styles.progressCard}>
          <View style={styles.progressHead}>
            <Text style={styles.progressLabel}>
              {invited} of {goal} friends joined
            </Text>
            <Text style={styles.progressEarned}>
              RM {earned.toFixed(0)} earned
            </Text>
          </View>

          <View style={styles.dotsRow}>
            {progressDots.map((on, i) => (
              <View
                key={i}
                style={[styles.dot, on ? styles.dotOn : styles.dotOff]}
              />
            ))}
          </View>

          <Text style={styles.progressHint}>
            {invited >= goal
              ? 'You unlocked your free ride. Keep sharing!'
              : `Invite ${goal - invited} more friend${
                  goal - invited > 1 ? 's' : ''
                } to unlock a free ride up to RM10.`}
          </Text>
        </View>

        <Button label="Share invite link" onPress={shareInvite} />

        {/* How it works */}
        <SectionGroup title="How it works">
          <MenuRow
            Icon={Share2}
            title="1. Share your code"
            onPress={shareInvite}
          />
          <MenuRow
            Icon={User}
            title="2. Friend signs up"
            subtitle="With their INTI email"
            onPress={() => {}}
          />
          <MenuRow
            Icon={Wallet}
            title="3. You both earn RM5"
            subtitle="Credited after their first ride"
            onPress={() => {}}
            last
          />
        </SectionGroup>

        {error ? <Text style={styles.error}>{error}</Text> : null}
      </ScreenScroll>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.light.background },

  hero: {
    backgroundColor: Colors.light.text,
    borderRadius: 20,
    padding: 22,
    alignItems: 'center',
    gap: 8,
  },
  heroKicker: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '600',
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.6,
    textAlign: 'center',
    marginBottom: 6,
  },
  codeBox: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginTop: 6,
  },
  code: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 3,
  },
  copyHint: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.5)',
  },

  progressCard: {
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 14,
    padding: 16,
    gap: 10,
  },
  progressHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.light.text,
  },
  progressEarned: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    flex: 1,
    height: 6,
    borderRadius: 3,
  },
  dotOn: {
    backgroundColor: Colors.light.primary,
  },
  dotOff: {
    backgroundColor: '#E5E7EB',
  },
  progressHint: {
    fontSize: 11,
    color: Colors.light.textSecondary,
    lineHeight: 15,
  },

  error: {
    fontSize: 12,
    color: Colors.light.primary,
    textAlign: 'center',
  },
});
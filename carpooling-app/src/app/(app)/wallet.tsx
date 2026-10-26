import { StatusBar } from 'expo-status-bar';
import {
    Banknote,
    CreditCard,
    Wallet as WalletIcon
} from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';

import { AppHeader } from '@/components/app-header'; // <-- Use the perfect header
import {
    Badge,
    Button,
    ScreenScroll,
    SectionGroup,
    Toggle,
} from '@/components';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/auth';
import {
    ApiError,
    createPaymentMethod,
    deletePaymentMethod,
    getPreferences,
    getWallet,
    listPaymentMethods,
    setDefaultPaymentMethod,
    topUpWallet,
    updatePreferences,
    TOPUP_MAX,
    TOPUP_MIN,
    type PaymentMethod,
    type Wallet,
} from '@/lib/api';
import { authenticate, getBiometricSupport, type BiometricSupport } from '@/lib/biometrics';
import { getBiometricPayEnabled, setBiometricPayEnabled } from '@/lib/storage';

const TYPE_ICON = {
  CARD: CreditCard,
  EWALLET: WalletIcon,
  BANK: Banknote,
  CASH: Banknote,
} as const;

export default function WalletScreen() {
  const { token } = useAuth();

  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Biometric payments is a per-device preference stored in SecureStore;
  // payment alerts map to the notifyPayments preference on the server.
  const [bioPay, setBioPay] = useState(false);
  const [bioSupport, setBioSupport] = useState<BiometricSupport | null>(null);
  const [alerts, setAlerts] = useState(true);

  // Top-up modal
  const [topupVisible, setTopupVisible] = useState(false);
  const [topupAmount, setTopupAmount] = useState(20);
  const [customAmount, setCustomAmount] = useState('');
  const [topupMethodId, setTopupMethodId] = useState<number | null>(null);
  const [topupBusy, setTopupBusy] = useState(false);

  // Add-method modal
  const [addVisible, setAddVisible] = useState(false);
  const [addType, setAddType] = useState<'CARD' | 'EWALLET' | 'BANK' | 'CASH'>('CARD');
  const [provider, setProvider] = useState('');
  const [accountRef, setAccountRef] = useState('');
  const [expiry, setExpiry] = useState('');
  const [addBusy, setAddBusy] = useState(false);

  async function load() {
    if (!token) return;
    setError(null);
    try {
      const [w, m, prefs] = await Promise.all([
        getWallet(token),
        listPaymentMethods(token),
        getPreferences(token).catch(() => null),
      ]);
      setWallet(w);
      setMethods(m);
      if (prefs) setAlerts(prefs.notifyPayments);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load wallet.');
    }
  }

  useEffect(() => {
    void getBiometricSupport().then(setBioSupport);
    void getBiometricPayEnabled().then(setBioPay);
  }, []);

  async function toggleBioPay(value: boolean) {
    setError(null);
    if (value) {
      if (!bioSupport?.available) {
        setError(bioSupport?.reason ?? 'Biometrics are not available on this device.');
        return;
      }
      // Prove it works before relying on it for payments
      const ok = await authenticate('Confirm to turn on biometric payments');
      if (!ok) return;
    }
    setBioPay(value);
    await setBiometricPayEnabled(value);
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Cash can't fund a top-up; default to the default method when it's eligible
  const fundingMethods = methods.filter((m) => m.type !== 'CASH');
  const selectedFunding =
    fundingMethods.find((m) => m.id === topupMethodId) ??
    fundingMethods.find((m) => m.isDefault) ??
    fundingMethods[0] ??
    null;

  async function toggleAlerts(value: boolean) {
    if (!token) return;
    setAlerts(value);
    try {
      await updatePreferences(token, { notifyPayments: value });
    } catch (err) {
      setAlerts(!value);
      setError(err instanceof ApiError ? err.message : 'Could not save.');
    }
  }

  function chooseAmount(value: number) {
    setTopupAmount(value);
    setCustomAmount('');
  }

  async function doTopUp() {
    if (!token) return;
    setError(null);
    if (!selectedFunding) {
      setError('Add a card, e-wallet or bank account to top up from.');
      return;
    }
    if (!(topupAmount >= TOPUP_MIN && topupAmount <= TOPUP_MAX)) {
      setError(`Top up between RM ${TOPUP_MIN} and RM ${TOPUP_MAX}.`);
      return;
    }
    if (bioPay) {
      const ok = await authenticate(`Confirm top-up of RM ${topupAmount.toFixed(2)}`);
      if (!ok) {
        setError('Top-up cancelled: biometric check did not pass.');
        return;
      }
    }
    setTopupBusy(true);
    try {
      await topUpWallet(token, topupAmount, selectedFunding.id);
      setTopupVisible(false);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Top-up failed.');
    } finally {
      setTopupBusy(false);
    }
  }

  async function addMethod() {
    if (!token) return;
    if (!provider.trim()) {
      setError('Enter a provider name.');
      return;
    }
    if (addType !== 'CASH' && accountRef.replace(/\D/g, '').length < 4) {
      setError('Enter the last 4 digits of the account.');
      return;
    }
    setAddBusy(true);
    try {
      await createPaymentMethod(token, {
        type: addType,
        provider: provider.trim(),
        accountRef: addType === 'CASH' ? undefined : accountRef.trim(),
        expiryDate: addType === 'CARD' && expiry.trim() ? expiry.trim() : undefined,
      });
      setAddVisible(false);
      setProvider('');
      setAccountRef('');
      setExpiry('');
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not add method.');
    } finally {
      setAddBusy(false);
    }
  }

  function removeMethod(method: PaymentMethod) {
    if (!token) return;
    Alert.alert('Remove payment method?', `${method.provider} ${method.accountRef ?? ''}`.trim(), [
      { text: 'Keep', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await deletePaymentMethod(token, method.id);
            await load();
          } catch (err) {
            setError(err instanceof ApiError ? err.message : 'Could not remove.');
          }
        },
      },
    ]);
  }

  async function makeDefault(id: number) {
    if (!token) return;
    try {
      await setDefaultPaymentMethod(token, id);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not set default.');
    }
  }

  const balance = wallet?.balance ?? 0;

  return (
    <View style={styles.safe}>
      <StatusBar style="light" />
      <AppHeader title="Payment" />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScreenScroll>
          {/* Balance card */}
          <View style={styles.balanceCard}>
            <View style={styles.balanceHead}>
              <Text style={styles.balanceLabel}>Campus Wallet balance</Text>
              <Pressable
                onPress={() => {
                  setError(null);
                  setTopupVisible(true);
                }}
                style={styles.topupBtn}>
                <Text style={styles.topupText}>Top up</Text>
              </Pressable>
            </View>
            <Text style={styles.balanceValue}>RM {balance.toFixed(2)}</Text>
            <Text style={styles.balanceSub}>
              Used for ride fares when selected at checkout
            </Text>
            {wallet && wallet.totalEarned > 0 ? (
              <Text style={styles.balanceSub}>
                Earned from driving: RM {wallet.totalEarned.toFixed(2)}
              </Text>
            ) : null}
          </View>

          {/* Payment methods */}
          <SectionGroup title="Payment methods">
            {methods.map((m) => {
              const Icon = TYPE_ICON[m.type as keyof typeof TYPE_ICON] || CreditCard;
              return (
                <Pressable
                  key={m.id}
                  onLongPress={() => removeMethod(m)}
                  onPress={() => {
                    if (!m.isDefault) makeDefault(m.id);
                  }}
                  style={styles.methodRow}>
                  <View style={styles.methodIcon}>
                    <Icon size={18} color={Colors.light.textSecondary} strokeWidth={2} />
                  </View>
                  <View style={styles.methodMiddle}>
                    <Text style={styles.methodTitle}>{m.provider}</Text>
                    {m.accountRef ? (
                      <Text style={styles.methodSub} numberOfLines={1}>
                        {m.accountRef}
                      </Text>
                    ) : null}
                  </View>
                  {m.isDefault ? <Badge label="Default" variant="success" /> : null}
                </Pressable>
              );
            })}

            <Pressable
              onPress={() => {
                setError(null);
                setAddVisible(true);
              }}
              style={styles.addMethodRow}>
              <Text style={styles.addMethodText}>+ Add payment method</Text>
              <Text style={styles.addMethodSub}>
                Card, e-wallet or online banking · long-press a method to remove it
              </Text>
            </Pressable>
          </SectionGroup>

          {/* Security & preferences */}
          <SectionGroup title="Security & preferences">
            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>
                {bioSupport?.available ? `${bioSupport.label} for payments` : 'Biometric payments'}
              </Text>
              <Toggle value={bioPay} onChange={toggleBioPay} />
            </View>
            <View style={[styles.toggleRow, styles.toggleLast]}>
              <Text style={styles.toggleLabel}>Payment alerts</Text>
              <Toggle value={alerts} onChange={toggleAlerts} />
            </View>
          </SectionGroup>

          {/* How ride payments work */}
          <SectionGroup title="How ride payments work">
            <Text style={styles.infoText}>
              When you request a seat with Campus Wallet, the fare is held from your balance.
              It's refunded in full if the driver declines or cancels, or if you cancel before
              the trip starts. The driver receives it when the trip ends. You can also choose
              to pay the driver in cash at pickup.
            </Text>
          </SectionGroup>

          {/* Transactions */}
          <SectionGroup title="Transaction history">
            {wallet?.transactions && wallet.transactions.length > 0 ? (
              wallet.transactions.map((t, i) => {
                const positive = t.amount >= 0;
                return (
                  <View
                    key={t.id}
                    style={[
                      styles.txRow,
                      i < wallet.transactions.length - 1 && styles.txDivider,
                    ]}>
                    <View style={styles.txIcon}>
                      <WalletIcon size={16} color={Colors.light.textSecondary} strokeWidth={2} />
                    </View>
                    <View style={styles.txMiddle}>
                      <Text style={styles.txTitle}>{t.description}</Text>
                      <Text style={styles.txSub}>
                        {new Date(t.createdAt).toLocaleDateString()} · {t.reference}
                      </Text>
                    </View>
                    <Text style={[styles.txAmount, positive && styles.txAmountPos]}>
                      {positive ? '+' : ''}RM {t.amount.toFixed(2)}
                    </Text>
                  </View>
                );
              })
            ) : (
              <Text style={styles.emptyText}>No transactions yet.</Text>
            )}
          </SectionGroup>

          {error ? <Text style={styles.error}>{error}</Text> : null}
        </ScreenScroll>
      </KeyboardAvoidingView>

      {/* Top-up modal */}
      <Modal
        visible={topupVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setTopupVisible(false)}>
        <View style={styles.backdrop}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Top up wallet</Text>

            <View style={styles.amountGrid}>
              {[10, 20, 50, 100].map((a) => {
                const on = a === topupAmount && !customAmount;
                return (
                  <Pressable
                    key={a}
                    onPress={() => chooseAmount(a)}
                    style={[styles.amountBtn, on && styles.amountBtnOn]}>
                    <Text style={[styles.amountText, on && styles.amountTextOn]}>
                      RM {a}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View>
              <Text style={styles.label}>Or enter an amount (RM {TOPUP_MIN}–{TOPUP_MAX})</Text>
              <TextInput
                value={customAmount}
                onChangeText={(t) => {
                  const clean = t.replace(/[^0-9.]/g, '');
                  setCustomAmount(clean);
                  const n = Number(clean);
                  if (clean && !Number.isNaN(n)) setTopupAmount(Math.round(n * 100) / 100);
                }}
                placeholder="e.g. 15"
                placeholderTextColor="#9CA3AF"
                keyboardType="decimal-pad"
                style={styles.input}
              />
            </View>

            <View>
              <Text style={styles.label}>Pay from</Text>
              {fundingMethods.length === 0 ? (
                <Pressable
                  onPress={() => {
                    setTopupVisible(false);
                    setAddVisible(true);
                  }}
                  style={styles.fundingEmpty}>
                  <Text style={styles.addMethodText}>+ Add a card, e-wallet or bank first</Text>
                </Pressable>
              ) : (
                <View style={styles.fundingList}>
                  {fundingMethods.map((m) => {
                    const on = m.id === selectedFunding?.id;
                    return (
                      <Pressable
                        key={m.id}
                        onPress={() => setTopupMethodId(m.id)}
                        style={[styles.fundingRow, on && styles.fundingRowOn]}>
                        <Text style={[styles.fundingText, on && styles.fundingTextOn]} numberOfLines={1}>
                          {m.provider}{m.accountRef ? ` ${m.accountRef}` : ''}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </View>

            <Text style={styles.simNote}>
              Demo mode: top-ups are simulated and no real money is charged.
            </Text>

            {error && topupVisible ? <Text style={styles.error}>{error}</Text> : null}

            <Button
              label={`Add RM ${topupAmount.toFixed(2)}`}
              onPress={doTopUp}
              loading={topupBusy}
              disabled={!selectedFunding}
            />
            <Pressable
              onPress={() => setTopupVisible(false)}
              style={styles.cancelRow}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Add method modal */}
      <Modal
        visible={addVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setAddVisible(false)}>
        <View style={styles.backdrop}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Add payment method</Text>

            <View style={styles.typeRow}>
              {(['CARD', 'EWALLET', 'BANK', 'CASH'] as const).map((t) => {
                const on = t === addType;
                return (
                  <Pressable
                    key={t}
                    onPress={() => setAddType(t)}
                    style={[styles.typeBtn, on && styles.typeBtnOn]}>
                    <Text style={[styles.typeText, on && styles.typeTextOn]}>
                      {t}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View>
              <Text style={styles.label}>Provider</Text>
              <TextInput
                value={provider}
                onChangeText={setProvider}
                placeholder="Visa, Touch 'n Go, Maybank..."
                placeholderTextColor="#9CA3AF"
                style={styles.input}
              />
            </View>

            {addType !== 'CASH' ? (
              <View>
                <Text style={styles.label}>
                  {addType === 'EWALLET' ? 'Last 4 digits of linked phone' : 'Last 4 digits'}
                </Text>
                <TextInput
                  value={accountRef}
                  onChangeText={(t) => setAccountRef(t.replace(/\D/g, '').slice(-4))}
                  placeholder="4821"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="number-pad"
                  maxLength={4}
                  style={styles.input}
                />
                <Text style={styles.simNote}>We only store the last 4 digits, never the full number.</Text>
              </View>
            ) : null}

            {addType === 'CARD' ? (
              <View>
                <Text style={styles.label}>Expiry (MM/YY)</Text>
                <TextInput
                  value={expiry}
                  onChangeText={(t) => {
                    const d = t.replace(/\D/g, '').slice(0, 4);
                    setExpiry(d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d);
                  }}
                  placeholder="08/28"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="number-pad"
                  maxLength={5}
                  style={styles.input}
                />
              </View>
            ) : null}

            {error && addVisible ? <Text style={styles.error}>{error}</Text> : null}

            <Button label="Add method" onPress={addMethod} loading={addBusy} />
            <Pressable onPress={() => setAddVisible(false)} style={styles.cancelRow}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.light.background },
  infoText: { fontSize: 13, lineHeight: 19, color: Colors.light.textSecondary, padding: 16 },
  simNote: { fontSize: 11, color: '#9CA3AF', marginTop: 4 },
  fundingList: { gap: 8 },
  fundingEmpty: { paddingVertical: 12 },
  fundingRow: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12 },
  fundingRowOn: { borderColor: Colors.light.primary, backgroundColor: Colors.light.primarySoft },
  fundingText: { fontSize: 14, fontWeight: '600', color: Colors.light.text },
  fundingTextOn: { color: Colors.light.primary },
  flex: { flex: 1 },

  // balance card
  balanceCard: {
    backgroundColor: Colors.light.text,
    borderRadius: 18,
    padding: 18,
    gap: 6,
  },
  balanceHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  balanceLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '600',
  },
  topupBtn: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
  },
  topupText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.light.text,
  },
  balanceValue: {
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -1,
    color: '#FFFFFF',
    marginTop: 4,
  },
  balanceSub: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
  },

  // payment methods
  methodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  methodIcon: { width: 22, alignItems: 'center' },
  methodMiddle: { flex: 1, minWidth: 0 },
  methodTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.text,
  },
  methodSub: {
    fontSize: 11,
    color: Colors.light.textSecondary,
    marginTop: 1,
  },
  addMethodRow: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 2,
  },
  addMethodText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.light.primary,
  },
  addMethodSub: {
    fontSize: 11,
    color: Colors.light.textSecondary,
  },

  // toggles
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  toggleLast: {
    borderBottomWidth: 0,
  },
  toggleLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.text,
    flex: 1,
  },

  // transactions
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  txDivider: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  txIcon: {
    width: 22,
    alignItems: 'center',
  },
  txMiddle: { flex: 1, minWidth: 0 },
  txTitle: {
    fontSize: 12.5,
    fontWeight: '600',
    color: Colors.light.text,
  },
  txSub: {
    fontSize: 10.5,
    color: Colors.light.textSecondary,
    marginTop: 1,
  },
  txAmount: {
    fontSize: 12.5,
    fontWeight: '700',
    color: Colors.light.text,
  },
  txAmountPos: {
    color: '#15803D',
  },
  emptyText: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    paddingVertical: 20,
  },

  // modals
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  sheet: {
    backgroundColor: Colors.light.surface,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 20,
    paddingBottom: 32,
    gap: 14,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.5,
    color: Colors.light.text,
  },
  amountGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  amountBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  amountBtnOn: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  amountText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: Colors.light.text,
  },
  amountTextOn: { color: '#FFFFFF' },
  typeRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  typeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 9999,
    backgroundColor: '#F3F4F6',
  },
  typeBtnOn: {
    backgroundColor: Colors.light.primary,
  },
  typeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.light.textSecondary,
  },
  typeTextOn: { color: '#FFFFFF' },
  label: {
    fontSize: 11.5,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 6,
  },
  input: {
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 13,
    color: Colors.light.text,
  },
  cancelRow: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  cancelText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.light.textSecondary,
  },

  error: {
    fontSize: 12,
    color: Colors.light.primary,
    textAlign: 'center',
  },
});
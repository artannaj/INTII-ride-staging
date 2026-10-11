import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { Colors, Fonts, Radii, Spacing } from '@/constants/theme';

type Props = Omit<TextInputProps, 'value' | 'onChangeText'> & {
  label?: string;
  /** Digits after +60 (user-editable part) */
  value: string;
  onChangeText: (localNumber: string) => void;
  error?: string;
};

/** Returns E.164-ish Malaysian mobile: +601XXXXXXXX */
export function toMalaysianPhone(localDigits: string): string {
  const cleaned = localDigits.replace(/\D/g, '');
  const withoutTrunk = cleaned.startsWith('0') ? cleaned.slice(1) : cleaned;
  return `+60${withoutTrunk}`;
}

export function isValidMalaysianMobile(localDigits: string): boolean {
  const phone = toMalaysianPhone(localDigits);
  return /^\+601[0-9]{8,9}$/.test(phone);
}

export function PhoneField({
  label = 'Phone number',
  value,
  onChangeText,
  error,
  style,
  ...rest
}: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.row, error ? styles.rowError : null]}>
        <View style={styles.prefix}>
          <Text style={styles.prefixText}>+60</Text>
        </View>
        <TextInput
          value={value}
          onChangeText={(text) => onChangeText(text.replace(/[^\d]/g, ''))}
          keyboardType="phone-pad"
          placeholder="123456789"
          placeholderTextColor={Colors.light.textMuted}
          maxLength={11}
          style={[styles.input, style]}
          {...rest}
        />
      </View>
      <Text style={styles.hint}>Malaysian mobile — do not include the leading 0</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: Spacing.two,
  },
  label: {
    fontFamily: Fonts.sansMedium,
    fontSize: 13,
    color: Colors.light.textSecondary,
    letterSpacing: 0.2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.surface,
    borderRadius: Radii.md,
    overflow: 'hidden',
  },
  rowError: {
    borderColor: Colors.light.primary,
  },
  prefix: {
    paddingHorizontal: Spacing.three,
    justifyContent: 'center',
    backgroundColor: Colors.light.backgroundElement,
    borderRightWidth: 1,
    borderRightColor: Colors.light.border,
  },
  prefixText: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 16,
    color: Colors.light.text,
  },
  input: {
    flex: 1,
    minHeight: 52,
    paddingHorizontal: Spacing.three,
    fontFamily: Fonts.sans,
    fontSize: 16,
    color: Colors.light.text,
  },
  hint: {
    fontFamily: Fonts.sans,
    fontSize: 12,
    color: Colors.light.textMuted,
  },
  error: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    color: Colors.light.primary,
  },
});

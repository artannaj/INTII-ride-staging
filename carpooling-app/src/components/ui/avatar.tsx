import { StyleSheet, Text, View } from 'react-native';

type AvatarProps = {
  name: string;
  size?: number;
};

const COLORS = [
  '#334155', // slate
  '#475569', // gray-slate
  '#7F1D1D', // deep red
  '#374151', // neutral
  '#1E3A5F', // navy
  '#3F3F46', // zinc
  '#4C1D3A', // plum
];

function initialsOf(name: string): string {
  if (!name) return '??';
  const parts = name.trim().split(/\s+/);
  const letters = parts.map((w) => w[0]).join('');
  return letters.slice(0, 2).toUpperCase();
}

function colorFor(name: string): string {
  let sum = 0;
  for (let i = 0; i < name.length; i++) sum += name.charCodeAt(i);
  return COLORS[sum % COLORS.length];
}

export function Avatar({ name, size = 44 }: AvatarProps) {
  const initials = initialsOf(name);
  const bg = colorFor(name);
  const fontSize = Math.round(size * 0.36);

  return (
    <View
      style={[
        styles.wrap,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: bg,
        },
      ]}>
      <Text style={[styles.label, { fontSize }]}>{initials}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
  },
  label: {
    color: '#FFFFFF',
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
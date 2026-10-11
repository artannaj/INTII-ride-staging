import { StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/theme';

type RouteLineProps = {
  from: string;
  to: string;
  fromLabel?: string;
  toLabel?: string;
};

export function RouteLine({ from, to, fromLabel = '', toLabel = '' }: RouteLineProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.rail}>
        <View style={styles.dotTop} />
        <View style={styles.line} />
        <View style={styles.pinBottom}>
          <View style={styles.pinInner} />
        </View>
      </View>

      <View style={styles.labels}>
        <View style={styles.row}>
          <Text style={styles.text} numberOfLines={1}>
            {from}
          </Text>
          {fromLabel ? <Text style={styles.time}>{fromLabel}</Text> : null}
        </View>
        <View style={styles.row}>
          <Text style={styles.text} numberOfLines={1}>
            {to}
          </Text>
          {toLabel ? <Text style={styles.time}>{toLabel}</Text> : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  rail: {
    alignItems: 'center',
    paddingTop: 4,
  },
  dotTop: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: Colors.light.text,
    backgroundColor: '#FFFFFF',
  },
  line: {
    width: 1,
    height: 24,
    backgroundColor: '#9CA3AF',
    marginVertical: 2,
  },
  pinBottom: {
    width: 14,
    height: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.light.primary,
  },
  labels: {
    flex: 1,
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  text: {
    flex: 1,
    fontSize: 12.5,
    fontWeight: '600',
    color: Colors.light.text,
  },
  time: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.light.textSecondary,
  },
});
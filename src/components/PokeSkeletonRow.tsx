import { View, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { POKE_BORDER } from '../theme/pokemon';

type Props = {
  count?: number;
};

export function PokeSkeletonRow({ count = 6 }: Props): React.JSX.Element {
  return (
    <View style={styles.wrap}>
      {Array.from({ length: count }, (_, i) => (
        <View key={i} style={styles.row}>
          <View style={styles.rank} />
          <View style={styles.sprite} />
          <View style={styles.body}>
            <View style={styles.lineLg} />
            <View style={styles.lineSm} />
            <View style={styles.lineMd} />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 4 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: POKE_BORDER,
    borderColor: colors.cardBorder,
    gap: 10,
  },
  rank: {
    width: 28,
    height: 18,
    borderRadius: 4,
    backgroundColor: colors.cardBorder,
  },
  sprite: {
    width: 52,
    height: 52,
    borderRadius: 8,
    backgroundColor: colors.cardBorder,
  },
  body: { flex: 1, gap: 8 },
  lineLg: {
    height: 16,
    width: '70%',
    borderRadius: 4,
    backgroundColor: colors.cardBorder,
  },
  lineSm: {
    height: 12,
    width: '50%',
    borderRadius: 4,
    backgroundColor: colors.cardBorder,
    opacity: 0.7,
  },
  lineMd: {
    height: 12,
    width: '85%',
    borderRadius: 4,
    backgroundColor: colors.cardBorder,
    opacity: 0.5,
  },
});

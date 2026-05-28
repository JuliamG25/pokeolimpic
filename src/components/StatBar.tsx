import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

const STAT_COLORS: Record<string, string> = {
  hp: colors.statHp,
  attack: colors.statAtk,
  defense: colors.statDef,
  'special-attack': colors.statSpa,
  'special-defense': colors.statSpd,
  speed: colors.statSpe,
};

const LABELS_ES: Record<string, string> = {
  hp: 'PS',
  attack: 'Ataque',
  defense: 'Defensa',
  'special-attack': 'At. Esp.',
  'special-defense': 'Def. Esp.',
  speed: 'Velocidad',
};

type Props = {
  statKey: string;
  value: number;
  max?: number;
};

export function StatBar({ statKey, value, max = 255 }: Props) {
  const pct = Math.min(100, (value / max) * 100);
  const barColor = STAT_COLORS[statKey] ?? colors.accent;
  const label = LABELS_ES[statKey] ?? statKey;

  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.barWrap}>
        <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: barColor }]} />
      </View>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    width: 72,
    marginRight: 8,
    color: colors.textMuted,
    fontSize: 13,
  },
  barWrap: {
    flex: 1,
    marginRight: 8,
    height: 8,
    backgroundColor: colors.cardBorder,
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  value: {
    width: 36,
    textAlign: 'right',
    color: colors.text,
    fontWeight: '600',
    fontSize: 14,
  },
});

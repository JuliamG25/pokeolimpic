import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { colors } from '../theme/colors';

export type TypeMatchupCounts = {
  defWeak: number;
  defRes: number;
  defImm: number;
  atkSe: number;
  atkNve: number;
  atkImm: number;
};

const ROWS: {
  key: keyof TypeMatchupCounts;
  short: string;
  detail: string;
  group: 'def' | 'atk';
}[] = [
  { key: 'defWeak', short: '×2 recibido', detail: 'Débil (supereficaz contra ti)', group: 'def' },
  { key: 'defRes', short: '×0.5 recibido', detail: 'Resiste (poco eficaz contra ti)', group: 'def' },
  { key: 'defImm', short: '×0 recibido', detail: 'Inmune', group: 'def' },
  { key: 'atkSe', short: '×2 al atacar', detail: 'Supereficaz', group: 'atk' },
  { key: 'atkNve', short: '×0.5 al atacar', detail: 'Poco eficaz', group: 'atk' },
  { key: 'atkImm', short: '×0 al atacar', detail: 'Sin efecto', group: 'atk' },
];

const BAR_COLORS: Record<keyof TypeMatchupCounts, string> = {
  defWeak: colors.danger,
  defRes: colors.success,
  defImm: colors.textMuted,
  atkSe: '#f97316',
  atkNve: colors.warning,
  atkImm: '#94a3b8',
};

type Props = {
  counts: TypeMatchupCounts;
};

function BarRow({
  short,
  detail,
  value,
  maxVal,
  color,
  barWidth,
}: {
  short: string;
  detail: string;
  value: number;
  maxVal: number;
  color: string;
  barWidth: number;
}) {
  const ratio = maxVal > 0 ? Math.min(1, value / maxVal) : 0;
  const fillW = Math.max(0, barWidth * ratio);

  return (
    <View style={styles.row}>
      <View style={styles.rowLabels}>
        <Text style={styles.rowShort}>{short}</Text>
        <Text style={styles.rowDetail}>{detail}</Text>
      </View>
      <View style={styles.barCol}>
        <View style={[styles.track, { width: barWidth }]}>
          <View style={[styles.fill, { width: fillW, backgroundColor: color }]} />
        </View>
        <Text style={styles.count}>{value}</Text>
      </View>
    </View>
  );
}

export function TypeMatchupRadarChart({ counts }: Props) {
  const { width: winW } = useWindowDimensions();
  const barWidth = Math.min(200, Math.max(120, winW - 120));

  const values = ROWS.map((r) => counts[r.key]);
  const maxVal = Math.max(1, ...values);

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Resumen visual</Text>
      <Text style={styles.sub}>
        Barras proporcionales al número de tipos en cada categoría (la más larga es la categoría con
        más tipos para este elemento).
      </Text>

      <Text style={styles.groupTitle}>Al defender</Text>
      {ROWS.filter((r) => r.group === 'def').map((r) => (
        <BarRow
          key={r.key}
          short={r.short}
          detail={r.detail}
          value={counts[r.key]}
          maxVal={maxVal}
          color={BAR_COLORS[r.key]}
          barWidth={barWidth}
        />
      ))}

      <Text style={[styles.groupTitle, styles.groupTitleSpaced]}>Al atacar</Text>
      {ROWS.filter((r) => r.group === 'atk').map((r) => (
        <BarRow
          key={r.key}
          short={r.short}
          detail={r.detail}
          value={counts[r.key]}
          maxVal={maxVal}
          color={BAR_COLORS[r.key]}
          barWidth={barWidth}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 8 },
  title: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 6,
  },
  sub: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 14,
  },
  groupTitle: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 10,
  },
  groupTitleSpaced: { marginTop: 6 },
  row: { marginBottom: 12 },
  rowLabels: { marginBottom: 6 },
  rowShort: { color: colors.text, fontSize: 14, fontWeight: '600' },
  rowDetail: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  barCol: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  track: {
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.cardBorder,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 5,
  },
  count: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
    minWidth: 22,
    textAlign: 'right',
  },
});

import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  CHAMPIONS_META_LABEL,
  fetchChampionsMetaTeraTypes,
  getChampionsMetaFormat,
  getMetaStatsUpdatedAt,
  invalidateMetaCache,
  type MetaCatalogEntry,
} from '../api/smogon';
import { formatCacheAge } from '../api/cache';
import { PokeScreenHeader } from '../components/PokeScreenHeader';
import { PokeSkeletonRow } from '../components/PokeSkeletonRow';
import { colors } from '../theme/colors';
import { POKE_BORDER } from '../theme/pokemon';
import { HORIZONTAL_PADDING } from '../theme/layout';
import { typeNameEs } from '../utils/i18n';

type Props = {
  onBack: () => void;
};

export function TeraScreen({ onBack }: Props) {
  const insets = useSafeAreaInsets();
  const [rows, setRows] = useState<MetaCatalogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [cacheHint, setCacheHint] = useState<string | null>(null);

  const load = useCallback(async (force = false) => {
    try {
      if (force) await invalidateMetaCache();
      const list = await fetchChampionsMetaTeraTypes();
      setRows(list);
      setErr(null);
      const at = getMetaStatsUpdatedAt();
      setCacheHint(at ? formatCacheAge(at) : null);
    } catch {
      setErr('No se pudieron cargar los tipos Tera del meta.');
    }
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      await load();
      if (alive) setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load(true);
    setRefreshing(false);
  }, [load]);

  const renderItem = useCallback(
    ({ item, index }: { item: MetaCatalogEntry; index: number }) => (
      <View style={styles.row}>
        <Text style={styles.rank}>#{index + 1}</Text>
        <View style={styles.rowBody}>
          <Text style={styles.name}>{typeNameEs(item.name)}</Text>
          <Text style={styles.sub}>{item.name}</Text>
          <View style={styles.barTrack}>
            <View style={[styles.barFill, { width: `${Math.round(item.score * 100)}%` }]} />
          </View>
        </View>
      </View>
    ),
    [],
  );

  return (
    <View
      style={[
        styles.safe,
        {
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
          paddingLeft: insets.left,
          paddingRight: insets.right,
        },
      ]}
    >
      <PokeScreenHeader
        compact
        title="Tera del meta"
        subtitle={`${CHAMPIONS_META_LABEL} · ${getChampionsMetaFormat()}`}
        onBack={onBack}
      />
      {cacheHint ? (
        <Text style={styles.cacheHint}>Datos {cacheHint}</Text>
      ) : null}

      {loading ? (
        <PokeSkeletonRow count={8} />
      ) : err ? (
        <Text style={styles.err}>{err}</Text>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(item) => item.name}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
          }
          ListEmptyComponent={<Text style={styles.muted}>Sin datos Tera.</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  cacheHint: {
    color: colors.textMuted,
    fontSize: 11,
    paddingHorizontal: HORIZONTAL_PADDING,
    marginBottom: 8,
  },
  list: { paddingHorizontal: HORIZONTAL_PADDING, paddingBottom: 24 },
  err: { color: colors.danger, paddingHorizontal: HORIZONTAL_PADDING },
  muted: { color: colors.textMuted, textAlign: 'center', padding: 20 },
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
  rank: { width: 32, fontWeight: '800', color: colors.accent, fontSize: 14 },
  rowBody: { flex: 1 },
  name: { color: colors.text, fontSize: 17, fontWeight: '700' },
  sub: { color: colors.textMuted, fontSize: 11, marginTop: 2, textTransform: 'capitalize' },
  barTrack: {
    height: 8,
    backgroundColor: colors.cardBorder,
    borderRadius: 4,
    marginTop: 10,
    overflow: 'hidden',
  },
  barFill: { height: '100%', backgroundColor: colors.accentBlue },
});

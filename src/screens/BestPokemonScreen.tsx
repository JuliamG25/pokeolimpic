import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  type ViewToken,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  CHAMPIONS_META_LABEL,
  enrichMetaRowLabels,
  fetchChampionsMetaUsage,
  getChampionsMetaFormat,
  getMetaStatsUpdatedAt,
  invalidateMetaCache,
  META_FORMAT_OPTIONS,
  setActiveMetaFormat,
  type MetaFormatId,
  type SmogonUsageEntry,
} from '../api/smogon';
import { formatCacheAge } from '../api/cache';
import {
  getChampionsDexBySlug,
  loadChampionsRoster,
  resolveChampionsSpriteId,
} from '../constants/championsRoster';
import { PokeScreenHeader } from '../components/PokeScreenHeader';
import { PokeSkeletonRow } from '../components/PokeSkeletonRow';
import { PokeSprite, PokeSpritePlaceholder } from '../components/PokeSprite';
import { colors } from '../theme/colors';
import { HORIZONTAL_PADDING } from '../theme/layout';
import { POKE_BORDER } from '../theme/pokemon';
import { pokemonSpriteUrl } from '../constants/sprites';
import { formatMetaMovesLabel, formatMetaPct } from '../utils/meta';
import { matchesSearch } from '../utils/search';
import { typeNameEs } from '../utils/i18n';

type Row = SmogonUsageEntry & {
  id: number;
  topAbilityEs?: string;
  topItemEs?: string;
};

type Props = {
  onBack: () => void;
  onSelectMeta: (entry: SmogonUsageEntry, spriteId: number) => void;
};

export function BestPokemonScreen({ onBack, onSelectMeta }: Props) {
  const insets = useSafeAreaInsets();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [battles, setBattles] = useState(0);
  const [rosterCount, setRosterCount] = useState(0);
  const [query, setQuery] = useState('');
  const [cacheHint, setCacheHint] = useState<string | null>(null);
  const [formatId, setFormatId] = useState<MetaFormatId>(getChampionsMetaFormat() as MetaFormatId);
  const enrichedRef = useRef(new Set<string>());

  const enrichOne = useCallback(async (slug: string) => {
    if (enrichedRef.current.has(slug)) return;
    enrichedRef.current.add(slug);
    setRows((prev) => {
      const row = prev.find((r) => r.slug === slug);
      if (row) {
        void enrichMetaRowLabels(row).then((labels) => {
          setRows((p) => p.map((r) => (r.slug === slug ? { ...r, ...labels } : r)));
        });
      }
      return prev;
    });
  }, []);

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      for (const v of viewableItems.slice(0, 8)) {
        const slug = (v.item as Row | undefined)?.slug;
        if (slug) void enrichOne(slug);
      }
    },
    [enrichOne],
  );

  const load = useCallback(async (force = false) => {
    try {
      const [roster, { entries, battles: totalBattles }] = await Promise.all([
        loadChampionsRoster(force),
        fetchChampionsMetaUsage(80, force),
      ]);

      const dexBySlug = getChampionsDexBySlug();
      const resolved: Row[] = entries.map((entry) => ({
        ...entry,
        id: resolveChampionsSpriteId(entry.slug, dexBySlug),
      }));

      enrichedRef.current = new Set();
      setRows(resolved);
      setBattles(totalBattles);
      setRosterCount(roster.length);
      setErr(null);
      const at = getMetaStatsUpdatedAt();
      setCacheHint(at ? formatCacheAge(at) : null);
    } catch {
      setErr('No se pudo cargar el meta de Smogon (data.pkmn.cc).');
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
  }, [load, formatId]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await invalidateMetaCache(formatId);
    await load(true);
    setRefreshing(false);
  }, [load, formatId]);

  const filtered = useMemo(() => {
    const q = query.trim();
    if (!q) return rows;
    return rows.filter((r) =>
      matchesSearch(
        q,
        r.name,
        r.slug,
        r.topAbilityEs ?? r.topAbility,
        r.topItemEs ?? r.topItem,
      ),
    );
  }, [rows, query]);

  const renderItem = useCallback(
    ({ item, index }: { item: Row; index: number }) => {
      const usagePct = formatMetaPct(item.usage);
      const movesLabel = formatMetaMovesLabel(item.topMoves);
      const abilityLabel = item.topAbilityEs ?? item.topAbility;
      const itemLabel = item.topItemEs ?? item.topItem;

      return (
        <TouchableOpacity
          style={styles.row}
          onPress={() => onSelectMeta(item, item.id)}
          activeOpacity={0.75}
        >
          <Text style={styles.rank}>#{index + 1}</Text>
          {item.id > 0 ? (
            <PokeSprite uri={pokemonSpriteUrl(item.id)} style={styles.sprite} />
          ) : (
            <PokeSpritePlaceholder style={styles.sprite} />
          )}
          <View style={styles.rowBody}>
            <Text style={styles.rowName}>{item.name}</Text>
            <Text style={styles.rowMeta}>
              {usagePct} uso
              {item.lead > 0 ? ` · Lead ${formatMetaPct(item.lead)}` : ''}
              {abilityLabel ? ` · ${abilityLabel}` : ''}
              {itemLabel ? ` · ${itemLabel}` : ''}
              {item.topTera ? ` · Tera ${typeNameEs(item.topTera)}` : ''}
            </Text>
            <Text style={styles.movesLabel} numberOfLines={2}>
              {movesLabel}
            </Text>
            {item.topNature ? (
              <Text style={styles.spread}>
                {item.topNature}
                {item.topSpread ? ` (${item.topSpread})` : ''}
              </Text>
            ) : null}
          </View>
          <Text style={styles.chev}>›</Text>
        </TouchableOpacity>
      );
    },
    [onSelectMeta],
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
        title="Meta Pokémon Champions"
        subtitle={`Roster Champions · ${CHAMPIONS_META_LABEL}`}
        onBack={onBack}
      />

      <View style={styles.formatRow}>
        {META_FORMAT_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt.id}
            style={[styles.formatChip, formatId === opt.id && styles.formatChipOn]}
            onPress={() => {
              setActiveMetaFormat(opt.id);
              setFormatId(opt.id);
            }}
          >
            <Text style={[styles.formatChipText, formatId === opt.id && styles.formatChipTextOn]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TextInput
        style={styles.search}
        placeholder="Buscar por nombre, habilidad u objeto…"
        placeholderTextColor={colors.textMuted}
        value={query}
        onChangeText={setQuery}
        autoCapitalize="none"
        autoCorrect={false}
      />

      {!loading && !err && rosterCount > 0 ? (
        <Text style={styles.rosterHint}>
          {rosterCount} especies · {filtered.length} en lista
          {cacheHint ? ` · datos ${cacheHint}` : ''}
        </Text>
      ) : null}
      {!loading && !err && battles > 0 ? (
        <Text style={styles.battles}>
          {battles.toLocaleString('es')} batallas · {getChampionsMetaFormat()}
        </Text>
      ) : null}

      {loading ? (
        <PokeSkeletonRow count={8} />
      ) : err ? (
        <Text style={styles.err}>{err}</Text>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.slug}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={{ itemVisiblePercentThreshold: 40 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
          }
          ListEmptyComponent={
            <Text style={styles.muted}>
              {query ? 'Sin coincidencias.' : 'Sin datos para el roster actual.'}
            </Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  formatRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: HORIZONTAL_PADDING,
    marginBottom: 8,
  },
  formatChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.cardBorder,
    backgroundColor: colors.card,
  },
  formatChipOn: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.accent,
  },
  formatChipText: { fontSize: 11, fontWeight: '700', color: colors.textMuted },
  formatChipTextOn: { color: colors.accent },
  search: {
    marginHorizontal: HORIZONTAL_PADDING,
    marginBottom: 8,
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: POKE_BORDER,
    borderColor: colors.cardBorder,
    color: colors.text,
    fontSize: 15,
  },
  rosterHint: {
    color: colors.accentBlue,
    fontSize: 12,
    fontWeight: '800',
    paddingHorizontal: HORIZONTAL_PADDING,
    marginBottom: 4,
  },
  battles: {
    color: colors.textMuted,
    fontSize: 11,
    paddingHorizontal: HORIZONTAL_PADDING,
    marginBottom: 12,
  },
  muted: { color: colors.textMuted, marginTop: 12, textAlign: 'center', paddingHorizontal: 20 },
  err: { color: colors.danger, paddingHorizontal: HORIZONTAL_PADDING },
  list: { paddingHorizontal: HORIZONTAL_PADDING, paddingBottom: 24 },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: POKE_BORDER,
    borderColor: colors.cardBorder,
    gap: 8,
  },
  rank: {
    width: 28,
    fontWeight: '800',
    color: colors.accent,
    fontSize: 14,
    marginTop: 4,
  },
  rowBody: { flex: 1, minWidth: 0 },
  sprite: { width: 52, height: 52 },
  rowName: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  rowMeta: { color: colors.textMuted, fontSize: 11, marginTop: 4, lineHeight: 15 },
  movesLabel: {
    color: colors.accent,
    fontSize: 12,
    marginTop: 6,
    fontWeight: '600',
    lineHeight: 16,
  },
  spread: { color: colors.textMuted, fontSize: 10, marginTop: 4 },
  chev: { color: colors.textMuted, fontSize: 22, paddingTop: 8 },
});

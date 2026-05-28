import { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  type ViewToken,
} from 'react-native';
import { getTopInset, getBottomInset, getLeftInset, getRightInset } from '../utils/safeArea';
import {
  fetchChampionsMetaAbilities,
  CHAMPIONS_META_LABEL,
  getMetaStatsUpdatedAt,
  invalidateMetaCache,
  type MetaCatalogEntry,
} from '../api/smogon';
import { formatCacheAge } from '../api/cache';
import { fetchAbility } from '../api/pokeapi';
import { fetchAbilityDetail, preloadGameDataIndexes } from '../api/gameData';
import { abilityEffectShort, abilityNameEs } from '../utils/i18n';
import { EntityDetailModal } from '../components/EntityDetailModal';
import { PokeScreenHeader } from '../components/PokeScreenHeader';
import { PokeSkeletonRow } from '../components/PokeSkeletonRow';
import { colors } from '../theme/colors';
import { POKE_BORDER } from '../theme/pokemon';
import { HORIZONTAL_PADDING } from '../theme/layout';

type Row = MetaCatalogEntry & { nameEs?: string; shortDesc?: string };

type Props = {
  onBack: () => void;
};

function isBadDescription(text: string): boolean {
  return (
    text.startsWith('No se encontró') || text.startsWith('Sin descripción en PokeAPI')
  );
}

export function AbilitiesScreen({ onBack }: Props) {
  const [abilities, setAbilities] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [cacheHint, setCacheHint] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalTitle, setModalTitle] = useState<string | null>(null);
  const [modalSubtitle, setModalSubtitle] = useState<string | null>(null);
  const [modalDesc, setModalDesc] = useState<string | null>(null);
  const enrichedRef = useRef(new Set<string>());

  const load = useCallback(async (force = false) => {
    try {
      if (force) await invalidateMetaCache();
      const list = await fetchChampionsMetaAbilities();
      setAbilities(list);
      enrichedRef.current = new Set();
      const at = getMetaStatsUpdatedAt();
      setCacheHint(at ? formatCacheAge(at) : null);
      setErr(null);
    } catch {
      setErr('No se pudieron cargar las habilidades del meta.');
    }
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      await preloadGameDataIndexes();
      await load();
      if (alive) setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [load]);

  const enrichOne = useCallback(async (englishName: string) => {
    if (enrichedRef.current.has(englishName)) return;
    enrichedRef.current.add(englishName);
    try {
      const raw = await fetchAbility(englishName);
      const nameEs = abilityNameEs(raw);
      const desc = abilityEffectShort(raw);
      const shortDesc = desc.length > 90 ? `${desc.slice(0, 87)}…` : desc;
      setAbilities((prev) =>
        prev.map((row) =>
          row.name === englishName
            ? {
                ...row,
                nameEs,
                shortDesc: isBadDescription(shortDesc) ? undefined : shortDesc,
              }
            : row,
        ),
      );
    } catch {
      const d = await fetchAbilityDetail(englishName);
      const shortDesc =
        d.description.length > 90 ? `${d.description.slice(0, 87)}…` : d.description;
      setAbilities((prev) =>
        prev.map((row) =>
          row.name === englishName
            ? {
                ...row,
                nameEs: d.nameEs,
                shortDesc: isBadDescription(shortDesc) ? undefined : shortDesc,
              }
            : row,
        ),
      );
    }
  }, []);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const names = viewableItems
        .map((v) => (v.item as Row | undefined)?.name)
        .filter((n): n is string => !!n && !enrichedRef.current.has(n))
        .slice(0, 10);
      void Promise.all(names.map((n) => enrichOne(n)));
    },
  ).current;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load(true);
    setRefreshing(false);
  }, [load]);

  const openDetail = useCallback(async (englishName: string) => {
    setModalOpen(true);
    setModalLoading(true);
    setModalTitle(null);
    setModalSubtitle(englishName);
    setModalDesc(null);
    try {
      await preloadGameDataIndexes();
      const raw = await fetchAbility(englishName);
      setModalTitle(abilityNameEs(raw));
      setModalSubtitle(englishName);
      setModalDesc(abilityEffectShort(raw));
    } catch {
      const d = await fetchAbilityDetail(englishName);
      setModalTitle(d.nameEs);
      setModalSubtitle(d.nameEn !== d.nameEs ? d.nameEn : null);
      setModalDesc(d.description);
    } finally {
      setModalLoading(false);
    }
  }, []);

  const renderItem = useCallback(
    ({ item, index }: { item: Row; index: number }) => (
      <TouchableOpacity
        style={styles.row}
        onPress={() => openDetail(item.name)}
        activeOpacity={0.75}
      >
        <Text style={styles.rank}>#{index + 1}</Text>
        <View style={styles.rowBody}>
          <Text style={styles.name}>{item.nameEs ?? item.name}</Text>
          {item.shortDesc ? (
            <Text style={styles.preview} numberOfLines={2}>
              {item.shortDesc}
            </Text>
          ) : null}
          <View style={styles.barTrack}>
            <View style={[styles.barFill, { width: `${Math.round(item.score * 100)}%` }]} />
          </View>
        </View>
        <Text style={styles.pct}>{Math.round(item.score * 100)}%</Text>
      </TouchableOpacity>
    ),
    [openDetail],
  );

  return (
    <View
      style={[
        styles.safe,
        {
          paddingTop: getTopInset(),
          paddingBottom: getBottomInset(),
          paddingLeft: getLeftInset(),
          paddingRight: getRightInset(),
        },
      ]}
    >
      <PokeScreenHeader
        compact
        title="Habilidades"
        subtitle={`PokeAPI · ${CHAMPIONS_META_LABEL}`}
        onBack={onBack}
      />
      {cacheHint ? <Text style={styles.cacheHint}>Datos {cacheHint}</Text> : null}

      {loading ? (
        <PokeSkeletonRow count={8} />
      ) : err ? (
        <Text style={styles.err}>{err}</Text>
      ) : (
        <FlatList
          data={abilities}
          keyExtractor={(item) => item.name}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={{ itemVisiblePercentThreshold: 40 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
          }
        />
      )}

      <EntityDetailModal
        visible={modalOpen}
        loading={modalLoading}
        title={modalTitle}
        subtitle={modalSubtitle}
        description={modalDesc}
        onClose={() => setModalOpen(false)}
      />
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
  err: { color: colors.danger, padding: 20 },
  list: { paddingHorizontal: HORIZONTAL_PADDING, paddingBottom: 24 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
    borderWidth: POKE_BORDER,
    borderColor: colors.cardBorder,
    gap: 10,
  },
  rank: { width: 32, color: colors.accent, fontWeight: '800', fontSize: 13 },
  rowBody: { flex: 1 },
  name: { color: colors.text, fontSize: 15, fontWeight: '600', marginBottom: 4 },
  preview: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 6,
  },
  barTrack: {
    height: 6,
    backgroundColor: colors.cardBorder,
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: colors.success,
    borderRadius: 3,
  },
  pct: { color: colors.textMuted, fontSize: 12, fontWeight: '700', minWidth: 36, textAlign: 'right' },
});

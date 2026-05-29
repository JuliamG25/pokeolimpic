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
  fetchChampionsMetaItems,
  CHAMPIONS_META_LABEL,
  getMetaStatsUpdatedAt,
  getPokemonUsingItem,
  invalidateMetaCache,
  type MetaCatalogEntry,
} from '../api/smogon';
import { formatCacheAge } from '../api/cache';
import { fetchItemDetail, preloadGameDataIndexes } from '../api/gameData';
import { EntityDetailModal } from '../components/EntityDetailModal';
import { PokeScreenHeader } from '../components/PokeScreenHeader';
import { PokeSkeletonRow } from '../components/PokeSkeletonRow';
import { PokeSprite } from '../components/PokeSprite';
import { colors } from '../theme/colors';
import { POKE_BORDER } from '../theme/pokemon';
import { HORIZONTAL_PADDING } from '../theme/layout';
import { formatMetaPct } from '../utils/meta';

type Row = MetaCatalogEntry & { nameEs?: string; spriteUrl?: string | null };

type Props = {
  onBack: () => void;
  onOpenMeta?: (slug: string) => void;
  openItem?: string;
};

export function ItemsScreen({ onBack, onOpenMeta, openItem }: Props) {
  const [items, setItems] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [cacheHint, setCacheHint] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalTitle, setModalTitle] = useState<string | null>(null);
  const [modalSubtitle, setModalSubtitle] = useState<string | null>(null);
  const [modalDesc, setModalDesc] = useState<string | null>(null);
  const [modalImage, setModalImage] = useState<string | null>(null);
  const [metaUsers, setMetaUsers] = useState<
    { name: string; slug: string; rate: number }[]
  >([]);
  const enrichedRef = useRef(new Set<string>());

  const load = useCallback(async (force = false) => {
    try {
      if (force) await invalidateMetaCache();
      const list = await fetchChampionsMetaItems();
      setItems(list);
      enrichedRef.current = new Set();
      const at = getMetaStatsUpdatedAt();
      setCacheHint(at ? formatCacheAge(at) : null);
      setErr(null);
    } catch {
      setErr('No se pudieron cargar los objetos del meta.');
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
      const d = await fetchItemDetail(englishName);
      setItems((prev) =>
        prev.map((row) =>
          row.name === englishName ? { ...row, nameEs: d.nameEs, spriteUrl: d.spriteUrl } : row,
        ),
      );
    } catch {
      /* mantener EN */
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
    setModalSubtitle(null);
    setModalDesc(null);
    setModalImage(null);
    setMetaUsers([]);
    try {
      const [d, users] = await Promise.all([
        fetchItemDetail(englishName),
        getPokemonUsingItem(englishName),
      ]);
      setModalTitle(d.nameEs);
      setModalSubtitle(d.nameEn !== d.nameEs ? d.nameEn : null);
      setModalDesc(d.description);
      setModalImage(d.spriteUrl);
      setMetaUsers(users);
    } finally {
      setModalLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!openItem || loading) return;
    void openDetail(openItem);
  }, [openItem, loading, openDetail]);

  const renderItem = useCallback(
    ({ item, index }: { item: Row; index: number }) => (
      <TouchableOpacity
        style={styles.row}
        onPress={() => openDetail(item.name)}
        activeOpacity={0.75}
      >
        <Text style={styles.rank}>#{index + 1}</Text>
        {item.spriteUrl ? (
          <PokeSprite uri={item.spriteUrl} style={styles.sprite} />
        ) : (
          <View style={styles.spritePh} />
        )}
        <View style={styles.rowBody}>
          <Text style={styles.name}>{item.nameEs ?? item.name}</Text>
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
        title="Objetos"
        subtitle={`Meta Champions · ${CHAMPIONS_META_LABEL}`}
        onBack={onBack}
      />
      {cacheHint ? <Text style={styles.cacheHint}>Datos {cacheHint}</Text> : null}

      {loading ? (
        <PokeSkeletonRow count={8} />
      ) : err ? (
        <Text style={styles.err}>{err}</Text>
      ) : (
        <FlatList
          data={items}
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
        imageUrl={modalImage}
        onClose={() => setModalOpen(false)}
      />

      {modalOpen && metaUsers.length > 0 && onOpenMeta ? (
        <View style={styles.metaPanel}>
          <Text style={styles.metaPanelTitle}>En el meta Champions</Text>
          {metaUsers.map((u) => (
            <TouchableOpacity
              key={u.slug}
              style={styles.metaUserRow}
              onPress={() => {
                setModalOpen(false);
                onOpenMeta(u.slug);
              }}
            >
              <Text style={styles.metaUserName}>{u.name}</Text>
              <Text style={styles.metaUserPct}>{formatMetaPct(u.rate)}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : null}
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
  sprite: { width: 40, height: 40 },
  spritePh: { width: 40, height: 40 },
  rowBody: { flex: 1 },
  name: { color: colors.text, fontSize: 15, fontWeight: '600', marginBottom: 6 },
  barTrack: {
    height: 6,
    backgroundColor: colors.cardBorder,
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: colors.accentBlue,
    borderRadius: 3,
  },
  pct: { color: colors.textMuted, fontSize: 12, fontWeight: '700', minWidth: 36, textAlign: 'right' },
  metaPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.card,
    borderTopWidth: POKE_BORDER,
    borderColor: colors.cardBorder,
    padding: HORIZONTAL_PADDING,
    maxHeight: 220,
  },
  metaPanelTitle: {
    fontWeight: '800',
    color: colors.textMuted,
    fontSize: 12,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  metaUserRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  metaUserName: { color: colors.text, fontWeight: '600' },
  metaUserPct: { color: colors.accent, fontWeight: '800' },
});

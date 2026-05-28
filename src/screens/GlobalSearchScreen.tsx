import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { getTopInset, getBottomInset } from '../utils/safeArea';
import type { SmogonUsageEntry } from '../api/smogon';
import { PokeScreenHeader } from '../components/PokeScreenHeader';
import { colors } from '../theme/colors';
import { HORIZONTAL_PADDING } from '../theme/layout';
import { POKE_BORDER } from '../theme/pokemon';
import {
  buildGlobalSearchIndex,
  filterSearchHits,
  searchKindLabel,
  type SearchHit,
} from '../utils/globalSearch';

type Props = {
  onBack: () => void;
  onOpenPokemon: (slug: string) => void;
  onOpenMeta: (entry: SmogonUsageEntry, spriteId: number) => void;
  onOpenMove: (slug: string) => void;
  onOpenItems: () => void;
  onOpenAbilities: () => void;
};

export function GlobalSearchScreen({
  onBack,
  onOpenPokemon,
  onOpenMeta,
  onOpenMove,
  onOpenItems,
  onOpenAbilities,
}: Props) {
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState<SearchHit[]>([]);
  const [query, setQuery] = useState('');

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const hits = await buildGlobalSearchIndex();
        if (alive) setIndex(hits);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const results = useMemo(() => filterSearchHits(index, query, 50), [index, query]);

  const onSelect = useCallback(
    (hit: SearchHit) => {
      if (hit.kind === 'pokemon' && hit.slug) {
        onOpenPokemon(hit.slug);
        return;
      }
      if (hit.kind === 'meta' && hit.entry) {
        onOpenMeta(hit.entry, 0);
        return;
      }
      if (hit.kind === 'move' && hit.slug) {
        onOpenMove(hit.slug);
        return;
      }
      if (hit.kind === 'item') {
        onOpenItems();
        return;
      }
      if (hit.kind === 'ability') {
        onOpenAbilities();
      }
    },
    [onOpenAbilities, onOpenItems, onOpenMeta, onOpenMove, onOpenPokemon],
  );

  return (
    <View style={[styles.safe, { paddingTop: getTopInset(), paddingBottom: getBottomInset() }]}>
      <PokeScreenHeader compact title="Buscar" onBack={onBack} backLabel="← Menú" />

      <TextInput
        style={styles.input}
        value={query}
        onChangeText={setQuery}
        placeholder="Pokémon, meta, movimiento, objeto…"
        placeholderTextColor={colors.textMuted}
        autoFocus
        autoCapitalize="none"
        autoCorrect={false}
      />

      {loading ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: 24 }} />
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.empty}>Sin resultados para «{query}».</Text>
          }
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.row} onPress={() => onSelect(item)}>
              <View style={styles.rowBody}>
                <Text style={styles.rowLabel}>{item.label}</Text>
                {item.sub ? <Text style={styles.rowSub}>{item.sub}</Text> : null}
              </View>
              <View style={styles.kindBadge}>
                <Text style={styles.kindText}>{searchKindLabel(item.kind)}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  input: {
    marginHorizontal: HORIZONTAL_PADDING,
    marginBottom: 8,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 14,
    borderWidth: POKE_BORDER,
    borderColor: colors.cardBorder,
    color: colors.text,
    fontSize: 16,
  },
  list: { paddingHorizontal: HORIZONTAL_PADDING, paddingBottom: 32 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: POKE_BORDER,
    borderColor: colors.cardBorder,
    gap: 10,
  },
  rowBody: { flex: 1 },
  rowLabel: { color: colors.text, fontWeight: '700', fontSize: 15, textTransform: 'capitalize' },
  rowSub: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  kindBadge: {
    backgroundColor: colors.accentSoft,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  kindText: { color: colors.accent, fontSize: 11, fontWeight: '700' },
  empty: { color: colors.textMuted, textAlign: 'center', padding: 24 },
});

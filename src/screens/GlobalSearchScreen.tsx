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
  onOpenMeta: (entry: SmogonUsageEntry) => void;
  onOpenMove: (slug: string) => void;
  onOpenItem: (name: string) => void;
  onOpenAbility: (name: string) => void;
};

export function GlobalSearchScreen({
  onBack,
  onOpenPokemon,
  onOpenMeta,
  onOpenMove,
  onOpenItem,
  onOpenAbility,
}: Props) {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [index, setIndex] = useState<SearchHit[]>([]);
  const [query, setQuery] = useState('');

  const loadIndex = useCallback(async (force = false) => {
    setLoading(true);
    setLoadError(null);
    try {
      const hits = await buildGlobalSearchIndex(force);
      setIndex(hits);
      if (hits.length === 0) {
        setLoadError('No hay datos para buscar. Revisá tu conexión e intentá de nuevo.');
      }
    } catch {
      setIndex([]);
      setLoadError('No se pudo cargar el índice de búsqueda. Revisá tu conexión e intentá de nuevo.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadIndex();
  }, [loadIndex]);

  const results = useMemo(() => filterSearchHits(index, query, 50), [index, query]);

  const onSelect = useCallback(
    (hit: SearchHit) => {
      if (hit.kind === 'pokemon' && hit.slug) {
        onOpenPokemon(hit.slug);
        return;
      }
      if (hit.kind === 'meta' && hit.entry) {
        onOpenMeta(hit.entry);
        return;
      }
      if (hit.kind === 'move' && hit.slug) {
        onOpenMove(hit.slug);
        return;
      }
      if (hit.kind === 'item' && hit.slug) {
        onOpenItem(hit.slug);
        return;
      }
      if (hit.kind === 'ability' && hit.slug) {
        onOpenAbility(hit.slug);
      }
    },
    [onOpenAbility, onOpenItem, onOpenMeta, onOpenMove, onOpenPokemon],
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
      ) : loadError ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{loadError}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => void loadIndex(true)}>
            <Text style={styles.retryText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.empty}>
              {query.trim() ? `Sin resultados para «${query}».` : 'Escribí para buscar en Pokédex, meta y más.'}
            </Text>
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
  errorBox: { padding: 24, alignItems: 'center', gap: 16 },
  errorText: { color: colors.danger, textAlign: 'center', lineHeight: 22 },
  retryBtn: {
    backgroundColor: colors.accent,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: POKE_BORDER,
    borderColor: colors.cardBorder,
  },
  retryText: { color: colors.textOnPrimary, fontWeight: '800' },
});

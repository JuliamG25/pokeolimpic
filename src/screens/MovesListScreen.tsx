import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fetchMove } from '../api/pokeapi';
import { fetchChampionsMetaMoveSlugs } from '../api/smogon';
import { typeNameEs } from '../utils/i18n';
import { TypeBadge } from '../components/TypeBadge';
import { PokeScreenHeader } from '../components/PokeScreenHeader';
import { colors } from '../theme/colors';
import { POKE_BORDER } from '../theme/pokemon';

const PAGE_SIZE = 40;

type Props = {
  onBack: () => void;
  onSelectMove: (slug: string) => void;
};

export function MovesListScreen({ onBack, onSelectMove }: Props) {
  const insets = useSafeAreaInsets();
  const [names, setNames] = useState<string[]>([]);
  const [dexByName, setDexByName] = useState<Map<string, number>>(() => new Map());
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [typeBySlug, setTypeBySlug] = useState<Map<string, string>>(() => new Map());

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const slugs = await fetchChampionsMetaMoveSlugs();
        const dex = new Map<string, number>();
        if (alive) {
          setNames(slugs);
          setDexByName(dex);
        }
      } catch {
        if (alive) setErr('No se pudieron cargar los movimientos del meta Champions.');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!names.length) return;
    let cancelled = false;
    (async () => {
      const acc = new Map<string, string>();
      const batch = 40;
      for (let i = 0; i < names.length; i += batch) {
        if (cancelled) return;
        const part = names.slice(i, i + batch);
        const results = await Promise.all(part.map((n) => fetchMove(n).catch(() => null)));
        part.forEach((n, idx) => {
          const m = results[idx];
          if (m) acc.set(n, m.type.name);
        });
        if (!cancelled) setTypeBySlug(new Map(acc));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [names]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return names;
    return names.filter((n) => n.includes(q));
  }, [names, query]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [query, names]);

  const displayed = useMemo(
    () => filtered.slice(0, visibleCount),
    [filtered, visibleCount]
  );

  const loadMore = useCallback(() => {
    setVisibleCount((v) => {
      if (v >= filtered.length) return v;
      return Math.min(v + PAGE_SIZE, filtered.length);
    });
  }, [filtered.length]);

  const total = filtered.length;

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
        title="Ataques del meta"
        subtitle="Movimientos populares en Champions · Toca para detalle"
        onBack={onBack}
      />

      <TextInput
        style={styles.input}
        placeholder="Ej. thunderbolt, close-combat"
        placeholderTextColor={colors.textMuted}
        value={query}
        onChangeText={setQuery}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
      />

      {err ? (
        <Text style={styles.err}>{err}</Text>
      ) : loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.accent} size="large" />
          <Text style={styles.muted}>Cargando movimientos…</Text>
        </View>
      ) : (
        <FlatList
          data={displayed}
          keyExtractor={(item) => item}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          onEndReached={loadMore}
          onEndReachedThreshold={0.35}
          ListFooterComponent={
            visibleCount < total ? (
              <Text style={styles.footerHint}>
                {visibleCount} de {total} · baja para cargar más
              </Text>
            ) : total > 0 ? (
              <Text style={styles.footerHint}>Fin de la lista ({total})</Text>
            ) : null
          }
          ListEmptyComponent={
            <Text style={styles.muted}>Sin coincidencias.</Text>
          }
          renderItem={({ item }) => {
            const id = dexByName.get(item);
            const num =
              id !== undefined && id > 0 ? `#${String(id).padStart(4, '0')}` : '—';
            const tSlug = typeBySlug.get(item);
            return (
              <TouchableOpacity
                style={styles.row}
                onPress={() => onSelectMove(item)}
                activeOpacity={0.75}
              >
                <Text style={styles.rowDex}>{num}</Text>
                <Text style={styles.rowText} numberOfLines={1}>
                  {item.replace(/-/g, ' ')}
                </Text>
                <View style={styles.rowType}>
                  {tSlug ? (
                    <TypeBadge slug={tSlug} label={typeNameEs(tSlug)} size="sm" />
                  ) : (
                    <View style={styles.typePlaceholder} />
                  )}
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  input: {
    marginHorizontal: 20,
    marginBottom: 12,
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.text,
    borderWidth: POKE_BORDER,
    borderColor: colors.cardBorder,
  },
  list: { paddingHorizontal: 20, paddingBottom: 24 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.card,
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 8,
    borderWidth: POKE_BORDER,
    borderColor: colors.cardBorder,
  },
  rowDex: {
    fontVariant: ['tabular-nums'],
    fontSize: 14,
    fontWeight: '800',
    color: colors.accent,
    minWidth: 56,
  },
  rowText: {
    flex: 1,
    color: colors.text,
    fontSize: 16,
    textTransform: 'capitalize',
  },
  rowType: {
    marginLeft: 8,
    alignItems: 'flex-end',
    justifyContent: 'center',
    minWidth: 72,
  },
  typePlaceholder: {
    width: 56,
    height: 22,
    borderRadius: 6,
    backgroundColor: colors.cardBorder,
    opacity: 0.5,
  },
  center: { paddingTop: 40, alignItems: 'center' },
  muted: { color: colors.textMuted, textAlign: 'center', marginTop: 8 },
  err: { color: colors.danger, paddingHorizontal: 20 },
  footerHint: {
    color: colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    paddingVertical: 12,
  },
});

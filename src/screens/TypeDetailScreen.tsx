import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NamedAPIResource } from '../types/pokeapi';
import { fetchPokemonNamesForType, fetchType } from '../api/pokeapi';
import { getChampionsSlugSet, isChampionsSpecies } from '../constants/championsRoster';
import { pokemonSpriteUrl } from '../constants/sprites';
import { PokeSprite, PokeSpritePlaceholder } from '../components/PokeSprite';
import { TypeBadge } from '../components/TypeBadge';
import { typeNameEs } from '../utils/i18n';
import { PokeScreenHeader } from '../components/PokeScreenHeader';
import { colors } from '../theme/colors';
import { POKE_BORDER } from '../theme/pokemon';
import { HORIZONTAL_PADDING } from '../theme/layout';
import { TypeMatchupRadarChart } from '../components/TypeMatchupRadarChart';

const PAGE_SIZE = 40;

type PokemonEntry = {
  name: string;
  id: number;
};

type Props = {
  slug: string;
  onBack: () => void;
  onOpenPokemon: (name: string) => void;
};

function formatTypeList(items: NamedAPIResource[]): string {
  if (!items.length) return '—';
  return items.map((t) => typeNameEs(t.name)).join(', ');
}

function extractId(url: string): number {
  const m = /\/(\d+)\/?$/.exec(url);
  return m ? Number(m[1]) : 0;
}

export function TypeDetailScreen({ slug, onBack, onOpenPokemon }: Props) {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [labelEs, setLabelEs] = useState('');

  const [defWeak, setDefWeak] = useState<NamedAPIResource[]>([]);
  const [defRes, setDefRes] = useState<NamedAPIResource[]>([]);
  const [defImm, setDefImm] = useState<NamedAPIResource[]>([]);
  const [atkSe, setAtkSe] = useState<NamedAPIResource[]>([]);
  const [atkNve, setAtkNve] = useState<NamedAPIResource[]>([]);
  const [atkImm, setAtkImm] = useState<NamedAPIResource[]>([]);

  const [allPokemon, setAllPokemon] = useState<PokemonEntry[]>([]);
  const [pokemonLoading, setPokemonLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const t = await fetchType(slug);
        if (!alive) return;
        const d = t.damage_relations;
        setLabelEs(typeNameEs(t.name));
        setDefWeak(d.double_damage_from);
        setDefRes(d.half_damage_from);
        setDefImm(d.no_damage_from);
        setAtkSe(d.double_damage_to);
        setAtkNve(d.half_damage_to);
        setAtkImm(d.no_damage_to);
      } catch (e) {
        if (alive) setErr(e instanceof Error ? e.message : 'Error');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [slug]);

  useEffect(() => {
    let alive = true;
    (async () => {
      setPokemonLoading(true);
      try {
        const t = await fetchType(slug);
        const byName = new Map<string, PokemonEntry>();
        for (const entry of t.pokemon ?? []) {
          const name = entry.pokemon.name;
          const id = extractId(entry.pokemon.url);
          if (!byName.has(name) || (id > 0 && id < (byName.get(name)?.id ?? 9999))) {
            byName.set(name, { name, id: id > 0 ? id : 0 });
          }
        }
        const roster = await getChampionsSlugSet();
        const list = [...byName.values()]
          .filter((p) => isChampionsSpecies(p.name, roster))
          .sort((a, b) => a.name.localeCompare(b.name));
        if (alive) setAllPokemon(list);
      } catch {
        if (alive) {
          const roster = await getChampionsSlugSet();
          const names = await fetchPokemonNamesForType(slug);
          setAllPokemon(
            names
              .filter((name) => isChampionsSpecies(name, roster))
              .map((name) => ({ name, id: 0 }))
              .sort((a, b) => a.name.localeCompare(b.name)),
          );
        }
      } finally {
        if (alive) setPokemonLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [slug]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [query, slug]);

  const filteredPokemon = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allPokemon;
    return allPokemon.filter((p) => p.name.includes(q));
  }, [allPokemon, query]);

  const displayed = useMemo(
    () => filteredPokemon.slice(0, visibleCount),
    [filteredPokemon, visibleCount],
  );

  const loadMorePokemon = useCallback(() => {
    setVisibleCount((v) => Math.min(v + PAGE_SIZE, filteredPokemon.length));
  }, [filteredPokemon.length]);

  const renderPokemon = useCallback(
    ({ item }: { item: PokemonEntry }) => (
      <TouchableOpacity
        style={styles.monRow}
        onPress={() => onOpenPokemon(item.name)}
        activeOpacity={0.75}
      >
        <Text style={styles.monDex}>
          {item.id > 0 ? `#${String(item.id).padStart(4, '0')}` : '—'}
        </Text>
        <Text style={styles.monName} numberOfLines={1}>
          {item.name.replace(/-/g, ' ')}
        </Text>
        {item.id > 0 ? (
          <PokeSprite uri={pokemonSpriteUrl(item.id)} style={styles.monSprite} />
        ) : (
          <PokeSpritePlaceholder style={styles.monSprite} />
        )}
        <Text style={styles.chev}>›</Text>
      </TouchableOpacity>
    ),
    [onOpenPokemon],
  );

  const listHeader = (
    <>
      <Text style={styles.title}>{labelEs}</Text>
      <View style={styles.typeBadgeRow}>
        <TypeBadge slug={slug} label={labelEs} size="lg" />
      </View>

      <TypeMatchupRadarChart
        counts={{
          defWeak: defWeak.length,
          defRes: defRes.length,
          defImm: defImm.length,
          atkSe: atkSe.length,
          atkNve: atkNve.length,
          atkImm: atkImm.length,
        }}
      />

      <Text style={styles.section}>Al defender (recibes ataques)</Text>
      <View style={styles.card}>
        <Text style={styles.cardLabel}>Débil (×2)</Text>
        <Text style={styles.cardBody}>{formatTypeList(defWeak)}</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.cardLabel}>Resiste (×0.5)</Text>
        <Text style={styles.cardBody}>{formatTypeList(defRes)}</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.cardLabel}>Inmune (×0)</Text>
        <Text style={styles.cardBody}>{formatTypeList(defImm)}</Text>
      </View>

      <Text style={styles.section}>Al atacar</Text>
      <View style={styles.card}>
        <Text style={styles.cardLabel}>Supereficaz (×2)</Text>
        <Text style={styles.cardBody}>{formatTypeList(atkSe)}</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.cardLabel}>Poco eficaz (×0.5)</Text>
        <Text style={styles.cardBody}>{formatTypeList(atkNve)}</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.cardLabel}>Sin efecto (×0)</Text>
        <Text style={styles.cardBody}>{formatTypeList(atkImm)}</Text>
      </View>

      <Text style={styles.section}>Pokémon de tipo {labelEs}</Text>
      <Text style={styles.hint}>
        {filteredPokemon.length} especies en la API. Toca una fila para abrir la ficha.
      </Text>
      <TextInput
        style={styles.search}
        placeholder="Filtrar por nombre…"
        placeholderTextColor={colors.textMuted}
        value={query}
        onChangeText={setQuery}
        autoCapitalize="none"
        autoCorrect={false}
      />
      {pokemonLoading ? (
        <ActivityIndicator color={colors.accent} style={styles.monLoader} />
      ) : null}
    </>
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
      <PokeScreenHeader compact title="Detalle de tipo" onBack={onBack} backLabel="← Tipos" />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.muted}>Cargando tipo…</Text>
        </View>
      ) : err ? (
        <Text style={styles.err}>{err}</Text>
      ) : (
        <FlatList
          data={displayed}
          keyExtractor={(item) => item.name}
          renderItem={renderPokemon}
          ListHeaderComponent={listHeader}
          contentContainerStyle={styles.list}
          onEndReached={loadMorePokemon}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            visibleCount < filteredPokemon.length ? (
              <Text style={styles.footerHint}>
                {visibleCount} de {filteredPokemon.length} · baja para cargar más
              </Text>
            ) : filteredPokemon.length > 0 ? (
              <Text style={styles.footerHint}>
                Fin de la lista ({filteredPokemon.length})
              </Text>
            ) : (
              <Text style={styles.footerHint}>Sin Pokémon en este tipo.</Text>
            )
          }
          keyboardShouldPersistTaps="handled"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  muted: { color: colors.textMuted, marginTop: 10 },
  err: { color: colors.danger, padding: 20 },
  list: { paddingHorizontal: HORIZONTAL_PADDING, paddingBottom: 32 },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 8,
  },
  typeBadgeRow: { marginBottom: 16 },
  section: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 6,
  },
  hint: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 10,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: POKE_BORDER,
    borderColor: colors.cardBorder,
  },
  cardLabel: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardBody: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 22,
  },
  search: {
    backgroundColor: colors.card,
    borderRadius: 10,
    borderWidth: POKE_BORDER,
    borderColor: colors.cardBorder,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.text,
    fontSize: 15,
    marginBottom: 12,
  },
  monLoader: { marginVertical: 16 },
  monRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 8,
    borderWidth: POKE_BORDER,
    borderColor: colors.cardBorder,
    gap: 10,
  },
  monDex: {
    fontVariant: ['tabular-nums'],
    fontSize: 13,
    fontWeight: '800',
    color: colors.accent,
    minWidth: 52,
  },
  monName: {
    flex: 1,
    color: colors.text,
    fontSize: 16,
    textTransform: 'capitalize',
  },
  monSprite: { width: 44, height: 44 },
  monSpritePlaceholder: { width: 44, height: 44 },
  chev: { color: colors.textMuted, fontSize: 20 },
  footerHint: {
    color: colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    paddingVertical: 14,
  },
});

import { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { getTopInset, getBottomInset, getLeftInset, getRightInset } from '../utils/safeArea';
import { fetchMove } from '../api/pokeapi';
import {
  moveEffectShort,
  moveNameEs,
  typeNameEs,
  damageClassEs,
} from '../utils/i18n';
import { TypeBadge } from '../components/TypeBadge';
import { PokeSprite, PokeSpritePlaceholder } from '../components/PokeSprite';
import { colors } from '../theme/colors';
import { pokemonIdFromResourceUrl, pokemonSpriteUrl } from '../constants/sprites';
import type { MoveDetail, NamedAPIResource } from '../types/pokeapi';
import { getChampionsSlugSet, isChampionsSpecies } from '../constants/championsRoster';
import { getPokemonUsingMove } from '../api/smogon';
import { formatMetaPct } from '../utils/meta';

export type PokemonResume = {
  pokemon: string;
  from: 'pokedex' | 'best' | 'move' | 'meta' | 'team';
  moveSlug?: string;
};

type Props = {
  slug: string;
  resume?: PokemonResume;
  onBack: () => void;
  onOpenPokemon: (name: string) => void;
  onOpenMeta?: (slug: string) => void;
  onOpenCalc?: (moveName: string) => void;
};

function statLabel(v: number | null, suffix = ''): string {
  if (v === null) return '—';
  return `${v}${suffix}`;
}

export function MoveDetailScreen({
  slug,
  resume,
  onBack,
  onOpenPokemon,
  onOpenMeta,
}: Props) {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [move, setMove] = useState<MoveDetail | null>(null);
  const [championsRoster, setChampionsRoster] = useState<Set<string> | null>(null);
  const [metaUsers, setMetaUsers] = useState<{ name: string; slug: string; rate: number }[]>([]);

  useEffect(() => {
    void getChampionsSlugSet().then(setChampionsRoster);
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const m = await fetchMove(slug);
        const users = await getPokemonUsingMove(m.name);
        if (alive) {
          setMove(m);
          setMetaUsers(users);
        }
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

  const learners = useMemo(() => {
    if (!move) return [] as NamedAPIResource[];
    const all = move.learned_by_pokemon ?? [];
    if (!championsRoster) return all;
    return all.filter((p) => isChampionsSpecies(p.name, championsRoster));
  }, [move, championsRoster]);

  const chrome = {
    paddingTop: getTopInset(),
    paddingBottom: getBottomInset(),
    paddingLeft: getLeftInset(),
    paddingRight: getRightInset(),
  };

  if (loading) {
    return (
      <View style={[styles.safe, chrome]}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.muted}>Cargando movimiento…</Text>
        </View>
      </View>
    );
  }

  if (err || !move) {
    return (
      <View style={[styles.safe, chrome]}>
        <View style={styles.center}>
          <Text style={styles.err}>{err ?? 'Sin datos'}</Text>
          <TouchableOpacity style={styles.backBtn} onPress={onBack}>
            <Text style={styles.backBtnText}>Volver</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const label = moveNameEs(move);
  const effect = moveEffectShort(move);
  const stabNote =
    move.power && move.power > 0
      ? `STAB ×1.5 si el Pokémon es tipo ${typeNameEs(move.type.name)}.`
      : null;

  const header = (
    <View style={styles.headerBlock}>
      <TouchableOpacity onPress={onBack} style={styles.backLink}>
        <Text style={styles.backLinkText}>← {resume ? 'Pokémon' : 'Ataques'}</Text>
      </TouchableOpacity>

      <Text style={styles.title}>{label}</Text>
      <Text style={styles.slug}>{move.name}</Text>

      <View style={styles.rowBadges}>
        <View style={styles.dcBadge}>
          <Text style={styles.dcText}>{damageClassEs(move.damage_class.name)}</Text>
        </View>
        <TypeBadge slug={move.type.name} label={typeNameEs(move.type.name)} size="md" />
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statLab}>Potencia</Text>
          <Text style={styles.statVal}>{statLabel(move.power)}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLab}>Precisión</Text>
          <Text style={styles.statVal}>{statLabel(move.accuracy, '%')}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLab}>PP</Text>
          <Text style={styles.statVal}>{statLabel(move.pp)}</Text>
        </View>
      </View>

      {stabNote ? <Text style={styles.stabNote}>{stabNote}</Text> : null}

      <Text style={styles.section}>Efecto</Text>
      <View style={styles.card}>
        <Text style={styles.effectBody}>{effect}</Text>
      </View>

      {metaUsers.length > 0 ? (
        <>
          <Text style={styles.section}>En el meta Champions</Text>
          <View style={styles.card}>
            {metaUsers.map((u) => (
              <TouchableOpacity
                key={u.slug}
                style={styles.metaUserRow}
                onPress={() =>
                  onOpenMeta ? onOpenMeta(u.slug) : onOpenPokemon(u.slug)
                }
              >
                <Text style={styles.metaUserName}>{u.name}</Text>
                <Text style={styles.metaUserPct}>{formatMetaPct(u.rate)}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      ) : null}

      <Text style={styles.section}>En roster Champions ({learners.length})</Text>
      <Text style={styles.hint}>
        Solo Pokémon disponibles en Pokémon Champions que aprenden este movimiento.
      </Text>
    </View>
  );

  return (
    <View style={[styles.safe, chrome]}>
      <FlatList
        data={learners}
        keyExtractor={(item) => item.name}
        ListHeaderComponent={header}
        contentContainerStyle={[styles.listContent, { paddingBottom: 24 + getBottomInset() }]}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => {
          const pid = pokemonIdFromResourceUrl(item.url);
          return (
            <TouchableOpacity
              style={styles.pokeRow}
              onPress={() => onOpenPokemon(item.name)}
              activeOpacity={0.75}
            >
              <Text style={styles.pokeName} numberOfLines={1}>
                {item.name.replace(/-/g, ' ')}
              </Text>
              {pid ? (
                <PokeSprite uri={pokemonSpriteUrl(pid)} style={styles.pokeSprite} />
              ) : (
                <PokeSpritePlaceholder style={styles.pokeSprite} />
              )}
              <Text style={styles.chev}>›</Text>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={<Text style={styles.muted}>Ninguno listado.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  listContent: { paddingHorizontal: 20, paddingTop: 0 },
  headerBlock: { paddingTop: 4 },
  backLink: { marginBottom: 8 },
  backLinkText: { color: colors.accent, fontSize: 16, fontWeight: '600' },
  title: { fontSize: 26, fontWeight: '800', color: colors.text },
  slug: {
    color: colors.textMuted,
    fontSize: 14,
    marginBottom: 12,
    textTransform: 'capitalize',
  },
  rowBadges: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 12,
  },
  dcBadge: {
    backgroundColor: colors.accentSoft,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  dcText: { color: colors.text, fontWeight: '700', fontSize: 13 },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    alignItems: 'center',
  },
  statLab: { color: colors.textMuted, fontSize: 11, marginBottom: 4 },
  statVal: { color: colors.text, fontSize: 18, fontWeight: '800' },
  stabNote: {
    color: colors.accentBlue,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 12,
  },
  calcBtn: {
    marginBottom: 16,
    padding: 14,
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: '#C62828',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  calcBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  section: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 8,
  },
  hint: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 12,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    marginBottom: 16,
  },
  effectBody: { color: colors.textMuted, fontSize: 14, lineHeight: 22 },
  pokeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    gap: 8,
  },
  pokeName: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  pokeSprite: { width: 44, height: 44 },
  metaUserRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  metaUserName: { color: colors.text, fontWeight: '600', fontSize: 15 },
  metaUserPct: { color: colors.accent, fontWeight: '800' },
  chev: { color: colors.textMuted, fontSize: 20, marginLeft: 2 },
  muted: { color: colors.textMuted, fontSize: 14, paddingVertical: 8 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  err: { color: colors.danger, marginBottom: 16, textAlign: 'center' },
  backBtn: {
    backgroundColor: colors.accent,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  backBtnText: { color: '#fff', fontWeight: '700' },
});

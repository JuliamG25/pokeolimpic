import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { getTopInset, getBottomInset, getLeftInset, getRightInset } from '../utils/safeArea';
import { fetchPokemon, fetchPokemonSpecies, fetchMove } from '../api/pokeapi';
import { getMetaEntryForSlug, type MetaRateEntry, type SmogonUsageEntry } from '../api/smogon';
import { analyzeTypeMatchups, type TypeMatchupSummary } from '../scoring/competitive';
import { StatBar } from '../components/StatBar';
import { PokeSprite } from '../components/PokeSprite';
import { colors } from '../theme/colors';
import { moveNameEs, speciesDisplayName, typeNameEs } from '../utils/i18n';
import { formatMetaPct } from '../utils/meta';

type MoveRow = { slug: string; label: string; rate?: number };

type Props = {
  name: string;
  onBack: () => void;
  onOpenMove: (slug: string) => void;
  onOpenMeta?: (entry: SmogonUsageEntry) => void;
};

export function DetailScreen({ name, onBack, onOpenMove, onOpenMeta }: Props) {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [typeMatchups, setTypeMatchups] = useState<TypeMatchupSummary | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [sprite, setSprite] = useState<string | null>(null);
  const [types, setTypes] = useState<string[]>([]);
  const [abilities, setAbilities] = useState<string[]>([]);
  const [metaMoves, setMetaMoves] = useState<MoveRow[]>([]);
  const [metaEntry, setMetaEntry] = useState<SmogonUsageEntry | null>(null);
  const [metaLoading, setMetaLoading] = useState(false);
  const [bst, setBst] = useState(0);
  const [stats, setStats] = useState<{ key: string; value: number }[]>([]);
  const [flags, setFlags] = useState({ legendary: false, mythical: false });

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setErr(null);
      setMetaMoves([]);
      setMetaEntry(null);
      try {
        const p = await fetchPokemon(name);
        const sp = await fetchPokemonSpecies(p.id);
        const matchups = await analyzeTypeMatchups(p);
        if (!alive) return;
        setDisplayName(speciesDisplayName(sp, p.name));
        const art =
          p.sprites.other?.['official-artwork']?.front_default ??
          p.sprites.front_default;
        setSprite(art);
        setTypes(p.types.sort((a, b) => a.slot - b.slot).map((t) => t.type.name));
        setAbilities(p.abilities.map((a) => a.ability.name.replace(/-/g, ' ')));
        const st = p.stats.map((s) => ({
          key: s.stat.name,
          value: s.base_stat,
        }));
        setStats(st);
        setBst(st.reduce((a, x) => a + x.value, 0));
        setFlags({
          legendary: sp.is_legendary,
          mythical: sp.is_mythical,
        });
        setTypeMatchups(matchups);

        setMetaLoading(true);
        try {
          const entry = await getMetaEntryForSlug(p.name);
          if (!alive || !entry) return;
          if (alive) setMetaEntry(entry);
          if (!entry.topMoves.length) return;
          const rows = await Promise.all(
            entry.topMoves.map(async (m: MetaRateEntry) => {
              const slug = m.name.trim().toLowerCase().replace(/\s+/g, '-');
              try {
                const raw = await fetchMove(slug);
                return { slug, label: moveNameEs(raw), rate: m.rate };
              } catch {
                return { slug, label: m.name, rate: m.rate };
              }
            }),
          );
          if (alive) setMetaMoves(rows);
        } catch {
          /* sin meta */
        } finally {
          if (alive) setMetaLoading(false);
        }
      } catch (e) {
        if (alive) setErr(e instanceof Error ? e.message : 'Error desconocido');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [name]);

  const chrome = {
    paddingTop: getTopInset(),
    paddingLeft: getLeftInset(),
    paddingRight: getRightInset(),
    paddingBottom: getBottomInset(),
  };

  if (loading) {
    return (
      <View style={[styles.safe, chrome]}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.muted}>Cargando…</Text>
        </View>
      </View>
    );
  }

  if (err || !typeMatchups) {
    return (
      <View style={[styles.safe, chrome]}>
        <View style={styles.center}>
          <Text style={styles.error}>{err ?? 'Sin datos'}</Text>
          <TouchableOpacity style={styles.backBtn} onPress={onBack}>
            <Text style={styles.backBtnText}>Volver</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.safe, chrome]}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: 40 + getBottomInset() },
        ]}
      >
        <TouchableOpacity onPress={onBack} style={styles.backLink}>
          <Text style={styles.backLinkText}>← Volver</Text>
        </TouchableOpacity>

        <Text style={styles.title}>{displayName}</Text>
        <Text style={styles.slug}>{name}</Text>

        {sprite ? (
          <PokeSprite uri={sprite} style={styles.art} />
        ) : null}

        <View style={styles.badges}>
          {types.map((t) => (
            <View key={t} style={styles.badge}>
              <Text style={styles.badgeText}>{typeNameEs(t)}</Text>
            </View>
          ))}
        </View>

        {(flags.legendary || flags.mythical) && (
          <Text style={styles.flags}>
            {[flags.legendary ? 'Legendario' : null, flags.mythical ? 'Mítico' : null]
              .filter(Boolean)
              .join(' · ')}
          </Text>
        )}

        {metaEntry && metaEntry.usage > 0 ? (
          <View style={styles.metaBadge}>
            <Text style={styles.metaBadgeText}>
              {formatMetaPct(metaEntry.usage)} uso en meta VGC
            </Text>
          </View>
        ) : null}

        {metaEntry && onOpenMeta ? (
          <TouchableOpacity
            style={styles.metaLinkBtn}
            onPress={() => onOpenMeta(metaEntry)}
          >
            <Text style={styles.metaLinkText}>Ver set completo en meta →</Text>
          </TouchableOpacity>
        ) : null}

        <Text style={styles.section}>Estadísticas base (BST: {bst})</Text>
        {stats.map((s) => (
          <StatBar key={s.key} statKey={s.key} value={s.value} />
        ))}

        <Text style={styles.section}>Tipos defensivos</Text>
        <Text style={styles.body}>
          Promedio de multiplicador recibido frente a los 18 tipos:{' '}
          <Text style={styles.em}>{typeMatchups.avgDamageTakenMultiplier}</Text> (menor suele
          implicar mejor defensa global).
        </Text>

        <Text style={styles.section}>Peores matchups (tipos ofensivos)</Text>
        {typeMatchups.worstMatchups.length ? (
          typeMatchups.worstMatchups.map((line) => (
            <Text key={line} style={styles.line}>
              • {line}
            </Text>
          ))
        ) : (
          <Text style={styles.muted}>Sin debilidades ×2 o mayores destacadas.</Text>
        )}

        <Text style={styles.section}>Buenas resistencias</Text>
        {typeMatchups.bestResistances.length ? (
          typeMatchups.bestResistances.map((line) => (
            <Text key={line} style={styles.line}>
              • {line}
            </Text>
          ))
        ) : (
          <Text style={styles.muted}>Pocas resistencias por debajo de ×1.</Text>
        )}

        <Text style={styles.section}>Habilidades</Text>
        <Text style={styles.body}>{abilities.join(', ') || '—'}</Text>

        <Text style={styles.section}>Movimientos del meta</Text>
        {metaLoading ? (
          <View style={styles.moveLoading}>
            <ActivityIndicator color={colors.accent} size="small" />
            <Text style={styles.muted}>Cargando sets del meta…</Text>
          </View>
        ) : metaMoves.length ? (
          metaMoves.map((m) => (
            <TouchableOpacity
              key={m.slug}
              style={styles.moveRow}
              onPress={() => onOpenMove(m.slug)}
              activeOpacity={0.75}
            >
              <Text style={styles.moveName} numberOfLines={1}>
                {m.label}
              </Text>
              <Text style={styles.movePct}>
                {m.rate !== undefined ? formatMetaPct(m.rate) : ''}
              </Text>
            </TouchableOpacity>
          ))
        ) : (
          <Text style={styles.body}>
            Sin datos de uso en el meta VGC para este Pokémon. Consultá la pantalla Meta y sets.
          </Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scroll: {
    padding: 20,
  },
  backLink: {
    marginBottom: 8,
  },
  backLinkText: {
    color: colors.accent,
    fontSize: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.text,
  },
  slug: {
    color: colors.textMuted,
    fontSize: 14,
    marginBottom: 12,
    textTransform: 'capitalize',
  },
  art: {
    width: '100%',
    height: 220,
    marginBottom: 12,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  badge: {
    backgroundColor: colors.accentSoft,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    marginRight: 8,
    marginBottom: 8,
  },
  badgeText: {
    color: colors.text,
    fontWeight: '600',
    fontSize: 13,
  },
  flags: {
    color: colors.warning,
    marginBottom: 12,
    fontWeight: '600',
  },
  metaBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.accentSoft,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.accent,
    marginBottom: 8,
  },
  metaBadgeText: { color: colors.accent, fontWeight: '800', fontSize: 13 },
  metaLinkBtn: {
    marginBottom: 12,
    paddingVertical: 10,
  },
  metaLinkText: { color: colors.accentBlue, fontWeight: '700', fontSize: 14 },
  section: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 10,
  },
  body: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  em: {
    color: colors.text,
    fontWeight: '700',
  },
  line: {
    color: colors.textMuted,
    fontSize: 14,
    marginBottom: 4,
    textTransform: 'capitalize',
  },
  muted: {
    color: colors.textMuted,
    fontSize: 14,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  error: {
    color: colors.danger,
    textAlign: 'center',
    marginBottom: 16,
  },
  backBtn: {
    backgroundColor: colors.accent,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  backBtnText: {
    color: '#fff',
    fontWeight: '700',
  },
  moveLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  moveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  moveName: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
    marginRight: 8,
  },
  movePct: {
    color: colors.accent,
    fontWeight: '700',
    fontSize: 14,
  },
});

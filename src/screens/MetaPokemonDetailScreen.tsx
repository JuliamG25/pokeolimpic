import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Share,
  Modal,
} from 'react-native';
import { getTopInset, getBottomInset } from '../utils/safeArea';
import type { MetaRateEntry, SmogonUsageEntry } from '../api/smogon';
import { fetchAbility, fetchMove } from '../api/pokeapi';
import { fetchItemDetail } from '../api/gameData';
import { addPokemonToTeamForTeam, listSavedTeams, type SavedTeam } from '../api/team';
import { abilityEffectShort, abilityNameEs, moveNameEs, typeNameEs } from '../utils/i18n';
import { formatMetaPct, formatRateLine } from '../utils/meta';
import { formatShowdownSet } from '../utils/showdown';
import { PokeScreenHeader } from '../components/PokeScreenHeader';
import { PokeSprite } from '../components/PokeSprite';
import { colors } from '../theme/colors';
import { HORIZONTAL_PADDING } from '../theme/layout';
import { POKE_BORDER } from '../theme/pokemon';
import { pokemonSpriteUrl } from '../constants/sprites';

const NATURE_ES: Record<string, string> = {
  Hardy: 'Fuerte',
  Lonely: 'Huraña',
  Brave: 'Audaz',
  Adamant: 'Firme',
  Naughty: 'Pícara',
  Bold: 'Osada',
  Docile: 'Dócil',
  Relaxed: 'Plácida',
  Impish: 'Agitada',
  Lax: 'Floja',
  Timid: 'Miedosa',
  Hasty: 'Activa',
  Serious: 'Seria',
  Jolly: 'Alegre',
  Naive: 'Ingenua',
  Modest: 'Modesta',
  Mild: 'Afable',
  Quiet: 'Mansa',
  Bashful: 'Tímida',
  Rash: 'Alocada',
  Calm: 'Serena',
  Gentle: 'Amable',
  Sassy: 'Grosera',
  Careful: 'Cauta',
  Quirky: 'Rara',
};

type Props = {
  entry: SmogonUsageEntry;
  spriteId: number;
  onBack: () => void;
  onOpenFullDetail?: (slug: string) => void;
  onOpenCalc?: (attacker: SmogonUsageEntry, moveName: string) => void;
};

function RateList({
  title,
  items,
  formatLabel,
}: {
  title: string;
  items: MetaRateEntry[];
  formatLabel: (name: string) => string;
}): React.JSX.Element | null {
  if (!items.length) return null;
  return (
    <>
      <Text style={styles.section}>{title}</Text>
      <View style={styles.card}>
        {items.map((item, i) => (
          <View key={`${item.name}-${i}`} style={styles.rateRow}>
            <Text style={styles.rateName}>{formatLabel(item.name)}</Text>
            <Text style={styles.ratePct}>{formatMetaPct(item.rate)}</Text>
          </View>
        ))}
      </View>
    </>
  );
}

export function MetaPokemonDetailScreen({
  entry,
  spriteId,
  onBack,
  onOpenFullDetail,
  onOpenCalc,
}: Props): React.JSX.Element {
  const [loading, setLoading] = useState(true);
  const [moveLabels, setMoveLabels] = useState<
    { label: string; rate: number; englishName: string }[]
  >([]);
  const [abilityEs, setAbilityEs] = useState<string | null>(null);
  const [itemEs, setItemEs] = useState<string | null>(null);
  const [abilityDesc, setAbilityDesc] = useState<string | null>(null);
  const [itemDesc, setItemDesc] = useState<string | null>(null);
  const [teamPickerOpen, setTeamPickerOpen] = useState(false);
  const [teams, setTeams] = useState<SavedTeam[]>([]);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const moves = await Promise.all(
          entry.topMoves.map(async (m) => {
            const slug = m.name.trim().toLowerCase().replace(/\s+/g, '-');
            try {
              const raw = await fetchMove(slug);
              return { label: moveNameEs(raw), rate: m.rate, englishName: m.name };
            } catch {
              return { label: m.name, rate: m.rate, englishName: m.name };
            }
          }),
        );

        let abName: string | null = null;
        let abText: string | null = null;
        if (entry.topAbility) {
          try {
            const ab = await fetchAbility(entry.topAbility);
            abName = abilityNameEs(ab);
            abText = abilityEffectShort(ab);
          } catch {
            abName = entry.topAbility;
            abText = null;
          }
        }

        let itName: string | null = null;
        let itText: string | null = null;
        if (entry.topItem) {
          const it = await fetchItemDetail(entry.topItem);
          itName = it.nameEs;
          itText = it.description;
        }

        if (alive) {
          setMoveLabels(moves);
          setAbilityEs(abName);
          setAbilityDesc(abText);
          setItemEs(itName);
          setItemDesc(itText);
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [entry]);

  const usagePct = formatMetaPct(entry.usage);
  const leadPct = entry.lead > 0 ? formatMetaPct(entry.lead) : null;
  const natureLabel = entry.topNature
    ? (NATURE_ES[entry.topNature] ?? entry.topNature)
    : null;

  const openTeamPicker = () => {
    void listSavedTeams().then(({ teams: t }) => {
      setTeams(t);
      setTeamPickerOpen(true);
    });
  };

  const addToTeam = (teamId: string) => {
    void addPokemonToTeamForTeam(teamId, entry.slug, entry.name, entry).then((r) => {
      const teamName = teams.find((t) => t.id === teamId)?.name ?? 'equipo';
      setTeamPickerOpen(false);
      if (r === 'ok') Alert.alert('Equipo', `${entry.name} añadido a «${teamName}».`);
      else if (r === 'full')
        Alert.alert('Equipo lleno', `«${teamName}» ya tiene 6 Pokémon.`);
      else if (r === 'duplicate')
        Alert.alert('Ya en el equipo', `${entry.name} ya está en «${teamName}».`);
    });
  };

  const exportSet = () => {
    void Share.share({ message: formatShowdownSet(entry), title: entry.name });
  };

  return (
    <View
      style={[
        styles.safe,
        {
          paddingTop: getTopInset(),
          paddingBottom: getBottomInset(),
        },
      ]}
    >
      <PokeScreenHeader compact title={entry.name} onBack={onBack} backLabel="← Meta" />

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.hero}>
          {spriteId > 0 ? (
            <PokeSprite uri={pokemonSpriteUrl(spriteId)} style={styles.sprite} />
          ) : (
            <View style={styles.spritePh} />
          )}
          <View style={styles.heroText}>
            <Text style={styles.title}>{entry.name}</Text>
            <Text style={styles.usage}>{usagePct} uso en el meta</Text>
            {leadPct ? (
              <Text style={styles.lead}>Lead: {leadPct}</Text>
            ) : null}
          </View>
        </View>

        {loading ? (
          <ActivityIndicator color={colors.accent} style={{ marginVertical: 24 }} />
        ) : (
          <>
            <Text style={styles.section}>Movimientos más usados</Text>
            <View style={styles.card}>
              {moveLabels.length > 0 ? (
                moveLabels.map((m, i) => (
                  <View key={`${m.label}-${i}`} style={styles.rateRow}>
                    <Text style={styles.moveNum}>{i + 1}</Text>
                    <Text style={styles.moveName}>{m.label}</Text>
                    <Text style={styles.ratePct}>{formatMetaPct(m.rate)}</Text>
                    {onOpenCalc ? (
                      <TouchableOpacity
                        style={styles.moveCalcBtn}
                        onPress={() => onOpenCalc(entry, m.englishName)}
                      >
                        <Text style={styles.moveCalcText}>÷</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                ))
              ) : (
                <Text style={styles.muted}>Sin datos de movimientos.</Text>
              )}
            </View>

            <RateList
              title="Habilidades"
              items={entry.topAbilities}
              formatLabel={(n) => (n === entry.topAbility && abilityEs ? abilityEs : n)}
            />
            {entry.topAbility && !entry.topAbilities.length ? (
              <>
                <Text style={styles.section}>Habilidad más usada</Text>
                <View style={styles.card}>
                  <Text style={styles.highlight}>{abilityEs ?? entry.topAbility}</Text>
                  {abilityDesc ? <Text style={styles.desc}>{abilityDesc}</Text> : null}
                </View>
              </>
            ) : abilityDesc && entry.topAbilities.length ? (
              <Text style={styles.descInline}>{abilityDesc}</Text>
            ) : null}

            <RateList
              title="Objetos"
              items={entry.topItems}
              formatLabel={(n) => (n === entry.topItem && itemEs ? itemEs : n)}
            />
            {entry.topItem && !entry.topItems.length ? (
              <>
                <Text style={styles.section}>Objeto más usado</Text>
                <View style={styles.card}>
                  <Text style={styles.highlight}>{itemEs ?? entry.topItem}</Text>
                  {itemDesc ? <Text style={styles.desc}>{itemDesc}</Text> : null}
                </View>
              </>
            ) : itemDesc && entry.topItems.length ? (
              <Text style={styles.descInline}>{itemDesc}</Text>
            ) : null}

            <RateList
              title="Tipos Tera"
              items={entry.topTeras}
              formatLabel={(n) => typeNameEs(n)}
            />
            {entry.topTera && !entry.topTeras.length ? (
              <>
                <Text style={styles.section}>Tera más usado</Text>
                <View style={styles.card}>
                  <Text style={styles.highlight}>{typeNameEs(entry.topTera)}</Text>
                </View>
              </>
            ) : null}

            {entry.topSpreads.length > 0 ? (
              <>
                <Text style={styles.section}>Repartos EV populares</Text>
                <View style={styles.card}>
                  {entry.topSpreads.map((s, i) => (
                    <Text key={i} style={styles.spreadLine}>
                      {formatRateLine(s.name.replace(/^[^:]+:\s*/, ''), s.rate)}
                    </Text>
                  ))}
                </View>
              </>
            ) : null}

            {natureLabel || entry.topSpread ? (
              <>
                <Text style={styles.section}>Naturaleza y EVs</Text>
                <View style={styles.card}>
                  {natureLabel ? (
                    <Text style={styles.highlight}>Naturaleza {natureLabel}</Text>
                  ) : null}
                  {entry.topSpread ? (
                    <Text style={styles.evs}>EVs: {entry.topSpread}</Text>
                  ) : null}
                </View>
              </>
            ) : null}
          </>
        )}

        <TouchableOpacity style={styles.teamBtn} onPress={openTeamPicker}>
          <Text style={styles.teamBtnText}>Añadir a un equipo…</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.exportBtn} onPress={exportSet}>
          <Text style={styles.exportBtnText}>Copiar / compartir set Showdown</Text>
        </TouchableOpacity>

        {onOpenFullDetail ? (
          <TouchableOpacity
            style={styles.linkBtn}
            onPress={() => onOpenFullDetail(entry.slug)}
          >
            <Text style={styles.linkBtnText}>Ver ficha completa (stats y matchups)</Text>
          </TouchableOpacity>
        ) : null}
      </ScrollView>

      <Modal visible={teamPickerOpen} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Elegir equipo</Text>
            {teams.map((t) => (
              <TouchableOpacity
                key={t.id}
                style={styles.modalTeamRow}
                onPress={() => addToTeam(t.id)}
              >
                <Text style={styles.modalTeamName}>{t.name}</Text>
                <Text style={styles.modalTeamCount}>{t.slots.length}/6</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.modalClose} onPress={() => setTeamPickerOpen(false)}>
              <Text style={styles.modalCloseText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingHorizontal: HORIZONTAL_PADDING, paddingBottom: 32, paddingTop: 4 },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 20,
  },
  sprite: { width: 96, height: 96 },
  spritePh: { width: 96, height: 96 },
  heroText: { flex: 1 },
  title: { fontSize: 24, fontWeight: '800', color: colors.text },
  usage: { color: colors.accent, fontSize: 15, fontWeight: '700', marginTop: 6 },
  lead: { color: colors.accentBlue, fontSize: 13, fontWeight: '700', marginTop: 4 },
  section: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginTop: 4,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    borderWidth: POKE_BORDER,
    borderColor: colors.cardBorder,
  },
  rateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
    gap: 8,
  },
  moveNum: {
    width: 24,
    color: colors.accent,
    fontWeight: '800',
    fontSize: 14,
  },
  moveName: { flex: 1, color: colors.text, fontSize: 16, fontWeight: '600' },
  moveCalcBtn: {
    backgroundColor: '#C62828',
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moveCalcText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  rateName: { flex: 1, color: colors.text, fontSize: 15, fontWeight: '600' },
  ratePct: { color: colors.accent, fontWeight: '800', fontSize: 14 },
  highlight: { color: colors.text, fontSize: 17, fontWeight: '700', marginBottom: 8 },
  desc: { color: colors.textMuted, fontSize: 14, lineHeight: 21 },
  descInline: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: -8,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  evs: { color: colors.textMuted, fontSize: 13, fontFamily: 'monospace' },
  spreadLine: { color: colors.textMuted, fontSize: 13, marginBottom: 6 },
  muted: { color: colors.textMuted, fontSize: 14 },
  teamBtn: {
    marginTop: 8,
    padding: 14,
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: colors.accent,
    borderWidth: POKE_BORDER,
    borderColor: colors.cardBorder,
  },
  teamBtnText: { color: colors.textOnPrimary, fontWeight: '800', fontSize: 15 },
  exportBtn: {
    marginTop: 10,
    padding: 14,
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.accentBlue,
  },
  exportBtnText: { color: colors.accentBlue, fontWeight: '700', fontSize: 14 },
  calcBtn: {
    marginTop: 10,
    padding: 14,
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: '#C62828',
    borderWidth: POKE_BORDER,
    borderColor: colors.cardBorder,
  },
  calcBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  linkBtn: {
    marginTop: 10,
    padding: 14,
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  linkBtnText: { color: colors.accent, fontWeight: '600', fontSize: 14 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 20,
    borderWidth: POKE_BORDER,
    borderColor: colors.cardBorder,
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: colors.text, marginBottom: 12 },
  modalTeamRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  modalTeamName: { color: colors.text, fontWeight: '700', fontSize: 15 },
  modalTeamCount: { color: colors.textMuted, fontWeight: '600' },
  modalClose: { marginTop: 12, padding: 12, alignItems: 'center' },
  modalCloseText: { color: colors.textMuted, fontWeight: '600' },
});

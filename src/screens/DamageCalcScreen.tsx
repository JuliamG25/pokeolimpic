import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { getTopInset, getBottomInset } from '../utils/safeArea';
import { fetchChampionsMetaUsage, type SmogonUsageEntry } from '../api/smogon';
import {
  getChampionsDexBySlug,
  resolveChampionsSpriteId,
} from '../constants/championsRoster';
import { PokeScreenHeader } from '../components/PokeScreenHeader';
import { PokeSprite, PokeSpritePlaceholder } from '../components/PokeSprite';
import { colors } from '../theme/colors';
import { HORIZONTAL_PADDING } from '../theme/layout';
import { POKE_BORDER } from '../theme/pokemon';
import { pokemonSpriteUrl } from '../constants/sprites';
import { calculateMetaDamage, type DamageCalcOutput } from '../scoring/damageCalc';
import { matchesSearch } from '../utils/search';
import { formatMetaPct } from '../utils/meta';

type Props = {
  initialAttacker?: SmogonUsageEntry;
  initialDefender?: SmogonUsageEntry;
  initialMoveName?: string;
  onBack: () => void;
};

type PickerSide = 'attacker' | 'defender' | null;

function MetaRow({
  entry,
  selected,
  onPress,
}: {
  entry: SmogonUsageEntry;
  selected: boolean;
  onPress: () => void;
}) {
  const spriteId = resolveChampionsSpriteId(entry.slug, getChampionsDexBySlug());
  return (
    <TouchableOpacity
      style={[styles.pickRow, selected && styles.pickRowSelected]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      {spriteId > 0 ? (
        <PokeSprite uri={pokemonSpriteUrl(spriteId)} style={styles.pickSprite} />
      ) : (
        <PokeSpritePlaceholder style={styles.pickSprite} />
      )}
      <View style={styles.pickText}>
        <Text style={styles.pickName}>{entry.name}</Text>
        <Text style={styles.pickSub}>{formatMetaPct(entry.usage)} uso</Text>
      </View>
      {selected ? <Text style={styles.pickCheck}>✓</Text> : null}
    </TouchableOpacity>
  );
}

export function DamageCalcScreen({
  initialAttacker,
  initialDefender,
  initialMoveName,
  onBack,
}: Props) {
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [metaErr, setMetaErr] = useState<string | null>(null);
  const [entries, setEntries] = useState<SmogonUsageEntry[]>([]);
  const [attacker, setAttacker] = useState<SmogonUsageEntry | null>(
    initialAttacker ?? null,
  );
  const [defender, setDefender] = useState<SmogonUsageEntry | null>(
    initialDefender ?? null,
  );
  const [moveName, setMoveName] = useState(initialMoveName ?? '');
  const [useTera, setUseTera] = useState(true);
  const [picker, setPicker] = useState<PickerSide>(null);
  const [query, setQuery] = useState('');
  const [calcErr, setCalcErr] = useState<string | null>(null);
  const [result, setResult] = useState<DamageCalcOutput | null>(null);
  const [calculating, setCalculating] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoadingMeta(true);
      setMetaErr(null);
      try {
        const { entries: list } = await fetchChampionsMetaUsage(80);
        if (alive) setEntries(list);
      } catch (e) {
        if (alive) {
          setMetaErr(e instanceof Error ? e.message : 'No se pudo cargar el meta');
        }
      } finally {
        if (alive) setLoadingMeta(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (initialAttacker && !moveName && initialAttacker.topMoves.length > 0) {
      setMoveName(initialAttacker.topMoves[0].name);
    }
  }, [initialAttacker, moveName]);

  const filtered = useMemo(() => {
    if (!query.trim()) return entries;
    return entries.filter((e) => matchesSearch(e.name, query));
  }, [entries, query]);

  const moveOptions = useMemo(() => {
    if (!attacker?.topMoves.length) return moveName ? [moveName] : [];
    const names = attacker.topMoves.map((m) => m.name);
    if (moveName && !names.includes(moveName)) return [moveName, ...names];
    return names;
  }, [attacker, moveName]);

  const runCalc = useCallback(async () => {
    if (!attacker || !defender || !moveName.trim()) {
      setCalcErr('Elegí atacante, defensor y movimiento.');
      setResult(null);
      return;
    }
    setCalculating(true);
    setCalcErr(null);
    try {
      const out = await calculateMetaDamage({
        attacker,
        defender,
        moveName,
        useTera,
      });
      setResult(out);
    } catch (e) {
      setResult(null);
      setCalcErr(
        e instanceof Error
          ? e.message
          : 'No se pudo calcular. Revisá nombres Showdown del meta.',
      );
    } finally {
      setCalculating(false);
    }
  }, [attacker, defender, moveName, useTera]);

  const selectEntry = (side: PickerSide, entry: SmogonUsageEntry) => {
    if (side === 'attacker') {
      setAttacker(entry);
      if (entry.topMoves.length > 0 && !entry.topMoves.some((m) => m.name === moveName)) {
        setMoveName(entry.topMoves[0].name);
      }
    } else if (side === 'defender') {
      setDefender(entry);
    }
    setPicker(null);
    setQuery('');
    setResult(null);
  };

  return (
    <View
      style={[
        styles.safe,
        { paddingTop: getTopInset(), paddingBottom: getBottomInset() },
      ]}
    >
      <PokeScreenHeader compact title="Calculadora" onBack={onBack} backLabel="← Menú" />

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.intro}>
          Daño Gen 9 · nivel 50 VGC · sets del meta (EVs, objeto, Tera). Aproximación con stats PokeAPI.
        </Text>

        {loadingMeta ? (
          <ActivityIndicator color={colors.accent} style={{ marginVertical: 24 }} />
        ) : metaErr ? (
          <Text style={styles.err}>{metaErr}</Text>
        ) : (
          <>
            <Text style={styles.section}>Atacante</Text>
            <TouchableOpacity
              style={styles.selector}
              onPress={() => setPicker('attacker')}
            >
              <Text style={attacker ? styles.selectorVal : styles.selectorPh}>
                {attacker?.name ?? 'Elegir del meta…'}
              </Text>
            </TouchableOpacity>

            <Text style={styles.section}>Defensor</Text>
            <TouchableOpacity
              style={styles.selector}
              onPress={() => setPicker('defender')}
            >
              <Text style={defender ? styles.selectorVal : styles.selectorPh}>
                {defender?.name ?? 'Elegir del meta…'}
              </Text>
            </TouchableOpacity>

            <Text style={styles.section}>Movimiento</Text>
            {moveOptions.length > 0 ? (
              <View style={styles.chips}>
                {moveOptions.map((m) => (
                  <TouchableOpacity
                    key={m}
                    style={[styles.chip, moveName === m && styles.chipActive]}
                    onPress={() => {
                      setMoveName(m);
                      setResult(null);
                    }}
                  >
                    <Text style={[styles.chipText, moveName === m && styles.chipTextActive]}>
                      {m}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <TextInput
                style={styles.input}
                value={moveName}
                onChangeText={(t) => {
                  setMoveName(t);
                  setResult(null);
                }}
                placeholder="Nombre Showdown (ej. Earthquake)"
                placeholderTextColor={colors.textMuted}
              />
            )}

            <View style={styles.teraRow}>
              <Text style={styles.teraLabel}>Aplicar Tera del set</Text>
              <Switch
                value={useTera}
                onValueChange={(v) => {
                  setUseTera(v);
                  setResult(null);
                }}
                trackColor={{ false: colors.cardBorder, true: colors.accentSoft }}
                thumbColor={useTera ? colors.accent : '#f4f4f4'}
              />
            </View>

            <TouchableOpacity
              style={[styles.calcBtn, calculating && styles.calcBtnDisabled]}
              onPress={runCalc}
              disabled={calculating}
            >
              {calculating ? (
                <ActivityIndicator color={colors.textOnPrimary} />
              ) : (
                <Text style={styles.calcBtnText}>Calcular daño</Text>
              )}
            </TouchableOpacity>

            {calcErr ? <Text style={styles.err}>{calcErr}</Text> : null}

            {result ? (
              <View style={styles.resultCard}>
                <Text style={styles.resultTitle}>Resultado</Text>
                <Text style={styles.damageRange}>
                  {result.min} – {result.max} HP
                </Text>
                <Text style={styles.damagePct}>
                  {result.minPct}% – {result.maxPct}% del PS ({result.defenderHp} PS)
                </Text>
                {result.koText ? (
                  <Text style={styles.koText}>{result.koText}</Text>
                ) : null}
                <Text style={styles.desc}>{result.description}</Text>
                {result.rolls.length > 1 ? (
                  <>
                    <Text style={styles.rollsTitle}>Todos los rolls</Text>
                    <Text style={styles.rolls}>{result.rolls.join(', ')}</Text>
                  </>
                ) : null}
              </View>
            ) : null}
          </>
        )}
      </ScrollView>

      {picker ? (
        <View style={styles.pickerOverlay}>
          <View style={styles.pickerPanel}>
            <Text style={styles.pickerTitle}>
              {picker === 'attacker' ? 'Atacante' : 'Defensor'}
            </Text>
            <TextInput
              style={styles.input}
              value={query}
              onChangeText={setQuery}
              placeholder="Buscar…"
              placeholderTextColor={colors.textMuted}
              autoFocus
            />
            <ScrollView style={styles.pickerList} keyboardShouldPersistTaps="handled">
              {filtered.map((e) => (
                <MetaRow
                  key={e.slug}
                  entry={e}
                  selected={
                    picker === 'attacker'
                      ? attacker?.slug === e.slug
                      : defender?.slug === e.slug
                  }
                  onPress={() => selectEntry(picker, e)}
                />
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.pickerClose} onPress={() => setPicker(null)}>
              <Text style={styles.pickerCloseText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingHorizontal: HORIZONTAL_PADDING, paddingBottom: 32 },
  intro: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 16,
  },
  section: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginTop: 8,
  },
  selector: {
    backgroundColor: colors.card,
    borderRadius: 10,
    padding: 14,
    borderWidth: POKE_BORDER,
    borderColor: colors.cardBorder,
    marginBottom: 8,
  },
  selectorVal: { color: colors.text, fontSize: 16, fontWeight: '700' },
  selectorPh: { color: colors.textMuted, fontSize: 15 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.card,
  },
  chipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipText: { color: colors.text, fontSize: 13, fontWeight: '600' },
  chipTextActive: { color: colors.textOnPrimary },
  input: {
    backgroundColor: colors.card,
    borderRadius: 10,
    padding: 12,
    borderWidth: POKE_BORDER,
    borderColor: colors.cardBorder,
    color: colors.text,
    fontSize: 15,
    marginBottom: 12,
  },
  teraRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 8,
    paddingHorizontal: 4,
  },
  teraLabel: { color: colors.text, fontSize: 15, fontWeight: '600' },
  calcBtn: {
    marginTop: 8,
    padding: 14,
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: colors.accent,
    borderWidth: POKE_BORDER,
    borderColor: colors.cardBorder,
  },
  calcBtnDisabled: { opacity: 0.7 },
  calcBtnText: { color: colors.textOnPrimary, fontWeight: '800', fontSize: 15 },
  err: { color: colors.danger, marginTop: 12, fontSize: 14 },
  resultCard: {
    marginTop: 20,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: POKE_BORDER,
    borderColor: colors.cardBorder,
  },
  resultTitle: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  damageRange: { color: colors.text, fontSize: 28, fontWeight: '800' },
  damagePct: { color: colors.accent, fontSize: 16, fontWeight: '700', marginTop: 4 },
  koText: { color: colors.accentBlue, fontSize: 15, fontWeight: '700', marginTop: 10 },
  desc: { color: colors.textMuted, fontSize: 13, lineHeight: 20, marginTop: 12 },
  rollsTitle: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    marginTop: 12,
    textTransform: 'uppercase',
  },
  rolls: { color: colors.text, fontSize: 12, fontFamily: 'monospace', marginTop: 4 },
  pickerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  pickerPanel: {
    backgroundColor: colors.bg,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: HORIZONTAL_PADDING,
    maxHeight: '70%',
    borderWidth: POKE_BORDER,
    borderColor: colors.cardBorder,
  },
  pickerTitle: { fontSize: 18, fontWeight: '800', color: colors.text, marginBottom: 12 },
  pickerList: { maxHeight: 320, marginBottom: 8 },
  pickRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  pickRowSelected: { backgroundColor: colors.accentSoft },
  pickSprite: { width: 40, height: 40 },
  pickText: { flex: 1 },
  pickName: { color: colors.text, fontWeight: '700', fontSize: 15 },
  pickSub: { color: colors.textMuted, fontSize: 12 },
  pickCheck: { color: colors.accent, fontWeight: '800', fontSize: 18 },
  pickerClose: {
    padding: 12,
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  pickerCloseText: { color: colors.text, fontWeight: '700' },
});

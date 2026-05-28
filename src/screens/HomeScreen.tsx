import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { getTopInset, getBottomInset, getLeftInset, getRightInset } from '../utils/safeArea';
import {
  fetchGeneration,
  fetchPokemonNamesForType,
  fetchHabitat,
  fetchPokemonColor,
  buildChampionsEvolutionMap,
  fetchHabitatList,
  fetchPokemonColorList,
} from '../api/pokeapi';
import {
  loadChampionsRoster,
  getChampionsSlugSet,
  isChampionsSpecies,
  loadRosterDisplayNames,
} from '../constants/championsRoster';
import { colors } from '../theme/colors';
import { PokeSprite, PokeSpritePlaceholder } from '../components/PokeSprite';
import { PokeSkeletonRow } from '../components/PokeSkeletonRow';
import { matchesSearch } from '../utils/search';
import {
  POKEMON_TYPES,
  GENERATIONS,
  type EvolutionPhaseFilter,
} from '../constants/filters';
import { FilterChipRow, EvolutionFilterRow } from '../components/FilterChips';
import { pokemonSpriteUrl } from '../constants/sprites';

const PAGE_SIZE = 20;

type Props = {
  onOpenPokemon: (name: string) => void;
  /** Si existe, muestra enlace para volver al menú principal */
  onBackToMenu?: () => void;
};

function intersectSets(sets: Set<string>[]): Set<string> {
  if (sets.length === 0) return new Set();
  let result = new Set(sets[0]);
  for (let i = 1; i < sets.length; i++) {
    result = new Set([...result].filter((x) => sets[i].has(x)));
  }
  return result;
}

export function HomeScreen({ onOpenPokemon, onBackToMenu }: Props) {
  const [query, setQuery] = useState('');
  const [names, setNames] = useState<string[]>([]);
  /** Número de Pokédex nacional (ID de entrada API) por nombre */
  const [dexByName, setDexByName] = useState<Map<string, number>>(() => new Map());
  const [loadingList, setLoadingList] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const [genId, setGenId] = useState<number | null>(null);
  const [typeSlug, setTypeSlug] = useState<string | null>(null);
  const [habitatSlug, setHabitatSlug] = useState<string | null>(null);
  const [colorSlug, setColorSlug] = useState<string | null>(null);
  const [evoPhase, setEvoPhase] = useState<EvolutionPhaseFilter>('any');

  const [habitatOptions, setHabitatOptions] = useState<{ name: string; label: string }[]>([]);
  const [colorOptions, setColorOptions] = useState<{ name: string; label: string }[]>([]);

  const [candidateNames, setCandidateNames] = useState<string[] | null>(null);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [candidateError, setCandidateError] = useState<string | null>(null);

  const [evolutionMap, setEvolutionMap] = useState<Map<string, boolean> | null>(null);
  const [evoMapProgress, setEvoMapProgress] = useState(0);
  const [evoMapLoading, setEvoMapLoading] = useState(false);

  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [displayNames, setDisplayNames] = useState<Map<string, string>>(() => new Map());

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const roster = await loadChampionsRoster();
        const n = roster.map((e) => e.speciesSlug);
        const dex = new Map(roster.map((e) => [e.speciesSlug, e.nationalDex]));
        if (alive) {
          setNames(n);
          setDexByName(dex);
        }
        void loadRosterDisplayNames(roster).then((map) => {
          if (alive) setDisplayNames(map);
        });
      } catch {
        if (alive) setListError('No se pudo cargar el roster de Pokémon Champions.');
      } finally {
        if (alive) setLoadingList(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      const [h, c] = await Promise.all([fetchHabitatList(), fetchPokemonColorList()]);
      if (alive) {
        setHabitatOptions(h);
        setColorOptions(c);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (evoPhase === 'any') return;
    if (evolutionMap) return;
    let alive = true;
    (async () => {
      setEvoMapLoading(true);
      setEvoMapProgress(0);
      try {
        const roster = await loadChampionsRoster();
        const map = await buildChampionsEvolutionMap(roster, (r) => {
          if (alive) setEvoMapProgress(r);
        });
        if (alive) setEvolutionMap(map);
      } catch {
        if (alive) setEvolutionMap(null);
      } finally {
        if (alive) setEvoMapLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [evoPhase, evolutionMap]);

  useEffect(() => {
    if (!genId && !typeSlug && !habitatSlug && !colorSlug) {
      setCandidateNames(null);
      setCandidateError(null);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoadingCandidates(true);
      setCandidateError(null);
      try {
        const sets: Set<string>[] = [];
        if (genId) {
          const g = await fetchGeneration(genId);
          sets.push(new Set(g.pokemon_species.map((s) => s.name)));
        }
        if (typeSlug) {
          const n = await fetchPokemonNamesForType(typeSlug);
          sets.push(new Set(n));
        }
        if (habitatSlug) {
          const h = await fetchHabitat(habitatSlug);
          sets.push(new Set(h.pokemon_species.map((s) => s.name)));
        }
        if (colorSlug) {
          const c = await fetchPokemonColor(colorSlug);
          sets.push(new Set(c.pokemon_species.map((s) => s.name)));
        }
        const inter = intersectSets(sets);
        const roster = await getChampionsSlugSet();
        const filtered = [...inter].filter((name) => isChampionsSpecies(name, roster));
        if (!cancelled) setCandidateNames(filtered);
      } catch {
        if (!cancelled) {
          setCandidateError('No se pudieron aplicar los filtros.');
          setCandidateNames([]);
        }
      } finally {
        if (!cancelled) setLoadingCandidates(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [genId, typeSlug, habitatSlug, colorSlug]);

  const filteredFull = useMemo(() => {
    const pool = candidateNames ?? names;
    let list = pool;
    const q = query.trim();
    if (q) {
      list = list.filter((n) =>
        matchesSearch(q, n, n.replace(/-/g, ' '), displayNames.get(n)),
      );
    }

    if (evoPhase !== 'any' && evolutionMap) {
      list = list.filter((n) => {
        const hasPrev = evolutionMap.get(n);
        if (hasPrev === undefined) return false;
        if (evoPhase === 'base') return !hasPrev;
        return hasPrev;
      });
    }

    return list;
  }, [names, candidateNames, query, evoPhase, evolutionMap, displayNames]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [query, genId, typeSlug, habitatSlug, colorSlug, evoPhase, candidateNames, names, evolutionMap]);

  const displayed = useMemo(
    () => filteredFull.slice(0, visibleCount),
    [filteredFull, visibleCount]
  );

  const loadMore = useCallback(() => {
    setVisibleCount((v) => {
      if (v >= filteredFull.length) return v;
      return Math.min(v + PAGE_SIZE, filteredFull.length);
    });
  }, [filteredFull]);

  const goDetail = useCallback(
    (name: string) => {
      Keyboard.dismiss();
      onOpenPokemon(name);
    },
    [onOpenPokemon]
  );

  const clearFilters = useCallback(() => {
    setGenId(null);
    setTypeSlug(null);
    setHabitatSlug(null);
    setColorSlug(null);
    setEvoPhase('any');
  }, []);

  const hasStructuralFilters = genId || typeSlug || habitatSlug || colorSlug;

  const activeFilterCount = useMemo(() => {
    let n = 0;
    if (genId) n += 1;
    if (typeSlug) n += 1;
    if (habitatSlug) n += 1;
    if (colorSlug) n += 1;
    if (evoPhase !== 'any') n += 1;
    return n;
  }, [genId, typeSlug, habitatSlug, colorSlug, evoPhase]);

  const genChips = GENERATIONS.map((g) => ({
    key: String(g.id),
    label: g.label,
  }));

  const typeChips = POKEMON_TYPES.map((t) => ({
    key: t.slug,
    label: t.label,
  }));

  const habitatChips = habitatOptions.map((h) => ({
    key: h.name,
    label: h.label.charAt(0).toUpperCase() + h.label.slice(1),
  }));

  const colorChips = colorOptions.map((c) => ({
    key: c.name,
    label: c.label.charAt(0).toUpperCase() + c.label.slice(1),
  }));

  const hasMore = visibleCount < filteredFull.length;
  const total = filteredFull.length;

  const listFooter =
    total === 0 ? null : hasMore ? (
      <View style={styles.footerLoad}>
        <Text style={styles.footerHint}>
          {visibleCount} de {total} · baja para cargar {Math.min(PAGE_SIZE, total - visibleCount)} más
        </Text>
      </View>
    ) : (
      <Text style={styles.footerDone}>
        Fin de la lista ({total} resultado{total === 1 ? '' : 's'})
      </Text>
    );

  return (
    <View
      style={[
        styles.safe,
        {
          paddingTop: getTopInset(),
          paddingLeft: getLeftInset(),
          paddingRight: getRightInset(),
          paddingBottom: getBottomInset(),
        },
      ]}
    >
      {onBackToMenu ? (
        <View style={styles.navRow}>
          <TouchableOpacity style={styles.navBackBtn} onPress={onBackToMenu} hitSlop={12}>
            <Text style={styles.navBack}>← Menú</Text>
          </TouchableOpacity>
        </View>
      ) : null}
      <View style={styles.header}>
        <Text style={styles.title}>◓ Pokédex Champions</Text>
        <Text style={styles.subtitle}>
          Solo Pokémon del roster oficial de Champions ({names.length} especies). Filtros en el
          panel desplegable. {PAGE_SIZE} por página al llegar al final.
        </Text>
      </View>

      <TextInput
        style={styles.input}
        placeholder="Nombre en español o inglés (ej. Garchomp, pikachu)"
        placeholderTextColor={colors.textMuted}
        value={query}
        onChangeText={setQuery}
        autoCapitalize="none"
        autoCorrect={false}
        onSubmitEditing={() => {
          const first = displayed[0];
          if (first) goDetail(first);
        }}
        returnKeyType="search"
      />

      {listError ? (
        <Text style={styles.error}>{listError}</Text>
      ) : loadingList ? (
        <PokeSkeletonRow count={10} />
      ) : (
        <FlatList
          data={displayed}
          keyExtractor={(item) => item}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.listContent}
          initialNumToRender={12}
          maxToRenderPerBatch={PAGE_SIZE}
          windowSize={8}
          onEndReached={loadMore}
          onEndReachedThreshold={0.35}
          ListHeaderComponent={
            <View style={styles.filtersWrap}>
              <TouchableOpacity
                style={styles.filterToggle}
                onPress={() => setFiltersExpanded((v) => !v)}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityState={{ expanded: filtersExpanded }}
                accessibilityLabel={
                  filtersExpanded ? 'Ocultar filtros' : 'Mostrar filtros'
                }
              >
                <View style={styles.filterToggleLeft}>
                  <Text style={styles.filterToggleTitle}>Filtros</Text>
                  {activeFilterCount > 0 ? (
                    <View style={styles.filterBadge}>
                      <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
                    </View>
                  ) : null}
                </View>
                <Text style={styles.filterToggleChevron}>
                  {filtersExpanded ? '▲' : '▼'}
                </Text>
              </TouchableOpacity>

              {loadingCandidates ? (
                <View style={styles.rowLoading}>
                  <ActivityIndicator color={colors.accent} size="small" />
                  <Text style={[styles.mutedSmall, styles.rowLoadingText]}>
                    Aplicando filtros…
                  </Text>
                </View>
              ) : null}
              {candidateError ? (
                <Text style={styles.warn}>{candidateError}</Text>
              ) : null}

              {filtersExpanded ? (
                <View style={styles.filtersPanel}>
                  <Text style={styles.championsFilterNote}>
                    Pokédex Champions: usá tipo y evolución. Los filtros de gen/hábitat/color
                    usan datos nacionales y pueden devolver pocos resultados.
                  </Text>
                  <FilterChipRow
                    title="Tipo"
                    chips={typeChips}
                    selectedKey={typeSlug}
                    onSelect={setTypeSlug}
                    layout="wrap"
                  />
                  <EvolutionFilterRow value={evoPhase} onChange={setEvoPhase} />
                  <TouchableOpacity
                    style={styles.advancedToggle}
                    onPress={() => setShowAdvancedFilters((v) => !v)}
                  >
                    <Text style={styles.advancedToggleText}>
                      {showAdvancedFilters ? '▲ Ocultar filtros avanzados' : '▼ Filtros avanzados (Pokédex nacional)'}
                    </Text>
                  </TouchableOpacity>
                  {showAdvancedFilters ? (
                    <>
                  <FilterChipRow
                    title="Generación (nacional)"
                    chips={genChips}
                    selectedKey={genId !== null ? String(genId) : null}
                    onSelect={(key) => {
                      setGenId(key !== null ? Number(key) : null);
                    }}
                    layout="scroll"
                  />
                  {habitatChips.length > 0 ? (
                    <FilterChipRow
                      title="Hábitat (nacional)"
                      chips={habitatChips}
                      selectedKey={habitatSlug}
                      onSelect={setHabitatSlug}
                      layout="wrap"
                    />
                  ) : null}
                  {colorChips.length > 0 ? (
                    <FilterChipRow
                      title="Color (nacional)"
                      chips={colorChips}
                      selectedKey={colorSlug}
                      onSelect={setColorSlug}
                      layout="wrap"
                    />
                  ) : null}
                    </>
                  ) : null}

                  {evoMapLoading ? (
                    <View style={styles.evoBanner}>
                      <Text style={styles.evoBannerText}>
                        Índice evolutivo: {Math.round(evoMapProgress * 100)}%
                      </Text>
                      <View style={styles.evoSpinner}>
                        <ActivityIndicator />
                      </View>
                    </View>
                  ) : null}
                  {!evoMapLoading && evoPhase !== 'any' && !evolutionMap ? (
                    <Text style={styles.warn}>
                      No se pudo cargar el índice evolutivo; el filtro de fase no aplica.
                    </Text>
                  ) : null}

                  {(hasStructuralFilters || evoPhase !== 'any') && (
                    <TouchableOpacity
                      style={styles.clearBtn}
                      onPress={clearFilters}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.clearBtnText}>Limpiar filtros</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ) : null}

              {total > 0 && !loadingCandidates ? (
                <Text style={styles.resultCount}>
                  {displayed.length} de {total} mostrados · Paginación: {PAGE_SIZE} por página
                </Text>
              ) : null}
            </View>
          }
          ListFooterComponent={
            <>
              {listFooter}
              <View style={{ height: 8 }} />
            </>
          }
          ListEmptyComponent={
            <Text style={styles.muted}>
              {loadingCandidates ? '…' : 'Sin coincidencias.'}
            </Text>
          }
          renderItem={({ item }) => {
            const dex = dexByName.get(item);
            const dexLabel =
              dex !== undefined && dex > 0
                ? `#${String(dex).padStart(4, '0')}`
                : '—';
            const sid = dex !== undefined && dex > 0 ? dex : null;
            const label = displayNames.get(item) ?? item.replace(/-/g, ' ');
            return (
              <TouchableOpacity
                style={styles.row}
                onPress={() => goDetail(item)}
                activeOpacity={0.7}
              >
                <Text style={styles.rowDex}>{dexLabel}</Text>
                <Text style={styles.rowText} numberOfLines={1}>
                  {label}
                </Text>
                {sid ? (
                  <PokeSprite uri={pokemonSpriteUrl(sid)} style={styles.rowSprite} />
                ) : (
                  <PokeSpritePlaceholder style={styles.rowSprite} />
                )}
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  navRow: {
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  navBackBtn: {
    alignSelf: 'flex-start',
    backgroundColor: colors.accentYellow,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 3,
    borderColor: colors.cardBorder,
  },
  navBack: {
    color: colors.textOnYellow,
    fontSize: 14,
    fontWeight: '800',
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.accentNavy,
    letterSpacing: -0.5,
  },
  subtitle: {
    marginTop: 8,
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  input: {
    marginHorizontal: 20,
    marginBottom: 12,
    backgroundColor: colors.inputBg,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.text,
    borderWidth: 3,
    borderColor: colors.inputBorder,
  },
  filtersWrap: {
    paddingBottom: 8,
  },
  filterToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginBottom: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 3,
    borderColor: colors.cardBorder,
  },
  filterToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterToggleTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  filterBadge: {
    marginLeft: 10,
    minWidth: 22,
    height: 22,
    paddingHorizontal: 6,
    borderRadius: 11,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  filterToggleChevron: {
    color: colors.textMuted,
    fontSize: 14,
    marginLeft: 12,
  },
  filtersPanel: {
    marginBottom: 4,
  },
  resultCount: {
    marginHorizontal: 20,
    marginBottom: 12,
    color: colors.textMuted,
    fontSize: 13,
  },
  evoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 8,
  },
  evoBannerText: {
    color: colors.textMuted,
    fontSize: 13,
    marginRight: 12,
  },
  evoSpinner: {
    marginLeft: 4,
  },
  championsFilterNote: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 12,
  },
  advancedToggle: {
    marginVertical: 10,
    paddingVertical: 8,
  },
  advancedToggleText: {
    color: colors.accentBlue,
    fontSize: 13,
    fontWeight: '700',
  },
  warn: {
    color: colors.warning,
    fontSize: 13,
    marginHorizontal: 20,
    marginBottom: 8,
  },
  rowLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 8,
  },
  mutedSmall: {
    color: colors.textMuted,
    fontSize: 12,
  },
  rowLoadingText: {
    marginLeft: 8,
  },
  clearBtn: {
    alignSelf: 'flex-start',
    marginHorizontal: 20,
    marginBottom: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: colors.accentSoft,
    borderRadius: 10,
    borderWidth: 3,
    borderColor: colors.cardBorder,
  },
  clearBtnText: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.card,
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 8,
    borderWidth: 3,
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
  rowSprite: {
    width: 48,
    height: 48,
    marginLeft: 8,
  },
  rowSpritePlaceholder: {
    width: 48,
    height: 48,
    marginLeft: 8,
  },
  muted: {
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 8,
  },
  error: {
    color: colors.danger,
    textAlign: 'center',
    marginHorizontal: 20,
  },
  center: {
    paddingTop: 40,
    alignItems: 'center',
  },
  footerLoad: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  footerHint: {
    color: colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
  },
  footerDone: {
    color: colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    paddingVertical: 12,
  },
});

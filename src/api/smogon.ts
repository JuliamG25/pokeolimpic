/**
 * Estadísticas y sets Smogon vía data.pkmn.cc
 */

import {
  getChampionsSlugSet,
  isChampionsSpecies,
  loadChampionsRoster,
} from '../constants/championsRoster';
import {
  CACHE_KEYS,
  DEFAULT_CACHE_TTL_MS,
  getCachedJson,
  getCachedJsonStale,
  removeCached,
  setCachedJson,
} from './cache';

const STATS_BASE = 'https://data.pkmn.cc/stats';

export const META_FORMAT_OPTIONS = [
  { id: 'gen9vgc2026', label: 'VGC 2026 (proxy Champions)' },
] as const;

export type MetaFormatId = (typeof META_FORMAT_OPTIONS)[number]['id'];

let activeFormatId: MetaFormatId = 'gen9vgc2026';

export function getActiveMetaFormat(): MetaFormatId {
  return activeFormatId;
}

export function setActiveMetaFormat(id: MetaFormatId): void {
  activeFormatId = id;
}

export function getChampionsMetaFormat(): string {
  return activeFormatId;
}

/** @deprecated Usar getChampionsMetaFormat() */
export const CHAMPIONS_META_FORMAT = 'gen9vgc2026';

export const CHAMPIONS_META_LABEL = 'VGC 2026 · solo Pokémon Champions';

export function showdownNameToSlug(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/\./g, '')
    .replace(/['']/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export interface MetaRateEntry {
  name: string;
  rate: number;
}

export interface SmogonUsageEntry {
  name: string;
  slug: string;
  usage: number;
  lead: number;
  topItem: string | null;
  topAbility: string | null;
  topTera: string | null;
  topMoves: MetaRateEntry[];
  topItems: MetaRateEntry[];
  topAbilities: MetaRateEntry[];
  topTeras: MetaRateEntry[];
  topSpreads: MetaRateEntry[];
  topNature: string | null;
  topSpread: string | null;
}

export interface MetaCatalogEntry {
  name: string;
  score: number;
}

interface RawUsageBlock {
  usage?: { raw?: number; real?: number; weighted?: number };
  lead?: { raw?: number; real?: number; weighted?: number };
  items?: Record<string, number>;
  abilities?: Record<string, number>;
  teraTypes?: Record<string, number>;
  moves?: Record<string, number>;
  spreads?: Record<string, number>;
}

export interface RawStatsFile {
  battles?: number;
  pokemon?: Record<string, RawUsageBlock>;
}

const statsMemoryCache = new Map<string, Promise<RawStatsFile>>();
let lastStatsUpdatedAt: number | null = null;

export function getMetaStatsUpdatedAt(): number | null {
  return lastStatsUpdatedAt;
}

function topRates(map: Record<string, number> | undefined, limit = 4): MetaRateEntry[] {
  if (!map) return [];
  const total = Object.values(map).reduce((a, b) => a + b, 0) || 1;
  return Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([name, count]) => ({ name, rate: count / total }));
}

function topKey(map: Record<string, number> | undefined): string | null {
  const rates = topRates(map, 1);
  return rates[0]?.name ?? null;
}

function parseSpread(spreadKey: string | null): { nature: string | null; spread: string | null } {
  if (!spreadKey) return { nature: null, spread: null };
  const idx = spreadKey.indexOf(':');
  if (idx <= 0) return { nature: null, spread: spreadKey };
  return {
    nature: spreadKey.slice(0, idx),
    spread: spreadKey.slice(idx + 1),
  };
}

export async function fetchRawStats(
  formatId: string = activeFormatId,
  forceRefresh = false,
): Promise<RawStatsFile> {
  if (!forceRefresh) {
    const hit = statsMemoryCache.get(formatId);
    if (hit) return hit;

    const disk = await getCachedJson<RawStatsFile>(
      CACHE_KEYS.smogonStats(formatId),
      DEFAULT_CACHE_TTL_MS,
    );
    if (disk) {
      lastStatsUpdatedAt = disk.savedAt;
      const promise = Promise.resolve(disk.data);
      statsMemoryCache.set(formatId, promise);
      return promise;
    }

    const staleDisk = await getCachedJsonStale<RawStatsFile>(
      CACHE_KEYS.smogonStats(formatId),
    );
    if (staleDisk) {
      lastStatsUpdatedAt = staleDisk.savedAt;
      statsMemoryCache.set(formatId, Promise.resolve(staleDisk.data));
      void (async () => {
        try {
          const res = await fetch(`${STATS_BASE}/${formatId}.json`);
          if (!res.ok) return;
          const data = (await res.json()) as RawStatsFile;
          await setCachedJson(CACHE_KEYS.smogonStats(formatId), data);
          lastStatsUpdatedAt = Date.now();
          statsMemoryCache.set(formatId, Promise.resolve(data));
        } catch {
          /* mantener stale */
        }
      })();
      return staleDisk.data;
    }
  } else {
    statsMemoryCache.delete(formatId);
    await removeCached(CACHE_KEYS.smogonStats(formatId));
  }

  const pending = (async () => {
    try {
      const res = await fetch(`${STATS_BASE}/${formatId}.json`);
      if (!res.ok) {
        statsMemoryCache.delete(formatId);
        const fallback = await getCachedJsonStale<RawStatsFile>(
          CACHE_KEYS.smogonStats(formatId),
        );
        if (fallback) return fallback.data;
        throw new Error(`No hay estadísticas para ${formatId} (${res.status})`);
      }
      const data = (await res.json()) as RawStatsFile;
      await setCachedJson(CACHE_KEYS.smogonStats(formatId), data);
      lastStatsUpdatedAt = Date.now();
      return data;
    } catch (e) {
      statsMemoryCache.delete(formatId);
      const fallback = await getCachedJsonStale<RawStatsFile>(
        CACHE_KEYS.smogonStats(formatId),
      );
      if (fallback) return fallback.data;
      throw e;
    }
  })();

  statsMemoryCache.set(formatId, pending);
  return pending;
}

export async function invalidateMetaCache(formatId: string = activeFormatId): Promise<RawStatsFile> {
  return fetchRawStats(formatId, true);
}

export function mapBlockToEntry(name: string, block: RawUsageBlock): SmogonUsageEntry {
  const usage =
    block.usage?.weighted ?? block.usage?.real ?? block.usage?.raw ?? 0;
  const lead = block.lead?.weighted ?? block.lead?.real ?? block.lead?.raw ?? 0;
  const spreadRates = topRates(block.spreads, 1);
  const spreadKey = spreadRates[0]?.name ?? null;
  const { nature, spread } = parseSpread(spreadKey);
  const moveRates = topRates(block.moves, 4);
  const itemRates = topRates(block.items, 3);
  const abilityRates = topRates(block.abilities, 3);
  const teraRates = topRates(block.teraTypes, 3);

  return {
    name,
    slug: showdownNameToSlug(name),
    usage,
    lead,
    topItem: topKey(block.items),
    topAbility: topKey(block.abilities),
    topTera: topKey(block.teraTypes),
    topMoves: moveRates,
    topItems: itemRates,
    topAbilities: abilityRates,
    topTeras: teraRates,
    topSpreads: topRates(block.spreads, 3),
    topNature: nature,
    topSpread: spread,
  };
}

function findBlockForSlug(
  data: RawStatsFile,
  slug: string,
  roster: Set<string>,
): [string, RawUsageBlock] | null {
  for (const [name, block] of Object.entries(data.pokemon ?? {})) {
    if (!isChampionsSpecies(name, roster)) continue;
    if (showdownNameToSlug(name) === slug || name.toLowerCase() === slug) {
      return [name, block];
    }
  }
  return null;
}

/** Entrada meta de un Pokémon por slug (desde stats cacheados). */
export async function getMetaEntryForSlug(slug: string): Promise<SmogonUsageEntry | null> {
  const [data, roster] = await Promise.all([
    fetchRawStats(activeFormatId),
    getChampionsSlugSet(),
  ]);
  const found = findBlockForSlug(data, slug, roster);
  if (!found) return null;
  const entry = mapBlockToEntry(found[0], found[1]);
  return entry.usage > 0 ? entry : entry;
}

/** Ranking meta solo con especies del roster Pokémon Champions. */
export async function fetchChampionsMetaUsage(
  limit = 60,
  forceRefresh = false,
): Promise<{ entries: SmogonUsageEntry[]; battles: number; formatId: string }> {
  const formatId = activeFormatId;
  const [data, roster] = await Promise.all([
    fetchRawStats(formatId, forceRefresh),
    getChampionsSlugSet(),
  ]);

  const entries = Object.entries(data.pokemon ?? {})
    .filter(([name]) => isChampionsSpecies(name, roster))
    .map(([name, block]) => mapBlockToEntry(name, block))
    .filter((e) => e.usage > 0)
    .sort((a, b) => b.usage - a.usage)
    .slice(0, limit);

  return {
    entries,
    battles: data.battles ?? 0,
    formatId,
  };
}

function aggregateWeighted(
  data: RawStatsFile,
  roster: Set<string>,
  field: 'items' | 'abilities' | 'teraTypes',
): MetaCatalogEntry[] {
  const totals = new Map<string, number>();

  for (const [name, block] of Object.entries(data.pokemon ?? {})) {
    if (!isChampionsSpecies(name, roster)) continue;
    const weight = block.usage?.weighted ?? block.usage?.real ?? 0;
    const map =
      field === 'items'
        ? block.items
        : field === 'abilities'
          ? block.abilities
          : block.teraTypes;
    if (!map) continue;
    for (const [key, rate] of Object.entries(map)) {
      totals.set(key, (totals.get(key) ?? 0) + rate * weight);
    }
  }

  const max = Math.max(...totals.values(), 0.0001);
  return [...totals.entries()]
    .map(([name, score]) => ({ name, score: score / max }))
    .sort((a, b) => b.score - a.score);
}

export async function fetchChampionsMetaItems(limit = 80): Promise<MetaCatalogEntry[]> {
  const [data, roster] = await Promise.all([
    fetchRawStats(activeFormatId),
    getChampionsSlugSet(),
  ]);
  return aggregateWeighted(data, roster, 'items').slice(0, limit);
}

export async function fetchChampionsMetaAbilities(limit = 80): Promise<MetaCatalogEntry[]> {
  const [data, roster] = await Promise.all([
    fetchRawStats(activeFormatId),
    getChampionsSlugSet(),
  ]);
  return aggregateWeighted(data, roster, 'abilities').slice(0, limit);
}

export async function fetchChampionsMetaTeraTypes(limit = 80): Promise<MetaCatalogEntry[]> {
  const [data, roster] = await Promise.all([
    fetchRawStats(activeFormatId),
    getChampionsSlugSet(),
  ]);
  return aggregateWeighted(data, roster, 'teraTypes').slice(0, limit);
}

export async function fetchChampionsMetaMoveSlugs(): Promise<string[]> {
  const [data, roster] = await Promise.all([
    fetchRawStats(activeFormatId),
    getChampionsSlugSet(),
  ]);

  const totals = new Map<string, number>();

  for (const [name, block] of Object.entries(data.pokemon ?? {})) {
    if (!isChampionsSpecies(name, roster)) continue;
    const weight = block.usage?.weighted ?? 0;
    for (const [move, rate] of Object.entries(block.moves ?? {})) {
      totals.set(move, (totals.get(move) ?? 0) + rate * weight);
    }
  }

  return [...totals.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([move]) => showdownNameToSlug(move));
}

export interface MetaPokemonRef {
  name: string;
  slug: string;
  rate: number;
}

/** Pokémon del roster que usan un movimiento en el meta. */
export async function getPokemonUsingMove(moveName: string, limit = 15): Promise<MetaPokemonRef[]> {
  const [data, roster] = await Promise.all([
    fetchRawStats(activeFormatId),
    getChampionsSlugSet(),
  ]);
  const key = moveName.trim();
  const out: MetaPokemonRef[] = [];

  for (const [name, block] of Object.entries(data.pokemon ?? {})) {
    if (!isChampionsSpecies(name, roster)) continue;
    const moves = block.moves ?? {};
    const rate = moves[key] ?? moves[Object.keys(moves).find((k) => showdownNameToSlug(k) === showdownNameToSlug(key)) ?? ''];
    if (!rate) continue;
    const total = Object.values(moves).reduce((a, b) => a + b, 0) || 1;
    out.push({
      name,
      slug: showdownNameToSlug(name),
      rate: rate / total,
    });
  }

  return out.sort((a, b) => b.rate - a.rate).slice(0, limit);
}

/** Pokémon del roster que equipan un objeto en el meta. */
export async function getPokemonUsingItem(itemName: string, limit = 15): Promise<MetaPokemonRef[]> {
  const [data, roster] = await Promise.all([
    fetchRawStats(activeFormatId),
    getChampionsSlugSet(),
  ]);
  const out: MetaPokemonRef[] = [];

  for (const [name, block] of Object.entries(data.pokemon ?? {})) {
    if (!isChampionsSpecies(name, roster)) continue;
    const items = block.items ?? {};
    const rate = items[itemName];
    if (!rate) continue;
    const total = Object.values(items).reduce((a, b) => a + b, 0) || 1;
    out.push({
      name,
      slug: showdownNameToSlug(name),
      rate: rate / total,
    });
  }

  return out.sort((a, b) => b.rate - a.rate).slice(0, limit);
}

export function preloadChampionsMeta(): void {
  void loadChampionsRoster();
  void fetchRawStats(activeFormatId);
  void import('./gameData').then((m) => m.preloadGameDataIndexes());
}

/** Traduce habilidad/objeto top de una fila meta (lazy). */
export async function enrichMetaRowLabels(
  entry: SmogonUsageEntry,
): Promise<{ topAbilityEs?: string; topItemEs?: string }> {
  const { fetchAbility } = await import('./pokeapi');
  const { fetchItemDetail } = await import('./gameData');
  const { abilityNameEs } = await import('../utils/i18n');

  let topAbilityEs: string | undefined;
  let topItemEs: string | undefined;
  if (entry.topAbility) {
    try {
      const ab = await fetchAbility(entry.topAbility);
      topAbilityEs = abilityNameEs(ab);
    } catch {
      topAbilityEs = entry.topAbility;
    }
  }
  if (entry.topItem) {
    try {
      const it = await fetchItemDetail(entry.topItem);
      topItemEs = it.nameEs;
    } catch {
      topItemEs = entry.topItem;
    }
  }
  return { topAbilityEs, topItemEs };
}

export { loadChampionsRoster };

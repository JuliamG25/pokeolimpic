/**
 * Objetos desde PokeAPI. Las habilidades usan pokeapi.ts + utils/i18n.
 */

import {
  fetchAbility,
  normalizePokeApiKey,
  preloadAbilityIndex,
  showdownLabelToSlug,
} from './pokeapi';
import { abilityEffectShort, abilityNameEs } from '../utils/i18n';
import {
  CACHE_KEYS,
  DEFAULT_CACHE_TTL_MS,
  getCachedJson,
  getCachedJsonStale,
  setCachedJson,
} from './cache';

const BASE = 'https://pokeapi.co/api/v2';
const CACHE_VERSION = 'v3';

export interface GameEntityDetail {
  slug: string;
  nameEs: string;
  nameEn: string;
  description: string;
  spriteUrl: string | null;
}

const itemCache = new Map<string, GameEntityDetail>();
const abilitySummaryCache = new Map<string, GameEntityDetail>();

let itemSlugIndex: Map<string, string> | null = null;

export { showdownLabelToSlug, normalizePokeApiKey };

async function loadItemSlugIndex(): Promise<Map<string, string>> {
  const index = new Map<string, string>();
  let url: string | null = `${BASE}/item?limit=100`;

  while (url) {
    const res = await fetch(url);
    if (!res.ok) break;
    const page = (await res.json()) as {
      results: { name: string }[];
      next: string | null;
    };
    for (const { name } of page.results) {
      index.set(normalizePokeApiKey(name), name);
      index.set(normalizePokeApiKey(name.replace(/-/g, ' ')), name);
    }
    url = page.next;
  }
  return index;
}

async function ensureItemIndex(): Promise<Map<string, string>> {
  if (itemSlugIndex) return itemSlugIndex;

  const disk = await getCachedJson<[string, string][]>(
    CACHE_KEYS.pokeapiItemIndex,
    DEFAULT_CACHE_TTL_MS,
  );
  if (disk) {
    itemSlugIndex = new Map(disk.data);
    return itemSlugIndex;
  }

  try {
    itemSlugIndex = await loadItemSlugIndex();
    await setCachedJson(CACHE_KEYS.pokeapiItemIndex, [...itemSlugIndex.entries()]);
  } catch {
    const stale = await getCachedJsonStale<[string, string][]>(
      CACHE_KEYS.pokeapiItemIndex,
    );
    itemSlugIndex = stale ? new Map(stale.data) : new Map();
  }
  return itemSlugIndex;
}

async function resolveItemSlug(englishName: string): Promise<string> {
  const index = await ensureItemIndex();
  const fromIndex = index.get(normalizePokeApiKey(englishName));
  if (fromIndex) return fromIndex;

  const direct = showdownLabelToSlug(englishName);
  if (index.has(normalizePokeApiKey(direct))) {
    return index.get(normalizePokeApiKey(direct))!;
  }

  const res = await fetch(`${BASE}/item/${encodeURIComponent(direct)}`);
  if (res.ok) return direct;

  return direct;
}

function pickSpanishName(
  names: Array<{ name: string; language: { name: string } }>,
  fallback: string,
): string {
  const es = names.find((n) => n.language.name === 'es');
  if (es?.name) return es.name;
  const en = names.find((n) => n.language.name === 'en');
  if (en?.name) return en.name;
  return fallback.replace(/-/g, ' ');
}

function cleanText(text: string): string {
  return text.replace(/\n/g, ' ').replace(/\f/g, ' ').trim();
}

function pickFlavorText(
  entries: Array<{ text: string; language: { name: string } }> | undefined,
  preferLang: 'es' | 'en',
): string | null {
  if (!entries?.length) return null;
  const langEntries = entries.filter((f) => f.language.name === preferLang);
  if (!langEntries.length) return null;
  return cleanText(langEntries[langEntries.length - 1].text);
}

function pickEffectText(
  entries: Array<{ short_effect?: string; effect?: string; language: { name: string } }>,
  preferLang: 'es' | 'en',
): string | null {
  const entry = entries.find((e) => e.language.name === preferLang);
  if (entry?.short_effect) return cleanText(entry.short_effect);
  if (entry?.effect) return cleanText(entry.effect).slice(0, 420);
  return null;
}

function buildItemDescription(
  flavorEntries: Array<{ text: string; language: { name: string } }> | undefined,
  effectEntries: Array<{
    short_effect?: string;
    effect?: string;
    language: { name: string };
  }>,
): string {
  const fromFlavorEs = pickFlavorText(flavorEntries, 'es');
  if (fromFlavorEs) return fromFlavorEs;
  const fromEffectEs = pickEffectText(effectEntries, 'es');
  if (fromEffectEs) return fromEffectEs;
  const fromFlavorEn = pickFlavorText(flavorEntries, 'en');
  if (fromFlavorEn) return fromFlavorEn;
  const fromEffectEn = pickEffectText(effectEntries, 'en');
  if (fromEffectEn) return fromEffectEn;
  return 'Descripción no disponible en PokeAPI.';
}

interface RawItem {
  name: string;
  names: Array<{ name: string; language: { name: string } }>;
  effect_entries: Array<{ effect?: string; short_effect?: string; language: { name: string } }>;
  flavor_text_entries?: Array<{ text: string; language: { name: string } }>;
  sprites?: { default: string | null };
}

function itemCacheKey(englishName: string): string {
  return `${CACHE_VERSION}:item:${normalizePokeApiKey(englishName)}`;
}

function abilityCacheKey(englishName: string): string {
  return `${CACHE_VERSION}:ability:${normalizePokeApiKey(englishName)}`;
}

/** Habilidad desde PokeAPI (nombre y efecto en español si existe). */
export async function fetchAbilityDetail(englishName: string): Promise<GameEntityDetail> {
  const key = abilityCacheKey(englishName);
  const hit = abilitySummaryCache.get(key);
  if (hit) return hit;

  try {
    const raw = await fetchAbility(englishName);
    const detail: GameEntityDetail = {
      slug: raw.name,
      nameEn: englishName,
      nameEs: abilityNameEs(raw),
      description: abilityEffectShort(raw),
      spriteUrl: null,
    };
    abilitySummaryCache.set(key, detail);
    return detail;
  } catch {
    const fallback: GameEntityDetail = {
      slug: showdownLabelToSlug(englishName),
      nameEn: englishName,
      nameEs: englishName,
      description: 'No se encontró esta habilidad en PokeAPI.',
      spriteUrl: null,
    };
    abilitySummaryCache.set(key, fallback);
    return fallback;
  }
}

export async function fetchItemDetail(englishName: string): Promise<GameEntityDetail> {
  const key = itemCacheKey(englishName);
  const hit = itemCache.get(key);
  if (hit) return hit;

  const slug = await resolveItemSlug(englishName);
  const res = await fetch(`${BASE}/item/${encodeURIComponent(slug)}`);

  if (!res.ok) {
    const fallback: GameEntityDetail = {
      slug,
      nameEn: englishName,
      nameEs: englishName,
      description: 'No se encontró información de este objeto en PokeAPI.',
      spriteUrl: null,
    };
    itemCache.set(key, fallback);
    return fallback;
  }

  const raw = (await res.json()) as RawItem;
  const detail: GameEntityDetail = {
    slug: raw.name,
    nameEn: englishName,
    nameEs: pickSpanishName(raw.names, englishName),
    description: buildItemDescription(raw.flavor_text_entries, raw.effect_entries),
    spriteUrl: raw.sprites?.default ?? null,
  };
  itemCache.set(key, detail);
  return detail;
}

/** Precarga índice de habilidades y objetos en PokeAPI. */
export async function preloadGameDataIndexes(): Promise<void> {
  await Promise.all([preloadAbilityIndex(), ensureItemIndex()]);
}

export async function mapPool<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;

  async function worker(): Promise<void> {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i]);
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, items.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

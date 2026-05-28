/**
 * Roster oficial de Pokémon Champions (Pokédex #36 en PokeAPI, v1.0.2).
 * @see https://pokeapi.co/api/v2/pokedex/36/
 */

import {
  CACHE_KEYS,
  DEFAULT_CACHE_TTL_MS,
  getCachedJson,
  setCachedJson,
} from '../api/cache';

export interface ChampionsRosterEntry {
  speciesSlug: string;
  nationalDex: number;
}

const POKEAPI_CHAMPIONS_DEX = 'https://pokeapi.co/api/v2/pokedex/36/';

let cachedRoster: ChampionsRosterEntry[] | null = null;
let cachedSlugSet: Set<string> | null = null;
let cachedDexBySlug: Map<string, number> | null = null;

export function getChampionsDexBySlug(): Map<string, number> {
  return cachedDexBySlug ?? new Map();
}

/** ID de sprite (dex Champions) sin llamar a PokeAPI. Resuelve formas (ej. indeedee-f → indeedee). */
export function resolveChampionsSpriteId(
  slug: string,
  dexBySlug: Map<string, number> = getChampionsDexBySlug(),
): number {
  const normalized = slug.trim().toLowerCase().replace(/\s+/g, '-');
  const direct = dexBySlug.get(normalized);
  if (direct !== undefined) return direct;

  const parts = normalized.split('-');
  while (parts.length > 1) {
    parts.pop();
    const base = parts.join('-');
    const id = dexBySlug.get(base);
    if (id !== undefined) return id;
  }
  return 0;
}

export async function loadChampionsRoster(forceRefresh = false): Promise<ChampionsRosterEntry[]> {
  if (!forceRefresh && cachedRoster) return cachedRoster;

  if (!forceRefresh) {
    const disk = await getCachedJson<ChampionsRosterEntry[]>(
      CACHE_KEYS.rosterChampions,
      DEFAULT_CACHE_TTL_MS,
    );
    if (disk) {
      cachedRoster = disk.data;
      cachedSlugSet = new Set(cachedRoster.map((e) => e.speciesSlug));
      cachedDexBySlug = new Map(cachedRoster.map((e) => [e.speciesSlug, e.nationalDex]));
      return cachedRoster;
    }
  }

  const res = await fetch(POKEAPI_CHAMPIONS_DEX);
  if (!res.ok) throw new Error('No se pudo cargar el roster de Pokémon Champions');

  const data = (await res.json()) as {
    pokemon_entries: Array<{
      entry_number: number;
      pokemon_species: { name: string };
    }>;
  };

  cachedRoster = data.pokemon_entries
    .map((e) => ({
      speciesSlug: e.pokemon_species.name,
      nationalDex: e.entry_number,
    }))
    .sort((a, b) => a.nationalDex - b.nationalDex);

  cachedSlugSet = new Set(cachedRoster.map((e) => e.speciesSlug));
  cachedDexBySlug = new Map(cachedRoster.map((e) => [e.speciesSlug, e.nationalDex]));
  await setCachedJson(CACHE_KEYS.rosterChampions, cachedRoster);
  return cachedRoster;
}

export async function getChampionsSlugSet(): Promise<Set<string>> {
  if (cachedSlugSet) return cachedSlugSet;
  await loadChampionsRoster();
  return cachedSlugSet ?? new Set();
}

/** Comprueba si un slug PokeAPI o nombre Showdown pertenece al roster. */
export function isChampionsSpecies(speciesOrSlug: string, roster: Set<string>): boolean {
  const slug = speciesOrSlug.trim().toLowerCase().replace(/\s+/g, '-');
  if (roster.has(slug)) return true;

  // Formas (ej. indeedee-f → indeedee) si la base está en Champions.
  const parts = slug.split('-');
  while (parts.length > 1) {
    parts.pop();
    const base = parts.join('-');
    if (roster.has(base)) return true;
  }

  return false;
}

let cachedDisplayNames: Map<string, string> | null = null;

/** Nombres ES para búsqueda en Pokédex (slug → nombre mostrado). */
export async function loadRosterDisplayNames(
  roster: ChampionsRosterEntry[],
): Promise<Map<string, string>> {
  if (cachedDisplayNames) return cachedDisplayNames;

  const disk = await getCachedJson<Record<string, string>>(
    CACHE_KEYS.rosterDisplayNames,
    DEFAULT_CACHE_TTL_MS,
  );
  if (disk) {
    cachedDisplayNames = new Map(Object.entries(disk.data));
    return cachedDisplayNames;
  }

  const map = new Map<string, string>();
  const chunk = 12;
  for (let i = 0; i < roster.length; i += chunk) {
    const slice = roster.slice(i, i + chunk);
    const results = await Promise.all(
      slice.map(async (entry) => {
        try {
          const res = await fetch(
            `https://pokeapi.co/api/v2/pokemon-species/${encodeURIComponent(entry.speciesSlug)}`,
          );
          if (!res.ok) return [entry.speciesSlug, entry.speciesSlug] as const;
          const sp = (await res.json()) as {
            names?: Array<{ name: string; language: { name: string } }>;
          };
          const es = sp.names?.find((n) => n.language.name === 'es')?.name;
          const en = sp.names?.find((n) => n.language.name === 'en')?.name;
          const label = es ?? en ?? entry.speciesSlug.replace(/-/g, ' ');
          return [entry.speciesSlug, label] as const;
        } catch {
          return [entry.speciesSlug, entry.speciesSlug] as const;
        }
      }),
    );
    for (const [slug, label] of results) map.set(slug, label);
  }

  cachedDisplayNames = map;
  await setCachedJson(CACHE_KEYS.rosterDisplayNames, Object.fromEntries(map));
  return map;
}

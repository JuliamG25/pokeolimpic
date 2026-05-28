import type {
  Pokemon,
  PokemonListResponse,
  PokemonSpecies,
  TypeDetail,
  GenerationResponse,
  HabitatOrColorResponse,
  NamedListResponse,
  MoveDetail,
  AbilityDetail,
} from '../types/pokeapi';
import type { ChampionsRosterEntry } from '../constants/championsRoster';
import {
  CACHE_KEYS,
  DEFAULT_CACHE_TTL_MS,
  getCachedJson,
  getCachedJsonStale,
  setCachedJson,
} from './cache';
import { resolvePokeApiSlug } from '../utils/pokeapiSlug';

const BASE = 'https://pokeapi.co/api/v2';

const typeCache = new Map<string, TypeDetail & { pokemon?: { pokemon: { name: string }; slot: number }[] }>();
const moveCache = new Map<string, MoveDetail>();
const abilityCache = new Map<string, AbilityDetail>();
const pokemonCache = new Map<string, Pokemon>();
const speciesCache = new Map<string, PokemonSpecies>();
let abilitySlugIndex: Map<string, string> | null = null;

export function normalizePokeApiKey(label: string): string {
  return label
    .toLowerCase()
    .replace(/[''.]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

/** Nombre Showdown/Smogon → slug PokeAPI */
export function showdownLabelToSlug(label: string): string {
  return label
    .trim()
    .toLowerCase()
    .replace(/\./g, '')
    .replace(/['']/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

async function loadAbilitySlugIndex(): Promise<Map<string, string>> {
  const index = new Map<string, string>();
  let url: string | null = `${BASE}/ability?limit=100`;

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

async function ensureAbilitySlugIndex(): Promise<Map<string, string>> {
  if (abilitySlugIndex) return abilitySlugIndex;

  const disk = await getCachedJson<[string, string][]>(
    CACHE_KEYS.pokeapiAbilityIndex,
    DEFAULT_CACHE_TTL_MS,
  );
  if (disk) {
    abilitySlugIndex = new Map(disk.data);
    return abilitySlugIndex;
  }

  try {
    abilitySlugIndex = await loadAbilitySlugIndex();
    await setCachedJson(CACHE_KEYS.pokeapiAbilityIndex, [...abilitySlugIndex.entries()]);
  } catch {
    const stale = await getCachedJsonStale<[string, string][]>(
      CACHE_KEYS.pokeapiAbilityIndex,
    );
    abilitySlugIndex = stale ? new Map(stale.data) : new Map();
  }
  return abilitySlugIndex;
}

/** Resuelve nombre de Smogon al slug de habilidad en PokeAPI. */
export async function resolveAbilitySlug(showdownName: string): Promise<string> {
  const index = await ensureAbilitySlugIndex();
  const fromIndex = index.get(normalizePokeApiKey(showdownName));
  if (fromIndex) return fromIndex;

  const direct = showdownLabelToSlug(showdownName);
  if (index.has(normalizePokeApiKey(direct))) {
    return index.get(normalizePokeApiKey(direct))!;
  }

  const res = await fetch(`${BASE}/ability/${encodeURIComponent(direct)}`);
  if (res.ok) return direct;

  return direct;
}

export async function preloadAbilityIndex(): Promise<void> {
  await ensureAbilitySlugIndex();
}

/** Habilidad completa desde PokeAPI (acepta nombre Showdown o slug). */
export async function fetchAbility(showdownOrSlug: string): Promise<AbilityDetail> {
  const slug = await resolveAbilitySlug(showdownOrSlug);
  const hit = abilityCache.get(slug);
  if (hit) return hit;

  const res = await fetch(`${BASE}/ability/${encodeURIComponent(slug)}`);
  if (!res.ok) {
    throw new Error(`Habilidad no encontrada en PokeAPI (${res.status}): ${showdownOrSlug}`);
  }
  const data = (await res.json()) as AbilityDetail;
  abilityCache.set(slug, data);
  abilityCache.set(data.name, data);
  return data;
}

export async function fetchMove(nameOrId: string | number): Promise<MoveDetail> {
  const key = String(nameOrId).trim().toLowerCase().replace(/\s+/g, '-');
  const hit = moveCache.get(key);
  if (hit) return hit;
  const res = await fetch(`${BASE}/move/${encodeURIComponent(key)}`);
  if (!res.ok) throw new Error(`Movimiento no encontrado (${res.status})`);
  const data = (await res.json()) as MoveDetail;
  moveCache.set(key, data);
  return data;
}

export async function fetchPokemon(nameOrId: string | number): Promise<Pokemon> {
  const q =
    typeof nameOrId === 'number'
      ? String(nameOrId)
      : resolvePokeApiSlug(String(nameOrId));
  const hit = pokemonCache.get(q);
  if (hit) return hit;
  const res = await fetch(`${BASE}/pokemon/${encodeURIComponent(q)}`);
  if (!res.ok) throw new Error(`Pokémon no encontrado (${res.status})`);
  const data = (await res.json()) as Pokemon;
  pokemonCache.set(q, data);
  pokemonCache.set(String(data.id), data);
  return data;
}

export async function fetchPokemonSpecies(idOrName: string | number): Promise<PokemonSpecies> {
  const q =
    typeof idOrName === 'number'
      ? String(idOrName)
      : resolvePokeApiSlug(String(idOrName));
  const hit = speciesCache.get(q);
  if (hit) return hit;
  const res = await fetch(`${BASE}/pokemon-species/${encodeURIComponent(q)}`);
  if (!res.ok) throw new Error(`Especies no encontrada (${res.status})`);
  const data = (await res.json()) as PokemonSpecies;
  speciesCache.set(q, data);
  speciesCache.set(String(data.id), data);
  return data;
}

export async function fetchType(name: string): Promise<TypeDetail> {
  const key = name.toLowerCase();
  const hit = typeCache.get(key);
  if (hit) return hit;
  const res = await fetch(`${BASE}/type/${encodeURIComponent(key)}`);
  if (!res.ok) throw new Error(`Tipo no encontrado (${res.status})`);
  const data = (await res.json()) as TypeDetail & {
    pokemon?: { pokemon: { name: string }; slot: number }[];
  };
  typeCache.set(key, data);
  return data;
}

/** Nombres de Pokémon que tienen ese tipo (incluye formas). */
export async function fetchPokemonNamesForType(typeSlug: string): Promise<string[]> {
  const t = (await fetchType(typeSlug)) as TypeDetail & {
    pokemon?: { pokemon: { name: string }; slot: number }[];
  };
  if (!t.pokemon?.length) return [];
  return t.pokemon.map((p) => p.pokemon.name);
}

export async function fetchGeneration(genId: number): Promise<GenerationResponse> {
  const res = await fetch(`${BASE}/generation/${genId}`);
  if (!res.ok) throw new Error(`Generación no encontrada (${res.status})`);
  return res.json() as Promise<GenerationResponse>;
}

export async function fetchHabitat(slug: string): Promise<HabitatOrColorResponse> {
  const res = await fetch(`${BASE}/habitat/${encodeURIComponent(slug)}`);
  if (!res.ok) throw new Error(`Hábitat no encontrado (${res.status})`);
  return res.json() as Promise<HabitatOrColorResponse>;
}

export async function fetchPokemonColor(slug: string): Promise<HabitatOrColorResponse> {
  const res = await fetch(`${BASE}/pokemon-color/${encodeURIComponent(slug)}`);
  if (!res.ok) throw new Error(`Color no encontrado (${res.status})`);
  return res.json() as Promise<HabitatOrColorResponse>;
}

export async function fetchHabitatList(): Promise<{ name: string; label: string }[]> {
  const res = await fetch(`${BASE}/habitat?limit=50`);
  if (!res.ok) return [];
  const data = (await res.json()) as NamedListResponse;
  return data.results.map((r) => ({
    name: r.name,
    label: r.name.replace(/-/g, ' '),
  }));
}

export async function fetchPokemonColorList(): Promise<{ name: string; label: string }[]> {
  const res = await fetch(`${BASE}/pokemon-color?limit=50`);
  if (!res.ok) return [];
  const data = (await res.json()) as NamedListResponse;
  return data.results.map((r) => ({
    name: r.name,
    label: r.name.replace(/-/g, ' '),
  }));
}

export async function fetchSpeciesCount(): Promise<number> {
  const res = await fetch(`${BASE}/pokemon-species?limit=0`);
  if (!res.ok) return 1025;
  const data = (await res.json()) as { count: number };
  return data.count;
}

/** Mapa evolutivo solo para el roster Champions (~184 especies). */
export async function buildChampionsEvolutionMap(
  roster: ChampionsRosterEntry[],
  onProgress?: (ratio: number) => void,
): Promise<Map<string, boolean>> {
  const disk = await getCachedJson<Record<string, boolean>>(
    CACHE_KEYS.evolutionMap,
    DEFAULT_CACHE_TTL_MS,
  );
  if (disk) return new Map(Object.entries(disk.data));

  const map = new Map<string, boolean>();
  const chunk = 12;
  let done = 0;
  for (let i = 0; i < roster.length; i += chunk) {
    const slice = roster.slice(i, i + chunk);
    const results = await Promise.all(
      slice.map((entry) =>
        fetch(`${BASE}/pokemon-species/${encodeURIComponent(entry.speciesSlug)}`)
          .then((r) => (r.ok ? r.json() : null))
          .catch(() => null),
      ),
    );
    for (const raw of results) {
      if (!raw || typeof raw !== 'object') continue;
      const sp = raw as PokemonSpecies;
      if (sp.name) {
        map.set(sp.name, sp.evolves_from_species !== null);
      }
    }
    done += slice.length;
    onProgress?.(Math.min(1, done / roster.length));
  }
  const obj = Object.fromEntries(map);
  await setCachedJson(CACHE_KEYS.evolutionMap, obj);
  return map;
}

/**
 * Mapa: nombre de especie → true si evoluciona de otra (tiene evolves_from).
 * Sirve para filtrar “sin evolución previa” vs “con evolución previa”.
 */
export async function buildSpeciesEvolutionMap(
  onProgress?: (ratio: number) => void
): Promise<Map<string, boolean>> {
  const map = new Map<string, boolean>();
  const count = await fetchSpeciesCount();
  const chunk = 36;
  let done = 0;
  for (let start = 1; start <= count; start += chunk) {
    const ids: number[] = [];
    for (let i = 0; i < chunk && start + i <= count; i++) ids.push(start + i);
    const results = await Promise.all(
      ids.map((id) =>
        fetch(`${BASE}/pokemon-species/${id}`)
          .then((r) => (r.ok ? r.json() : null))
          .catch(() => null)
      )
    );
    for (const raw of results) {
      if (!raw || typeof raw !== 'object') continue;
      const sp = raw as PokemonSpecies;
      if (sp.name) {
        map.set(sp.name, sp.evolves_from_species !== null);
      }
    }
    done += ids.length;
    onProgress?.(Math.min(1, done / count));
  }
  return map;
}

/** ID de Pokédex (entrada en la API) por nombre de Pokémon — todas las páginas de la API. */
export async function fetchPokemonListWithDex(maxEntries = 0): Promise<{
  names: string[];
  dexByName: Map<string, number>;
}> {
  const dexByName = new Map<string, number>();
  const names: string[] = [];
  let nextUrl: string | null = `${BASE}/pokemon?limit=200`;

  while (nextUrl !== null) {
    const res = await fetch(nextUrl);
    if (!res.ok) throw new Error('No se pudo cargar la lista');
    const data = (await res.json()) as PokemonListResponse;
    for (const r of data.results) {
      if (maxEntries > 0 && names.length >= maxEntries) break;
      names.push(r.name);
      const m = /\/(\d+)\/?$/.exec(r.url);
      dexByName.set(r.name, m ? Number(m[1]) : 0);
    }
    if (maxEntries > 0 && names.length >= maxEntries) break;
    nextUrl = data.next;
  }

  return { names, dexByName };
}

export async function fetchPokemonNamesPage(limit = 1025): Promise<string[]> {
  const { names } = await fetchPokemonListWithDex(limit);
  return names;
}

/** Lista de movimientos (slug) e ID de movimiento en la API */
export async function fetchMoveListWithDex(limit = 1000): Promise<{
  names: string[];
  dexByName: Map<string, number>;
}> {
  const res = await fetch(`${BASE}/move?limit=${limit}`);
  if (!res.ok) throw new Error('No se pudo cargar la lista de movimientos');
  const data = (await res.json()) as PokemonListResponse;
  const dexByName = new Map<string, number>();
  const names: string[] = [];
  for (const r of data.results) {
    names.push(r.name);
    const m = /\/(\d+)\/?$/.exec(r.url);
    dexByName.set(r.name, m ? Number(m[1]) : 0);
  }
  return { names, dexByName };
}

export function getStat(stats: Pokemon['stats'], key: string): number {
  const s = stats.find((x) => x.stat.name === key);
  return s?.base_stat ?? 0;
}

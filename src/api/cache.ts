import AsyncStorage from '@react-native-async-storage/async-storage';

const PREFIX = 'pokemeta:';

export const CACHE_KEYS = {
  smogonStats: (formatId: string) => `smogon:${formatId}`,
  rosterChampions: 'roster:champions',
  rosterDisplayNames: 'roster:display-names',
  evolutionMap: 'roster:evolution-map',
  metaUpdatedAt: (formatId: string) => `meta:updated:${formatId}`,
  savedTeam: 'team:saved',
  pokeapiAbilityIndex: 'pokeapi:ability-index',
  pokeapiItemIndex: 'pokeapi:item-index',
} as const;

interface CachedEnvelope<T> {
  savedAt: number;
  data: T;
}

export async function getCachedJson<T>(
  key: string,
  maxAgeMs: number,
): Promise<{ data: T; savedAt: number; stale: boolean } | null> {
  const hit = await readEnvelope<T>(key);
  if (!hit) return null;
  const stale = Date.now() - hit.savedAt > maxAgeMs;
  if (stale) return null;
  return { ...hit, stale: false };
}

/** Lee caché aunque haya expirado (stale-while-revalidate). */
export async function getCachedJsonStale<T>(
  key: string,
): Promise<{ data: T; savedAt: number; stale: boolean } | null> {
  const hit = await readEnvelope<T>(key);
  if (!hit) return null;
  return hit;
}

async function readEnvelope<T>(
  key: string,
): Promise<{ data: T; savedAt: number; stale: boolean } | null> {
  try {
    const raw = await AsyncStorage.getItem(PREFIX + key);
    if (!raw) return null;
    const envelope = JSON.parse(raw) as CachedEnvelope<T>;
    return { data: envelope.data, savedAt: envelope.savedAt, stale: true };
  } catch {
    return null;
  }
}

export async function setCachedJson<T>(key: string, data: T): Promise<void> {
  const envelope: CachedEnvelope<T> = { savedAt: Date.now(), data };
  await AsyncStorage.setItem(PREFIX + key, JSON.stringify(envelope));
}

export async function removeCached(key: string): Promise<void> {
  await AsyncStorage.removeItem(PREFIX + key);
}

export function formatCacheAge(savedAt: number): string {
  const mins = Math.floor((Date.now() - savedAt) / 60_000);
  if (mins < 1) return 'hace un momento';
  if (mins < 60) return `hace ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `hace ${hours} h`;
  return `hace ${Math.floor(hours / 24)} d`;
}

/** TTL por defecto: 24 h */
export const DEFAULT_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

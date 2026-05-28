import AsyncStorage from '@react-native-async-storage/async-storage';
import { CACHE_KEYS } from './cache';
import type { SmogonUsageEntry } from './smogon';
import { resolvePokeApiSlug } from '../utils/pokeapiSlug';

const TEAM_SIZE = 6;
const PREFIX = 'pokemeta:';
const COLLECTIONS_KEY = 'team:collections';

export interface SavedTeamSlot {
  slug: string;
  name: string;
  entry?: SmogonUsageEntry;
}

export interface SavedTeam {
  id: string;
  name: string;
  slots: SavedTeamSlot[];
}

interface TeamStorage {
  activeTeamId: string;
  teams: SavedTeam[];
}

function newTeamId(): string {
  return `team-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function emptyTeam(name: string): SavedTeam {
  return { id: newTeamId(), name, slots: [] };
}

async function readLegacyTeam(): Promise<SavedTeamSlot[]> {
  try {
    const raw = await AsyncStorage.getItem(PREFIX + CACHE_KEYS.savedTeam);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SavedTeamSlot[];
    return Array.isArray(parsed) ? parsed.slice(0, TEAM_SIZE) : [];
  } catch {
    return [];
  }
}

async function loadStorage(): Promise<TeamStorage> {
  try {
    const raw = await AsyncStorage.getItem(PREFIX + COLLECTIONS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as TeamStorage;
      if (parsed?.teams?.length && parsed.activeTeamId) {
        return {
          activeTeamId: parsed.activeTeamId,
          teams: parsed.teams.map((t) => ({
            ...t,
            slots: (t.slots ?? []).slice(0, TEAM_SIZE),
          })),
        };
      }
    }
  } catch {
    /* migrar */
  }

  const legacy = await readLegacyTeam();
  const first = { id: newTeamId(), name: 'Equipo 1', slots: legacy };
  const storage: TeamStorage = { activeTeamId: first.id, teams: [first] };
  await saveStorage(storage);
  return storage;
}

async function saveStorage(storage: TeamStorage): Promise<void> {
  await AsyncStorage.setItem(PREFIX + COLLECTIONS_KEY, JSON.stringify(storage));
}

function getActiveTeam(storage: TeamStorage): SavedTeam {
  const found = storage.teams.find((t) => t.id === storage.activeTeamId);
  if (found) return found;
  return storage.teams[0] ?? emptyTeam('Equipo 1');
}

function normalizeSlot(slug: string, name: string, entry?: SmogonUsageEntry): SavedTeamSlot {
  const apiSlug = resolvePokeApiSlug(slug);
  return { slug: apiSlug, name, entry };
}

export async function listSavedTeams(): Promise<{ activeTeamId: string; teams: SavedTeam[] }> {
  const storage = await loadStorage();
  return { activeTeamId: storage.activeTeamId, teams: storage.teams };
}

export async function getActiveTeamId(): Promise<string> {
  const storage = await loadStorage();
  return getActiveTeam(storage).id;
}

export async function setActiveTeamId(teamId: string): Promise<void> {
  const storage = await loadStorage();
  if (!storage.teams.some((t) => t.id === teamId)) return;
  storage.activeTeamId = teamId;
  await saveStorage(storage);
}

export async function loadSavedTeam(): Promise<SavedTeamSlot[]> {
  const storage = await loadStorage();
  return getActiveTeam(storage).slots;
}

export async function saveSavedTeam(slots: SavedTeamSlot[]): Promise<void> {
  const storage = await loadStorage();
  const active = getActiveTeam(storage);
  active.slots = slots.slice(0, TEAM_SIZE);
  await saveStorage(storage);
}

export async function createSavedTeam(name?: string): Promise<SavedTeam> {
  const storage = await loadStorage();
  const n = storage.teams.length + 1;
  const team = emptyTeam(name?.trim() || `Equipo ${n}`);
  storage.teams.push(team);
  storage.activeTeamId = team.id;
  await saveStorage(storage);
  return team;
}

export async function renameSavedTeam(teamId: string, name: string): Promise<void> {
  const trimmed = name.trim();
  if (!trimmed) return;
  const storage = await loadStorage();
  const team = storage.teams.find((t) => t.id === teamId);
  if (!team) return;
  team.name = trimmed;
  await saveStorage(storage);
}

export async function deleteSavedTeam(teamId: string): Promise<'ok' | 'last'> {
  const storage = await loadStorage();
  if (storage.teams.length <= 1) return 'last';
  const idx = storage.teams.findIndex((t) => t.id === teamId);
  if (idx < 0) return 'ok';
  storage.teams.splice(idx, 1);
  if (storage.activeTeamId === teamId) {
    storage.activeTeamId = storage.teams[0].id;
  }
  await saveStorage(storage);
  return 'ok';
}

export async function addPokemonToTeamForTeam(
  teamId: string,
  slug: string,
  name: string,
  entry?: SmogonUsageEntry,
): Promise<'ok' | 'full' | 'duplicate' | 'notfound'> {
  const storage = await loadStorage();
  const team = storage.teams.find((t) => t.id === teamId);
  if (!team) return 'notfound';
  const slot = normalizeSlot(slug, name, entry);
  if (team.slots.some((s) => s.slug === slot.slug)) return 'duplicate';
  if (team.slots.length >= TEAM_SIZE) return 'full';
  team.slots.push(slot);
  await saveStorage(storage);
  return 'ok';
}

export async function addPokemonToTeam(
  slug: string,
  name: string,
  entry?: SmogonUsageEntry,
): Promise<'ok' | 'full' | 'duplicate'> {
  const storage = await loadStorage();
  const team = getActiveTeam(storage);
  const slot = normalizeSlot(slug, name, entry);
  if (team.slots.some((s) => s.slug === slot.slug)) return 'duplicate';
  if (team.slots.length >= TEAM_SIZE) return 'full';
  team.slots.push(slot);
  await saveStorage(storage);
  return 'ok';
}

export async function removeFromTeam(slug: string): Promise<void> {
  const apiSlug = resolvePokeApiSlug(slug);
  const storage = await loadStorage();
  const team = getActiveTeam(storage);
  team.slots = team.slots.filter((s) => s.slug !== apiSlug);
  await saveStorage(storage);
}

export async function moveTeamSlot(from: number, to: number): Promise<void> {
  const storage = await loadStorage();
  const team = getActiveTeam(storage);
  if (from < 0 || from >= team.slots.length || to < 0 || to >= team.slots.length) return;
  const [item] = team.slots.splice(from, 1);
  team.slots.splice(to, 0, item);
  await saveStorage(storage);
}

export async function swapTeamSlots(a: number, b: number): Promise<void> {
  const storage = await loadStorage();
  const team = getActiveTeam(storage);
  if (!team.slots[a] || !team.slots[b]) return;
  [team.slots[a], team.slots[b]] = [team.slots[b], team.slots[a]];
  await saveStorage(storage);
}

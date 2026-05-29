import { loadChampionsRoster, loadRosterDisplayNames } from '../constants/championsRoster';
import {
  fetchChampionsMetaAbilities,
  fetchChampionsMetaItems,
  fetchChampionsMetaMoveSlugs,
  fetchChampionsMetaUsage,
  type SmogonUsageEntry,
} from '../api/smogon';
import { fetchMove } from '../api/pokeapi';
import { fetchAbilityDetail, fetchItemDetail, mapPool, preloadGameDataIndexes } from '../api/gameData';
import { moveNameEs } from './i18n';
import { matchesSearch } from './search';

export type SearchHitKind = 'pokemon' | 'meta' | 'move' | 'item' | 'ability';

export interface SearchHit {
  kind: SearchHitKind;
  id: string;
  label: string;
  sub?: string;
  slug?: string;
  entry?: SmogonUsageEntry;
  /** Campos extra para búsqueda (EN, ES, slug, etc.) */
  aliases?: string[];
}

let cachedIndex: SearchHit[] | null = null;

export async function buildGlobalSearchIndex(force = false): Promise<SearchHit[]> {
  if (cachedIndex && !force) return cachedIndex;

  await preloadGameDataIndexes();

  const [rosterR, metaR, movesR, itemsR, abilitiesR] = await Promise.allSettled([
    loadChampionsRoster(),
    fetchChampionsMetaUsage(80),
    fetchChampionsMetaMoveSlugs(),
    fetchChampionsMetaItems(80),
    fetchChampionsMetaAbilities(80),
  ]);

  if (rosterR.status === 'rejected') {
    throw rosterR.reason instanceof Error
      ? rosterR.reason
      : new Error('No se pudo cargar el roster de Pokémon Champions');
  }

  const roster = rosterR.value;
  const entries = metaR.status === 'fulfilled' ? metaR.value.entries : [];
  const moveSlugs = movesR.status === 'fulfilled' ? movesR.value : [];
  const items = itemsR.status === 'fulfilled' ? itemsR.value : [];
  const abilities = abilitiesR.status === 'fulfilled' ? abilitiesR.value : [];

  const displayNames = await loadRosterDisplayNames(roster);
  const metaBySlug = new Map(entries.map((e) => [e.slug, e]));

  const hits: SearchHit[] = [];

  for (const r of roster) {
    const label = displayNames.get(r.speciesSlug) ?? r.speciesSlug.replace(/-/g, ' ');
    const english = r.speciesSlug.replace(/-/g, ' ');
    hits.push({
      kind: 'pokemon',
      id: `poke-${r.speciesSlug}`,
      label,
      sub: 'Pokédex Champions',
      slug: r.speciesSlug,
      aliases: [r.speciesSlug, english],
    });
    const meta = metaBySlug.get(r.speciesSlug);
    if (meta) {
      hits.push({
        kind: 'meta',
        id: `meta-${meta.slug}`,
        label: meta.name,
        sub: `Meta · ${(meta.usage * 100).toFixed(1)}% uso`,
        slug: meta.slug,
        entry: meta,
        aliases: [meta.slug, meta.name, label],
      });
    }
  }

  for (const e of entries) {
    if (!hits.some((h) => h.kind === 'meta' && h.slug === e.slug)) {
      hits.push({
        kind: 'meta',
        id: `meta-${e.slug}`,
        label: e.name,
        sub: `Meta · ${(e.usage * 100).toFixed(1)}% uso`,
        slug: e.slug,
        entry: e,
        aliases: [e.slug, e.name],
      });
    }
  }

  const moveRows = await mapPool(moveSlugs, 8, async (slug) => {
    try {
      const m = await fetchMove(slug);
      return {
        slug,
        label: moveNameEs(m),
        aliases: [slug, m.name, slug.replace(/-/g, ' ')],
      };
    } catch {
      const fallback = slug.replace(/-/g, ' ');
      return { slug, label: fallback, aliases: [slug, fallback] };
    }
  });

  for (const row of moveRows) {
    hits.push({
      kind: 'move',
      id: `move-${row.slug}`,
      label: row.label,
      sub: 'Movimiento meta',
      slug: row.slug,
      aliases: row.aliases,
    });
  }

  const itemRows = await mapPool(items, 8, async (it) => {
    try {
      const d = await fetchItemDetail(it.name);
      return {
        name: it.name,
        label: d.nameEs,
        aliases: [it.name, d.nameEs, d.nameEn, d.slug],
      };
    } catch {
      return {
        name: it.name,
        label: it.name,
        aliases: [it.name],
      };
    }
  });

  for (const row of itemRows) {
    hits.push({
      kind: 'item',
      id: `item-${row.name}`,
      label: row.label,
      sub: 'Objeto meta',
      slug: row.name,
      aliases: row.aliases,
    });
  }

  const abilityRows = await mapPool(abilities, 8, async (ab) => {
    try {
      const d = await fetchAbilityDetail(ab.name);
      return {
        name: ab.name,
        label: d.nameEs,
        aliases: [ab.name, d.nameEs, d.nameEn, d.slug],
      };
    } catch {
      return {
        name: ab.name,
        label: ab.name,
        aliases: [ab.name],
      };
    }
  });

  for (const row of abilityRows) {
    hits.push({
      kind: 'ability',
      id: `ab-${row.name}`,
      label: row.label,
      sub: 'Habilidad meta',
      slug: row.name,
      aliases: row.aliases,
    });
  }

  cachedIndex = hits;
  return hits;
}

export function filterSearchHits(hits: SearchHit[], query: string, limit = 40): SearchHit[] {
  if (!query.trim()) return hits.slice(0, limit);
  return hits
    .filter((h) => matchesSearch(query, h.label, h.sub, h.slug, ...(h.aliases ?? [])))
    .slice(0, limit);
}

export function searchKindLabel(kind: SearchHitKind): string {
  switch (kind) {
    case 'pokemon':
      return 'Pokédex';
    case 'meta':
      return 'Meta';
    case 'move':
      return 'Movimiento';
    case 'item':
      return 'Objeto';
    case 'ability':
      return 'Habilidad';
  }
}

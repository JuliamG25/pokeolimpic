import { loadChampionsRoster, loadRosterDisplayNames } from '../constants/championsRoster';
import {
  fetchChampionsMetaAbilities,
  fetchChampionsMetaItems,
  fetchChampionsMetaMoveSlugs,
  fetchChampionsMetaUsage,
  type SmogonUsageEntry,
} from '../api/smogon';
import { matchesSearch } from './search';

export type SearchHitKind = 'pokemon' | 'meta' | 'move' | 'item' | 'ability';

export interface SearchHit {
  kind: SearchHitKind;
  id: string;
  label: string;
  sub?: string;
  slug?: string;
  entry?: SmogonUsageEntry;
}

let cachedIndex: SearchHit[] | null = null;

export async function buildGlobalSearchIndex(force = false): Promise<SearchHit[]> {
  if (cachedIndex && !force) return cachedIndex;

  const [roster, { entries }, moveSlugs, items, abilities] = await Promise.all([
    loadChampionsRoster(),
    fetchChampionsMetaUsage(80),
    fetchChampionsMetaMoveSlugs(),
    fetchChampionsMetaItems(80),
    fetchChampionsMetaAbilities(80),
  ]);

  const displayNames = await loadRosterDisplayNames(roster);
  const metaBySlug = new Map(entries.map((e) => [e.slug, e]));

  const hits: SearchHit[] = [];

  for (const r of roster) {
    const label = displayNames.get(r.speciesSlug) ?? r.speciesSlug.replace(/-/g, ' ');
    hits.push({
      kind: 'pokemon',
      id: `poke-${r.speciesSlug}`,
      label,
      sub: 'Pokédex Champions',
      slug: r.speciesSlug,
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
      });
    }
  }

  for (const slug of moveSlugs) {
    hits.push({
      kind: 'move',
      id: `move-${slug}`,
      label: slug.replace(/-/g, ' '),
      sub: 'Movimiento meta',
      slug,
    });
  }

  for (const it of items) {
    hits.push({
      kind: 'item',
      id: `item-${it.name}`,
      label: it.name,
      sub: 'Objeto meta',
      slug: it.name,
    });
  }

  for (const ab of abilities) {
    hits.push({
      kind: 'ability',
      id: `ab-${ab.name}`,
      label: ab.name,
      sub: 'Habilidad meta',
      slug: ab.name,
    });
  }

  cachedIndex = hits;
  return hits;
}

export function filterSearchHits(hits: SearchHit[], query: string, limit = 40): SearchHit[] {
  if (!query.trim()) return hits.slice(0, limit);
  return hits
    .filter((h) => matchesSearch(h.label, query) || matchesSearch(h.sub ?? '', query))
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

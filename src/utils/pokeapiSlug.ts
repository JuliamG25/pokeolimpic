/** Slugs Showdown/Smogon → identificador PokeAPI (formas con -f / -m, etc.). */
const SHOWDOWN_ALIASES: Record<string, string> = {
  'indeedee-f': 'indeedee-female',
  'indeedee-m': 'indeedee-male',
  'oinkologne-f': 'oinkologne-female',
  'oinkologne-m': 'oinkologne-male',
  'basculegion-f': 'basculegion-female',
  'basculegion-m': 'basculegion-male',
  'urshifu-rs': 'urshifu-rapid-strike',
  'landorus-t': 'landorus-therian',
  'landorus-i': 'landorus-incarnate',
  'tornadus-t': 'tornadus-therian',
  'tornadus-i': 'tornadus-incarnate',
  'thundurus-t': 'thundurus-therian',
  'thundurus-i': 'thundurus-incarnate',
  'enamorus-t': 'enamorus-therian',
  'enamorus-i': 'enamorus-incarnate',
  'gastrodon-e': 'gastrodon-east',
  'gastrodon-w': 'gastrodon-west',
  'lycanroc-midnight': 'lycanroc-midnight',
  'lycanroc-dusk': 'lycanroc-dusk',
  'lycanroc-midday': 'lycanroc-midday',
};

export function normalizeSpeciesSlug(input: string): string {
  return input.trim().toLowerCase().replace(/\s+/g, '-');
}

/** Resuelve slug de meta/equipo al nombre que entiende PokeAPI. */
export function resolvePokeApiSlug(input: string): string {
  const slug = normalizeSpeciesSlug(input);
  if (SHOWDOWN_ALIASES[slug]) return SHOWDOWN_ALIASES[slug];
  if (slug.endsWith('-f')) return `${slug.slice(0, -2)}-female`;
  if (slug.endsWith('-m')) return `${slug.slice(0, -2)}-male`;
  return slug;
}

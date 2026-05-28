import type { AbilityDetail, MoveDetail, PokemonSpecies } from '../types/pokeapi';

const TYPE_ES: Record<string, string> = {
  normal: 'Normal',
  fighting: 'Lucha',
  flying: 'Volador',
  poison: 'Veneno',
  ground: 'Tierra',
  rock: 'Roca',
  bug: 'Bicho',
  ghost: 'Fantasma',
  steel: 'Acero',
  fire: 'Fuego',
  water: 'Agua',
  grass: 'Planta',
  electric: 'Eléctrico',
  psychic: 'Psíquico',
  ice: 'Hielo',
  dragon: 'Dragón',
  dark: 'Siniestro',
  fairy: 'Hada',
};

export function typeNameEs(en: string): string {
  return TYPE_ES[en.toLowerCase()] ?? en;
}

export function moveNameEs(move: MoveDetail): string {
  const es = move.names.find((n) => n.language.name === 'es');
  if (es?.name) return es.name;
  const en = move.names.find((n) => n.language.name === 'en');
  if (en?.name) return en.name;
  return move.name.replace(/-/g, ' ');
}

export function moveEffectShort(move: MoveDetail): string {
  const es = move.effect_entries.find((e) => e.language.name === 'es');
  if (es?.short_effect) return es.short_effect.replace(/\n/g, ' ').trim();
  const en = move.effect_entries.find((e) => e.language.name === 'en');
  if (en?.short_effect) return en.short_effect.replace(/\n/g, ' ').trim();
  const ftEs = move.flavor_text_entries.filter((f) => f.language.name === 'es');
  if (ftEs.length) {
    const t = ftEs[ftEs.length - 1].flavor_text;
    return t.replace(/\n/g, ' ').replace(/\f/g, ' ').trim();
  }
  const ftEn = move.flavor_text_entries.filter((f) => f.language.name === 'en');
  if (ftEn.length) {
    const t = ftEn[ftEn.length - 1].flavor_text;
    return t.replace(/\n/g, ' ').replace(/\f/g, ' ').trim();
  }
  return '—';
}

const DAMAGE_CLASS_ES: Record<string, string> = {
  physical: 'Físico',
  special: 'Especial',
  status: 'Estado',
};

export function damageClassEs(slug: string): string {
  return DAMAGE_CLASS_ES[slug] ?? slug;
}

export function abilityNameEs(ability: AbilityDetail): string {
  const es = ability.names.find((n) => n.language.name === 'es');
  if (es?.name) return es.name;
  const en = ability.names.find((n) => n.language.name === 'en');
  if (en?.name) return en.name;
  return ability.name.replace(/-/g, ' ');
}

/** Efecto de habilidad desde PokeAPI (ES → EN). */
export function abilityEffectShort(ability: AbilityDetail): string {
  const es = ability.effect_entries.find((e) => e.language.name === 'es');
  if (es?.short_effect) return es.short_effect.replace(/\n/g, ' ').trim();
  if (es?.effect) return es.effect.replace(/\n/g, ' ').trim().slice(0, 420);

  const ftEs = ability.flavor_text_entries.filter((f) => f.language.name === 'es');
  if (ftEs.length) {
    const t = ftEs[ftEs.length - 1].flavor_text;
    return t.replace(/\n/g, ' ').replace(/\f/g, ' ').trim();
  }

  const en = ability.effect_entries.find((e) => e.language.name === 'en');
  if (en?.short_effect) return en.short_effect.replace(/\n/g, ' ').trim();
  if (en?.effect) return en.effect.replace(/\n/g, ' ').trim().slice(0, 420);

  const ftEn = ability.flavor_text_entries.filter((f) => f.language.name === 'en');
  if (ftEn.length) {
    const t = ftEn[ftEn.length - 1].flavor_text;
    return t.replace(/\n/g, ' ').replace(/\f/g, ' ').trim();
  }

  return 'Sin descripción en PokeAPI para esta habilidad.';
}

export function speciesDisplayName(
  species: PokemonSpecies,
  fallbackSlug: string
): string {
  const es = species.names?.find((n) => n.language.name === 'es');
  if (es?.name) return es.name;
  const en = species.names?.find((n) => n.language.name === 'en');
  if (en?.name) return en.name;
  return fallbackSlug.replace(/-/g, ' ');
}

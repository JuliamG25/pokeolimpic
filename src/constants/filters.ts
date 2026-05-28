/** Slugs de tipo en PokeAPI (inglés) y etiquetas en español */

export const POKEMON_TYPES: { slug: string; label: string }[] = [
  { slug: 'normal', label: 'Normal' },
  { slug: 'fighting', label: 'Lucha' },
  { slug: 'flying', label: 'Volador' },
  { slug: 'poison', label: 'Veneno' },
  { slug: 'ground', label: 'Tierra' },
  { slug: 'rock', label: 'Roca' },
  { slug: 'bug', label: 'Bicho' },
  { slug: 'ghost', label: 'Fantasma' },
  { slug: 'steel', label: 'Acero' },
  { slug: 'fire', label: 'Fuego' },
  { slug: 'water', label: 'Agua' },
  { slug: 'grass', label: 'Planta' },
  { slug: 'electric', label: 'Eléctrico' },
  { slug: 'psychic', label: 'Psíquico' },
  { slug: 'ice', label: 'Hielo' },
  { slug: 'dragon', label: 'Dragón' },
  { slug: 'dark', label: 'Siniestro' },
  { slug: 'fairy', label: 'Hada' },
];

/** Generaciones 1–9 (PokeAPI usa id numérico) */
export const GENERATIONS: { id: number; label: string }[] = [
  { id: 1, label: 'Gen 1' },
  { id: 2, label: 'Gen 2' },
  { id: 3, label: 'Gen 3' },
  { id: 4, label: 'Gen 4' },
  { id: 5, label: 'Gen 5' },
  { id: 6, label: 'Gen 6' },
  { id: 7, label: 'Gen 7' },
  { id: 8, label: 'Gen 8' },
  { id: 9, label: 'Gen 9' },
];

export type EvolutionPhaseFilter = 'any' | 'base' | 'evolved';

export const EVOLUTION_PHASE_OPTIONS: {
  value: EvolutionPhaseFilter;
  label: string;
}[] = [
  { value: 'any', label: 'Cualquiera' },
  {
    value: 'base',
    label: 'Sin evolución previa',
  },
  {
    value: 'evolved',
    label: 'Con evolución previa',
  },
];

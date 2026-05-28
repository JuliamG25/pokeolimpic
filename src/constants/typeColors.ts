/** Colores de tipo (estilo juego / cartas); slug PokeAPI en minúsculas */

export const TYPE_COLORS: Record<string, string> = {
  normal: '#A8A878',
  fighting: '#C03028',
  flying: '#A890F0',
  poison: '#A040A0',
  ground: '#E0C068',
  rock: '#B8A038',
  bug: '#A8B820',
  ghost: '#705898',
  steel: '#B8B8D0',
  fire: '#F08030',
  water: '#6890F0',
  grass: '#78C850',
  electric: '#F8D030',
  psychic: '#F85888',
  ice: '#98D8D8',
  dragon: '#7038F8',
  dark: '#705848',
  fairy: '#EE99AC',
};

export function getTypeColor(slug: string): string {
  return TYPE_COLORS[slug.toLowerCase()] ?? '#64748b';
}

/** Texto oscuro en fondos muy claros (mejor contraste) */
const DARK_LABEL_TYPES = new Set(['electric', 'ice', 'normal', 'fairy']);

export function getTypeLabelColor(slug: string): string {
  return DARK_LABEL_TYPES.has(slug.toLowerCase()) ? '#1a1a1a' : '#ffffff';
}

/** Alias usado por TypePill y componentes legacy. */
export const typeColors = TYPE_COLORS;

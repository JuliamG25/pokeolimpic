import offensiveRelations from '../constants/offensiveRelations.json';

/** Orden visual de los 18 tipos (como en los juegos). */
export const STANDARD_TYPES = [
  'normal', 'fire', 'water', 'electric', 'grass', 'ice',
  'fighting', 'poison', 'ground', 'flying', 'psychic', 'bug',
  'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy',
] as const;

export type StandardTypeName = (typeof STANDARD_TYPES)[number];

/** Abreviaturas estilo carta / infografía. */
export const TYPE_ABBREVIATIONS: Record<string, string> = {
  normal: 'NORM',
  fire: 'FIRE',
  water: 'WATER',
  electric: 'ELECTR',
  grass: 'GRASS',
  ice: 'ICE',
  fighting: 'FIGHT',
  poison: 'POISON',
  ground: 'GROUND',
  flying: 'FLYING',
  psychic: 'PSYCH',
  bug: 'BUG',
  rock: 'ROCK',
  ghost: 'GHOST',
  dragon: 'DRAGON',
  dark: 'DARK',
  steel: 'STEEL',
  fairy: 'FAIRY',
};

export function formatTypeAbbr(typeName: string): string {
  const key = typeName.toLowerCase();
  return TYPE_ABBREVIATIONS[key] ?? key.slice(0, 6).toUpperCase();
}

type Relations = Record<string, Record<string, number>>;

const OFFENSIVE = offensiveRelations as Relations;

export function multiplierAgainst(
  defenderType: string,
  attackerTypeName: string,
): 0 | 0.5 | 1 | 2 {
  const attackerRelations = OFFENSIVE[attackerTypeName.toLowerCase()];
  if (!attackerRelations) return 1;
  const multiplier = attackerRelations[defenderType.toLowerCase()];
  if (multiplier === undefined) return 1;
  return multiplier as 0 | 0.5 | 1 | 2;
}

/** Tipos que hacen 2× de daño a `defenderType` (debilidades del defensor). */
export function getWeaknesses(defenderType: string, allTypes: string[]): string[] {
  return allTypes.filter((attacker) => multiplierAgainst(defenderType, attacker) === 2);
}

/** Tipos a los que `attackerType` hace 2× de daño (fortalezas ofensivas). */
export function getStrengths(attackerType: string, allTypes: string[]): string[] {
  return allTypes.filter((defender) => multiplierAgainst(defender, attackerType) === 2);
}

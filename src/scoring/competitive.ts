import type { Pokemon, TypeDetail } from '../types/pokeapi';
import { fetchType } from '../api/pokeapi';

const ALL_TYPE_NAMES = [
  'normal',
  'fighting',
  'flying',
  'poison',
  'ground',
  'rock',
  'bug',
  'ghost',
  'steel',
  'fire',
  'water',
  'grass',
  'electric',
  'psychic',
  'ice',
  'dragon',
  'dark',
  'fairy',
] as const;

function multiplierAgainst(
  defender: TypeDetail,
  attackerTypeName: string,
): number {
  const { damage_relations: d } = defender;
  const a = attackerTypeName.toLowerCase();
  if (d.no_damage_from.some((x) => x.name === a)) return 0;
  if (d.double_damage_from.some((x) => x.name === a)) return 2;
  if (d.half_damage_from.some((x) => x.name === a)) return 0.5;
  return 1;
}

/** Multiplicador efectivo de un movimiento de tipo `attacker` contra defensores `types` */
export function combinedDefenseMultiplier(
  defenderTypes: TypeDetail[],
  attackerTypeName: string,
): number {
  return defenderTypes.reduce(
    (acc, t) => acc * multiplierAgainst(t, attackerTypeName),
    1,
  );
}

export type TypeMatchupSummary = {
  avgDamageTakenMultiplier: number;
  worstMatchups: string[];
  bestResistances: string[];
};

/** Resumen defensivo por tipos (sin puntaje competitivo). */
export async function analyzeTypeMatchups(pokemon: Pokemon): Promise<TypeMatchupSummary> {
  const typeNames = [...new Set(pokemon.types.map((t) => t.type.name))];
  const defenderTypes = await Promise.all(typeNames.map((n) => fetchType(n)));

  const mults: number[] = [];
  const notes: { attacker: string; mult: number }[] = [];
  for (const att of ALL_TYPE_NAMES) {
    const m = combinedDefenseMultiplier(defenderTypes, att);
    mults.push(m);
    notes.push({ attacker: att, mult: m });
  }
  const avg = mults.reduce((a, b) => a + b, 0) / (mults.length || 1);

  const worst = notes
    .filter((x) => x.mult >= 2)
    .sort((a, b) => b.mult - a.mult)
    .slice(0, 6)
    .map((x) => `${x.attacker} (×${x.mult})`);

  const best = notes
    .filter((x) => x.mult < 1 && x.mult > 0)
    .sort((a, b) => a.mult - b.mult)
    .slice(0, 6)
    .map((x) => `${x.attacker} (×${x.mult})`);

  return {
    avgDamageTakenMultiplier: Math.round(avg * 1000) / 1000,
    worstMatchups: worst,
    bestResistances: best,
  };
}

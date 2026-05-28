import { fetchMove, fetchPokemon, fetchType } from '../api/pokeapi';
import { showdownNameToSlug, type SmogonUsageEntry } from '../api/smogon';
import { parseEvsSpread } from '../utils/spreadParse';
import { resolvePokeApiSlug } from '../utils/pokeapiSlug';
import { combinedDefenseMultiplier } from './competitive';
import {
  activeTypes,
  adjustTypeMultiplierForAbilities,
  applyAbilitiesToStats,
  applyHeldItemToStats,
  applyIntimidate,
  buildDescription,
  calcBattleStats,
  computeDamageRolls,
  koSummary,
  pokemonBasesFromApi,
  stabMultiplier,
} from './gen9DamageCore';

const VGC_LEVEL = 50;

export interface DamageCalcInput {
  attacker: SmogonUsageEntry;
  defender: SmogonUsageEntry;
  moveName: string;
  level?: number;
  useTera?: boolean;
}

export interface DamageCalcOutput {
  min: number;
  max: number;
  defenderHp: number;
  minPct: number;
  maxPct: number;
  description: string;
  koText: string;
  rolls: number[];
}

function normalizeTera(tera: string | null | undefined): string | null {
  if (!tera?.trim()) return null;
  const s = tera.trim().toLowerCase();
  return s.charAt(0).toUpperCase() + s.slice(1);
}

async function typeMultiplierAgainst(moveType: string, defenderTypes: string[]): Promise<number> {
  if (!defenderTypes.length) return 1;
  const types = await Promise.all(defenderTypes.map((t) => fetchType(t)));
  return combinedDefenseMultiplier(types, moveType.toLowerCase());
}

/** Calcula daño Gen 9 (nivel 50 VGC) con sets del meta + stats PokeAPI. */
export async function calculateMetaDamage(input: DamageCalcInput): Promise<DamageCalcOutput> {
  const level = input.level ?? VGC_LEVEL;
  const useTera = input.useTera !== false;

  const atkSlug = resolvePokeApiSlug(showdownNameToSlug(input.attacker.name));
  const defSlug = resolvePokeApiSlug(showdownNameToSlug(input.defender.name));
  const moveSlug = showdownNameToSlug(input.moveName);

  const [attackerMon, defenderMon, move] = await Promise.all([
    fetchPokemon(atkSlug),
    fetchPokemon(defSlug),
    fetchMove(moveSlug),
  ]);

  if (!move.power || move.power <= 0) {
    throw new Error('Este movimiento no tiene potencia de daño.');
  }

  const category = move.damage_class.name === 'special' ? 'special' : 'physical';
  if (move.damage_class.name === 'status') {
    throw new Error('Los movimientos de estado no infligen daño.');
  }

  const atkBases = pokemonBasesFromApi(attackerMon.stats);
  const defBases = pokemonBasesFromApi(defenderMon.stats);

  let atkStats = calcBattleStats(
    atkBases,
    parseEvsSpread(input.attacker.topSpread),
    input.attacker.topNature,
    level,
  );
  let defStats = calcBattleStats(
    defBases,
    parseEvsSpread(input.defender.topSpread),
    input.defender.topNature,
    level,
  );

  atkStats = applyAbilitiesToStats(atkStats, input.attacker.topAbility, 'attacker');
  defStats = applyAbilitiesToStats(defStats, input.defender.topAbility, 'defender');

  atkStats = applyHeldItemToStats(atkStats, input.attacker.topItem, 'attacker');
  defStats = applyHeldItemToStats(defStats, input.defender.topItem, 'defender');

  atkStats = applyIntimidate(atkStats, input.defender.topAbility, category);

  const atkOriginal = attackerMon.types.map((t) => t.type.name);
  const defOriginal = defenderMon.types.map((t) => t.type.name);

  const atkTera = normalizeTera(input.attacker.topTera);
  const defTera = normalizeTera(input.defender.topTera);

  const defTypes = activeTypes(defOriginal, defTera, useTera);
  let typeMult = await typeMultiplierAgainst(move.type.name, defTypes);
  typeMult = adjustTypeMultiplierForAbilities(typeMult, input.defender.topAbility);
  const stab = stabMultiplier(move.type.name, atkOriginal, atkTera, useTera);

  const rolls = computeDamageRolls({
    level,
    power: move.power,
    category,
    moveType: move.type.name,
    typeMultiplier: typeMult,
    stab,
    attackerStats: atkStats,
    defenderStats: defStats,
    attackerItem: input.attacker.topItem,
  });

  const min = Math.min(...rolls);
  const max = Math.max(...rolls);
  const defenderHp = defStats.hp;
  const minPct = defenderHp > 0 ? Math.round((min / defenderHp) * 1000) / 10 : 0;
  const maxPct = defenderHp > 0 ? Math.round((max / defenderHp) * 1000) / 10 : 0;

  return {
    min,
    max,
    defenderHp,
    minPct,
    maxPct,
    description: buildDescription({
      attacker: input.attacker.name,
      defender: input.defender.name,
      move: input.moveName.trim(),
      item: input.attacker.topItem,
      nature: input.attacker.topNature,
      spread: input.attacker.topSpread,
      tera: input.attacker.topTera,
      useTera,
      min,
      max,
      hp: defenderHp,
      typeMult,
      stab,
      ability: input.attacker.topAbility,
      defenderAbility: input.defender.topAbility,
    }),
    koText: koSummary(rolls, defenderHp),
    rolls,
  };
}

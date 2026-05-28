export type Stat = 'hp' | 'atk' | 'def' | 'spa' | 'spd' | 'spe';

export type EvSpread = Partial<Record<Stat, number>>;

export interface BattleStats {
  hp: number;
  atk: number;
  def: number;
  spa: number;
  spd: number;
  spe: number;
}

const NATURE_MOD: Record<string, { plus?: Stat; minus?: Stat }> = {
  Lonely: { plus: 'atk', minus: 'def' },
  Brave: { plus: 'atk', minus: 'spe' },
  Adamant: { plus: 'atk', minus: 'spa' },
  Naughty: { plus: 'atk', minus: 'spd' },
  Bold: { plus: 'def', minus: 'atk' },
  Relaxed: { plus: 'def', minus: 'spe' },
  Impish: { plus: 'def', minus: 'spa' },
  Lax: { plus: 'def', minus: 'spd' },
  Timid: { plus: 'spe', minus: 'atk' },
  Hasty: { plus: 'spe', minus: 'def' },
  Jolly: { plus: 'spe', minus: 'spa' },
  Naive: { plus: 'spe', minus: 'spd' },
  Modest: { plus: 'spa', minus: 'atk' },
  Mild: { plus: 'spa', minus: 'def' },
  Quiet: { plus: 'spa', minus: 'spe' },
  Rash: { plus: 'spa', minus: 'spd' },
  Calm: { plus: 'spd', minus: 'atk' },
  Gentle: { plus: 'spd', minus: 'def' },
  Sassy: { plus: 'spd', minus: 'spe' },
  Careful: { plus: 'spd', minus: 'spa' },
};

const ATTACK_ITEM: Record<string, Stat> = {
  'Choice Band': 'atk',
  'Choice Specs': 'spa',
};

const DEFENSE_ITEM: Record<string, Stat> = {
  'Assault Vest': 'spd',
};

const DEFENSE_MULT_ITEM: Record<string, Partial<Record<'def' | 'spd', number>>> = {
  Eviolite: { def: 1.5, spd: 1.5 },
};

const DAMAGE_ITEM_MULT: Record<string, number> = {
  'Life Orb': 1.3,
  'Expert Belt': 1.2,
};

function normAbility(name: string | null | undefined): string {
  return (name ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function natureMult(nature: string | null | undefined, stat: Stat): number {
  if (!nature) return 1;
  const mod = NATURE_MOD[nature];
  if (!mod) return 1;
  if (mod.plus === stat) return 1.1;
  if (mod.minus === stat) return 0.9;
  return 1;
}

function baseStatValue(base: number, ev: number, iv = 31): number {
  return 2 * base + iv + Math.floor(ev / 4);
}

/** Stats finales nivel 50 (VGC), IV 31 por defecto. */
export function calcBattleStats(
  bases: BattleStats,
  evs: EvSpread,
  nature: string | null | undefined,
  level = 50,
  iv = 31,
): BattleStats {
  const calc = (stat: Stat, base: number): number => {
    const raw = baseStatValue(base, evs[stat] ?? 0, iv);
    if (stat === 'hp') {
      return Math.floor((raw * level) / 100) + level + 10;
    }
    const core = Math.floor((raw * level) / 100) + 5;
    return Math.floor(core * natureMult(nature, stat));
  };

  return {
    hp: calc('hp', bases.hp),
    atk: calc('atk', bases.atk),
    def: calc('def', bases.def),
    spa: calc('spa', bases.spa),
    spd: calc('spd', bases.spd),
    spe: calc('spe', bases.spe),
  };
}

export function applyHeldItemToStats(
  stats: BattleStats,
  item: string | null | undefined,
  role: 'attacker' | 'defender',
): BattleStats {
  if (!item) return stats;
  const next = { ...stats };
  if (role === 'attacker') {
    const stat = ATTACK_ITEM[item];
    if (stat) next[stat] = Math.floor(next[stat] * 1.5);
    if (item === 'Muscle Band') next.atk = Math.floor(next.atk * 1.1);
    if (item === 'Wise Glasses') next.spa = Math.floor(next.spa * 1.1);
  } else {
    const stat = DEFENSE_ITEM[item];
    if (stat) next[stat] = Math.floor(next[stat] * 1.5);
    const mults = DEFENSE_MULT_ITEM[item];
    if (mults) {
      if (mults.def) next.def = Math.floor(next.def * mults.def);
      if (mults.spd) next.spd = Math.floor(next.spd * mults.spd);
    }
  }
  return next;
}

/** Choice Scarf y similares (solo velocidad). */
export function applySpeedItem(speed: number, item: string | null | undefined): number {
  if (item === 'Choice Scarf') return Math.floor(speed * 1.5);
  return speed;
}

export function applyAbilitiesToStats(
  stats: BattleStats,
  ability: string | null | undefined,
  role: 'attacker' | 'defender',
): BattleStats {
  const id = normAbility(ability);
  if (!id) return stats;
  const next = { ...stats };

  if (role === 'defender' && id === 'furcoat') {
    next.def = Math.floor(next.def * 2);
  }
  if (role === 'attacker') {
    if (id === 'hugepower' || id === 'purepower') {
      next.atk = Math.floor(next.atk * 2);
    }
    if (id.includes('protosynthesis') || id.includes('quarkdrive')) {
      const order: Stat[] = ['spe', 'spa', 'spd', 'atk', 'def'];
      const best = order.reduce((a, b) => (next[a] >= next[b] ? a : b));
      next[best] = Math.floor(next[best] * 1.3);
    }
  }
  return next;
}

/** Intimidate del defensor en ataques físicos (−1 Atk). */
export function applyIntimidate(
  attackerStats: BattleStats,
  defenderAbility: string | null | undefined,
  category: 'physical' | 'special',
): BattleStats {
  if (category !== 'physical') return attackerStats;
  if (normAbility(defenderAbility) !== 'intimidate') return attackerStats;
  return { ...attackerStats, atk: Math.floor((attackerStats.atk * 2) / 3) };
}

export function adjustTypeMultiplierForAbilities(
  typeMult: number,
  defenderAbility: string | null | undefined,
): number {
  const id = normAbility(defenderAbility);
  if (typeMult >= 2 && (id === 'filter' || id === 'solidrock')) {
    return typeMult * 0.75;
  }
  return typeMult;
}

export function stabMultiplier(
  moveType: string,
  originalTypes: string[],
  teraType: string | null | undefined,
  useTera: boolean,
): number {
  const move = moveType.toLowerCase();
  if (useTera && teraType && teraType.toLowerCase() === move) return 2;
  if (originalTypes.some((t) => t.toLowerCase() === move)) return 1.5;
  return 1;
}

export function activeTypes(
  originalTypes: string[],
  teraType: string | null | undefined,
  useTera: boolean,
): string[] {
  if (useTera && teraType) return [teraType.toLowerCase()];
  return originalTypes.map((t) => t.toLowerCase());
}

export interface DamageComputeInput {
  level: number;
  power: number;
  category: 'physical' | 'special';
  moveType: string;
  typeMultiplier: number;
  stab: number;
  attackerStats: BattleStats;
  defenderStats: BattleStats;
  attackerItem?: string | null;
}

/** Rolls de daño Gen 9 (16 valores aleatorios 85–100%). */
export function computeDamageRolls(input: DamageComputeInput): number[] {
  const atkStat = input.category === 'physical' ? input.attackerStats.atk : input.attackerStats.spa;
  const defStat = input.category === 'physical' ? input.defenderStats.def : input.defenderStats.spd;

  const levelFactor = Math.floor((2 * input.level) / 5) + 2;
  const core = Math.floor(
    Math.floor(Math.floor((levelFactor * input.power * atkStat) / defStat) / 50) + 2,
  );

  let itemMult = 1;
  if (input.attackerItem === 'Life Orb') itemMult = DAMAGE_ITEM_MULT['Life Orb'] ?? 1;
  if (input.attackerItem === 'Expert Belt' && input.typeMultiplier > 1) {
    itemMult = DAMAGE_ITEM_MULT['Expert Belt'] ?? 1;
  }

  const modifier = input.stab * input.typeMultiplier * itemMult;
  const rolls: number[] = [];
  for (let i = 85; i <= 100; i++) {
    rolls.push(Math.max(1, Math.floor((core * modifier * i) / 100)));
  }
  return rolls;
}

export function koSummary(rolls: number[], hp: number): string {
  const kos = rolls.filter((r) => r >= hp).length;
  if (kos === 0) return 'No KO';
  if (kos === rolls.length) return 'OHKO seguro (16/16 rolls)';
  const pct = Math.round((kos / rolls.length) * 100);
  return `${pct}% de KO (${kos}/${rolls.length} rolls)`;
}

export function buildDescription(opts: {
  attacker: string;
  defender: string;
  move: string;
  item?: string | null;
  nature?: string | null;
  spread?: string | null;
  tera?: string | null;
  useTera: boolean;
  min: number;
  max: number;
  hp: number;
  typeMult: number;
  stab: number;
  ability?: string | null;
  defenderAbility?: string | null;
}): string {
  const parts = [
    `${opts.attacker} → ${opts.defender}: ${opts.move}`,
    opts.ability ? `Habilidad: ${opts.ability}` : null,
    opts.defenderAbility ? `Hab. rival: ${opts.defenderAbility}` : null,
    opts.item ? `Objeto: ${opts.item}` : null,
    opts.nature ? `Naturaleza: ${opts.nature}` : null,
    opts.spread ? `EVs: ${opts.spread}` : null,
    opts.useTera && opts.tera ? `Tera: ${opts.tera}` : null,
    `STAB ×${opts.stab} · Tipos ×${opts.typeMult}`,
    `Daño: ${opts.min}–${opts.max} / ${opts.hp} PS`,
  ].filter(Boolean);
  return parts.join(' · ');
}

export function pokemonBasesFromApi(stats: { stat: { name: string }; base_stat: number }[]): BattleStats {
  const map = Object.fromEntries(stats.map((s) => [s.stat.name, s.base_stat]));
  return {
    hp: map.hp ?? 1,
    atk: map.attack ?? 1,
    def: map.defense ?? 1,
    spa: map['special-attack'] ?? 1,
    spd: map['special-defense'] ?? 1,
    spe: map.speed ?? 1,
  };
}

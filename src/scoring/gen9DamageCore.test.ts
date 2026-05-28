import {
  applyIntimidate,
  calcBattleStats,
  computeDamageRolls,
  koSummary,
  stabMultiplier,
} from './gen9DamageCore';

describe('gen9DamageCore', () => {
  it('calcula stats nivel 50 con EVs', () => {
    const stats = calcBattleStats(
      { hp: 55, atk: 55, def: 55, spa: 50, spd: 65, spe: 90 },
      { spa: 252, spe: 252, hp: 4 },
      'Timid',
      50,
    );
    expect(stats.spa).toBeGreaterThan(stats.atk);
    expect(stats.hp).toBeGreaterThan(100);
  });

  it('genera 16 rolls de daño', () => {
    const rolls = computeDamageRolls({
      level: 50,
      power: 90,
      category: 'special',
      moveType: 'fairy',
      typeMultiplier: 1,
      stab: 1.5,
      attackerStats: {
        hp: 131,
        atk: 73,
        def: 73,
        spa: 187,
        spd: 155,
        spe: 205,
      },
      defenderStats: {
        hp: 183,
        atk: 115,
        def: 90,
        spa: 90,
        spd: 100,
        spe: 90,
      },
      attackerItem: 'Choice Specs',
    });
    expect(rolls).toHaveLength(16);
    expect(Math.min(...rolls)).toBeLessThanOrEqual(Math.max(...rolls));
    expect(Math.max(...rolls)).toBeGreaterThan(0);
  });

  it('STAB Tera ×2 si coincide tipo', () => {
    expect(stabMultiplier('fairy', ['ghost', 'fairy'], 'Fairy', true)).toBe(2);
    expect(stabMultiplier('dark', ['ghost', 'fairy'], 'Fairy', true)).toBe(1);
  });

  it('Intimidate reduce Atk físico', () => {
    const base = { hp: 100, atk: 150, def: 100, spa: 100, spd: 100, spe: 100 };
    const lowered = applyIntimidate(base, 'Intimidate', 'physical');
    expect(lowered.atk).toBeLessThan(base.atk);
  });

  it('koSummary con porcentaje', () => {
    expect(koSummary([120, 130], 100)).toBe('OHKO seguro (16/16 rolls)');
    expect(koSummary([90, 110, 120], 100)).toContain('%');
    expect(koSummary([50, 60], 100)).toBe('No KO');
  });
});

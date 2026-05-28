import { calculateMetaDamage } from './damageCalc';
import type { SmogonUsageEntry } from '../api/smogon';

jest.mock('../api/pokeapi', () => ({
  fetchPokemon: jest.fn(async (slug: string) => {
    if (slug === 'flutter-mane') {
      return {
        name: 'flutter-mane',
        types: [{ slot: 1, type: { name: 'ghost' } }, { slot: 2, type: { name: 'fairy' } }],
        stats: [
          { stat: { name: 'hp' }, base_stat: 55 },
          { stat: { name: 'attack' }, base_stat: 55 },
          { stat: { name: 'defense' }, base_stat: 55 },
          { stat: { name: 'special-attack' }, base_stat: 135 },
          { stat: { name: 'special-defense' }, base_stat: 135 },
          { stat: { name: 'speed' }, base_stat: 135 },
        ],
      };
    }
    return {
      name: 'incineroar',
      types: [{ slot: 1, type: { name: 'fire' } }, { slot: 2, type: { name: 'dark' } }],
      stats: [
        { stat: { name: 'hp' }, base_stat: 95 },
        { stat: { name: 'attack' }, base_stat: 115 },
        { stat: { name: 'defense' }, base_stat: 90 },
        { stat: { name: 'special-attack' }, base_stat: 80 },
        { stat: { name: 'special-defense' }, base_stat: 90 },
        { stat: { name: 'speed' }, base_stat: 60 },
      ],
    };
  }),
  fetchMove: jest.fn(async () => ({
    name: 'moonblast',
    power: 95,
    type: { name: 'fairy' },
    damage_class: { name: 'special' },
  })),
  fetchType: jest.fn(async (name: string) => ({
    name,
    damage_relations: {
      double_damage_from: name === 'dark' ? [{ name: 'fairy' }] : [],
      half_damage_from: [],
      no_damage_from: [],
    },
  })),
}));

function stubEntry(partial: Partial<SmogonUsageEntry> & Pick<SmogonUsageEntry, 'name'>): SmogonUsageEntry {
  return {
    slug: partial.name.toLowerCase().replace(/\s+/g, '-'),
    usage: 0.1,
    lead: 0,
    topItem: null,
    topAbility: null,
    topTera: null,
    topMoves: [],
    topItems: [],
    topAbilities: [],
    topTeras: [],
    topSpreads: [],
    topNature: null,
    topSpread: null,
    ...partial,
  };
}

describe('calculateMetaDamage', () => {
  it('calcula rango de daño para movimiento con potencia', async () => {
    const attacker = stubEntry({
      name: 'Flutter Mane',
      topItem: 'Choice Specs',
      topNature: 'Timid',
      topSpread: '4 HP / 252 SpA / 252 Spe',
      topTera: 'Fairy',
    });
    const defender = stubEntry({
      name: 'Incineroar',
      topNature: 'Careful',
      topSpread: '252 HP / 4 Atk / 252 SpD / 4 Spe',
    });

    const out = await calculateMetaDamage({
      attacker,
      defender,
      moveName: 'Moonblast',
    });

    expect(out.max).toBeGreaterThan(0);
    expect(out.min).toBeGreaterThan(0);
    expect(out.min).toBeLessThanOrEqual(out.max);
    expect(out.defenderHp).toBeGreaterThan(0);
    expect(out.description.length).toBeGreaterThan(0);
    expect(out.rolls).toHaveLength(16);
  });
});

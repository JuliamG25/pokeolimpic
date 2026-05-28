import { formatShowdownSet } from './showdown';
import type { SmogonUsageEntry } from '../api/smogon';

describe('formatShowdownSet', () => {
  it('genera texto con movimientos y item', () => {
    const entry: SmogonUsageEntry = {
      name: 'Pikachu',
      slug: 'pikachu',
      usage: 0.05,
      lead: 0,
      topItem: 'Light Ball',
      topAbility: 'Static',
      topTera: 'electric',
      topMoves: [
        { name: 'Thunderbolt', rate: 0.6 },
        { name: 'Protect', rate: 0.4 },
      ],
      topItems: [],
      topAbilities: [],
      topTeras: [],
      topSpreads: [],
      topNature: 'Timid',
      topSpread: '4 HP / 252 SpA / 252 Spe',
    };
    const text = formatShowdownSet(entry);
    expect(text).toContain('Pikachu @ Light Ball');
    expect(text).toContain('- Thunderbolt');
    expect(text).toContain('5.0%');
  });
});

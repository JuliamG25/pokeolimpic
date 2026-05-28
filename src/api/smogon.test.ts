import { mapBlockToEntry } from './smogon';

describe('mapBlockToEntry', () => {
  it('calcula porcentajes de movimientos top 4', () => {
    const entry = mapBlockToEntry('Pikachu', {
      usage: { weighted: 0.12 },
      lead: { weighted: 0.05 },
      moves: {
        Thunderbolt: 40,
        'Volt Tackle': 30,
        Protect: 20,
        'Fake Out': 10,
      },
      items: { LightBall: 1 },
      abilities: { Static: 1 },
      teraTypes: { electric: 1 },
    });

    expect(entry.topMoves).toHaveLength(4);
    expect(entry.topMoves[0]).toEqual({ name: 'Thunderbolt', rate: 0.4 });
    expect(entry.topMoves[1].rate).toBeCloseTo(0.3);
    expect(entry.lead).toBe(0.05);
    expect(entry.usage).toBe(0.12);
  });
});

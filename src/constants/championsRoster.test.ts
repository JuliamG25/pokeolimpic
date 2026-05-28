import { resolveChampionsSpriteId } from './championsRoster';

describe('resolveChampionsSpriteId', () => {
  const dex = new Map<string, number>([
    ['pikachu', 25],
    ['indeedee', 876],
  ]);

  it('resolves slug directo', () => {
    expect(resolveChampionsSpriteId('pikachu', dex)).toBe(25);
  });

  it('resuelve forma a base del roster', () => {
    expect(resolveChampionsSpriteId('indeedee-f', dex)).toBe(876);
  });

  it('devuelve 0 si no hay coincidencia', () => {
    expect(resolveChampionsSpriteId('missingmon', dex)).toBe(0);
  });
});

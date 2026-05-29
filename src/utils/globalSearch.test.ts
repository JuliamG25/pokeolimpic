import { filterSearchHits, type SearchHit } from './globalSearch';

const sampleHits: SearchHit[] = [
  {
    kind: 'pokemon',
    id: 'poke-incineroar',
    label: 'Incineroar',
    sub: 'Pokédex Champions',
    slug: 'incineroar',
    aliases: ['incineroar'],
  },
  {
    kind: 'meta',
    id: 'meta-charizard',
    label: 'Charizard',
    sub: 'Meta · 12.0% uso',
    slug: 'charizard',
    aliases: ['charizard'],
  },
  {
    kind: 'move',
    id: 'move-fake-out',
    label: 'Sorpresa',
    sub: 'Movimiento meta',
    slug: 'fake-out',
    aliases: ['fake-out', 'Fake Out', 'fake out'],
  },
];

describe('globalSearch', () => {
  it('encuentra coincidencias parciales en label', () => {
    const results = filterSearchHits(sampleHits, 'inci');
    expect(results.some((h) => h.slug === 'incineroar')).toBe(true);
  });

  it('encuentra por alias en inglés', () => {
    const results = filterSearchHits(sampleHits, 'char');
    expect(results.some((h) => h.slug === 'charizard')).toBe(true);
  });

  it('encuentra movimientos por nombre ES o EN', () => {
    expect(filterSearchHits(sampleHits, 'sorp').some((h) => h.slug === 'fake-out')).toBe(true);
    expect(filterSearchHits(sampleHits, 'fake').some((h) => h.slug === 'fake-out')).toBe(true);
  });

  it('devuelve los primeros resultados con query vacía', () => {
    expect(filterSearchHits(sampleHits, '')).toHaveLength(3);
  });
});

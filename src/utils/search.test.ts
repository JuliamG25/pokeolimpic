import { normalizeSearchText, matchesSearch } from './search';

describe('search utils', () => {
  it('normaliza acentos', () => {
    expect(normalizeSearchText('Florges')).toBe('florges');
    expect(normalizeSearchText('Pokémon')).toBe('pokemon');
  });

  it('matchesSearch encuentra en campos ES', () => {
    expect(matchesSearch('florg', 'florges', 'Florges')).toBe(true);
    expect(matchesSearch('xyz', 'pikachu')).toBe(false);
  });
});

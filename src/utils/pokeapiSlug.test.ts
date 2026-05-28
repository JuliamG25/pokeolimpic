import { resolvePokeApiSlug } from './pokeapiSlug';

describe('resolvePokeApiSlug', () => {
  it('mapea formas Showdown comunes', () => {
    expect(resolvePokeApiSlug('indeedee-f')).toBe('indeedee-female');
    expect(resolvePokeApiSlug('Indeedee-F')).toBe('indeedee-female');
    expect(resolvePokeApiSlug('urshifu-rs')).toBe('urshifu-rapid-strike');
  });

  it('deja slugs normales intactos', () => {
    expect(resolvePokeApiSlug('pikachu')).toBe('pikachu');
    expect(resolvePokeApiSlug('flutter-mane')).toBe('flutter-mane');
  });
});

import { parseEvsSpread } from './spreadParse';

describe('parseEvsSpread', () => {
  it('parsea reparto estándar', () => {
    expect(parseEvsSpread('4 HP / 252 SpA / 252 Spe')).toEqual({
      hp: 4,
      spa: 252,
      spe: 252,
    });
  });

  it('devuelve vacío si no hay spread', () => {
    expect(parseEvsSpread(null)).toEqual({});
    expect(parseEvsSpread('')).toEqual({});
  });
});

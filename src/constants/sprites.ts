/** Sprite oficial clásico (PokeAPI / GitHub). */
export function pokemonSpriteUrl(id: number): string {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
}

/** ID numérico desde la URL de un recurso Pokémon (p. ej. learned_by_pokemon). */
export function pokemonIdFromResourceUrl(url: string): number | null {
  const m = /\/(\d+)\/?$/.exec(url);
  return m ? Number(m[1]) : null;
}

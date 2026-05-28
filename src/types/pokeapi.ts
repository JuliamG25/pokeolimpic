/** Tipos mínimos para respuestas de PokeAPI usadas en la app */

export type NamedAPIResource = {
  name: string;
  url: string;
};

export type PokemonTypeSlot = {
  slot: number;
  type: NamedAPIResource;
};

export type PokemonStat = {
  base_stat: number;
  effort: number;
  stat: NamedAPIResource;
};

export type PokemonAbilitySlot = {
  is_hidden: boolean;
  slot: number;
  ability: NamedAPIResource;
};

export type PokemonMove = {
  move: NamedAPIResource;
  version_group_details: {
    level_learned_at: number;
    move_learn_method: NamedAPIResource;
    version_group: NamedAPIResource;
  }[];
};

export type Pokemon = {
  id: number;
  name: string;
  height: number;
  weight: number;
  base_experience: number | null;
  types: PokemonTypeSlot[];
  stats: PokemonStat[];
  abilities: PokemonAbilitySlot[];
  moves: PokemonMove[];
  sprites: {
    front_default: string | null;
    other?: {
      'official-artwork'?: { front_default: string | null };
    };
  };
};

export type TypeDamageRelations = {
  no_damage_to: NamedAPIResource[];
  half_damage_to: NamedAPIResource[];
  double_damage_to: NamedAPIResource[];
  no_damage_from: NamedAPIResource[];
  half_damage_from: NamedAPIResource[];
  double_damage_from: NamedAPIResource[];
};

export type TypeDetail = {
  id: number;
  name: string;
  damage_relations: TypeDamageRelations;
  pokemon?: { pokemon: NamedAPIResource; slot: number }[];
};

export type PokemonSpecies = {
  id: number;
  name: string;
  is_legendary: boolean;
  is_mythical: boolean;
  capture_rate: number;
  base_happiness: number;
  names: { name: string; language: NamedAPIResource }[];
  evolves_from_species: NamedAPIResource | null;
  generation: NamedAPIResource;
  habitat: NamedAPIResource | null;
};

export type GenerationResponse = {
  id: number;
  name: string;
  pokemon_species: NamedAPIResource[];
};

export type TypeWithPokemon = TypeDetail & {
  pokemon: { pokemon: NamedAPIResource; slot: number }[];
};

export type HabitatOrColorResponse = {
  id: number;
  name: string;
  pokemon_species: NamedAPIResource[];
};

export type NamedListResponse = {
  results: NamedAPIResource[];
};

export type PokemonListItem = {
  name: string;
  url: string;
};

export type PokemonListResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: PokemonListItem[];
};

export type MoveEffectEntry = {
  effect: string;
  short_effect: string;
  language: NamedAPIResource;
};

export type MoveFlavorText = {
  flavor_text: string;
  language: NamedAPIResource;
};

export type MoveName = {
  name: string;
  language: NamedAPIResource;
};

export type MoveDetail = {
  id: number;
  name: string;
  power: number | null;
  pp: number | null;
  accuracy: number | null;
  type: NamedAPIResource;
  damage_class: NamedAPIResource;
  effect_entries: MoveEffectEntry[];
  flavor_text_entries: MoveFlavorText[];
  names: MoveName[];
  learned_by_pokemon: NamedAPIResource[];
};

export type AbilityDetail = {
  id: number;
  name: string;
  names: MoveName[];
  effect_entries: MoveEffectEntry[];
  flavor_text_entries: MoveFlavorText[];
};

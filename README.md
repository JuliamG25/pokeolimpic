# PokéMeta

App Expo (React Native + TypeScript) para **Pokémon Champions**: Pokédex del roster oficial (~184 especies), meta competitivo y utilidades.

## Fuentes de datos

- [PokeAPI](https://pokeapi.co) — especies, movimientos, habilidades, objetos, i18n
- [data.pkmn.cc](https://data.pkmn.cc) — estadísticas Smogon (`gen9vgc2026`)

El meta actual es un **proxy VGC 2026** filtrado al roster Champions hasta que exista un formato dedicado (`championsou`) en data.pkmn.cc.

## Desarrollo

```bash
npm install
npx expo start
npm test
npx tsc --noEmit
```

## Mejoras recientes

- Calculadora de daño Gen 9 con sets del meta VGC (motor nativo + PokeAPI)
- Búsqueda global · speed tiers en equipo · elegir equipo al guardar
- Análisis de equipo (debilidades compartidas, cobertura ofensiva)
- Export Showdown desde meta y equipo
- Búsqueda ES en Pokédex, lazy i18n en lista meta
- Stale-while-revalidate en stats Smogon
- Índices PokeAPI persistidos en AsyncStorage

## Caché

Stats Smogon, roster Champions, nombres ES y mapa evolutivo en AsyncStorage (TTL 24 h). Stats usan stale-while-revalidate offline. Pull-to-refresh invalida datos Smogon.

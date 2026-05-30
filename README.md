# PokéOlimpic

Aplicación móvil desarrollada en Expo (React Native + TypeScript) que proporciona acceso completo a información competitiva de Pokémon Championships Gen 9 (VGC 2026). Incluye Pokédex del roster oficial (~184 especies), análisis meta, calculadora de daño, gestor de equipos y utilidades para jugadores competitivos.

---

## 📋 Nombre de la Aplicación y Descripción General

**PokéOlimpic** es una plataforma integral diseñada para jugadores competitivos de Pokémon que participan en torneos VGC (Video Game Championship) del formato Champions/Gen 9. Integra datos en tiempo real de PokeAPI y estadísticas Smogon para ofrecer herramientas que mejoren el análisis estratégico, la construcción de equipos y los cálculos de daño.

---

## 👥 Integrantes del Equipo

| Nombre Completo | Código |
|:---|:---|
| Juliam Steven Guarin Bueno | 1093590617 |
| David Mauricio Rangel Báez | 1094046835 |

---

## 🛠️ Tecnologías Utilizadas

| Categoría | Tecnología | Versión |
|:---|:---|:---|
| **Framework** | Expo | ~54.0.33 |
| **Lenguaje** | TypeScript | ~5.9.2 |
| **Runtime** | React Native | 0.81.5 |
| **Librería UI** | React | 19.1.0 |
| **Almacenamiento Local** | AsyncStorage | 2.2.0 |
| **Testing** | Jest | ^29.0.0 |
| **Testing TS** | ts-jest | ^29.4.9 |
| **Compilación Web** | React Native Web | ^0.21.0 |
| **Tipado** | @types/react | ~19.1.0 |

### APIs Consumidas

- **PokeAPI v2** (https://pokeapi.co/api/v2) — Pokémon, movimientos, habilidades, objetos, naturalezas
- **Smogon Stats** (https://data.pkmn.cc/stats) — Estadísticas meta VGC 2026

---

## 🏗️ Arquitectura de la Aplicación

```
src/
├── api/                 # Capa de acceso a datos (API calls, caché)
│   ├── pokeapi.ts      # Integración PokeAPI con caché en memoria
│   ├── smogon.ts       # Datos Smogon meta VGC 2026
│   ├── cache.ts        # Sistema de caché con TTL (AsyncStorage)
│   ├── gameData.ts     # Datos precargados del juego
│   └── team.ts         # Persistencia de equipos
│
├── components/          # Componentes reutilizables de UI
│   ├── EntityDetailModal.tsx    # Modal para detalles
│   ├── FilterChips.tsx          # Chips de filtrado
│   ├── PokeSkeletonRow.tsx      # Loading placeholder
│   ├── StatBar.tsx              # Visualización de estadísticas
│   ├── TypeBadge.tsx            # Badge de tipos
│   ├── TypeEffectivenessRow.tsx # Fila de matchups
│   ├── TypeMatchupRadarChart.tsx# Gráfico radar interactivo
│   └── WebMaxWidth.tsx          # Responsive wrapper
│
├── screens/             # Pantallas de la aplicación
│   ├── HomeScreen.tsx           # Pantalla principal
│   ├── GlobalSearchScreen.tsx    # Búsqueda global
│   ├── BestPokemonScreen.tsx     # Ranking meta VGC
│   ├── DetailScreen.tsx          # Ficha Pokémon
│   ├── MetaPokemonDetailScreen.tsx# Detalle meta + sets
│   ├── MovesListScreen.tsx       # Catálogo de movimientos
│   ├── MoveDetailScreen.tsx      # Detalle de movimiento
│   ├── ItemsScreen.tsx           # Objetos equipados
│   ├── AbilitiesScreen.tsx       # Habilidades meta
│   ├── TypeChartScreen.tsx       # Tabla de efectividad
│   ├── TypeDetailScreen.tsx      # Detalle tipo con radar
│   ├── TeraScreen.tsx            # Distribución Tera
│   ├── DamageCalcScreen.tsx      # Calculadora de daño
│   ├── TeamScreen.tsx            # Gestor de equipos
│   └── MenuScreen.tsx            # Menú de navegación
│
├── scoring/             # Motor de cálculo de daño Gen 9
│   ├── damageCalc.ts            # API de cálculo
│   ├── gen9DamageCore.ts        # Núcleo de daño Gen 9
│   └── competitive.ts           # Lógica competitiva
│
├── constants/           # Datos constantes
│   ├── championsRoster.ts       # Roster oficial Champions
│   ├── filters.ts               # Opciones de filtrado
│   ├── sprites.ts               # URLs de sprites
│   ├── typeColors.ts            # Colores por tipo
│   └── offensiveRelations.json  # Relaciones ofensivas
│
├── theme/               # Tema y estilos
│   ├── colors.ts        # Paleta de colores
│   ├── layout.ts        # Constantes de layout
│   └── pokemon.ts       # Configuración Pokémon
│
├── types/               # Definiciones TypeScript
│   ├── index.ts         # Tipos globales
│   └── pokeapi.ts       # Tipado PokeAPI
│
├── utils/               # Utilidades
│   ├── globalSearch.ts          # Motor búsqueda global
│   ├── i18n.ts                  # Internacionalización (ES/EN)
│   ├── pokeapiSlug.ts           # Resolución de slugs
│   ├── search.ts                # Búsqueda en listas
│   ├── showdown.ts              # Export a Pokémon Showdown
│   ├── speedTiers.ts            # Cálculo de speed tiers
│   ├── spreadParse.ts           # Parseo de spreads EVs
│   ├── teamAnalysis.ts          # Análisis de equipo
│   └── typeEffectiveness.ts     # Cálculos de efectividad
│
└── navigation/          # Configuración de navegación
    └── routeBack.ts     # Manejo de navegación atrás

```

**Patrón Arquitectónico:** Model-View-ViewModel (MVVM) con capas separadas:
- **Capa de Presentación:** Screens + Components
- **Capa de Lógica:** Utils + Scoring
- **Capa de Datos:** API + Cache + Constants

---

## ✨ Especificaciones Funcionales

### 1. **Pantalla de Inicio**
- Barra de búsqueda global integrada
- Grid de 9 modos de acceso (Pokédex, Meta, Tipos, Ataques, Objetos, Habilidades, Tera, Equipo, Calculadora)
- Branding Champions/Gen 9
- Precargar meta en segundo plano para mejor rendimiento

### 2. **Pokédex Champions**
- Listado de ~184 especies del roster oficial
- Búsqueda por nombre en español e inglés
- Filtros avanzados:
  - Por generación (1-9)
  - Por tipo (18 tipos)
  - Por hábitat
  - Por color
  - Por fase evolutiva
- Paginación eficiente
- Ficha detallada: stats base, tipos, evolución, movimientos, enlaces meta

### 3. **Meta y Sets Competitivos**
- Ranking de uso VGC 2026 filtrado al roster Champions
- Estadísticas por especie: porcentaje uso, movimientos más populares, objeto/habilidad
- Spreads de EVs con formato Pokémon Showdown
- Asignación de tipos Tera
- Pull-to-refresh con invalidación caché
- Offline support (stale-while-revalidate)

### 4. **Tipos y Efectividad**
- Tabla de efectividad visual (1 fila por tipo)
- Detalle con radar de matchups interactivo
- Weaknesses y resistencias destacadas
- Descripción traducida desde PokeAPI

### 5. **Catálogo de Movimientos**
- Listado de movimientos meta VGC
- Atributos: tipo, categoría, potencia, precisión, usos
- Frecuencia en meta
- Detalle: Pokémon que lo llevan, poder, descripción

### 6. **Objetos (Items)**
- Ítems equipados en sets competitivos
- Ranking por frecuencia de uso
- Descripción en español vía PokeAPI
- Beneficios en estrategia competitiva

### 7. **Habilidades**
- Listado ordenado por popularidad meta
- Descripción del efecto en español
- Enlace a Pokémon que la usan
- Frecuencia en formato

### 8. **Teracristalización**
- Distribución de tipos Tera en meta
- Frecuencia por especie
- Estadísticas generales del formato
- Análisis de coberturas

### 9. **Gestor de Equipos**
- Crear/editar múltiples equipos (6 Pokémon c/u)
- Agregar Pokémon desde meta o Pokédex
- Análisis de equipo:
  - Debilidades compartidas
  - Cobertura ofensiva
  - Speed tiers entre miembros
- Reordenar slots, renombrar equipos
- Export a formato Pokémon Showdown
- Persistencia en AsyncStorage

### 10. **Calculadora de Daño (Gen 9)**
- Motor nativo de cálculo Gen 9
- Seleccionar atacante/defensor desde sets meta
- Opciones avanzadas:
  - Golpe crítico
  - Efectos climáticos
  - Terastal ofensivo/defensivo
  - Items y habilidades
  - Modifiers de ataque/defensa
- Resultados: daño min/max, % PS, OHKO/2HKO/xHKO
- Pre-relleno desde movimientos o detalle meta

### 11. **Búsqueda Global**
- Motor unificado sobre múltiples índices:
  - Pokémon
  - Movimientos
  - Habilidades
  - Objetos
  - Tipos
  - Meta (por especie)
- Soporte español e inglés
- Resultados en tiempo real

### 12. **Caché y Offline**
- AsyncStorage con TTL 24h para:
  - Stats Smogon
  - Roster Champions
  - Nombres en español
  - Índices PokeAPI
- Stale-while-revalidate: servir datos old mientras se actualiza
- Pull-to-refresh manual

---

## 📦 Instalación y Ejecución

### Prerequisitos
- Node.js >= 18
- npm o yarn
- Expo CLI (se instala con `npm install -g expo-cli`)
- Para Android: Android SDK 24+ (si build local)

### Instalación

```bash
# Clonar repositorio
git clone <repositorio>
cd pokeolimpic

# Instalar dependencias
npm install

# Configurar Expo (opcional, para builds)
npm install -g eas-cli
eas login  # Con cuenta Expo
```

### Ejecución

```bash
# Desarrollo local (Expo dev server)
npm start

# En Android (requiere emulador o dispositivo)
npm run android

# En iOS (solo macOS)
npm run ios

# En web
npm run web

# Con tunnel (QR share)
npm run tunnel
```

### Testing

```bash
# Ejecutar tests
npm test

# Con coverage
npm test -- --coverage

# Type checking
npx tsc --noEmit
```

### Build para Android

**Con EAS Cloud (recomendado):**
```bash
eas build --platform android --profile preview
```

**Build local (requiere Android SDK):**
```bash
eas build --platform android --profile preview --local
```

El APK se genera en el servidor EAS o localmente según configuración.

---

## 📸 Capturas de Pantalla

### Pantalla de Inicio

| Cabecera y Búsqueda | Primeros Modos |
|:---:|:---:|
| ![Inicio - Hero](docs/screenshots/01-inicio-hero.png) | ![Inicio - Modos](docs/screenshots/02-inicio-modos.png) |

| Equipos, Calculadora y Pie |
|:---:|
| ![Inicio - Footer](docs/screenshots/03-inicio-footer.png) |

Punto de entrada principal. Muestra branding Champions/Gen 9, barra de búsqueda global (Pokémon, meta, movimientos, objetos, habilidades) y acceso a 9 modos principales. El meta se precarga en background.

---

### Pokédex Champions

![Pokédex del Roster](docs/screenshots/04-pokedex.png)

Listado filtrable de ~184 especies. Búsqueda español/inglés, filtros por gen/tipo/hábitat/color/fase evolutiva. Ficha detallada: stats, tipos, evolución, movimientos, referencias meta.

---

### Meta y Sets VGC 2026

![Ranking Meta Champions](docs/screenshots/05-meta-champions.png)

Ranking VGC 2026 filtrado al roster. Muestra % uso, movimientos/objeto/habilidad populares, pull-to-refresh, caché offline. Detalle incluye spreads EVs, movimientos, Tera y export Showdown.

---

### Tabla de Tipos

![Tabla de Efectividad](docs/screenshots/06-tipos.png)

Tabla visual de matchups (1 fila por tipo). Debilidades y fortalezas destacadas. Detalle con radar interactivo.

---

### Catálogo de Movimientos

![Movimientos Meta](docs/screenshots/07-ataques.png)

Movimientos VGC: tipo, categoría, potencia, frecuencia. Detalle: qué Pokémon lo llevan, acceso a calculadora.

---

### Objetos (Items)

![Items Equipados](docs/screenshots/08-objetos.png)

Items en sets competitivos. Ranking por frecuencia, descripción español, importancia estratégica.

---

### Habilidades

![Habilidades Meta](docs/screenshots/09-habilidades.png)

Habilidades ordenadas por popularidad. Efecto en español, Pokémon que las usan.

---

### Teracristalización

![Distribución Tera](docs/screenshots/10-teracristalizacion.png)

Frecuencia de tipos Tera en meta. Por especie y general. Análisis de coberturas defensivas/ofensivas.

---

### Calculadora de Daño

| Formulario | Resultados |
|:---:|:---:|
| ![Calculadora - Entrada](docs/screenshots/11-calculadora.png) | ![Calculadora - Resultado](docs/screenshots/13-calculadora-resultado.png) |

Motor Gen 9 con sets meta. Atacante/defensor desde ranking, movimiento, crítico, clima, Terastal. Daño min/max, % PS, OHKO/2HKO/xHKO.

---

### Mi Equipo

![Gestor de Equipos](docs/screenshots/12-mi-equipo.png)

Hasta 6 Pokémon por equipo. Análisis: debilidades compartidas, cobertura ofensiva, speed tiers. Reordenar, renombrar, export Showdown.

---

## 🌐 Servicios Web Consumidos

### PokeAPI v2

| Endpoint | Uso |
|:---|:---|
| `GET /api/v2/pokemon/{id-name}` | Datos Pokémon: stats, tipos, habilidades, movimientos |
| `GET /api/v2/pokemon-species/{id-name}` | Información especie: evolución, hábitat, color |
| `GET /api/v2/type/{id-name}` | Relaciones de tipo, matchups |
| `GET /api/v2/move/{id-name}` | Detalles movimiento: poder, precisión, descripción |
| `GET /api/v2/ability/{id-name}` | Detalles habilidad: descripción, Pokémon |
| `GET /api/v2/item/{id-name}` | Detalles objeto: descripción, efecto |
| `GET /api/v2/nature/{id-name}` | Naturalezas (modificadores stats) |
| `GET /api/v2/generation/{id}` | Datos por generación |
| `GET /api/v2/pokemon-habitat/{name}` | Hábitats para filtrado |
| `GET /api/v2/pokemon-color/{name}` | Colores para filtrado |

**Base URL:** https://pokeapi.co/api/v2  
**Rate Limit:** Sin límite oficial (caché en memoria)  
**Respuestas Principales:**
- Pokemon: stats, sprites, tipos, abilities, moves  
- PokemonSpecies: evolución, hábitat, color, nombres  
- Type: efectividad, damage_relations

### Smogon Stats (data.pkmn.cc)

| Endpoint | Uso |
|:---|:---|
| `GET /stats/{format}/{pokemon}` | Sets por Pokémon en formato VGC |
| `GET /stats/{format}` | Rankings meta general |

**Base URL:** https://data.pkmn.cc/stats  
**Formato Actual:** `gen9vgc2026` (proxy Champions)  
**Respuestas:**
- Porcentaje uso
- Movimientos (top 4, % cada uno)
- Item (% equipado)
- Habilidad (% cada una)
- Tera (% por tipo)
- Spreads (EVs, Nature)

**Caché:** 24 horas (AsyncStorage), stale-while-revalidate offline

---

## 📚 Conclusiones y Aprendizajes

### Logros Técnicos

1. **Integración Multi-API:** Unificación de datos PokeAPI + Smogon con caché inteligente y fallback offline.

2. **Motor de Cálculo de Daño Gen 9:** Implementación nativa de fórmulas Gen 9 (STAB, type advantage, criticals, weather, Terastal) con precisión competitiva.

3. **Arquitectura Escalable:** Separación clara de concerns (API, UI, Logic) permitiendo fácil mantenimiento y testing.

4. **Performance Optimization:** 
   - Caché multi-nivel (memoria + AsyncStorage)
   - Lazy loading en listas
   - Precargas en background
   - Stale-while-revalidate para UX offline

5. **Búsqueda Global Unificada:** Motor de búsqueda agnóstico sobre múltiples índices con soporte español/inglés.

6. **Testing:** Cobertura de lógica crítica (damage calc, spreads, type effectiveness) con Jest + ts-jest.

### Aprendizajes del Equipo

- **React Native + Expo:** Desarrollo mobile multiplataforma con TypeScript, ciclo de desarrollo ágil con Expo.
- **Gestión de Estado Local:** AsyncStorage para persistencia, caché strategies (TTL, stale-while-revalidate).
- **Tipado TypeScript Estricto:** Buen TS stricto atrapa errores early, mejora refactorings.
- **Pokémon Competitive:** Dominio de mecanánicas VGC Gen 9 (stats, types, abilities, Terastal, damage calculation).
- **UX/UI:** Diseño responsive, accesibilidad, manejo de estados de loading/error.

### Mejoras Futuras

- [ ] Sincronización en la nube de equipos (Firebase)
- [ ] Notificaciones de cambios meta
- [ ] Análisis de matchups predeterminados
- [ ] Modo offline-first con sync
- [ ] Internationalization completa (i18n)
- [ ] Modo oscuro
- [ ] Historial de cálculos
- [ ] Compartir equipos (deep links)
- [ ] Integración Pokémon Showdown simulador

### Conclusión

**PokéOlimpic** demuestra cómo las herramientas modernas de desarrollo mobile (Expo, TypeScript, React Native) permiten crear aplicaciones complejas y performantes. La combinación de datos públicos (PokeAPI) con estadísticas competitivas reales (Smogon) genera valor para la comunidad de jugadores VGC, ofreciendo un punto de referencia único en análisis Pokémon competitive.

El proyecto refuerza conceptos clave: arquitectura escalable, caché strategies, APIs externas, tipado fuerte y testing. Los aprendizajes son transferibles a otros proyectos mobile y web que requieran integración multi-fuente, análisis de datos y offline support.

---

## 📝 Notas Adicionales

- **Roster Champions:** ~184 Pokémon aprobados para torneo Champions Gen 9
- **VGC 2026:** Formato Video Game Championship vigente (proxy en data.pkmn.cc hasta formato `championsou`)
- **Gen 9:** Pokémon Scarlet/Violet (Paldea Pokédex)
- **Terastal:** Mecánica Gen 9 de cambio de tipo en batalla

---

**Última actualización:** Mayo 2026  
**Versión:** 1.0.3  
**Licencia:** Privada (Proyecto Académico)

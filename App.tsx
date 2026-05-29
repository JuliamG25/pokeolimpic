import { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet, BackHandler, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { AppErrorBoundary } from './src/components/AppErrorBoundary';
import { MenuScreen } from './src/screens/MenuScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { DetailScreen } from './src/screens/DetailScreen';
import { BestPokemonScreen } from './src/screens/BestPokemonScreen';
import { MetaPokemonDetailScreen } from './src/screens/MetaPokemonDetailScreen';
import { TypeChartScreen } from './src/screens/TypeChartScreen';
import { TypeDetailScreen } from './src/screens/TypeDetailScreen';
import { MovesListScreen } from './src/screens/MovesListScreen';
import { MoveDetailScreen, type PokemonResume } from './src/screens/MoveDetailScreen';
import { ItemsScreen } from './src/screens/ItemsScreen';
import { AbilitiesScreen } from './src/screens/AbilitiesScreen';
import { TeraScreen } from './src/screens/TeraScreen';
import { TeamScreen } from './src/screens/TeamScreen';
import { DamageCalcScreen } from './src/screens/DamageCalcScreen';
import { GlobalSearchScreen } from './src/screens/GlobalSearchScreen';
import { colors } from './src/theme/colors';
import { WebMaxWidth } from './src/components/WebMaxWidth';
import { getParentRoute } from './src/navigation/routeBack';
import { getMetaEntryForSlug, type SmogonUsageEntry } from './src/api/smogon';
import {
  getChampionsDexBySlug,
  resolveChampionsSpriteId,
} from './src/constants/championsRoster';

export type AppRoute =
  | { name: 'menu' }
  | { name: 'search' }
  | { name: 'pokedex' }
  | { name: 'best' }
  | { name: 'types' }
  | { name: 'moves' }
  | { name: 'items'; openItem?: string; returnTo?: AppRoute }
  | { name: 'abilities'; openAbility?: string; returnTo?: AppRoute }
  | { name: 'tera' }
  | { name: 'team' }
  | {
      name: 'calc';
      attacker?: SmogonUsageEntry;
      defender?: SmogonUsageEntry;
      moveName?: string;
      calcReturn?: AppRoute;
    }
  | { name: 'moveDetail'; slug: string; resume?: PokemonResume; returnTo?: AppRoute }
  | { name: 'typeDetail'; slug: string }
  | { name: 'metaDetail'; entry: SmogonUsageEntry; spriteId: number; returnTo?: AppRoute }
  | {
      name: 'detail';
      pokemon: string;
      from: 'pokedex' | 'best' | 'move' | 'meta' | 'team' | 'search';
      moveSlug?: string;
      metaReturn?: { entry: SmogonUsageEntry; spriteId: number; returnTo?: AppRoute };
    };

export default function App() {
  const [route, setRoute] = useState<AppRoute>({ name: 'menu' });
  const [teamRefreshKey, setTeamRefreshKey] = useState(0);

  const openMetaBySlug = useCallback(async (slug: string) => {
    const entry = await getMetaEntryForSlug(slug);
    if (!entry) return;
    const spriteId = resolveChampionsSpriteId(slug, getChampionsDexBySlug());
    setRoute({ name: 'metaDetail', entry, spriteId });
  }, []);

  const openMetaEntry = useCallback((entry: SmogonUsageEntry) => {
    const spriteId = resolveChampionsSpriteId(entry.slug, getChampionsDexBySlug());
    setRoute({ name: 'metaDetail', entry, spriteId });
  }, []);

  const goBack = useCallback(() => {
    const parent = getParentRoute(route);
    if (parent) {
      setRoute(parent);
      return true;
    }
    return false;
  }, [route]);

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', goBack);
    return () => sub.remove();
  }, [goBack]);

  useEffect(() => {
    if (route.name === 'team') setTeamRefreshKey((k) => k + 1);
  }, [route.name]);

  return (
    <AppErrorBoundary>
        <View style={styles.root}>
          <StatusBar style="dark" />
          <WebMaxWidth>
          {route.name === 'menu' ? (
            <MenuScreen
              onPokedex={() => setRoute({ name: 'pokedex' })}
              onBest={() => setRoute({ name: 'best' })}
              onTypes={() => setRoute({ name: 'types' })}
              onMoves={() => setRoute({ name: 'moves' })}
              onItems={() => setRoute({ name: 'items' })}
              onAbilities={() => setRoute({ name: 'abilities' })}
              onTera={() => setRoute({ name: 'tera' })}
              onTeam={() => setRoute({ name: 'team' })}
              onCalc={() => setRoute({ name: 'calc' })}
              onSearch={() => setRoute({ name: 'search' })}
            />
          ) : route.name === 'search' ? (
            <GlobalSearchScreen
              onBack={() => setRoute({ name: 'menu' })}
              onOpenPokemon={(slug) =>
                setRoute({ name: 'detail', pokemon: slug, from: 'search' })
              }
              onOpenMeta={(entry) => {
                const spriteId = resolveChampionsSpriteId(entry.slug, getChampionsDexBySlug());
                setRoute({ name: 'metaDetail', entry, spriteId, returnTo: { name: 'search' } });
              }}
              onOpenMove={(slug) =>
                setRoute({ name: 'moveDetail', slug, returnTo: { name: 'search' } })
              }
              onOpenItem={(name) =>
                setRoute({ name: 'items', openItem: name, returnTo: { name: 'search' } })
              }
              onOpenAbility={(name) =>
                setRoute({ name: 'abilities', openAbility: name, returnTo: { name: 'search' } })
              }
            />
          ) : route.name === 'pokedex' ? (
            <HomeScreen
              onBackToMenu={() => setRoute({ name: 'menu' })}
              onOpenPokemon={(name) =>
                setRoute({ name: 'detail', pokemon: name, from: 'pokedex' })
              }
            />
          ) : route.name === 'best' ? (
            <BestPokemonScreen
              onBack={() => setRoute({ name: 'menu' })}
              onSelectMeta={(entry, spriteId) =>
                setRoute({ name: 'metaDetail', entry, spriteId })
              }
            />
          ) : route.name === 'metaDetail' ? (
            <MetaPokemonDetailScreen
              entry={route.entry}
              spriteId={route.spriteId}
              onBack={() => {
                const parent = getParentRoute(route);
                if (parent) setRoute(parent);
              }}
              onOpenFullDetail={(slug) =>
                setRoute({
                  name: 'detail',
                  pokemon: slug,
                  from: 'meta',
                  metaReturn: {
                    entry: route.entry,
                    spriteId: route.spriteId,
                    returnTo: route.returnTo,
                  },
                })
              }
              onOpenCalc={(attacker, moveName) =>
                setRoute({
                  name: 'calc',
                  attacker,
                  moveName,
                  calcReturn: {
                    name: 'metaDetail',
                    entry: route.entry,
                    spriteId: route.spriteId,
                  },
                })
              }
            />
          ) : route.name === 'types' ? (
            <TypeChartScreen
              onBack={() => setRoute({ name: 'menu' })}
              onSelectType={(slug) => setRoute({ name: 'typeDetail', slug })}
            />
          ) : route.name === 'moves' ? (
            <MovesListScreen
              onBack={() => setRoute({ name: 'menu' })}
              onSelectMove={(slug) => setRoute({ name: 'moveDetail', slug })}
            />
          ) : route.name === 'items' ? (
            <ItemsScreen
              onBack={() => {
                const parent = getParentRoute(route);
                if (parent) setRoute(parent);
              }}
              openItem={route.openItem}
              onOpenMeta={openMetaBySlug}
            />
          ) : route.name === 'abilities' ? (
            <AbilitiesScreen
              onBack={() => {
                const parent = getParentRoute(route);
                if (parent) setRoute(parent);
              }}
              openAbility={route.openAbility}
            />
          ) : route.name === 'tera' ? (
            <TeraScreen onBack={() => setRoute({ name: 'menu' })} />
          ) : route.name === 'calc' ? (
            <DamageCalcScreen
              initialAttacker={route.attacker}
              initialDefender={route.defender}
              initialMoveName={route.moveName}
              onBack={() => {
                const parent = route.calcReturn ?? { name: 'menu' };
                setRoute(parent);
              }}
            />
          ) : route.name === 'team' ? (
            <TeamScreen
              refreshKey={teamRefreshKey}
              onBack={() => setRoute({ name: 'menu' })}
              onOpenPokemon={(slug) =>
                setRoute({ name: 'detail', pokemon: slug, from: 'team' })
              }
            />
          ) : route.name === 'moveDetail' ? (
            <MoveDetailScreen
              slug={route.slug}
              resume={route.resume}
              onBack={() => {
                const parent = getParentRoute(route);
                if (parent) setRoute(parent);
              }}
              onOpenMeta={openMetaBySlug}
              onOpenPokemon={(name) =>
                setRoute({
                  name: 'detail',
                  pokemon: name,
                  from: 'move',
                  moveSlug: route.slug,
                })
              }
              onOpenCalc={(moveName) =>
                setRoute({
                  name: 'calc',
                  moveName,
                  calcReturn: { name: 'moveDetail', slug: route.slug, resume: route.resume },
                })
              }
            />
          ) : route.name === 'typeDetail' ? (
            <TypeDetailScreen
              slug={route.slug}
              onBack={() => setRoute({ name: 'types' })}
              onOpenPokemon={(name) =>
                setRoute({ name: 'detail', pokemon: name, from: 'pokedex' })
              }
            />
          ) : route.name === 'detail' ? (
            <DetailScreen
              name={route.pokemon}
              onBack={() => {
                const parent = getParentRoute(route);
                if (parent) setRoute(parent);
              }}
              onOpenMove={(slug) =>
                setRoute({
                  name: 'moveDetail',
                  slug,
                  resume: {
                    pokemon: route.pokemon,
                    from: route.from,
                    moveSlug: route.moveSlug,
                  },
                })
              }
              onOpenMeta={openMetaEntry}
            />
          ) : null}
          </WebMaxWidth>
        </View>
    </AppErrorBoundary>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
});

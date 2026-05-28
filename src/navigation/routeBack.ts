import type { AppRoute } from '../../App';

/** Pantalla anterior al pulsar atrás (hardware o gesto). */
export function getParentRoute(route: AppRoute): AppRoute | null {
  switch (route.name) {
    case 'menu':
      return null;
    case 'pokedex':
    case 'best':
    case 'search':
    case 'types':
    case 'moves':
    case 'items':
    case 'abilities':
    case 'tera':
    case 'team':
    case 'calc':
      return route.name === 'calc' && route.calcReturn ? route.calcReturn : { name: 'menu' };
    case 'typeDetail':
      return { name: 'types' };
    case 'metaDetail':
      return { name: 'best' };
    case 'moveDetail':
      if (route.resume) {
        return {
          name: 'detail',
          pokemon: route.resume.pokemon,
          from: route.resume.from,
          moveSlug: route.resume.moveSlug,
        };
      }
      return { name: 'moves' };
    case 'detail':
      if (route.from === 'move' && route.moveSlug) {
        return { name: 'moveDetail', slug: route.moveSlug };
      }
      if (route.from === 'meta' && route.metaReturn) {
        return {
          name: 'metaDetail',
          entry: route.metaReturn.entry,
          spriteId: route.metaReturn.spriteId,
        };
      }
      if (route.from === 'pokedex') return { name: 'pokedex' };
      if (route.from === 'best') return { name: 'best' };
      if (route.from === 'team') return { name: 'team' };
      return { name: 'menu' };
    default:
      return { name: 'menu' };
  }
}

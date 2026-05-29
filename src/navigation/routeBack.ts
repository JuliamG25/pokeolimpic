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
    case 'tera':
    case 'team':
      return { name: 'menu' };
    case 'items':
    case 'abilities':
      return route.returnTo ?? { name: 'menu' };
    case 'calc':
      return route.calcReturn ?? { name: 'menu' };
    case 'typeDetail':
      return { name: 'types' };
    case 'metaDetail':
      return route.returnTo ?? { name: 'best' };
    case 'moveDetail':
      if (route.returnTo) return route.returnTo;
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
          returnTo: route.metaReturn.returnTo,
        };
      }
      if (route.from === 'pokedex') return { name: 'pokedex' };
      if (route.from === 'best') return { name: 'best' };
      if (route.from === 'team') return { name: 'team' };
      if (route.from === 'search') return { name: 'search' };
      return { name: 'menu' };
    default:
      return { name: 'menu' };
  }
}

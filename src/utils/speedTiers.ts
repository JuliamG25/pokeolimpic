import { fetchPokemon } from '../api/pokeapi';
import type { SavedTeamSlot } from '../api/team';
import {
  applyAbilitiesToStats,
  applyHeldItemToStats,
  applySpeedItem,
  calcBattleStats,
  pokemonBasesFromApi,
} from '../scoring/gen9DamageCore';
import { parseEvsSpread } from '../utils/spreadParse';

export interface SpeedTierLine {
  slug: string;
  name: string;
  speed: number;
  nature: string | null;
  item: string | null;
  rank: number;
}

export async function computeTeamSpeedTiers(slots: SavedTeamSlot[]): Promise<SpeedTierLine[]> {
  const rows = await Promise.all(
    slots.map(async (slot) => {
      const entry = slot.entry;
      try {
        const p = await fetchPokemon(slot.slug);
        const bases = pokemonBasesFromApi(p.stats);
        let stats = calcBattleStats(
          bases,
          parseEvsSpread(entry?.topSpread ?? null),
          entry?.topNature ?? null,
          50,
        );
        stats = applyAbilitiesToStats(stats, entry?.topAbility ?? null, 'attacker');
        stats = applyHeldItemToStats(stats, entry?.topItem ?? null, 'attacker');
        const speed = applySpeedItem(stats.spe, entry?.topItem ?? null);
        return {
          slug: slot.slug,
          name: slot.name,
          speed,
          nature: entry?.topNature ?? null,
          item: entry?.topItem ?? null,
        };
      } catch {
        return {
          slug: slot.slug,
          name: slot.name,
          speed: 0,
          nature: entry?.topNature ?? null,
          item: entry?.topItem ?? null,
        };
      }
    }),
  );

  return [...rows]
    .sort((a, b) => b.speed - a.speed)
    .map((r, i) => ({ ...r, rank: i + 1 }));
}

export function speedComparisonSummary(tiers: SpeedTierLine[]): string[] {
  if (tiers.length < 2) return [];
  const lines: string[] = [];
  const top = tiers[0];
  for (let i = 1; i < tiers.length; i++) {
    const other = tiers[i];
    if (top.speed > other.speed) {
      lines.push(`${top.name} outspeedea a ${other.name} (+${top.speed - other.speed})`);
    } else if (top.speed === other.speed) {
      lines.push(`${top.name} empata en velocidad con ${other.name} (${top.speed})`);
    }
  }
  for (let i = 0; i < tiers.length - 1; i++) {
    const a = tiers[i];
    const b = tiers[i + 1];
    if (a.speed === b.speed && i > 0) {
      lines.push(`${a.name} y ${b.name}: speed tie (${a.speed})`);
    }
  }
  return [...new Set(lines)].slice(0, 6);
}

import { STANDARD_TYPES } from './typeEffectiveness';
import { multiplierAgainst } from './typeEffectiveness';
import { typeNameEs } from './i18n';

export interface TeamWeaknessLine {
  attackType: string;
  count: number;
  label: string;
}

export interface TeamAnalysis {
  offensiveCoverage: string[];
  sharedWeaknesses: TeamWeaknessLine[];
  typeCounts: Record<string, number>;
}

function dualMultiplier(attacker: string, defenderTypes: string[]): number {
  if (!defenderTypes.length) return 1;
  return defenderTypes.reduce(
    (acc, dt) => acc * multiplierAgainst(dt, attacker),
    1,
  );
}

/** Análisis defensivo/ofensivo de un equipo por tipos. */
export function analyzeTeamTypes(
  members: { types: string[] }[],
): TeamAnalysis {
  const typeCounts: Record<string, number> = {};
  const offensiveSet = new Set<string>();

  for (const m of members) {
    for (const t of m.types) {
      typeCounts[t] = (typeCounts[t] ?? 0) + 1;
      for (const def of STANDARD_TYPES) {
        if (multiplierAgainst(def, t) === 2) offensiveSet.add(def);
      }
    }
  }

  const sharedWeaknesses: TeamWeaknessLine[] = [];
  for (const atk of STANDARD_TYPES) {
    let count = 0;
    for (const m of members) {
      if (dualMultiplier(atk, m.types) >= 2) count += 1;
    }
    if (count >= 2) {
      sharedWeaknesses.push({
        attackType: atk,
        count,
        label: typeNameEs(atk),
      });
    }
  }

  sharedWeaknesses.sort((a, b) => b.count - a.count);

  return {
    offensiveCoverage: [...offensiveSet].map((t) => typeNameEs(t)),
    sharedWeaknesses,
    typeCounts,
  };
}

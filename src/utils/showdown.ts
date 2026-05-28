import type { SmogonUsageEntry } from '../api/smogon';

/** Texto copiable estilo Showdown / resumen de set. */
export function formatShowdownSet(entry: SmogonUsageEntry): string {
  const lines: string[] = [`${entry.name} @ ${entry.topItem ?? 'Sin objeto'}`];
  if (entry.topAbility) lines.push(`Ability: ${entry.topAbility}`);
  if (entry.topTera) lines.push(`Tera Type: ${entry.topTera}`);
  if (entry.topNature) lines.push(`${entry.topNature} Nature`);
  if (entry.topSpread) lines.push(`EVs: ${entry.topSpread}`);
  for (const m of entry.topMoves) {
    lines.push(`- ${m.name}`);
  }
  lines.push('');
  lines.push(`Uso meta: ${(entry.usage * 100).toFixed(1)}%`);
  if (entry.lead > 0) lines.push(`Lead: ${(entry.lead * 100).toFixed(1)}%`);
  return lines.join('\n');
}

export function formatTeamExport(
  slots: { name: string; entry?: SmogonUsageEntry | null }[],
  teamName?: string,
): string {
  const filled = slots.filter((s) => s.name);
  if (!filled.length) return teamName ? `${teamName}: vacío` : 'Equipo vacío';
  const header = teamName ? `=== ${teamName} ===\n\n` : '';
  return (
    header +
    filled
      .map((s, i) => {
        if (s.entry) return `=== Slot ${i + 1} ===\n${formatShowdownSet(s.entry)}`;
        return `=== Slot ${i + 1} ===\n${s.name}`;
      })
      .join('\n\n')
  );
}

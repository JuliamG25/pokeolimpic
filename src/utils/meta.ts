import type { MetaRateEntry } from '../api/smogon';

export function formatMetaPct(rate: number, decimals = 1): string {
  return `${(rate * 100).toFixed(decimals)}%`;
}

export function formatMetaMovesLabel(moves: MetaRateEntry[], max = 4): string {
  if (!moves.length) return '—';
  return moves
    .slice(0, max)
    .map((m) => `${m.name} ${formatMetaPct(m.rate, 0)}`)
    .join(' · ');
}

export function formatRateLine(name: string, rate: number): string {
  return `${name} · ${formatMetaPct(rate, 0)}`;
}

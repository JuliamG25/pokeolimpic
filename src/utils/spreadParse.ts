type EvKey = 'hp' | 'atk' | 'def' | 'spa' | 'spd' | 'spe';

export type EvSpread = Partial<Record<EvKey, number>>;

const EV_LABEL: Record<string, EvKey> = {
  hp: 'hp',
  HP: 'hp',
  atk: 'atk',
  Atk: 'atk',
  def: 'def',
  Def: 'def',
  spa: 'spa',
  SpA: 'spa',
  spd: 'spd',
  SpD: 'spd',
  spe: 'spe',
  Spe: 'spe',
};

/** Parsea "4 HP / 252 SpA / 252 Spe" → EVs. */
export function parseEvsSpread(spread: string | null | undefined): EvSpread {
  const evs: EvSpread = {};
  if (!spread?.trim()) return evs;

  for (const part of spread.split('/')) {
    const m = /(\d+)\s+(HP|Atk|Def|SpA|SpD|Spe)/i.exec(part.trim());
    if (!m) continue;
    const key = EV_LABEL[m[2]] ?? EV_LABEL[m[2].slice(0, 1).toUpperCase() + m[2].slice(1).toLowerCase()];
    if (key) evs[key] = Number(m[1]);
  }
  return evs;
}

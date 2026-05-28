/** Normaliza texto para búsqueda sin acentos ni mayúsculas. */
export function normalizeSearchText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function matchesSearch(query: string, ...fields: (string | undefined | null)[]): boolean {
  const q = normalizeSearchText(query);
  if (!q) return true;
  return fields.some((f) => f && normalizeSearchText(f).includes(q));
}

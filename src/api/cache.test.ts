jest.mock('@react-native-async-storage/async-storage', () => {
  const store = new Map<string, string>();
  return {
    __esModule: true,
    default: {
      getItem: jest.fn((key: string) => Promise.resolve(store.get(key) ?? null)),
      setItem: jest.fn((key: string, value: string) => {
        store.set(key, value);
        return Promise.resolve();
      }),
      removeItem: jest.fn((key: string) => {
        store.delete(key);
        return Promise.resolve();
      }),
    },
  };
});

import { getCachedJson, getCachedJsonStale, setCachedJson, formatCacheAge } from './cache';

describe('cache AsyncStorage', () => {
  it('guarda y recupera JSON dentro del TTL', async () => {
    await setCachedJson('test:key', { foo: 1 });
    const hit = await getCachedJson<{ foo: number }>('test:key', 60_000);
    expect(hit?.data.foo).toBe(1);
    expect(hit?.savedAt).toBeGreaterThan(0);
  });

  it('getCachedJsonStale devuelve datos expirados', async () => {
    await setCachedJson('stale:key', { v: 1 });
    const stale = await getCachedJsonStale<{ v: number }>('stale:key');
    expect(stale?.data.v).toBe(1);
  });

  it('formatCacheAge devuelve texto legible', () => {
    const text = formatCacheAge(Date.now() - 5 * 60_000);
    expect(text).toMatch(/min/);
  });
});

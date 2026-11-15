import { describe, expect, it, vi } from 'vitest';
import { TtlCache } from '../ttlCache.ts';

describe('TtlCache', () => {
  it('shares one in-flight computation between concurrent callers', async () => {
    const cache = new TtlCache<number>(10, 1_000);
    const factory = vi.fn(async () => 42);
    const [a, b] = await Promise.all([cache.getOrCreate('k', factory), cache.getOrCreate('k', factory)]);
    expect([a, b]).toEqual([42, 42]);
    expect(factory).toHaveBeenCalledOnce();
  });

  it('expires entries after the TTL', async () => {
    let t = 0;
    const cache = new TtlCache<number>(10, 1_000, () => t);
    const factory = vi.fn(async () => t);
    await cache.getOrCreate('k', factory);
    t = 999;
    expect(cache.has('k')).toBe(true);
    t = 1_000;
    expect(cache.has('k')).toBe(false);
    await cache.getOrCreate('k', factory);
    expect(factory).toHaveBeenCalledTimes(2);
  });

  it('evicts rejected promises so the next call retries', async () => {
    const cache = new TtlCache<number>(10, 1_000);
    await expect(cache.getOrCreate('k', async () => { throw new Error('boom'); })).rejects.toThrow('boom');
    await Promise.resolve();
    expect(cache.has('k')).toBe(false);
    await expect(cache.getOrCreate('k', async () => 7)).resolves.toBe(7);
  });

  it('evicts the least recently used entry beyond capacity', async () => {
    const cache = new TtlCache<string>(2, 1_000);
    await cache.getOrCreate('a', async () => 'a');
    await cache.getOrCreate('b', async () => 'b');
    await cache.getOrCreate('a', async () => 'a2'); // touch a
    await cache.getOrCreate('c', async () => 'c');
    expect(cache.has('a')).toBe(true);
    expect(cache.has('b')).toBe(false);
    expect(cache.size).toBe(2);
  });
});

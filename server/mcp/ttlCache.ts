interface Entry<T> {
  value: Promise<T>;
  expiresAt: number;
}

/**
 * Small LRU with a TTL that stores promises, so concurrent callers asking for
 * the same key share one computation. Rejected promises are evicted so a
 * transient failure is retried on the next call instead of being cached.
 */
export class TtlCache<T> {
  private readonly entries = new Map<string, Entry<T>>();

  constructor(
    private readonly maxEntries: number,
    private readonly ttlMs: number,
    private readonly now: () => number = Date.now,
  ) {}

  has(key: string): boolean {
    const entry = this.entries.get(key);
    return Boolean(entry && entry.expiresAt > this.now());
  }

  getOrCreate(key: string, factory: () => Promise<T>): Promise<T> {
    const existing = this.entries.get(key);
    if (existing && existing.expiresAt > this.now()) {
      // Re-insert to mark as most recently used.
      this.entries.delete(key);
      this.entries.set(key, existing);
      return existing.value;
    }

    const value = factory();
    this.entries.delete(key);
    this.entries.set(key, { value, expiresAt: this.now() + this.ttlMs });
    value.catch(() => {
      if (this.entries.get(key)?.value === value) this.entries.delete(key);
    });
    this.evictOverflow();
    return value;
  }

  get size(): number {
    return this.entries.size;
  }

  private evictOverflow(): void {
    while (this.entries.size > this.maxEntries) {
      const oldest = this.entries.keys().next().value;
      if (oldest === undefined) return;
      this.entries.delete(oldest);
    }
  }
}

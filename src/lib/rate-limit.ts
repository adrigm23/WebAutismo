type RateLimitEntry = {
  count: number;
  resetAt: number;
};

declare global {
  var __academyRateLimitStore: Map<string, RateLimitEntry> | undefined;
}

function getStore() {
  if (!globalThis.__academyRateLimitStore) {
    globalThis.__academyRateLimitStore = new Map<string, RateLimitEntry>();
  }

  return globalThis.__academyRateLimitStore;
}

function pruneExpiredEntries(now: number) {
  const store = getStore();

  if (store.size < 1_000) {
    return;
  }

  for (const [key, entry] of store.entries()) {
    if (entry.resetAt <= now) {
      store.delete(key);
    }
  }
}

export function consumeRateLimit(input: {
  bucket: string;
  key: string;
  limit: number;
  windowMs: number;
  now?: number;
}) {
  const now = input.now ?? Date.now();
  const store = getStore();
  const compoundKey = `${input.bucket}:${input.key}`;
  const current = store.get(compoundKey);

  pruneExpiredEntries(now);

  if (!current || current.resetAt <= now) {
    const nextEntry = {
      count: 1,
      resetAt: now + input.windowMs
    };

    store.set(compoundKey, nextEntry);

    return {
      allowed: true,
      remaining: Math.max(input.limit - 1, 0),
      retryAfterSeconds: Math.ceil(input.windowMs / 1_000)
    };
  }

  if (current.count >= input.limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(Math.ceil((current.resetAt - now) / 1_000), 1)
    };
  }

  current.count += 1;
  store.set(compoundKey, current);

  return {
    allowed: true,
    remaining: input.limit - current.count,
    retryAfterSeconds: Math.max(Math.ceil((current.resetAt - now) / 1_000), 1)
  };
}

export function resetRateLimitStore() {
  getStore().clear();
}

import { createHash, randomUUID } from "node:crypto";
import { canUseMemoryRateLimitFallback, getRateLimitBackendEnv } from "@/lib/env";
import { captureOperationalWarning } from "@/lib/monitoring";
import { getDb } from "@/lib/prisma";

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

type ConsumeRateLimitInput = {
  bucket: string;
  key: string;
  limit: number;
  windowMs: number;
  now?: number;
};

type ConsumeRateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

declare global {
  var __academyRateLimitStore: Map<string, RateLimitEntry> | undefined;
  var __academyRateLimitPruneCursor: number | undefined;
}

function getStore() {
  if (!globalThis.__academyRateLimitStore) {
    globalThis.__academyRateLimitStore = new Map<string, RateLimitEntry>();
  }

  return globalThis.__academyRateLimitStore;
}

function pruneExpiredMemoryEntries(now: number) {
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

function consumeMemoryRateLimit(input: ConsumeRateLimitInput): ConsumeRateLimitResult {
  const now = input.now ?? Date.now();
  const store = getStore();
  const compoundKey = `${input.bucket}:${input.key}`;
  const current = store.get(compoundKey);

  pruneExpiredMemoryEntries(now);

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

function getRateLimitBackend() {
  return getRateLimitBackendEnv() ?? "database";
}

function hashRateLimitKey(key: string) {
  return createHash("sha256").update(key).digest("hex");
}

function scheduleDatabasePrune(now: Date) {
  globalThis.__academyRateLimitPruneCursor =
    (globalThis.__academyRateLimitPruneCursor ?? 0) + 1;

  if (globalThis.__academyRateLimitPruneCursor % 100 !== 0) {
    return;
  }

  void getDb().rateLimitBucket
    .deleteMany({
      where: {
        resetAt: {
          lt: now
        }
      }
    })
    .catch(() => {
      // Ignore best-effort cleanup failures.
    });
}

async function consumeDatabaseRateLimit(
  input: ConsumeRateLimitInput
): Promise<ConsumeRateLimitResult> {
  const now = new Date(input.now ?? Date.now());
  const resetAt = new Date(now.getTime() + input.windowMs);
  const keyHash = hashRateLimitKey(input.key);
  const recordId = randomUUID();

  await getDb().$executeRaw`
    INSERT INTO RateLimitBucket (id, bucket, keyHash, hitCount, resetAt, createdAt, updatedAt)
    VALUES (${recordId}, ${input.bucket}, ${keyHash}, 1, ${resetAt}, ${now}, ${now})
    ON DUPLICATE KEY UPDATE
      hitCount = IF(resetAt <= ${now}, 1, hitCount + 1),
      resetAt = IF(resetAt <= ${now}, ${resetAt}, resetAt),
      updatedAt = ${now}
  `;

  const rows = await getDb().$queryRaw<Array<{ hitCount: number; resetAt: Date }>>`
    SELECT hitCount, resetAt
    FROM RateLimitBucket
    WHERE bucket = ${input.bucket} AND keyHash = ${keyHash}
    LIMIT 1
  `;
  const record = rows[0];

  if (!record) {
    throw new Error("Rate limit record was not persisted.");
  }

  scheduleDatabasePrune(now);

  const retryAfterSeconds = Math.max(
    Math.ceil((record.resetAt.getTime() - now.getTime()) / 1_000),
    1
  );

  if (record.hitCount > input.limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds
    };
  }

  return {
    allowed: true,
    remaining: Math.max(input.limit - record.hitCount, 0),
    retryAfterSeconds
  };
}

export async function consumeRateLimit(
  input: ConsumeRateLimitInput
): Promise<ConsumeRateLimitResult> {
  const backend = getRateLimitBackend();

  if (backend === "memory") {
    return consumeMemoryRateLimit(input);
  }

  try {
    return await consumeDatabaseRateLimit(input);
  } catch (error) {
    if (!canUseMemoryRateLimitFallback()) {
      throw error;
    }

    captureOperationalWarning("Persistent rate limit backend failed; using explicit memory fallback.", {
      bucket: input.bucket,
      error: error instanceof Error ? error : new Error(String(error))
    });

    return consumeMemoryRateLimit(input);
  }
}

export function resetRateLimitStore() {
  getStore().clear();
}

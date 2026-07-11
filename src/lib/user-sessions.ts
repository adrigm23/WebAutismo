import { cookies, headers } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import {
  getSessionTtlDays,
  isProductionEnv
} from "@/lib/env";
import { getDb } from "@/lib/prisma";
import { getClientIpFromHeaders, getUserAgentFromHeaders } from "@/lib/request-client";

const SESSION_COOKIE = "academy_session";

// Short in-process cache for session-validity lookups. The database round
// trip to validate a session (revocation + expiry check) runs on every page
// load; caching it for a few seconds turns N page loads in a row into a
// single DB hit while keeping revocation propagation fast enough in
// practice. This is per-instance memory: on a serverless deployment with
// multiple warm instances, a revoked session may still be treated as valid
// on *other* instances for up to SESSION_VALIDITY_CACHE_TTL_MS — an accepted
// trade-off for this app's threat model, not appropriate for high-security
// session revocation requirements.
const SESSION_VALIDITY_CACHE_TTL_MS = 5_000;

type CachedSessionRecord = {
  id: string;
  userId: string;
  expiresAt: Date;
  revokedAt: Date | null;
  lastSeenAt: Date | null;
};

declare global {
  var __academySessionValidityCache:
    | Map<string, { record: CachedSessionRecord | null; cachedAt: number }>
    | undefined;
}

function getSessionValidityCache() {
  if (!globalThis.__academySessionValidityCache) {
    globalThis.__academySessionValidityCache = new Map();
  }

  return globalThis.__academySessionValidityCache;
}

function invalidateSessionValidityCache(sessionId: string) {
  getSessionValidityCache().delete(sessionId);
}

function invalidateAllSessionValidityCache() {
  getSessionValidityCache().clear();
}

function pruneExpiredSessionValidityCacheEntries(now: number) {
  const cache = getSessionValidityCache();

  if (cache.size < 1_000) {
    return;
  }

  for (const [sessionId, entry] of cache.entries()) {
    if (now - entry.cachedAt >= SESSION_VALIDITY_CACHE_TTL_MS) {
      cache.delete(sessionId);
    }
  }
}

function getSessionDurationSeconds() {
  return getSessionTtlDays() * 24 * 60 * 60;
}

function getSessionExpiryDate() {
  return new Date(Date.now() + getSessionDurationSeconds() * 1_000);
}

function getSessionSecret() {
  const secret = process.env.SESSION_SECRET?.trim();

  if (!secret) {
    throw new Error("Missing required environment variable: SESSION_SECRET");
  }

  return new TextEncoder().encode(secret);
}

async function signSessionToken(input: {
  userId: string;
  sessionId: string;
}) {
  return new SignJWT({
    sub: input.userId,
    sid: input.sessionId
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${getSessionDurationSeconds()}s`)
    .sign(getSessionSecret());
}

async function getSessionTokenPayload() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) {
    return null;
  }

  try {
    const verified = await jwtVerify(token, getSessionSecret());
    const userId = typeof verified.payload.sub === "string" ? verified.payload.sub : null;
    const sessionId =
      typeof verified.payload.sid === "string" ? verified.payload.sid : null;

    if (!userId || !sessionId) {
      return null;
    }

    return {
      userId,
      sessionId
    };
  } catch {
    return null;
  }
}

async function setSessionCookie(token: string) {
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: isProductionEnv(),
    path: "/",
    maxAge: getSessionDurationSeconds()
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

async function touchUserSession(sessionId: string, lastSeenAt: Date | null) {
  const now = new Date();

  if (lastSeenAt && now.getTime() - lastSeenAt.getTime() < 5 * 60 * 1_000) {
    return;
  }

  await getDb().userSession.updateMany({
    where: {
      id: sessionId,
      revokedAt: null,
      expiresAt: {
        gt: now
      }
    },
    data: {
      lastSeenAt: now
    }
  });
}

export async function createUserSession(userId: string) {
  const requestHeaders = await headers();
  const session = await getDb().userSession.create({
    data: {
      userId,
      expiresAt: getSessionExpiryDate(),
      lastSeenAt: new Date(),
      userAgent: getUserAgentFromHeaders(requestHeaders),
      ipAddress: getClientIpFromHeaders(requestHeaders)
    }
  });
  const token = await signSessionToken({
    userId,
    sessionId: session.id
  });

  await setSessionCookie(token);
  return session;
}

export async function getCurrentSessionId() {
  return (await getSessionTokenPayload())?.sessionId ?? null;
}

async function findSessionRecord(sessionId: string): Promise<CachedSessionRecord | null> {
  const cache = getSessionValidityCache();
  const cached = cache.get(sessionId);
  const now = Date.now();

  if (cached && now - cached.cachedAt < SESSION_VALIDITY_CACHE_TTL_MS) {
    return cached.record;
  }

  pruneExpiredSessionValidityCacheEntries(now);

  const record = await getDb().userSession.findUnique({
    where: {
      id: sessionId
    },
    select: {
      id: true,
      userId: true,
      expiresAt: true,
      revokedAt: true,
      lastSeenAt: true
    }
  });

  cache.set(sessionId, { record, cachedAt: now });

  return record;
}

export async function getCurrentSessionUserId() {
  const tokenPayload = await getSessionTokenPayload();

  if (!tokenPayload) {
    return null;
  }

  const session = await findSessionRecord(tokenPayload.sessionId);

  if (
    !session ||
    session.userId !== tokenPayload.userId ||
    session.revokedAt ||
    session.expiresAt.getTime() <= Date.now()
  ) {
    await clearSessionCookie();
    return null;
  }

  // Fire-and-forget: updating lastSeenAt is non-critical.
  // It must NOT block the auth response — a write failure here should
  // never prevent a valid session from being used.
  void touchUserSession(session.id, session.lastSeenAt).catch(() => {
    // Silent — lastSeenAt lag is acceptable if the write fails.
  });

  return session.userId;
}

export async function revokeUserSession(sessionId: string) {
  await getDb().userSession.updateMany({
    where: {
      id: sessionId,
      revokedAt: null
    },
    data: {
      revokedAt: new Date()
    }
  });

  invalidateSessionValidityCache(sessionId);
}

export async function revokeUserSessions(input: {
  userId: string;
  excludeSessionId?: string | null;
}) {
  await getDb().userSession.updateMany({
    where: {
      userId: input.userId,
      revokedAt: null,
      ...(input.excludeSessionId
        ? {
            id: {
              not: input.excludeSessionId
            }
          }
        : {})
    },
    data: {
      revokedAt: new Date()
    }
  });

  // We don't have the individual session ids revoked in bulk here, so drop
  // the whole cache rather than leave other users' sessions serving stale
  // "valid" reads — this is a rare admin/security action, not a hot path.
  invalidateAllSessionValidityCache();
}

export async function clearCurrentUserSession() {
  const sessionId = await getCurrentSessionId();

  if (sessionId) {
    await revokeUserSession(sessionId);
  }

  await clearSessionCookie();
}

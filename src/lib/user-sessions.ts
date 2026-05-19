import { cookies, headers } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import {
  getSessionTtlDays,
  isProductionEnv
} from "@/lib/env";
import { getDb } from "@/lib/prisma";
import { getClientIpFromHeaders, getUserAgentFromHeaders } from "@/lib/request-client";

const SESSION_COOKIE = "academy_session";

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

export async function getCurrentSessionUserId() {
  const tokenPayload = await getSessionTokenPayload();

  if (!tokenPayload) {
    return null;
  }

  const session = await getDb().userSession.findUnique({
    where: {
      id: tokenPayload.sessionId
    },
    select: {
      id: true,
      userId: true,
      expiresAt: true,
      revokedAt: true,
      lastSeenAt: true
    }
  });

  if (
    !session ||
    session.userId !== tokenPayload.userId ||
    session.revokedAt ||
    session.expiresAt.getTime() <= Date.now()
  ) {
    await clearSessionCookie();
    return null;
  }

  await touchUserSession(session.id, session.lastSeenAt);
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
}

export async function clearCurrentUserSession() {
  const sessionId = await getCurrentSessionId();

  if (sessionId) {
    await revokeUserSession(sessionId);
  }

  await clearSessionCookie();
}

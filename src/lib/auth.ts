import { compare, hash } from "bcryptjs";
import type { UserGlobalRole } from "@prisma/client";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { getDemoUserById, isDemoUserId } from "@/lib/demo-auth";
import { isDatabaseConnectionError } from "@/lib/db-errors";
import { getRequiredEnv, isDemoAuthEnabled, isProductionEnv } from "@/lib/env";
import { getDb } from "@/lib/prisma";

const SESSION_COOKIE = "academy_session";
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 30;

function normalizeEmailSet(raw: string) {
  return new Set(
    raw
      .split(",")
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean)
  );
}

function getBootstrapAdminEmails() {
  return normalizeEmailSet(process.env.BOOTSTRAP_ADMIN_EMAILS || process.env.ADMIN_EMAILS || "");
}

function getSessionSecret() {
  return new TextEncoder().encode(getRequiredEnv("SESSION_SECRET"));
}

export async function hashPassword(password: string) {
  return hash(password, 12);
}

export async function verifyPassword(password: string, passwordHash: string) {
  return compare(password, passwordHash);
}

async function signSession(userId: string) {
  return new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(getSessionSecret());
}

export async function createSession(userId: string) {
  const token = await signSession(userId);
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: isProductionEnv(),
    path: "/",
    maxAge: SESSION_DURATION_SECONDS
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function getSessionUserId() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) {
    return null;
  }

  try {
    const verified = await jwtVerify(token, getSessionSecret());
    return typeof verified.payload.sub === "string" ? verified.payload.sub : null;
  } catch {
    return null;
  }
}

export async function ensureBootstrapAdmin(input: {
  userId: string;
  email: string;
  currentRole?: UserGlobalRole;
}) {
  const normalizedEmail = input.email.trim().toLowerCase();

  if (!getBootstrapAdminEmails().has(normalizedEmail)) {
    return input.currentRole ?? null;
  }

  if (input.currentRole === "ADMIN") {
    return "ADMIN" as const;
  }

  const db = getDb();
  const adminsCount = await db.user.count({
    where: {
      globalRole: "ADMIN"
    }
  });

  if (adminsCount > 0) {
    return input.currentRole ?? null;
  }

  await db.user.update({
    where: {
      id: input.userId
    },
    data: {
      globalRole: "ADMIN",
      isActive: true
    }
  });

  return "ADMIN" as const;
}

export const getCurrentUser = cache(async () => {
  const userId = await getSessionUserId();

  if (!userId) {
    return null;
  }

  if (isDemoUserId(userId)) {
    if (!isDemoAuthEnabled()) {
      return null;
    }

    return getDemoUserById(userId);
  }

  try {
    const user = await getDb().user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        globalRole: true,
        isActive: true,
        createdAt: true
      }
    });

    if (!user) {
      return null;
    }

    const bootstrappedRole = await ensureBootstrapAdmin({
      userId: user.id,
      email: user.email,
      currentRole: user.globalRole
    });

    return {
      ...user,
      globalRole: bootstrappedRole ?? user.globalRole
    };
  } catch (error) {
    if (isDatabaseConnectionError(error)) {
      return null;
    }

    throw error;
  }
});

export async function requireUser(returnTo?: string) {
  const user = await getCurrentUser();

  if (!user) {
    const next = returnTo ? `?next=${encodeURIComponent(returnTo)}` : "";
    redirect(`/acceder${next}`);
  }

  if (!user.isActive) {
    await clearSession();
    redirect("/acceder?inactive=1");
  }

  return user;
}

import { compare, hash } from "bcryptjs";
import type { UserGlobalRole } from "@prisma/client";
import { redirect } from "next/navigation";
import { cache } from "react";
import { getDemoUserById, isDemoUserId } from "@/lib/demo-auth";
import {
  isDatabaseConnectionError,
  isMissingDatabaseFieldError
} from "@/lib/db-errors";
import {
  getRequiredEnv,
  isDemoAuthEnabled,
  isEmailVerificationRequired
} from "@/lib/env";
import { getDb } from "@/lib/prisma";
import {
  clearCurrentUserSession,
  createUserSession,
  getCurrentSessionUserId
} from "@/lib/user-sessions";

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

export async function hashPassword(password: string) {
  return hash(password, 12);
}

export async function verifyPassword(password: string, passwordHash: string) {
  return compare(password, passwordHash);
}

export async function createSession(userId: string) {
  await createUserSession(userId);
}

export async function clearSession() {
  await clearCurrentUserSession();
}

async function getUserEmailVerificationDate(userId: string) {
  try {
    const user = await getDb().user.findUnique({
      where: {
        id: userId
      },
      select: {
        emailVerifiedAt: true
      }
    });

    return user?.emailVerifiedAt ?? null;
  } catch (error) {
    if (isMissingDatabaseFieldError(error, "emailVerifiedAt")) {
      return null;
    }

    throw error;
  }
}

export async function getSessionUserId() {
  return getCurrentSessionUserId();
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
    const emailVerifiedAt = isEmailVerificationRequired()
      ? await getUserEmailVerificationDate(user.id)
      : null;

    return {
      ...user,
      emailVerifiedAt,
      globalRole: bootstrappedRole ?? user.globalRole
    };
  } catch (error) {
    if (isDatabaseConnectionError(error)) {
      throw error;
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

  if (isEmailVerificationRequired() && !user.emailVerifiedAt) {
    redirect("/verificacion-pendiente");
  }

  return user;
}

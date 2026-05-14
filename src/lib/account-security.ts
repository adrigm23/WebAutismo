import { createHash, randomBytes } from "crypto";
import { hashPassword } from "@/lib/auth";
import {
  getEmailVerificationTokenTtlHours,
  getPasswordResetTokenTtlMinutes
} from "@/lib/env";
import { getDb } from "@/lib/prisma";

function hashOpaqueToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function createOpaqueToken() {
  return randomBytes(32).toString("hex");
}

function addMinutes(baseDate: Date, minutes: number) {
  return new Date(baseDate.getTime() + minutes * 60 * 1_000);
}

function addHours(baseDate: Date, hours: number) {
  return new Date(baseDate.getTime() + hours * 60 * 60 * 1_000);
}

export async function issuePasswordResetToken(userId: string) {
  const token = createOpaqueToken();
  const tokenHash = hashOpaqueToken(token);
  const expiresAt = addMinutes(new Date(), getPasswordResetTokenTtlMinutes());

  await getDb().$transaction([
    getDb().userPasswordResetToken.deleteMany({
      where: {
        userId
      }
    }),
    getDb().userPasswordResetToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt
      }
    })
  ]);

  return {
    token,
    expiresAt
  };
}

export async function issueEmailVerificationToken(userId: string) {
  const token = createOpaqueToken();
  const tokenHash = hashOpaqueToken(token);
  const expiresAt = addHours(new Date(), getEmailVerificationTokenTtlHours());

  await getDb().$transaction([
    getDb().userEmailVerificationToken.deleteMany({
      where: {
        userId
      }
    }),
    getDb().userEmailVerificationToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt
      }
    })
  ]);

  return {
    token,
    expiresAt
  };
}

async function getActivePasswordResetToken(rawToken: string) {
  return getDb().userPasswordResetToken.findUnique({
    where: {
      tokenHash: hashOpaqueToken(rawToken)
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          isActive: true
        }
      }
    }
  });
}

async function getActiveEmailVerificationToken(rawToken: string) {
  return getDb().userEmailVerificationToken.findUnique({
    where: {
      tokenHash: hashOpaqueToken(rawToken)
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          isActive: true,
          emailVerifiedAt: true
        }
      }
    }
  });
}

function isExpired(expiresAt: Date) {
  return expiresAt.getTime() <= Date.now();
}

export async function validatePasswordResetToken(rawToken: string) {
  const record = await getActivePasswordResetToken(rawToken);

  if (!record || record.usedAt || isExpired(record.expiresAt) || !record.user.isActive) {
    return null;
  }

  return record;
}

export async function consumePasswordResetToken(input: {
  token: string;
  nextPassword: string;
}) {
  const record = await validatePasswordResetToken(input.token);

  if (!record) {
    return null;
  }

  const passwordHash = await hashPassword(input.nextPassword);

  await getDb().$transaction([
    getDb().user.update({
      where: {
        id: record.userId
      },
      data: {
        passwordHash
      }
    }),
    getDb().userPasswordResetToken.update({
      where: {
        id: record.id
      },
      data: {
        usedAt: new Date()
      }
    }),
    getDb().userPasswordResetToken.deleteMany({
      where: {
        userId: record.userId,
        id: {
          not: record.id
        }
      }
    })
  ]);

  return record.user;
}

export async function validateEmailVerificationToken(rawToken: string) {
  const record = await getActiveEmailVerificationToken(rawToken);

  if (
    !record ||
    record.usedAt ||
    isExpired(record.expiresAt) ||
    !record.user.isActive ||
    record.user.emailVerifiedAt
  ) {
    return null;
  }

  return record;
}

export async function consumeEmailVerificationToken(rawToken: string) {
  const record = await validateEmailVerificationToken(rawToken);

  if (!record) {
    return null;
  }

  await getDb().$transaction([
    getDb().user.update({
      where: {
        id: record.userId
      },
      data: {
        emailVerifiedAt: new Date()
      }
    }),
    getDb().userEmailVerificationToken.update({
      where: {
        id: record.id
      },
      data: {
        usedAt: new Date()
      }
    }),
    getDb().userEmailVerificationToken.deleteMany({
      where: {
        userId: record.userId,
        id: {
          not: record.id
        }
      }
    })
  ]);

  return record.user;
}

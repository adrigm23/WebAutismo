"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { issueEmailVerificationToken } from "@/lib/account-security";
import { writeAuditLog } from "@/lib/audit";
import { createSession, ensureBootstrapAdmin, hashPassword, verifyPassword } from "@/lib/auth";
import { getDemoUserByEmail, isValidDemoPassword } from "@/lib/demo-auth";
import {
  isDatabaseConnectionError,
  isDatabaseSchemaDriftError,
  isMissingDatabaseFieldError
} from "@/lib/db-errors";
import { canSendEmailMessage, sendEmailVerificationEmail } from "@/lib/email";
import { isEmailVerificationRequired } from "@/lib/env";
import { getDb } from "@/lib/prisma";
import { buildRequestFingerprint } from "@/lib/request-client";
import { getSafeRedirect } from "@/lib/redirect";
import { consumeRateLimit } from "@/lib/rate-limit";

export type AuthFormState = {
  error?: string;
};

const registerSchema = z
  .object({
    name: z.string().min(2, "Introduce tu nombre."),
    email: z.string().email("Introduce un email válido."),
    password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres."),
    confirmPassword: z.string().min(8, "Confirma la contraseña."),
    next: z.string().optional()
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden.",
    path: ["confirmPassword"]
  });

const loginSchema = z.object({
  email: z.string().email("Introduce un email válido."),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres."),
  next: z.string().optional()
});

const INVALID_LOGIN_MESSAGE = "Credenciales no válidas.";
const DUMMY_PASSWORD_HASH = "$2b$10$UVxjH7726JLyAsVadN8HVe3Kt0jMDfhJESSea8meSy76yz/Tm3sKy";

function getOptionalString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function getDefaultPrivateRedirect(globalRole: "STUDENT" | "TEACHER" | "ADMIN") {
  return globalRole === "ADMIN" ? "/admin" : "/mi-cuenta";
}

async function createUserWithOptionalEmailVerification(input: {
  name: string;
  email: string;
  passwordHash: string;
}) {
  const db = getDb();
  const verificationRequired = isEmailVerificationRequired();
  const baseData = {
    name: input.name.trim(),
    email: input.email,
    passwordHash: input.passwordHash,
    notificationPreference: {
      create: {}
    }
  };

  try {
    return await db.user.create({
      data: verificationRequired
        ? baseData
        : {
            ...baseData,
            emailVerifiedAt: new Date()
          }
    });
  } catch (error) {
    if (!isMissingDatabaseFieldError(error, "emailVerifiedAt")) {
      throw error;
    }

    if (verificationRequired) {
      throw new Error(
        "La verificación por correo requiere aplicar la migración pendiente de la base de datos."
      );
    }

    return db.user.create({
      data: baseData
    });
  }
}

async function getUserForLogin(email: string) {
  return getDb().user.findUnique({
    where: {
      email
    },
    select: {
      id: true,
      email: true,
      passwordHash: true,
      isActive: true,
      globalRole: true
    }
  });
}

async function getEmailVerificationStateForLogin(userId: string) {
  try {
    const user = await getDb().user.findUnique({
      where: {
        id: userId
      },
      select: {
        emailVerifiedAt: true
      }
    });

    return {
      emailVerifiedAt: user?.emailVerifiedAt ?? null,
      schemaReady: true
    };
  } catch (error) {
    if (isMissingDatabaseFieldError(error, "emailVerifiedAt")) {
      return {
        emailVerifiedAt: null,
        schemaReady: false
      };
    }

    throw error;
  }
}

export async function registerAction(
  _: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  try {
    if (isEmailVerificationRequired() && !canSendEmailMessage()) {
      return {
        error:
          "La verificación obligatoria por email está activada, pero el envío de correo no está configurado."
      };
    }

    const parsed = registerSchema.safeParse({
      name: formData.get("name"),
      email: formData.get("email"),
      password: formData.get("password"),
      confirmPassword: formData.get("confirmPassword"),
      next: getOptionalString(formData, "next")
    });

    if (!parsed.success) {
      return {
        error: parsed.error.issues[0]?.message || "Revisa los datos del formulario."
      }
    }

    const db = getDb();
    const normalizedEmail = parsed.data.email.toLowerCase();
    const existingUser = await db.user.findUnique({
      where: { email: normalizedEmail }
    });

    if (existingUser) {
      return { error: "Ya existe una cuenta con ese correo." };
    }

    const passwordHash = await hashPassword(parsed.data.password);
    const user = await createUserWithOptionalEmailVerification({
      name: parsed.data.name,
      email: normalizedEmail,
      passwordHash
    });

    const globalRole =
      (await ensureBootstrapAdmin({
        userId: user.id,
        email: user.email,
        currentRole: user.globalRole
      })) ?? user.globalRole;

    await writeAuditLog({
      actorId: user.id,
      action: "USER_CREATED",
      entityType: "USER",
      entityId: user.id,
      entityLabel: user.email,
      metadata: {
        globalRole
      }
    });

    if (isEmailVerificationRequired()) {
      const verificationToken = await issueEmailVerificationToken(user.id);

      await sendEmailVerificationEmail({
        email: user.email,
        name: user.name,
        token: verificationToken.token,
        expiresAt: verificationToken.expiresAt
      });

      redirect("/acceder?verify=1");
    }

    await createSession(user.id);
    redirect(getSafeRedirect(parsed.data.next, getDefaultPrivateRedirect(globalRole)));
  } catch (error) {
    if (isDatabaseConnectionError(error)) {
      return {
        error: "No se puede conectar con la base de datos en este momento. Revisa DATABASE_URL en Vercel."
      };
    }

    if (isDatabaseSchemaDriftError(error)) {
      return {
        error:
          "La aplicación necesita aplicar la migración pendiente de la base de datos antes de completar esta operación."
      };
    }

    throw error;
  }
}

export async function loginAction(
  _: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  try {
    const parsed = loginSchema.safeParse({
      email: formData.get("email"),
      password: formData.get("password"),
      next: getOptionalString(formData, "next")
    });

    if (!parsed.success) {
      return {
        error: parsed.error.issues[0]?.message || "Revisa los datos del formulario."
      };
    }

    const requestHeaders = await headers();
    const loginRateLimit = consumeRateLimit({
      bucket: "login",
      key: buildRequestFingerprint(requestHeaders, [parsed.data.email]),
      limit: 5,
      windowMs: 10 * 60 * 1_000
    });

    if (!loginRateLimit.allowed) {
      return {
        error: `Demasiados intentos de acceso. Espera ${loginRateLimit.retryAfterSeconds} segundos antes de volver a intentarlo.`
      };
    }

    const demoUser = getDemoUserByEmail(parsed.data.email);

    if (demoUser) {
      if (!isValidDemoPassword(parsed.data.password)) {
        return { error: INVALID_LOGIN_MESSAGE };
      }

      await createSession(demoUser.id);
      redirect(
        getSafeRedirect(parsed.data.next, getDefaultPrivateRedirect(demoUser.globalRole))
      );
    }

    const user = await getUserForLogin(parsed.data.email.toLowerCase());

    const passwordHash = user?.passwordHash ?? DUMMY_PASSWORD_HASH;
    const isValidPassword = await verifyPassword(parsed.data.password, passwordHash);

    if (!user) {
      return { error: INVALID_LOGIN_MESSAGE };
    }

    if (!isValidPassword) {
      return { error: INVALID_LOGIN_MESSAGE };
    }

    if (!user.isActive) {
      return { error: "Tu cuenta está desactivada. Contacta con administración." };
    }

    if (isEmailVerificationRequired()) {
      const verificationState = await getEmailVerificationStateForLogin(user.id);

      if (!verificationState.schemaReady) {
        return {
          error:
            "El acceso con verificación de correo todavía no está disponible en este entorno. Aplica la migración pendiente de la base de datos."
        };
      }

      if (!verificationState.emailVerifiedAt) {
        return {
          error: "Debes verificar tu correo electrónico antes de acceder al campus."
        };
      }
    }

    const globalRole =
      (await ensureBootstrapAdmin({
        userId: user.id,
        email: user.email,
        currentRole: user.globalRole
      })) ?? user.globalRole;

    await createSession(user.id);
    redirect(getSafeRedirect(parsed.data.next, getDefaultPrivateRedirect(globalRole)));
  } catch (error) {
    if (isDatabaseConnectionError(error)) {
      return {
        error: "No se puede conectar con la base de datos en este momento. Revisa DATABASE_URL en Vercel."
      };
    }

    if (isDatabaseSchemaDriftError(error)) {
      return {
        error:
          "La aplicación necesita aplicar la migración pendiente de la base de datos antes de completar esta operación."
      };
    }

    throw error;
  }
}

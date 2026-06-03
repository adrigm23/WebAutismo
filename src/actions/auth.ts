"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";
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
import { createRequestLogger, getRequestIdFromHeaders } from "@/lib/logger";
import { getDb } from "@/lib/prisma";
import { buildRequestFingerprint } from "@/lib/request-client";
import {
  getDefaultPrivateRedirect,
  getPostLoginRedirect,
  getSafeRedirect,
} from "@/lib/redirect";
import { consumeRateLimit } from "@/lib/rate-limit";

export type AuthFormState = {
  error?: string;
  fields?: {
    name?: string;
    email?: string;
  };
};

const registerSchema = z
  .object({
    name: z.string().min(2, "Introduce tu nombre."),
    email: z.string().email("Introduce un email valido."),
    password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres."),
    confirmPassword: z.string().min(8, "Confirma la contraseña."),
    next: z.string().optional()
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden.",
    path: ["confirmPassword"]
  });

const loginSchema = z.object({
  email: z.string().email("Introduce un email valido."),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres."),
  next: z.string().optional()
});

const INVALID_LOGIN_MESSAGE = "Credenciales no válidas.";
const DUMMY_PASSWORD_HASH = "$2b$10$UVxjH7726JLyAsVadN8HVe3Kt0jMDfhJESSea8meSy76yz/Tm3sKy";

function getOptionalString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function getRegisterFieldState(formData: FormData): NonNullable<AuthFormState["fields"]> {
  return {
    name: getOptionalString(formData, "name") ?? "",
    email: getOptionalString(formData, "email") ?? ""
  };
}

function getLoginFieldState(formData: FormData): NonNullable<AuthFormState["fields"]> {
  return {
    email: getOptionalString(formData, "email") ?? ""
  };
}

function createAuthLogger(input: {
  requestHeaders: Headers;
  action: "register" | "login";
  userId?: string | null;
}) {
  return createRequestLogger({
    requestId: getRequestIdFromHeaders(input.requestHeaders),
    route: "auth",
    action: input.action,
    userId: input.userId ?? null
  });
}

function isRedirectSignal(error: unknown) {
  return isRedirectError(error) || (error instanceof Error && error.message.startsWith("REDIRECT:"));
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
        "La verificacion por correo requiere aplicar la migracion pendiente de la base de datos."
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
  const requestHeaders = await headers();
  const authLogger = createAuthLogger({
    requestHeaders,
    action: "register"
  });
  const startedAt = Date.now();

  try {
    if (isEmailVerificationRequired() && !canSendEmailMessage()) {
      authLogger.warn("Registration blocked because email delivery is not configured.", {
        result: "email-config-missing",
        durationMs: Date.now() - startedAt
      });
      return {
        error:
          "La verificacion obligatoria por email esta activada, pero el envio de correo no esta configurado.",
        fields: getRegisterFieldState(formData)
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
      authLogger.warn("Registration rejected because form validation failed.", {
        result: "invalid-form",
        durationMs: Date.now() - startedAt
      });
      return {
        error: parsed.error.issues[0]?.message || "Revisa los datos del formulario.",
        fields: getRegisterFieldState(formData)
      };
    }

    const normalizedEmail = parsed.data.email.toLowerCase();
    const registerRateLimit = await consumeRateLimit({
      bucket: "register",
      key: buildRequestFingerprint(requestHeaders, [parsed.data.email]),
      limit: 5,
      windowMs: 10 * 60 * 1_000
    });

    if (!registerRateLimit.allowed) {
      authLogger.warn("Registration rate limited.", {
        email: normalizedEmail,
        result: "rate-limited",
        durationMs: Date.now() - startedAt
      });
      return {
        error: `Demasiados intentos de registro. Espera ${registerRateLimit.retryAfterSeconds} segundos antes de volver a intentarlo.`,
        fields: getRegisterFieldState(formData)
      };
    }

    const db = getDb();
    const existingUser = await db.user.findUnique({
      where: { email: normalizedEmail }
    });

    if (existingUser) {
      authLogger.warn("Registration rejected because the email already exists.", {
        email: normalizedEmail,
        result: "duplicate-email",
        durationMs: Date.now() - startedAt
      });
      return {
        error: "Ya existe una cuenta con ese correo.",
        fields: getRegisterFieldState(formData)
      };
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

      authLogger.info("Registration completed and email verification was requested.", {
        userId: user.id,
        email: user.email,
        globalRole,
        result: "verification-pending",
        durationMs: Date.now() - startedAt
      });

      redirect("/acceder?verify=1");
    }

    await createSession(user.id);
    authLogger.info("Registration completed and session created.", {
      userId: user.id,
      email: user.email,
      globalRole,
      result: "registered",
      durationMs: Date.now() - startedAt
    });
    redirect(getSafeRedirect(parsed.data.next, getDefaultPrivateRedirect(globalRole)));
  } catch (error) {
    if (isRedirectSignal(error)) {
      throw error;
    }

    if (isDatabaseConnectionError(error)) {
      authLogger.error("Registration failed because the database is unavailable.", {
        result: "database-unavailable",
        durationMs: Date.now() - startedAt,
        error: error instanceof Error ? error : new Error(String(error))
      });
      return {
        error: "No se puede conectar con la base de datos en este momento. Revisa DATABASE_URL en Vercel.",
        fields: getRegisterFieldState(formData)
      };
    }

    if (isDatabaseSchemaDriftError(error)) {
      authLogger.error("Registration failed because the database schema is outdated.", {
        result: "schema-drift",
        durationMs: Date.now() - startedAt,
        error: error instanceof Error ? error : new Error(String(error))
      });
      return {
        error:
          "La aplicacion necesita aplicar la migracion pendiente de la base de datos antes de completar esta operacion.",
        fields: getRegisterFieldState(formData)
      };
    }

    authLogger.error("Registration failed unexpectedly.", {
      result: "failed",
      durationMs: Date.now() - startedAt,
      error: error instanceof Error ? error : new Error(String(error))
    });
    throw error;
  }
}

export async function loginAction(
  _: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const requestHeaders = await headers();
  const authLogger = createAuthLogger({
    requestHeaders,
    action: "login"
  });
  const startedAt = Date.now();

  try {
    const parsed = loginSchema.safeParse({
      email: formData.get("email"),
      password: formData.get("password"),
      next: getOptionalString(formData, "next")
    });

    if (!parsed.success) {
      authLogger.warn("Login rejected because form validation failed.", {
        result: "invalid-form",
        durationMs: Date.now() - startedAt
      });
      return {
        error: parsed.error.issues[0]?.message || "Revisa los datos del formulario.",
        fields: getLoginFieldState(formData)
      };
    }

    const normalizedEmail = parsed.data.email.toLowerCase();
    const loginRateLimit = await consumeRateLimit({
      bucket: "login",
      key: buildRequestFingerprint(requestHeaders, [parsed.data.email]),
      limit: 5,
      windowMs: 10 * 60 * 1_000
    });

    if (!loginRateLimit.allowed) {
      authLogger.warn("Login rate limited.", {
        email: normalizedEmail,
        result: "rate-limited",
        durationMs: Date.now() - startedAt
      });
      return {
        error: `Demasiados intentos de acceso. Espera ${loginRateLimit.retryAfterSeconds} segundos antes de volver a intentarlo.`,
        fields: getLoginFieldState(formData)
      };
    }

    const demoUser = getDemoUserByEmail(parsed.data.email);

    if (demoUser) {
      if (!isValidDemoPassword(parsed.data.password)) {
        authLogger.warn("Demo login rejected because the password is invalid.", {
          email: normalizedEmail,
          result: "invalid-demo-password",
          durationMs: Date.now() - startedAt
        });
        return {
          error: INVALID_LOGIN_MESSAGE,
          fields: getLoginFieldState(formData)
        };
      }

      await createSession(demoUser.id);
      authLogger.info("Demo login granted.", {
        userId: demoUser.id,
        email: demoUser.email,
        globalRole: demoUser.globalRole,
        result: "logged-in-demo",
        durationMs: Date.now() - startedAt
      });
      redirect(getPostLoginRedirect(parsed.data.next, demoUser.globalRole));
    }

    const user = await getUserForLogin(normalizedEmail);
    const passwordHash = user?.passwordHash ?? DUMMY_PASSWORD_HASH;
    const isValidPassword = await verifyPassword(parsed.data.password, passwordHash);

    if (!user) {
      authLogger.warn("Login rejected because the account does not exist.", {
        email: normalizedEmail,
        result: "missing-user",
        durationMs: Date.now() - startedAt
      });
      return {
        error: INVALID_LOGIN_MESSAGE,
        fields: getLoginFieldState(formData)
      };
    }

    if (!isValidPassword) {
      authLogger.warn("Login rejected because the password is invalid.", {
        userId: user.id,
        email: user.email,
        result: "invalid-password",
        durationMs: Date.now() - startedAt
      });
      return {
        error: INVALID_LOGIN_MESSAGE,
        fields: getLoginFieldState(formData)
      };
    }

    if (!user.isActive) {
      authLogger.warn("Login rejected because the account is inactive.", {
        userId: user.id,
        email: user.email,
        result: "inactive-account",
        durationMs: Date.now() - startedAt
      });
      return {
        error: "Tu cuenta esta desactivada. Contacta con administracion.",
        fields: getLoginFieldState(formData)
      };
    }

    if (isEmailVerificationRequired()) {
      const verificationState = await getEmailVerificationStateForLogin(user.id);

      if (!verificationState.schemaReady) {
        authLogger.warn("Login rejected because email verification schema is missing.", {
          userId: user.id,
          email: user.email,
          result: "verification-schema-missing",
          durationMs: Date.now() - startedAt
        });
        return {
          error:
            "El acceso con verificacion de correo todavia no esta disponible en este entorno. Aplica la migracion pendiente de la base de datos.",
          fields: getLoginFieldState(formData)
        };
      }

      if (!verificationState.emailVerifiedAt) {
        authLogger.warn("Login rejected because the email is not verified.", {
          userId: user.id,
          email: user.email,
          result: "email-not-verified",
          durationMs: Date.now() - startedAt
        });
        return {
          error: "Debes verificar tu correo electrónico antes de acceder al campus.",
          fields: getLoginFieldState(formData)
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
    authLogger.info("Login completed and session created.", {
      userId: user.id,
      email: user.email,
      globalRole,
      result: "logged-in",
      durationMs: Date.now() - startedAt
    });
    redirect(getPostLoginRedirect(parsed.data.next, globalRole));
  } catch (error) {
    if (isRedirectSignal(error)) {
      throw error;
    }

    if (isDatabaseConnectionError(error)) {
      authLogger.error("Login failed because the database is unavailable.", {
        result: "database-unavailable",
        durationMs: Date.now() - startedAt,
        error: error instanceof Error ? error : new Error(String(error))
      });
      return {
        error: "No se puede conectar con la base de datos en este momento. Revisa DATABASE_URL en Vercel.",
        fields: getLoginFieldState(formData)
      };
    }

    if (isDatabaseSchemaDriftError(error)) {
      authLogger.error("Login failed because the database schema is outdated.", {
        result: "schema-drift",
        durationMs: Date.now() - startedAt,
        error: error instanceof Error ? error : new Error(String(error))
      });
      return {
        error:
          "La aplicacion necesita aplicar la migracion pendiente de la base de datos antes de completar esta operacion.",
        fields: getLoginFieldState(formData)
      };
    }

    authLogger.error("Login failed unexpectedly.", {
      result: "failed",
      durationMs: Date.now() - startedAt,
      error: error instanceof Error ? error : new Error(String(error))
    });
    throw error;
  }
}

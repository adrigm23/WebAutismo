"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  consumePasswordResetToken,
  issueEmailVerificationToken,
  issuePasswordResetToken
} from "@/lib/account-security";
import { clearSession, getCurrentUser } from "@/lib/auth";
import { canSendEmailMessage, sendEmailVerificationEmail, sendPasswordResetEmail } from "@/lib/email";
import { createRequestLogger, getRequestIdFromHeaders } from "@/lib/logger";
import { getDb } from "@/lib/prisma";
import { buildRequestFingerprint } from "@/lib/request-client";
import { consumeRateLimit } from "@/lib/rate-limit";
import { revokeUserSessions } from "@/lib/user-sessions";

export type AccountSecurityFormState = {
  error?: string;
  success?: string;
};

const passwordResetRequestSchema = z.object({
  email: z.string().email("Introduce un email valido.")
});

const passwordResetSchema = z
  .object({
    token: z.string().min(1, "Falta el token de recuperacion."),
    password: z.string().min(8, "La contrasena debe tener al menos 8 caracteres."),
    confirmPassword: z.string().min(8, "Confirma la contrasena.")
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contrasenas no coinciden.",
    path: ["confirmPassword"]
  });

const EMAIL_DELIVERY_DISABLED_MESSAGE =
  "El envio de correo no esta configurado en este entorno.";

function createAccountSecurityLogger(input: {
  requestHeaders: Headers;
  action: "request-password-reset" | "reset-password" | "resend-email-verification";
  userId?: string | null;
}) {
  return createRequestLogger({
    requestId: getRequestIdFromHeaders(input.requestHeaders),
    route: "account-security",
    action: input.action,
    userId: input.userId ?? null
  });
}

export async function requestPasswordResetAction(
  _: AccountSecurityFormState,
  formData: FormData
): Promise<AccountSecurityFormState> {
  const requestHeaders = await headers();
  const accountSecurityLogger = createAccountSecurityLogger({
    requestHeaders,
    action: "request-password-reset"
  });
  const parsed = passwordResetRequestSchema.safeParse({
    email: formData.get("email")
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Revisa el correo introducido."
    };
  }

  if (!canSendEmailMessage()) {
    return {
      error: EMAIL_DELIVERY_DISABLED_MESSAGE
    };
  }

  const normalizedEmail = parsed.data.email.toLowerCase();
  const rateLimit = await consumeRateLimit({
    bucket: "password-reset-request",
    key: buildRequestFingerprint(requestHeaders, [normalizedEmail]),
    limit: 3,
    windowMs: 15 * 60 * 1_000
  });

  if (!rateLimit.allowed) {
    accountSecurityLogger.warn("Password reset request rate limited.", {
      email: normalizedEmail,
      result: "rate-limited"
    });
    return {
      error: `Has alcanzado el limite temporal de recuperacion. Espera ${rateLimit.retryAfterSeconds} segundos antes de volver a intentarlo.`
    };
  }

  const user = await getDb().user.findUnique({
    where: {
      email: normalizedEmail
    },
    select: {
      id: true,
      email: true,
      name: true,
      isActive: true
    }
  });

  if (user?.isActive) {
    const resetToken = await issuePasswordResetToken(user.id);

    await sendPasswordResetEmail({
      email: user.email,
      name: user.name,
      token: resetToken.token,
      expiresAt: resetToken.expiresAt
    });
  }

  return {
    success:
      "Si existe una cuenta activa asociada a ese correo, acabamos de enviar instrucciones para restablecer la contrasena."
  };
}

export async function resetPasswordAction(
  _: AccountSecurityFormState,
  formData: FormData
): Promise<AccountSecurityFormState> {
  const requestHeaders = await headers();
  const accountSecurityLogger = createAccountSecurityLogger({
    requestHeaders,
    action: "reset-password"
  });
  const parsed = passwordResetSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword")
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Revisa la nueva contrasena."
    };
  }

  const rateLimit = await consumeRateLimit({
    bucket: "password-reset-consume",
    key: buildRequestFingerprint(requestHeaders, [parsed.data.token]),
    limit: 5,
    windowMs: 15 * 60 * 1_000
  });

  if (!rateLimit.allowed) {
    accountSecurityLogger.warn("Password reset confirmation rate limited.", {
      result: "rate-limited"
    });
    return {
      error: `Has alcanzado el limite temporal para restablecer la contrasena. Espera ${rateLimit.retryAfterSeconds} segundos antes de volver a intentarlo.`
    };
  }

  const user = await consumePasswordResetToken({
    token: parsed.data.token,
    nextPassword: parsed.data.password
  });

  if (!user) {
    return {
      error: "El enlace de recuperacion no es valido o ya ha caducado."
    };
  }

  await revokeUserSessions({
    userId: user.id
  });
  await clearSession();
  redirect("/acceder?reset=1");
}

export async function resendEmailVerificationAction(formData: FormData) {
  const requestHeaders = await headers();
  const nextPath = String(formData.get("nextPath") ?? "/verificacion-pendiente");
  const user = await getCurrentUser();

  if (!user) {
    redirect("/acceder");
  }

  if (user.emailVerifiedAt) {
    redirect("/mi-cuenta");
  }

  if (!canSendEmailMessage()) {
    redirect(`${nextPath}?error=email-delivery`);
  }

  const accountSecurityLogger = createAccountSecurityLogger({
    requestHeaders,
    action: "resend-email-verification",
    userId: user.id
  });
  const rateLimit = await consumeRateLimit({
    bucket: "email-verification-resend",
    key: buildRequestFingerprint(requestHeaders, [user.id, user.email]),
    limit: 3,
    windowMs: 15 * 60 * 1_000
  });

  if (!rateLimit.allowed) {
    accountSecurityLogger.warn("Email verification resend rate limited.", {
      email: user.email,
      result: "rate-limited"
    });
    redirect(`${nextPath}?error=rate-limited`);
  }

  const verificationToken = await issueEmailVerificationToken(user.id);

  await sendEmailVerificationEmail({
    email: user.email,
    name: user.name,
    token: verificationToken.token,
    expiresAt: verificationToken.expiresAt
  });

  redirect(`${nextPath}?sent=1`);
}

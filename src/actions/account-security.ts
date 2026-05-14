"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import {
  consumePasswordResetToken,
  issueEmailVerificationToken,
  issuePasswordResetToken
} from "@/lib/account-security";
import { clearSession, getCurrentUser } from "@/lib/auth";
import { canSendEmailMessage, sendEmailVerificationEmail, sendPasswordResetEmail } from "@/lib/email";
import { getDb } from "@/lib/prisma";

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

export async function requestPasswordResetAction(
  _: AccountSecurityFormState,
  formData: FormData
): Promise<AccountSecurityFormState> {
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

  const user = await getDb().user.findUnique({
    where: {
      email: parsed.data.email.toLowerCase()
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

  const user = await consumePasswordResetToken({
    token: parsed.data.token,
    nextPassword: parsed.data.password
  });

  if (!user) {
    return {
      error: "El enlace de recuperacion no es valido o ya ha caducado."
    };
  }

  await clearSession();
  redirect("/acceder?reset=1");
}

export async function resendEmailVerificationAction(formData: FormData) {
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

  const verificationToken = await issueEmailVerificationToken(user.id);

  await sendEmailVerificationEmail({
    email: user.email,
    name: user.name,
    token: verificationToken.token,
    expiresAt: verificationToken.expiresAt
  });

  redirect(`${nextPath}?sent=1`);
}

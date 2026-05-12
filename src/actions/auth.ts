"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { writeAuditLog } from "@/lib/audit";
import { createSession, ensureBootstrapAdmin, hashPassword, verifyPassword } from "@/lib/auth";
import { getDemoUserByEmail, isValidDemoPassword } from "@/lib/demo-auth";
import { isDatabaseConnectionError } from "@/lib/db-errors";
import { getDb } from "@/lib/prisma";
import { getSafeRedirect } from "@/lib/redirect";

export type AuthFormState = {
  error?: string;
};

const registerSchema = z
  .object({
    name: z.string().min(2, "Introduce tu nombre."),
    email: z.string().email("Introduce un email valido."),
    password: z.string().min(8, "La contrasena debe tener al menos 8 caracteres."),
    confirmPassword: z.string().min(8, "Confirma la contrasena."),
    next: z.string().optional()
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contrasenas no coinciden.",
    path: ["confirmPassword"]
  });

const loginSchema = z.object({
  email: z.string().email("Introduce un email valido."),
  password: z.string().min(8, "La contrasena debe tener al menos 8 caracteres."),
  next: z.string().optional()
});

function getOptionalString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

export async function registerAction(
  _: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  try {
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
    const user = await db.user.create({
      data: {
        name: parsed.data.name.trim(),
        email: normalizedEmail,
        passwordHash,
        notificationPreference: {
          create: {}
        }
      }
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

    await createSession(user.id);
    redirect(getSafeRedirect(parsed.data.next, "/mi-cuenta"));
  } catch (error) {
    if (isDatabaseConnectionError(error)) {
      return {
        error: "No se puede conectar con la base de datos en este momento. Revisa DATABASE_URL en Vercel."
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

    const demoUser = getDemoUserByEmail(parsed.data.email);

    if (demoUser) {
      if (!isValidDemoPassword(parsed.data.password)) {
        return { error: "La contrasena no es correcta." };
      }

      await createSession(demoUser.id);
      redirect(getSafeRedirect(parsed.data.next, "/mi-cuenta"));
    }

    const user = await getDb().user.findUnique({
      where: {
        email: parsed.data.email.toLowerCase()
      }
    });

    if (!user) {
      return { error: "No existe una cuenta con ese correo." };
    }

    if (!user.isActive) {
      return { error: "Tu cuenta esta desactivada. Contacta con administracion." };
    }

    const isValidPassword = await verifyPassword(parsed.data.password, user.passwordHash);

    if (!isValidPassword) {
      return { error: "La contrasena no es correcta." };
    }

    await ensureBootstrapAdmin({
      userId: user.id,
      email: user.email,
      currentRole: user.globalRole
    });

    await createSession(user.id);
    redirect(getSafeRedirect(parsed.data.next, "/mi-cuenta"));
  } catch (error) {
    if (isDatabaseConnectionError(error)) {
      return {
        error: "No se puede conectar con la base de datos en este momento. Revisa DATABASE_URL en Vercel."
      };
    }

    throw error;
  }
}

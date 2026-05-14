import { Resend } from "resend";
import { absoluteUrl, siteConfig } from "@/lib/site";

let resendClient: Resend | null = null;

function getResend() {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    return null;
  }

  if (!resendClient) {
    resendClient = new Resend(apiKey);
  }

  return resendClient;
}

export function canSendEmailMessage() {
  return Boolean(getResend() && process.env.EMAIL_FROM?.trim());
}

type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
};

type PurchaseEmailPayload = {
  courseTitle: string;
  email: string;
  name: string;
  slug: string;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export async function sendEmailMessage(input: SendEmailInput) {
  const resend = getResend();
  const from = process.env.EMAIL_FROM;

  if (!resend || !from) {
    return;
  }

  await resend.emails.send({
    from,
    to: input.to,
    subject: input.subject,
    html: input.html
  });
}

export async function sendNotificationEmail(input: {
  email: string;
  name: string;
  subject: string;
  title: string;
  body: string;
  actionLabel?: string;
  actionUrl?: string;
}) {
  const accountUrl = absoluteUrl("/mi-cuenta");
  const safeTitle = escapeHtml(input.title);
  const safeName = escapeHtml(input.name);
  const safeBody = escapeHtml(input.body);
  const safeActionLabel = input.actionLabel ? escapeHtml(input.actionLabel) : null;
  const safeActionUrl = input.actionUrl ? escapeHtml(input.actionUrl) : null;
  const safeAccountUrl = escapeHtml(accountUrl);
  const safeSiteName = escapeHtml(siteConfig.name);

  await sendEmailMessage({
    to: input.email,
    subject: input.subject,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #173039">
        <h1 style="font-size: 24px; margin-bottom: 12px;">${safeTitle}</h1>
        <p>Hola ${safeName},</p>
        <p>${safeBody}</p>
        ${
          safeActionLabel && safeActionUrl
            ? `<p><a href="${safeActionUrl}" style="display: inline-block; background: #0d6356; color: white; padding: 12px 18px; border-radius: 999px; text-decoration: none;">${safeActionLabel}</a></p>`
            : ""
        }
        <p>Tambien puedes revisar tu cuenta aqui:</p>
        <p><a href="${safeAccountUrl}">${safeAccountUrl}</a></p>
        <p>${safeSiteName}</p>
      </div>
    `
  });
}

export async function sendPurchaseConfirmationEmail(payload: PurchaseEmailPayload) {
  const accessUrl = absoluteUrl(`/mis-cursos/${payload.slug}`);

  await sendNotificationEmail({
    email: payload.email,
    name: payload.name,
    subject: `Ya tienes acceso a ${payload.courseTitle}`,
    title: "Compra confirmada",
    body: `Ya puedes acceder al curso ${payload.courseTitle}.`,
    actionLabel: "Acceder al curso",
    actionUrl: accessUrl
  });
}

export async function sendPasswordResetEmail(input: {
  email: string;
  name: string;
  token: string;
  expiresAt: Date;
}) {
  const resetUrl = absoluteUrl(`/restablecer-contrasena?token=${encodeURIComponent(input.token)}`);

  await sendNotificationEmail({
    email: input.email,
    name: input.name,
    subject: "Restablece tu contrasena",
    title: "Recuperacion de contrasena",
    body: `Hemos recibido una solicitud para restablecer tu contrasena. El enlace caduca el ${input.expiresAt.toLocaleString("es-ES")}. Si no has sido tu, puedes ignorar este mensaje.`,
    actionLabel: "Restablecer contrasena",
    actionUrl: resetUrl
  });
}

export async function sendEmailVerificationEmail(input: {
  email: string;
  name: string;
  token: string;
  expiresAt: Date;
}) {
  const verificationUrl = absoluteUrl(`/verificar-email?token=${encodeURIComponent(input.token)}`);

  await sendNotificationEmail({
    email: input.email,
    name: input.name,
    subject: "Verifica tu correo electronico",
    title: "Verificacion de email",
    body: `Confirma tu direccion de correo para activar completamente tu acceso al campus. El enlace caduca el ${input.expiresAt.toLocaleString("es-ES")}.`,
    actionLabel: "Verificar email",
    actionUrl: verificationUrl
  });
}

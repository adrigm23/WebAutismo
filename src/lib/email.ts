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

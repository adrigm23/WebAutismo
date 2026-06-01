import type { Metadata } from "next";
import Link from "next/link";
import { Clock, HelpCircle, Mail, MessageSquareText } from "lucide-react";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Soporte",
  description: "Centro de ayuda del campus de Autismo Cordoba.",
};

const faqs = [
  {
    question: "¿Cómo accedo a un curso después de comprarlo?",
    answer:
      "Una vez confirmado el pago, el acceso se activa automáticamente en tu cuenta. Entra en el campus con tu correo y contraseña y encontrarás el curso en \"Mis cursos\".",
  },
  {
    question: "¿Durante cuánto tiempo tengo acceso al curso?",
    answer:
      "El período de acceso depende de la edición en la que te inscribiste. Puedes consultarlo en la página del curso o en tu panel privado bajo \"Mis cursos\". Al finalizar la edición, se mantiene un período adicional de consulta.",
  },
  {
    question: "¿Puedo descargar los recursos y materiales?",
    answer:
      "Sí. Los recursos descargables de cada módulo están disponibles en la sección \"Recursos\" dentro de tu campus privado. Puedes descargarlos en cualquier momento mientras tengas acceso activo.",
  },
  {
    question: "¿Cómo obtengo mi certificado al terminar?",
    answer:
      "El certificado se genera automáticamente cuando completas todos los módulos del curso. Puedes descargarlo desde la sección de recursos o desde tu perfil en el campus.",
  },
  {
    question: "¿Qué hago si tengo problemas técnicos con el campus?",
    answer:
      "Escríbenos a " +
      siteConfig.supportEmail +
      " indicando tu correo de acceso, el curso afectado y una descripción del problema. Si puedes adjuntar una captura o el mensaje de error exacto, te ayudaremos más rápido.",
  },
];

export default function SupportPage() {
  const mailtoHref = `mailto:${siteConfig.supportEmail}?subject=${encodeURIComponent("Soporte campus Autismo Cordoba")}&body=${encodeURIComponent("Hola,\n\nNecesito ayuda con:\n\nCurso o pantalla afectada: \nDescripción del problema: \n\nGracias.")}`;

  return (
    <main className="min-h-screen bg-[var(--color-background)]">
      {/* Hero */}
      <div className="px-6 pb-12 pt-14 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-primary)]">
            Soporte
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em] text-[var(--color-ink)] sm:text-5xl">
            ¿En qué podemos ayudarte?
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-[var(--color-ink-soft)]">
            Si tienes dudas sobre el acceso, materiales, pagos o funcionamiento
            del campus, estamos aquí para resolverlas.
          </p>
        </div>
      </div>

      {/* Cards de primer nivel */}
      <div className="px-6 pb-12 lg:px-8">
        <div className="mx-auto max-w-3xl grid gap-4 sm:grid-cols-3">
          {/* Contacto */}
          <div className="rounded-[1.5rem] border border-[var(--color-border)] bg-white p-6 shadow-[0_8px_24px_rgba(34,34,33,0.04)]">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-brand-soft)] text-[var(--color-primary)]">
              <Mail className="h-5 w-5" />
            </div>
            <h2 className="mt-4 text-base font-semibold text-[var(--color-ink)]">
              Contacto directo
            </h2>
            <p className="mt-2 text-sm leading-6 text-[var(--color-ink-soft)]">
              Escríbenos a{" "}
              <a
                className="font-medium text-[var(--color-primary)] hover:underline"
                href={`mailto:${siteConfig.supportEmail}`}
              >
                {siteConfig.supportEmail}
              </a>{" "}
              con tu nombre y correo de acceso.
            </p>
          </div>

          {/* Tiempo de respuesta */}
          <div className="rounded-[1.5rem] border border-[var(--color-border)] bg-white p-6 shadow-[0_8px_24px_rgba(34,34,33,0.04)]">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-success-soft)] text-[var(--color-success)]">
              <Clock className="h-5 w-5" />
            </div>
            <h2 className="mt-4 text-base font-semibold text-[var(--color-ink)]">
              Tiempo de respuesta
            </h2>
            <p className="mt-2 text-sm leading-6 text-[var(--color-ink-soft)]">
              El equipo responde normalmente en{" "}
              <strong className="text-[var(--color-ink)]">
                24–48 horas hábiles
              </strong>{" "}
              desde la recepción del mensaje.
            </p>
          </div>

          {/* Comunidad */}
          <div className="rounded-[1.5rem] border border-[var(--color-border)] bg-white p-6 shadow-[0_8px_24px_rgba(34,34,33,0.04)]">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-accent-warm-soft)] text-[var(--color-accent-warm)]">
              <MessageSquareText className="h-5 w-5" />
            </div>
            <h2 className="mt-4 text-base font-semibold text-[var(--color-ink)]">
              Foro del curso
            </h2>
            <p className="mt-2 text-sm leading-6 text-[var(--color-ink-soft)]">
              Para dudas sobre el contenido, el foro privado de tu curso es el
              canal más rápido para recibir respuesta del equipo docente.
            </p>
          </div>
        </div>
      </div>

      {/* Qué incluir */}
      <div className="px-6 pb-12 lg:px-8">
        <div className="mx-auto max-w-3xl rounded-[1.5rem] border border-[var(--color-border)] bg-white p-8 shadow-[0_8px_24px_rgba(34,34,33,0.04)]">
          <h2 className="text-xl font-semibold text-[var(--color-ink)]">
            Qué incluir en tu mensaje
          </h2>
          <p className="mt-2 text-sm leading-7 text-[var(--color-ink-soft)]">
            Para que podamos ayudarte lo más rápido posible, incluye:
          </p>
          <ul className="mt-4 space-y-2">
            {[
              "El curso o pantalla donde aparece el problema.",
              "La hora aproximada y los pasos que seguiste.",
              "Una captura de pantalla o el mensaje de error exacto.",
              "Tu correo de acceso al campus.",
            ].map((item) => (
              <li
                key={item}
                className="flex items-start gap-3 text-sm leading-7 text-[var(--color-ink-soft)]"
              >
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-primary)]" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* FAQ */}
      <div className="px-6 pb-12 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <div className="mb-6 flex items-center gap-3">
            <HelpCircle className="h-5 w-5 shrink-0 text-[var(--color-primary)]" />
            <h2 className="text-xl font-semibold text-[var(--color-ink)]">
              Preguntas frecuentes
            </h2>
          </div>
          <div className="space-y-3">
            {faqs.map((faq) => (
              <details
                key={faq.question}
                className="group rounded-[1.25rem] border border-[var(--color-border)] bg-white px-6 shadow-[0_4px_12px_rgba(34,34,33,0.03)] open:shadow-[0_8px_24px_rgba(34,34,33,0.05)]"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 text-sm font-semibold text-[var(--color-ink)] hover:text-[var(--color-primary)] [&::-webkit-details-marker]:hidden">
                  {faq.question}
                  <span className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[var(--color-border)] text-[var(--color-muted)] transition group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="pb-5 text-sm leading-7 text-[var(--color-ink-soft)]">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="px-6 pb-16 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <a
            className="inline-flex items-center gap-2 rounded-full bg-[var(--color-primary)] px-6 py-3 text-sm font-medium text-white transition hover:opacity-90"
            href={mailtoHref}
          >
            <Mail className="h-4 w-4" />
            Contactar con soporte
          </a>
          <p className="mt-3 text-xs text-[var(--color-muted)]">
            O escríbenos directamente a{" "}
            <a
              className="text-[var(--color-primary)] hover:underline"
              href={`mailto:${siteConfig.supportEmail}`}
            >
              {siteConfig.supportEmail}
            </a>
            . La información legal está disponible en el{" "}
            <Link className="text-[var(--color-primary)] hover:underline" href="/legal">
              aviso legal
            </Link>
            .
          </p>
        </div>
      </div>
    </main>
  );
}

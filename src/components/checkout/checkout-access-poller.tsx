"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type CheckoutAccessPollerProps = {
  courseSlug: string;
  courseTitle: string;
  isDemo: boolean;
};

export function CheckoutAccessPoller({
  courseSlug,
  courseTitle,
  isDemo
}: CheckoutAccessPollerProps) {
  const router = useRouter();
  const [enrolled, setEnrolled] = useState(isDemo);

  useEffect(() => {
    if (isDemo) {
      return;
    }

    let cancelled = false;
    let attempts = 0;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    async function poll() {
      if (cancelled || attempts >= 12) {
        return;
      }

      attempts += 1;

      try {
        const response = await fetch(`/api/courses/${courseSlug}/enrollment`, {
          cache: "no-store"
        });

        if (response.ok) {
          const payload = (await response.json()) as { enrolled?: boolean };
          if (payload.enrolled) {
            setEnrolled(true);
            return;
          }
        }
      } catch {
        // Retry on transient errors.
      }

      timeoutId = setTimeout(poll, 2000);
    }

    poll();

    return () => {
      cancelled = true;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [courseSlug, isDemo]);

  useEffect(() => {
    if (enrolled) {
      router.prefetch(`/mis-cursos/${courseSlug}`);
    }
  }, [courseSlug, enrolled, router]);

  return (
    <Card className="w-full p-8 text-center lg:p-12">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-muted)]">
        {enrolled ? "Acceso listo" : "Preparando tu acceso"}
      </p>
      <h1 className="mt-4 text-display-lg font-semibold text-[var(--color-ink)]">
        {enrolled
          ? `Ya puedes entrar a "${courseTitle}"`
          : `Estamos activando "${courseTitle}"`}
      </h1>
      <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-[var(--color-muted)]">
        {enrolled
          ? "Tu matrícula ya está disponible en el campus. Puedes continuar con el primer módulo cuando quieras."
          : "En pocos segundos confirmaremos el pago y activaremos tu matrícula. No cierres esta ventana."}
      </p>
      {isDemo ? (
        <p className="mx-auto mt-4 max-w-xl rounded-xl bg-[var(--color-surface)] px-4 py-3 text-xs leading-6 text-[var(--color-muted)]">
          Flujo demo local: el acceso se activa de inmediato sin esperar al webhook de Stripe.
        </p>
      ) : null}
      {!enrolled ? (
        <div
          aria-hidden
          className="mx-auto mt-6 h-1.5 w-48 overflow-hidden rounded-full bg-[var(--color-surface)]"
        >
          <div className="h-full w-1/2 animate-pulse rounded-full bg-[var(--color-primary)]" />
        </div>
      ) : null}
      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        <ButtonLink
          aria-disabled={!enrolled}
          className={!enrolled ? "pointer-events-none opacity-50" : undefined}
          href={`/mis-cursos/${courseSlug}?onboarding=1`}
        >
          Ir al curso
        </ButtonLink>
        <ButtonLink href="/mis-cursos" variant="secondary">
          Ver mis cursos
        </ButtonLink>
      </div>
    </Card>
  );
}

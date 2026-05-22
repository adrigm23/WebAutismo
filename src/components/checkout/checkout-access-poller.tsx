"use client";

import { CircleCheckBig, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ButtonLink } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { StateBanner } from "@/components/ui/state-banner";
import { SurfaceCard } from "@/components/ui/surface-card";

type CheckoutAccessPollerProps = {
  courseSlug: string;
  courseTitle: string;
  isDemo: boolean;
};

export function CheckoutAccessPoller({
  courseSlug,
  courseTitle,
  isDemo,
}: CheckoutAccessPollerProps) {
  const router = useRouter();
  const [enrolled, setEnrolled] = useState(isDemo);
  const [progressValue, setProgressValue] = useState(isDemo ? 100 : 18);

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
      setProgressValue((current) => Math.min(current + 7, 88));

      try {
        const response = await fetch(`/api/courses/${courseSlug}/enrollment`, {
          cache: "no-store",
        });

        if (response.ok) {
          const payload = (await response.json()) as { enrolled?: boolean };
          if (payload.enrolled) {
            setEnrolled(true);
            setProgressValue(100);
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
    <SurfaceCard className="w-full max-w-3xl" padding="lg">
      <div className="flex flex-col gap-6 text-center">
        <div className="mx-auto grid size-16 place-items-center rounded-[var(--radius-pill)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
          {enrolled ? (
            <CircleCheckBig className="size-8" strokeWidth={2} />
          ) : (
            <LoaderCircle className="size-8 animate-spin" strokeWidth={2} />
          )}
        </div>

        <div>
          <p className="text-meta-xs font-semibold text-[var(--color-primary)]">
            {enrolled ? "Acceso confirmado" : "Activando tu matricula"}
          </p>
          <h1 className="mt-3 font-premium text-display-lg font-semibold text-[var(--color-text)]">
            {enrolled
              ? `Ya puedes entrar a "${courseTitle}"`
              : `Estamos preparando "${courseTitle}"`}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-body-md text-[var(--color-text-muted)]">
            {enrolled
              ? "Tu matricula ya esta disponible en el campus. Puedes continuar con el primer modulo cuando quieras."
              : "En pocos segundos confirmaremos el pago y activaremos tu matricula. No cierres esta ventana."}
          </p>
        </div>

        <div className="mx-auto w-full max-w-xl">
          <Progress
            aria-label={enrolled ? "Acceso confirmado" : "Activacion en curso"}
            value={progressValue}
          />
        </div>

        {isDemo ? (
          <StateBanner
            className="text-left"
            description="Flujo demo local: el acceso se activa de inmediato sin esperar al webhook de Stripe."
            tone="info"
          />
        ) : null}

        <div className="flex flex-col justify-center gap-3 sm:flex-row">
          <ButtonLink
            aria-disabled={!enrolled}
            className={!enrolled ? "pointer-events-none opacity-50" : undefined}
            href={`/mis-cursos/${courseSlug}?onboarding=1`}
          >
            Ir al curso
          </ButtonLink>
          <ButtonLink href="/mis-cursos" variant="neutral">
            Ver mis cursos
          </ButtonLink>
        </div>
      </div>
    </SurfaceCard>
  );
}

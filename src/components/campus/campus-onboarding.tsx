"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

const storageKey = (courseSlug: string) => `campus-onboarding:${courseSlug}`;

type CampusOnboardingProps = {
  courseSlug: string;
  showInitially?: boolean;
};

const steps = [
  "Revisa el módulo activo y marca tu avance cuando termines.",
  "Abre Recursos y tareas para entregar actividades del curso.",
  "Usa el foro para dudas y avisos del equipo docente."
];

export function CampusOnboarding({ courseSlug, showInitially = false }: CampusOnboardingProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!showInitially) {
      return;
    }

    try {
      const done = window.localStorage.getItem(storageKey(courseSlug));
      setVisible(!done);
    } catch {
      setVisible(showInitially);
    }
  }, [courseSlug, showInitially]);

  if (!visible) {
    return null;
  }

  function dismiss() {
    try {
      window.localStorage.setItem(storageKey(courseSlug), "1");
    } catch {
      // Ignore storage errors.
    }
    setVisible(false);
  }

  return (
    <aside
      aria-labelledby="campus-onboarding-title"
      className="rounded-2xl border border-[rgba(12,113,195,0.16)] bg-[var(--color-primary-soft)] p-5"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p
            className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-primary)]"
            id="campus-onboarding-title"
          >
            Primeros pasos en el campus
          </p>
          <ol className="mt-3 space-y-2 text-sm leading-6 text-[var(--color-ink)]">
            {steps.map((step, index) => (
              <li className="flex gap-2" key={step}>
                <span className="font-semibold text-[var(--color-primary)]">{index + 1}.</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>
        <button
          aria-label="Cerrar guía de inicio"
          className="rounded-lg p-1 text-[var(--color-muted)] transition hover:bg-white/80 hover:text-[var(--color-ink)]"
          onClick={dismiss}
          type="button"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <Button className="mt-4" onClick={dismiss} type="button" variant="secondary">
        Entendido, empezar
      </Button>
    </aside>
  );
}

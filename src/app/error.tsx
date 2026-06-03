"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

function reportClientError(error: ErrorPageProps["error"]) {
  const payload = JSON.stringify({
    name: error.name,
    message: error.message,
    stack: error.stack,
    digest: error.digest,
    pathname: window.location.pathname,
    userAgent: navigator.userAgent
  });

  if (navigator.sendBeacon) {
    const body = new Blob([payload], {
      type: "application/json"
    });
    navigator.sendBeacon("/api/monitoring/client-errors", body);
    return;
  }

  void fetch("/api/monitoring/client-errors", {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: payload,
    keepalive: true
  });
}

function isNextDevtoolsBug(error: Error): boolean {
  // Next.js 16 devtools SegmentTrieNode throws when encountering deeply nested
  // dynamic routes during dev-mode hydration. Auto-reset to let the page render.
  if (process.env.NODE_ENV !== "development") return false;
  return (
    error.message.includes("page.tsx") &&
    (error.stack?.includes("next-devtools") ?? false)
  );
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    if (isNextDevtoolsBug(error)) {
      reset();
      return;
    }
    reportClientError(error);
  }, [error, reset]);

  return (
    <div className="site-container flex min-h-[60vh] items-center py-16">
      <div className="w-full rounded-xl border border-[var(--color-border)] bg-white p-8 shadow-[0_24px_60px_rgba(16,24,40,0.08)]">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-primary)]">
          Incidencia detectada
        </p>
        <h1 className="mt-4 text-[2.8rem] font-semibold tracking-[-0.06em] text-[var(--color-ink)]">
          No hemos podido cargar esta pantalla
        </h1>
        <p className="mt-4 max-w-3xl text-[1.05rem] leading-8 text-[var(--color-muted)]">
          El error ya se ha registrado. Puedes volver a intentarlo sin perder la sesión actual.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button onClick={reset} type="button">
            Reintentar
          </Button>
          <Button onClick={() => window.location.assign("/mis-cursos")} type="button" variant="secondary">
            Volver a mis cursos
          </Button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect } from "react";

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    const payload = JSON.stringify({
      name: error.name,
      message: error.message,
      stack: error.stack,
      digest: error.digest,
      pathname: window.location.pathname,
      userAgent: navigator.userAgent
    });

    void fetch("/api/monitoring/client-errors", {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: payload,
      keepalive: true
    });
  }, [error]);

  return (
    <html lang="es">
      <body className="bg-[var(--color-page)] text-[var(--color-ink)]">
        <main className="site-container flex min-h-screen items-center py-16">
          <div className="w-full rounded-[32px] border border-[var(--color-border)] bg-white p-8 shadow-[0_24px_60px_rgba(16,24,40,0.08)]">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-primary)]">
              Error global
            </p>
            <h1 className="mt-4 text-[2.8rem] font-semibold tracking-[-0.06em] text-[var(--color-ink)]">
              La aplicacion ha encontrado un problema inesperado
            </h1>
            <p className="mt-4 max-w-3xl text-[1.05rem] leading-8 text-[var(--color-muted)]">
              El incidente ya se ha enviado al registro central. Puedes volver a intentarlo ahora.
            </p>
            <button
              className="mt-8 inline-flex items-center justify-center rounded-xl bg-[var(--color-primary)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--color-primary-strong)]"
              onClick={reset}
              type="button"
            >
              Reintentar
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}

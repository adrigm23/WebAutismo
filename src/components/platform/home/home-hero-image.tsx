"use client";

import { useState } from "react";

export function HomeHeroImage() {
  const [error, setError] = useState(false);

  if (error) {
    return (
      <div
        aria-hidden
        className="flex h-[22rem] w-full items-center justify-center rounded-[var(--radius-xl)] bg-[linear-gradient(135deg,rgba(22,60,88,0.07)_0%,rgba(22,60,88,0.16)_100%)] lg:h-[28rem]"
      >
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-brand-soft)]">
            <svg
              className="h-8 w-8 text-[var(--color-primary)]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
              />
            </svg>
          </div>
          <p className="mt-3 text-sm text-[var(--color-muted)]">Imagen del hero</p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[var(--radius-xl)] shadow-[var(--shadow-strong)]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        alt="Formación especializada en autismo"
        className="h-[22rem] w-full object-cover lg:h-[28rem]"
        onError={() => setError(true)}
        src="/hero-image.jpg"
      />
    </div>
  );
}

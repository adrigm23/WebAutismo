"use client";

const SHOW_PLACEHOLDER = false;

export function HomeHeroImage() {
  if (SHOW_PLACEHOLDER) {
    return (
      <div
        aria-hidden
        className="flex h-[22rem] w-full items-center justify-center overflow-hidden rounded-[var(--radius-xl)] bg-[linear-gradient(135deg,rgba(22,60,88,0.06)_0%,rgba(22,60,88,0.14)_100%)] shadow-[var(--shadow-strong)] lg:h-[28rem]"
      >
        <div className="text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-white/60">
            <svg
              className="h-9 w-9 text-[var(--color-primary)] opacity-50"
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
          <p className="mt-3 text-sm font-medium text-[var(--color-primary)] opacity-50">
            Imagen del hero
          </p>
          <p className="mt-1 text-xs text-[var(--color-muted)] opacity-60">
            Subir a /public/hero-image.jpg
          </p>
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
        src="/brand/thedanw-music-818459_1920 (1).jpg"
      />
    </div>
  );
}

type HomeSectionHeaderProps = {
  eyebrow: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  headingId?: string;
};

export function HomeSectionHeader({
  eyebrow,
  title,
  description,
  align = "left",
  headingId
}: HomeSectionHeaderProps) {
  const alignment =
    align === "center"
      ? "mx-auto max-w-3xl text-center"
      : "max-w-2xl";

  return (
    <header className={alignment}>
      <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-[var(--color-primary)]">
        {eyebrow}
      </p>
      <h2
        className="mt-3 text-balance font-display text-3xl font-semibold tracking-[-0.04em] text-[var(--color-ink)] sm:text-4xl"
        id={headingId}
      >
        {title}
      </h2>
      {description ? (
        <p className="mt-4 text-pretty text-base leading-7 text-[var(--color-muted)] sm:text-lg">
          {description}
        </p>
      ) : null}
    </header>
  );
}

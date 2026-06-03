"use client";

import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SurfaceCard(input: {
  title?: string;
  description?: string;
  className?: string;
  id?: string;
  children: ReactNode;
}) {
  return (
    <section
      className={cn(
        "rounded-lg border border-[rgba(22,60,88,0.08)] bg-[rgba(255,255,255,0.72)] px-4 py-4 shadow-[0_1px_0_rgba(255,255,255,0.88)] backdrop-blur-[2px] sm:px-5 sm:py-5",
        input.className,
      )}
      id={input.id}
    >
      {input.title ? (
        <header className="mb-4 flex flex-col gap-2.5 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h2 className="font-premium text-[1.45rem] font-semibold tracking-[-0.045em] text-[var(--color-ink)]">
              {input.title}
            </h2>
            {input.description ? (
              <p className="mt-1.5 max-w-3xl text-sm leading-6 text-[var(--color-muted)]">
                {input.description}
              </p>
            ) : null}
          </div>
        </header>
      ) : null}
      {input.children}
    </section>
  );
}

export function SummaryMetric(input: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-lg border border-[rgba(22,60,88,0.08)] bg-[rgba(248,245,239,0.62)] p-3.5">
      <p className="text-meta-xs font-semibold text-[var(--color-muted)]">{input.label}</p>
      <p className="font-premium mt-2.5 text-[1.45rem] font-semibold leading-tight tracking-[-0.04em] text-[var(--color-ink)] [font-variant-numeric:tabular-nums]">
        {input.value}
      </p>
      <p className="mt-1.5 text-body-sm text-[var(--color-muted)]">{input.detail}</p>
    </div>
  );
}

export function WorkspaceTabButton(input: {
  active: boolean;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
}) {
  const Icon = input.icon;

  return (
    <button
      className={cn(
        "inline-flex min-h-10 items-center justify-center gap-2 rounded-[var(--radius-pill)] border px-3.5 py-2 text-sm font-semibold transition",
        input.active
          ? "border-[var(--color-border-strong)] bg-[var(--color-brand-soft)] text-[var(--color-primary)] shadow-[var(--shadow-inset-soft)]"
          : "border-transparent bg-transparent text-[var(--color-ink-soft)] hover:border-[var(--color-border-subtle)] hover:bg-white hover:text-[var(--color-ink)]",
      )}
      onClick={input.onClick}
      type="button"
    >
      <Icon className="h-3.5 w-3.5" />
      {input.label}
    </button>
  );
}

export function ActionCard(input: {
  title: string;
  body: string;
  cta: string;
  onClick: () => void;
}) {
  return (
    <button
      className="w-full rounded-lg border border-[rgba(22,60,88,0.08)] bg-[rgba(248,245,239,0.58)] p-4 text-left transition-colors duration-[var(--motion-duration-base)] hover:border-[rgba(22,60,88,0.16)] hover:bg-white/88 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface-canvas)]"
      onClick={input.onClick}
      type="button"
    >
      <p className="text-base font-semibold text-[var(--color-ink)]">{input.title}</p>
      <p className="mt-2 text-body-sm text-[var(--color-muted)]">{input.body}</p>
      <span className="mt-3 inline-flex items-center text-sm font-semibold text-[var(--color-primary)]">
        {input.cta}
        <ArrowRight className="ml-2 h-4 w-4" />
      </span>
    </button>
  );
}

export function ModuleRow(input: {
  title: string;
  meta: string;
  stateLabel: string;
  stateTone: BadgeTone;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={cn(
        "flex w-full items-start justify-between gap-3 rounded-lg border px-4 py-3.5 text-left transition-colors duration-[var(--motion-duration-base)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface-canvas)]",
        input.isSelected
          ? "border-[rgba(22,60,88,0.16)] bg-[rgba(242,247,252,0.92)] text-[var(--color-primary)]"
          : "border-[rgba(22,60,88,0.08)] bg-[rgba(255,255,255,0.62)] hover:border-[rgba(22,60,88,0.14)] hover:bg-white/88",
      )}
      onClick={input.onClick}
      type="button"
    >
      <div className="min-w-0">
        <p className="text-heading-md font-semibold text-[var(--color-ink)]">{input.title}</p>
        <p className="mt-2 text-body-sm text-[var(--color-muted)]">{input.meta}</p>
      </div>
      <Badge tone={input.stateTone}>{input.stateLabel}</Badge>
    </button>
  );
}

export function InfoPanel(input: {
  title: string;
  body: string;
  ctaHref?: string;
  ctaLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="rounded-lg border border-[rgba(22,60,88,0.08)] bg-[rgba(248,245,239,0.58)] p-4">
      <p className="text-heading-md font-semibold text-[var(--color-ink)]">{input.title}</p>
      <p className="mt-2 text-body-sm text-[var(--color-muted)]">{input.body}</p>
      {input.onAction && input.ctaLabel ? (
        <Button
          className="mt-4 px-0"
          onClick={input.onAction}
          size="sm"
          type="button"
          variant="subtle"
        >
          {input.ctaLabel}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      ) : null}
      {input.ctaHref && input.ctaLabel ? (
        <ButtonLink
          className="mt-4 px-0"
          href={input.ctaHref}
          prefetch
          size="sm"
          variant="subtle"
        >
          {input.ctaLabel}
          <ArrowRight className="ml-2 h-4 w-4" />
        </ButtonLink>
      ) : null}
    </div>
  );
}

export function ModuleResourceCard(input: {
  title: string;
  body: string;
  badge: string;
  ctaLabel: string;
  onClick: () => void;
}) {
  return (
    <button
      className="w-full rounded-lg border border-[rgba(22,60,88,0.08)] bg-[rgba(248,245,239,0.58)] p-4 text-left transition-colors duration-[var(--motion-duration-base)] hover:border-[rgba(22,60,88,0.16)] hover:bg-white/88 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface-canvas)]"
      onClick={input.onClick}
      type="button"
    >
      <Badge tone="outline">{input.badge}</Badge>
      <p className="mt-3 text-heading-md font-semibold text-[var(--color-ink)]">{input.title}</p>
      <p className="mt-2 text-body-sm text-[var(--color-muted)]">{input.body}</p>
      <span className="mt-3 inline-flex items-center text-sm font-semibold text-[var(--color-primary)]">
        {input.ctaLabel}
        <ArrowRight className="ml-2 h-4 w-4" />
      </span>
    </button>
  );
}

"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { Badge, type BadgeTone } from "@/components/ui/badge";
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
      id={input.id}
      className={cn(
        "ui-card-base rounded-[var(--radius-lg)] bg-white/96 p-5 lg:p-6",
        input.className
      )}
    >
      {input.title ? (
        <div className="mb-4">
          <h2 className="text-display-md font-semibold text-[var(--color-ink)]">
            {input.title}
          </h2>
          {input.description ? (
            <p className="mt-1.5 max-w-3xl text-sm leading-6 text-[var(--color-muted)]">
              {input.description}
            </p>
          ) : null}
        </div>
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
    <div className="rounded-[var(--radius-md)] border border-[rgba(12,113,195,0.1)] bg-[var(--color-surface)] p-3.5">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">
        {input.label}
      </p>
      <p className="mt-2 text-[1.55rem] font-semibold leading-tight tracking-[-0.04em] text-[var(--color-ink)] [font-variant-numeric:tabular-nums]">
        {input.value}
      </p>
      <p className="mt-1 text-sm leading-6 text-[var(--color-muted)]">{input.detail}</p>
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
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-pill)] border px-3.5 py-2.5 text-sm font-semibold transition",
        input.active
          ? "border-[var(--color-primary)] bg-white text-[var(--color-primary)] shadow-[var(--shadow-inset-soft)]"
          : "border-[var(--color-border)] bg-white text-[var(--color-ink)] hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-soft)] hover:text-[var(--color-primary)]"
      )}
      onClick={input.onClick}
      type="button"
    >
      <Icon className="h-4 w-4" />
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
      className="w-full rounded-[var(--radius-md)] border border-[rgba(12,113,195,0.1)] bg-[var(--color-surface)] p-4 text-left transition hover:-translate-y-[1px] hover:border-[var(--color-primary)] hover:bg-white hover:shadow-[var(--shadow-medium)]"
      onClick={input.onClick}
      type="button"
    >
      <p className="text-base font-semibold text-[var(--color-ink)]">{input.title}</p>
      <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">{input.body}</p>
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
        "flex w-full items-start justify-between gap-4 rounded-[var(--radius-md)] border p-3.5 text-left transition",
        input.isSelected
          ? "border-[var(--color-primary)] bg-[rgba(12,113,195,0.08)] shadow-[var(--shadow-medium)]"
          : "border-[rgba(12,113,195,0.1)] bg-white hover:border-[var(--color-primary)] hover:bg-[rgba(12,113,195,0.03)]"
      )}
      onClick={input.onClick}
      type="button"
    >
      <div className="min-w-0">
        <p className="text-base font-semibold text-[var(--color-ink)]">{input.title}</p>
        <p className="mt-1.5 text-sm leading-6 text-[var(--color-muted)]">{input.meta}</p>
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
    <div className="rounded-[var(--radius-md)] border border-[rgba(12,113,195,0.1)] bg-[var(--color-surface)] p-4">
      <p className="text-base font-semibold text-[var(--color-ink)]">{input.title}</p>
      <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">{input.body}</p>
      {input.onAction && input.ctaLabel ? (
        <button
          className="mt-3 inline-flex items-center text-sm font-semibold text-[var(--color-primary)]"
          onClick={input.onAction}
          type="button"
        >
          {input.ctaLabel}
          <ArrowRight className="ml-2 h-4 w-4" />
        </button>
      ) : null}
      {input.ctaHref && input.ctaLabel ? (
        <Link
          className="mt-3 inline-flex items-center text-sm font-semibold text-[var(--color-primary)]"
          href={input.ctaHref}
          prefetch
        >
          {input.ctaLabel}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
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
      className="w-full rounded-[var(--radius-md)] border border-[rgba(12,113,195,0.1)] bg-white p-4 text-left transition hover:-translate-y-[1px] hover:border-[var(--color-primary)] hover:bg-[rgba(12,113,195,0.03)] hover:shadow-[var(--shadow-medium)]"
      onClick={input.onClick}
      type="button"
    >
      <Badge tone="outline">{input.badge}</Badge>
      <p className="mt-3 text-base font-semibold text-[var(--color-ink)]">{input.title}</p>
      <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">{input.body}</p>
      <span className="mt-3 inline-flex items-center text-sm font-semibold text-[var(--color-primary)]">
        {input.ctaLabel}
        <ArrowRight className="ml-2 h-4 w-4" />
      </span>
    </button>
  );
}

export function SimpleModeToggle(input: {
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      aria-label={
        input.active
          ? "Cambiar a vista completa del campus"
          : "Cambiar a vista simple del campus"
      }
      aria-pressed={input.active}
      className={cn(
        "inline-flex min-h-11 items-center gap-3 rounded-[var(--radius-pill)] border px-3.5 py-2.5 text-left transition",
        input.active
          ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary)] shadow-[var(--shadow-inset-soft)]"
          : "border-[var(--color-border)] bg-white text-[var(--color-ink)] hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-soft)] hover:text-[var(--color-primary)]"
      )}
      onClick={input.onClick}
      type="button"
    >
      <span
        className={cn(
          "relative h-6 w-11 rounded-full transition",
          input.active ? "bg-[var(--color-primary)]" : "bg-[var(--color-border)]"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition",
            input.active ? "left-[1.3rem]" : "left-0.5"
          )}
        />
      </span>
      <span className="flex flex-col leading-tight">
        <span className="text-sm font-semibold">Vista simple</span>
        <span className="text-xs text-[var(--color-muted)]">
          {input.active ? "Activa" : "Modo completo"}
        </span>
      </span>
    </button>
  );
}

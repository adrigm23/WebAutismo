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
        "ui-card-base rounded-[var(--radius-xl)] bg-[color:var(--color-surface-elevated)]/96 p-5 lg:p-6",
        input.className,
      )}
    >
      {input.title ? (
        <div className="mb-4">
          <h2 className="font-premium text-display-md font-semibold text-[var(--color-ink)]">
            {input.title}
          </h2>
          {input.description ? (
            <p className="mt-2 max-w-3xl text-body-sm text-[var(--color-muted)]">
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
    <div className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[color:var(--color-bg-subtle)] p-4">
      <p className="text-meta-xs font-semibold text-[var(--color-muted)]">{input.label}</p>
      <p className="font-premium mt-3 text-[1.55rem] font-semibold leading-tight tracking-[-0.04em] text-[var(--color-ink)] [font-variant-numeric:tabular-nums]">
        {input.value}
      </p>
      <p className="mt-2 text-body-sm text-[var(--color-muted)]">{input.detail}</p>
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
      className="w-full rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[color:var(--color-bg-subtle)] p-4 text-left transition hover:-translate-y-[1px] hover:border-[var(--color-primary)] hover:bg-white hover:shadow-[var(--shadow-medium)]"
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
        "flex w-full items-start justify-between gap-3 rounded-[var(--radius-lg)] border p-4 text-left transition",
        input.isSelected
          ? "border-[var(--color-border-strong)] bg-[linear-gradient(180deg,rgba(255,253,250,0.98),rgba(223,234,243,0.42))] shadow-[var(--shadow-medium)]"
          : "border-[var(--color-border-subtle)] bg-[color:var(--color-surface-elevated)] hover:border-[var(--color-primary)] hover:bg-white",
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
    <div className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[color:var(--color-bg-subtle)] p-4">
      <p className="text-heading-md font-semibold text-[var(--color-ink)]">{input.title}</p>
      <p className="mt-2 text-body-sm text-[var(--color-muted)]">{input.body}</p>
      {input.onAction && input.ctaLabel ? (
        <button
          className="mt-4 inline-flex items-center text-sm font-semibold text-[var(--color-primary)]"
          onClick={input.onAction}
          type="button"
        >
          {input.ctaLabel}
          <ArrowRight className="ml-2 h-4 w-4" />
        </button>
      ) : null}
      {input.ctaHref && input.ctaLabel ? (
        <Link
          className="mt-4 inline-flex items-center text-sm font-semibold text-[var(--color-primary)]"
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
      className="w-full rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[color:var(--color-bg-subtle)] p-4 text-left transition hover:-translate-y-[1px] hover:border-[var(--color-primary)] hover:bg-white hover:shadow-[var(--shadow-medium)]"
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

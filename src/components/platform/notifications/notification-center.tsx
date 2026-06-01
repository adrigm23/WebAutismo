"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  Award,
  Bell,
  Calendar,
  CheckCheck,
  CheckCircle2,
  ClipboardList,
  CornerUpLeft,
  Inbox,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { markAllNotificationsReadAction } from "@/actions/notifications";

// ─── Types ────────────────────────────────────────────────────────────────────

type FilterTab = "all" | "unread" | "mentions" | "deliveries" | "system";

type IconType =
  | "message"
  | "calendar"
  | "clipboard"
  | "reply"
  | "certificate"
  | "check"
  | "bell";

export type UnifiedNotification = {
  id: string;
  title: string;
  body: string;
  linkPath: string;
  readAt: Date | null;
  createdAt: Date;
  iconType: IconType;
  filterTabs: FilterTab[];
  actionLabel?: string;
  actionHref?: string;
};

type Props = {
  notifications: UnifiedNotification[];
  unreadCount: number;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getDateGroup(date: Date): "today" | "yesterday" | "older" {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86_400_000);
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (d.getTime() === today.getTime()) return "today";
  if (d.getTime() === yesterday.getTime()) return "yesterday";
  return "older";
}

function formatRelativeTime(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMs / 3_600_000);

  if (diffMin < 1) return "Ahora mismo";
  if (diffMin < 60) return `Hace ${diffMin} min`;
  if (diffHours < 24) return `Hace ${diffHours} hora${diffHours !== 1 ? "s" : ""}`;

  const h = date.getHours().toString().padStart(2, "0");
  const m = date.getMinutes().toString().padStart(2, "0");
  const group = getDateGroup(date);
  if (group === "yesterday") return `Ayer ${h}:${m}`;

  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  return `${day}/${month} ${h}:${m}`;
}

// ─── Icon component ───────────────────────────────────────────────────────────

const ICON_CONFIG: Record<
  IconType,
  { Icon: typeof Bell; bg: string; text: string }
> = {
  message: {
    Icon: MessageSquare,
    bg: "bg-[#d1fae5]",
    text: "text-[#059669]",
  },
  calendar: {
    Icon: Calendar,
    bg: "bg-[#dbeafe]",
    text: "text-[#2563eb]",
  },
  clipboard: {
    Icon: ClipboardList,
    bg: "bg-[rgba(22,60,88,0.08)]",
    text: "text-[var(--color-ink-soft)]",
  },
  reply: {
    Icon: CornerUpLeft,
    bg: "bg-[rgba(22,60,88,0.08)]",
    text: "text-[var(--color-ink-soft)]",
  },
  certificate: {
    Icon: Award,
    bg: "bg-[var(--color-primary)]",
    text: "text-white",
  },
  check: {
    Icon: CheckCircle2,
    bg: "bg-[rgba(22,60,88,0.08)]",
    text: "text-[var(--color-ink-soft)]",
  },
  bell: {
    Icon: Bell,
    bg: "bg-[#dbeafe]",
    text: "text-[#2563eb]",
  },
};

function NotificationIcon({ type }: { type: IconType }) {
  const { Icon, bg, text } = ICON_CONFIG[type];
  return (
    <div
      className={cn(
        "grid h-10 w-10 shrink-0 place-items-center rounded-full",
        bg,
        text,
      )}
    >
      <Icon className="h-[1.1rem] w-[1.1rem]" strokeWidth={2} />
    </div>
  );
}

// ─── Filter sidebar ────────────────────────────────────────────────────────────

const FILTER_ITEMS: {
  id: FilterTab;
  label: string;
  Icon: typeof Bell;
}[] = [
  { id: "all", label: "Todas", Icon: Inbox },
  { id: "unread", label: "No leídas", Icon: Bell },
  { id: "mentions", label: "Menciones", Icon: MessageSquare },
  { id: "deliveries", label: "Entregas", Icon: ClipboardList },
  { id: "system", label: "Sistema", Icon: CheckCircle2 },
];

function FilterSidebar({
  active,
  unreadCount,
  counts,
  onChange,
}: {
  active: FilterTab;
  unreadCount: number;
  counts: Record<FilterTab, number>;
  onChange: (tab: FilterTab) => void;
}) {
  return (
    <aside className="hidden w-[220px] shrink-0 border-r border-[rgba(22,60,88,0.08)] bg-white p-5 md:flex md:flex-col">
      <h2 className="mb-4 text-[1.05rem] font-bold text-[var(--color-ink)]">
        Notificaciones
      </h2>
      <nav className="space-y-1">
        {FILTER_ITEMS.map(({ id, label, Icon }) => {
          const isActive = active === id;
          const badge =
            id === "unread" ? unreadCount : id === "all" ? counts.all : counts[id];

          return (
            <button
              className={cn(
                "flex w-full items-center gap-2.5 rounded-[var(--radius-md)] px-3 py-2.5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]",
                isActive
                  ? "bg-[var(--color-brand-soft)] text-[var(--color-primary)]"
                  : "text-[var(--color-ink-soft)] hover:bg-[rgba(22,60,88,0.05)] hover:text-[var(--color-ink)]",
              )}
              key={id}
              onClick={() => onChange(id)}
              type="button"
            >
              <Icon className="h-4 w-4 shrink-0" strokeWidth={2} />
              <span className="flex-1 text-left">{label}</span>
              {badge > 0 && (
                <span
                  className={cn(
                    "grid h-5 min-w-5 place-items-center rounded-full px-1.5 text-[0.62rem] font-bold",
                    isActive
                      ? "bg-[var(--color-primary)] text-white"
                      : "bg-[rgba(22,60,88,0.1)] text-[var(--color-ink-soft)]",
                  )}
                >
                  {badge > 99 ? "99+" : badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}

// ─── Mobile filter tabs ────────────────────────────────────────────────────────

function MobileFilterTabs({
  active,
  unreadCount,
  onChange,
}: {
  active: FilterTab;
  unreadCount: number;
  onChange: (tab: FilterTab) => void;
}) {
  return (
    <div className="flex gap-1.5 overflow-x-auto border-b border-[rgba(22,60,88,0.08)] bg-white px-4 py-3 md:hidden">
      {FILTER_ITEMS.map(({ id, label }) => {
        const isActive = active === id;
        const badge = id === "unread" ? unreadCount : undefined;

        return (
          <button
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition",
              isActive
                ? "bg-[var(--color-primary)] text-white"
                : "bg-[rgba(22,60,88,0.07)] text-[var(--color-ink-soft)] hover:bg-[rgba(22,60,88,0.12)]",
            )}
            key={id}
            onClick={() => onChange(id)}
            type="button"
          >
            {label}
            {badge !== undefined && badge > 0 && (
              <span
                className={cn(
                  "grid h-4 min-w-4 place-items-center rounded-full px-1 text-[0.55rem] font-bold",
                  isActive ? "bg-white/25 text-white" : "bg-[var(--color-primary)] text-white",
                )}
              >
                {badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ─── Single notification row ───────────────────────────────────────────────────

function NotificationRow({ item }: { item: UnifiedNotification }) {
  const isUnread = item.readAt === null;

  return (
    <div
      className={cn(
        "relative flex items-start gap-3.5 border-b border-[rgba(22,60,88,0.07)] px-5 py-4 last:border-0 sm:px-6",
        isUnread && "bg-[rgba(22,60,88,0.018)]",
      )}
    >
      {/* Unread dot */}
      {isUnread && (
        <span className="absolute left-2 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-[var(--color-primary)]" />
      )}

      <NotificationIcon type={item.iconType} />

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <p
            className={cn(
              "text-sm leading-snug",
              isUnread
                ? "font-semibold text-[var(--color-ink)]"
                : "font-medium text-[var(--color-ink-soft)]",
            )}
          >
            {item.title}
          </p>
          <span className="shrink-0 text-[0.72rem] text-[var(--color-muted)] sm:whitespace-nowrap">
            {formatRelativeTime(item.createdAt)}
          </span>
        </div>

        {item.body ? (
          <p className="mt-0.5 line-clamp-2 text-[0.8rem] text-[var(--color-ink-soft)]">
            {item.body}
          </p>
        ) : null}

        {item.actionLabel && item.actionHref ? (
          <Link
            className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-[rgba(22,60,88,0.15)] bg-white px-3 py-1.5 text-[0.78rem] font-semibold text-[var(--color-ink)] transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
            href={item.actionHref}
          >
            {item.actionLabel}
          </Link>
        ) : null}
      </div>
    </div>
  );
}

// ─── Date group section ────────────────────────────────────────────────────────

function DateGroupSection({
  label,
  items,
}: {
  label: string;
  items: UnifiedNotification[];
}) {
  if (items.length === 0) return null;

  return (
    <section>
      <div className="flex items-center gap-3 px-5 py-3 sm:px-6">
        <span className="text-[0.7rem] font-bold uppercase tracking-[0.14em] text-[var(--color-muted)]">
          {label}
        </span>
        <div className="h-px flex-1 bg-[rgba(22,60,88,0.08)]" />
      </div>
      {items.map((item) => (
        <NotificationRow item={item} key={item.id} />
      ))}
    </section>
  );
}

// ─── Mark all read button ──────────────────────────────────────────────────────

function MarkAllReadButton({ disabled }: { disabled: boolean }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      className="flex items-center gap-1.5 text-[0.8rem] font-medium text-[var(--color-ink-soft)] transition hover:text-[var(--color-primary)] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] rounded"
      disabled={disabled || isPending}
      onClick={() => startTransition(() => markAllNotificationsReadAction())}
      type="button"
    >
      <CheckCheck className="h-4 w-4" strokeWidth={2} />
      {isPending ? "Marcando..." : "Marcar todo como leído"}
    </button>
  );
}

// ─── Empty state ───────────────────────────────────────────────────────────────

function EmptyState({ activeFilter }: { activeFilter: FilterTab }) {
  const messages: Record<FilterTab, string> = {
    all: "No tienes notificaciones todavía.",
    unread: "No tienes notificaciones sin leer.",
    mentions: "No tienes menciones recientes.",
    deliveries: "No hay notificaciones de entregas.",
    system: "No hay notificaciones del sistema.",
  };

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-full bg-[rgba(22,60,88,0.07)]">
        <Bell className="h-6 w-6 text-[var(--color-muted)]" strokeWidth={1.5} />
      </div>
      <p className="mt-4 text-sm font-medium text-[var(--color-ink-soft)]">
        {messages[activeFilter]}
      </p>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export function NotificationCenter({ notifications, unreadCount }: Props) {
  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");

  // Filter
  const filtered =
    activeFilter === "all"
      ? notifications
      : notifications.filter((n) => n.filterTabs.includes(activeFilter));

  // Date groups
  const todayItems = filtered.filter((n) => getDateGroup(n.createdAt) === "today");
  const yesterdayItems = filtered.filter((n) => getDateGroup(n.createdAt) === "yesterday");
  const olderItems = filtered.filter((n) => getDateGroup(n.createdAt) === "older");

  // Badge counts per tab
  const counts: Record<FilterTab, number> = {
    all: notifications.length,
    unread: unreadCount,
    mentions: notifications.filter((n) => n.filterTabs.includes("mentions")).length,
    deliveries: notifications.filter((n) => n.filterTabs.includes("deliveries")).length,
    system: notifications.filter((n) => n.filterTabs.includes("system")).length,
  };

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <FilterSidebar
        active={activeFilter}
        counts={counts}
        onChange={setActiveFilter}
        unreadCount={unreadCount}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <MobileFilterTabs
          active={activeFilter}
          onChange={setActiveFilter}
          unreadCount={unreadCount}
        />

        {/* Inbox header */}
        <div className="flex items-center justify-between gap-4 border-b border-[rgba(22,60,88,0.08)] bg-white px-5 py-4 sm:px-6">
          <h1 className="text-[1rem] font-bold text-[var(--color-ink)]">
            Bandeja de entrada
          </h1>
          <MarkAllReadButton disabled={unreadCount === 0} />
        </div>

        {/* Notifications list */}
        <div className="flex-1 bg-white">
          {filtered.length === 0 ? (
            <EmptyState activeFilter={activeFilter} />
          ) : (
            <>
              <DateGroupSection items={todayItems} label="Hoy" />
              <DateGroupSection items={yesterdayItems} label="Ayer" />
              <DateGroupSection items={olderItems} label="Anteriores" />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

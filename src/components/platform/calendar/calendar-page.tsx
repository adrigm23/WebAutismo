"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import type { CalendarEventStatus, CalendarEventType, CalendarEventVisibility } from "@prisma/client";
import {
  Calendar,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  Edit2,
  ExternalLink,
  Filter,
  GraduationCap,
  Loader2,
  MapPin,
  Plus,
  Radio,
  Video,
  X,
  XCircle,
} from "lucide-react";
import type { CalendarEventItem } from "@/lib/calendar";
import {
  cancelCalendarEventAction,
  createCalendarEventAction,
  updateCalendarEventAction,
} from "@/actions/calendar";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

export type CalendarCourse = { id: string; title: string; slug: string };

export type CalendarPageProps = {
  events: CalendarEventItem[];
  courses: CalendarCourse[];
  canManage: boolean;
};

type ViewMode = "month" | "week" | "agenda";

type ActiveFilters = {
  types: Set<CalendarEventType>;
  courseId: string;
  statuses: Set<CalendarEventStatus>;
};

// ─── Config ───────────────────────────────────────────────────────────────────

const EVENT_TYPE_CONFIG: Record<
  CalendarEventType,
  { label: string; color: string; dot: string; icon: React.ElementType }
> = {
  LIVE_WEBINAR: { label: "Webinar en vivo", color: "bg-blue-100 text-blue-700 border-blue-200", dot: "bg-blue-500", icon: Video },
  GROUP_TUTORING: { label: "Tutoría grupal", color: "bg-indigo-100 text-indigo-700 border-indigo-200", dot: "bg-indigo-500", icon: GraduationCap },
  INDIVIDUAL_TUTORING: { label: "Tutoría individual", color: "bg-sky-100 text-sky-700 border-sky-200", dot: "bg-sky-400", icon: GraduationCap },
  ASSIGNMENT_DEADLINE: { label: "Entrega / plazo", color: "bg-red-100 text-red-700 border-red-200", dot: "bg-red-500", icon: Calendar },
  EVALUATION: { label: "Evaluación", color: "bg-orange-100 text-orange-700 border-orange-200", dot: "bg-orange-500", icon: Calendar },
  LIVE_CLASS: { label: "Clase en directo", color: "bg-emerald-100 text-emerald-700 border-emerald-200", dot: "bg-emerald-500", icon: Radio },
  INFO_SESSION: { label: "Sesión informativa", color: "bg-gray-100 text-gray-600 border-gray-200", dot: "bg-gray-400", icon: Calendar },
};

const EVENT_STATUS_CONFIG: Record<CalendarEventStatus, { label: string; badge: string }> = {
  SCHEDULED: { label: "Próximo", badge: "bg-blue-50 text-blue-700" },
  LIVE: { label: "En vivo", badge: "bg-emerald-50 text-emerald-700" },
  FINISHED: { label: "Finalizado", badge: "bg-gray-50 text-gray-500" },
  CANCELLED: { label: "Cancelado", badge: "bg-red-50 text-red-500" },
  EXPIRED: { label: "Vencido", badge: "bg-orange-50 text-orange-600" },
};

const VISIBILITY_LABELS: Record<CalendarEventVisibility, string> = {
  PUBLIC: "Público",
  COURSE: "Curso",
  TEACHERS_ONLY: "Solo docentes",
  ADMIN_ONLY: "Solo admins",
};

const DAYS_ES = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const MONTHS_ES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function isToday(d: Date) {
  return isSameDay(d, new Date());
}

function formatTime(d: Date) {
  return d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
}

function formatDateFull(d: Date) {
  return d.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

function formatDateShort(d: Date) {
  return d.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
}

/** Build 6-week grid for given month/year */
function buildMonthGrid(year: number, month: number): Date[] {
  const firstDay = new Date(year, month, 1);
  const startOffset = firstDay.getDay(); // 0=Sun
  const cells: Date[] = [];
  for (let i = 0; i < 42; i++) {
    cells.push(new Date(year, month, 1 - startOffset + i));
  }
  return cells;
}

/** Build 7-day array starting from Sunday of the week containing `date` */
function buildWeekDays(date: Date): Date[] {
  const sun = new Date(date);
  sun.setDate(sun.getDate() - sun.getDay());
  return Array.from({ length: 7 }, (_, i) => new Date(sun.getFullYear(), sun.getMonth(), sun.getDate() + i));
}

function getEventsForDay(events: CalendarEventItem[], day: Date): CalendarEventItem[] {
  return events.filter((e) => isSameDay(new Date(e.startsAt), day));
}

function applyFilters(events: CalendarEventItem[], filters: ActiveFilters): CalendarEventItem[] {
  return events.filter((e) => {
    if (filters.types.size > 0 && !filters.types.has(e.type)) return false;
    if (filters.courseId && e.courseId !== filters.courseId) return false;
    if (filters.statuses.size > 0 && !filters.statuses.has(e.status)) return false;
    return true;
  });
}

// ─── Event Chip ───────────────────────────────────────────────────────────────

function EventChip({ event, onClick }: { event: CalendarEventItem; onClick: () => void }) {
  const cfg = EVENT_TYPE_CONFIG[event.type];
  if (event.status === "CANCELLED") {
    return (
      <button
        type="button"
        onClick={onClick}
        className="w-full truncate rounded px-1.5 py-0.5 text-left text-[0.6rem] leading-tight text-gray-400 line-through hover:bg-gray-50"
      >
        {event.title}
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full truncate rounded border px-1.5 py-0.5 text-left text-[0.6rem] leading-tight font-medium transition hover:opacity-80",
        cfg.color
      )}
    >
      {event.title}
    </button>
  );
}

// ─── Monthly Grid ─────────────────────────────────────────────────────────────

function MonthGrid({
  year,
  month,
  events,
  onEventClick,
}: {
  year: number;
  month: number;
  events: CalendarEventItem[];
  onEventClick: (e: CalendarEventItem) => void;
}) {
  const cells = buildMonthGrid(year, month);
  const MAX_VISIBLE = 3;

  return (
    <div className="flex-1 overflow-hidden rounded-xl border border-[#eaecf0] bg-white">
      {/* Day headers */}
      <div className="grid grid-cols-7 border-b border-[#eaecf0]">
        {DAYS_ES.map((d) => (
          <div key={d} className="py-2 text-center text-xs font-semibold text-[#9ba3af]">
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7" style={{ gridTemplateRows: "repeat(6, minmax(80px, 1fr))" }}>
        {cells.map((day, idx) => {
          const isCurrentMonth = day.getMonth() === month;
          const todayFlag = isToday(day);
          const dayEvents = getEventsForDay(events, day);
          const visible = dayEvents.slice(0, MAX_VISIBLE);
          const overflow = dayEvents.length - MAX_VISIBLE;

          return (
            <div
              key={idx}
              className={cn(
                "min-h-[80px] border-b border-r border-[#eaecf0] p-1 last:border-b-0",
                !isCurrentMonth && "bg-[#f8fafc]",
                idx % 7 === 6 && "border-r-0"
              )}
            >
              <div
                className={cn(
                  "mb-0.5 flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium",
                  todayFlag ? "bg-[#163c58] text-white" : isCurrentMonth ? "text-[#374151]" : "text-[#c7cdd6]"
                )}
              >
                {day.getDate()}
              </div>

              <div className="space-y-0.5">
                {visible.map((e) => (
                  <EventChip key={e.id} event={e} onClick={() => onEventClick(e)} />
                ))}
                {overflow > 0 && (
                  <p className="px-1 text-[0.6rem] text-[#9ba3af]">+{overflow} más</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Week Grid ────────────────────────────────────────────────────────────────

function WeekGrid({
  weekDays,
  events,
  onEventClick,
}: {
  weekDays: Date[];
  events: CalendarEventItem[];
  onEventClick: (e: CalendarEventItem) => void;
}) {
  return (
    <div className="flex-1 overflow-hidden rounded-xl border border-[#eaecf0] bg-white">
      <div className="grid grid-cols-7 border-b border-[#eaecf0]">
        {weekDays.map((day) => {
          const todayFlag = isToday(day);
          return (
            <div key={day.toISOString()} className="py-2 text-center">
              <p className="text-xs text-[#9ba3af]">{DAYS_ES[day.getDay()]}</p>
              <div
                className={cn(
                  "mx-auto mt-0.5 flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold",
                  todayFlag ? "bg-[#163c58] text-white" : "text-[#374151]"
                )}
              >
                {day.getDate()}
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-7 divide-x divide-[#eaecf0]">
        {weekDays.map((day) => {
          const dayEvents = getEventsForDay(events, day);
          return (
            <div key={day.toISOString()} className="min-h-[200px] p-1.5 space-y-1">
              {dayEvents.map((e) => {
                const cfg = EVENT_TYPE_CONFIG[e.type];
                return (
                  <button
                    key={e.id}
                    type="button"
                    onClick={() => onEventClick(e)}
                    className={cn(
                      "w-full rounded-lg border px-2 py-1.5 text-left transition hover:opacity-80",
                      cfg.color,
                      e.status === "CANCELLED" && "opacity-40"
                    )}
                  >
                    <p className="truncate text-[0.65rem] font-semibold">{e.title}</p>
                    <p className="text-[0.6rem] opacity-70">{formatTime(new Date(e.startsAt))}</p>
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Agenda Section ───────────────────────────────────────────────────────────

function AgendaSection({
  title,
  items,
  onEventClick,
}: {
  title: string;
  items: CalendarEventItem[];
  onEventClick: (e: CalendarEventItem) => void;
}) {
  if (items.length === 0) return null;
  return (
    <div className="mb-4">
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#9ba3af]">{title}</h3>
      <div className="space-y-2">
        {items.map((e) => {
          const cfg = EVENT_TYPE_CONFIG[e.type];
          return (
            <button
              key={e.id}
              type="button"
              onClick={() => onEventClick(e)}
              className="flex w-full items-start gap-3 rounded-xl border border-[#eaecf0] bg-white p-3 text-left transition hover:shadow-sm"
            >
              <div className={cn("mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full", cfg.dot)} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-[var(--color-primary)]">{e.title}</p>
                <p className="mt-0.5 text-xs text-[#9ba3af]">
                  {formatDateShort(new Date(e.startsAt))} · {formatTime(new Date(e.startsAt))}
                  {e.courseTitle && ` · ${e.courseTitle}`}
                </p>
              </div>
              <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[0.6rem] font-medium", EVENT_STATUS_CONFIG[e.status].badge)}>
                {EVENT_STATUS_CONFIG[e.status].label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Agenda View (mobile) ─────────────────────────────────────────────────────

function AgendaView({
  events,
  onEventClick,
}: {
  events: CalendarEventItem[];
  onEventClick: (e: CalendarEventItem) => void;
}) {
  const now = new Date();
  const today = events.filter((e) => isSameDay(new Date(e.startsAt), now));
  const thisWeek = events.filter((e) => {
    const d = new Date(e.startsAt);
    const diff = (d.getTime() - now.getTime()) / 86400000;
    return diff > 0 && diff <= 7;
  });
  const upcoming = events.filter((e) => {
    const d = new Date(e.startsAt);
    const diff = (d.getTime() - now.getTime()) / 86400000;
    return diff > 7 && diff <= 30;
  });

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#e5e7eb] bg-white px-6 py-16 text-center">
        <CalendarDays className="mb-3 h-10 w-10 text-[#d1d5db]" />
        <p className="text-sm text-[#6b7280]">No hay eventos disponibles.</p>
      </div>
    );
  }

  return (
    <div>
      <AgendaSection title="Hoy" items={today} onEventClick={onEventClick} />
      <AgendaSection title="Esta semana" items={thisWeek} onEventClick={onEventClick} />
      <AgendaSection title="Próximos eventos" items={upcoming} onEventClick={onEventClick} />
      {today.length === 0 && thisWeek.length === 0 && upcoming.length === 0 && events.length > 0 && (
        <AgendaSection title="Todos los eventos" items={events.slice(0, 20)} onEventClick={onEventClick} />
      )}
    </div>
  );
}

// ─── Upcoming Events Panel ─────────────────────────────────────────────────────

function UpcomingEventsPanel({
  events,
  onEventClick,
}: {
  events: CalendarEventItem[];
  onEventClick: (e: CalendarEventItem) => void;
}) {
  const now = new Date();
  const upcoming = events
    .filter((e) => new Date(e.startsAt) >= now && e.status !== "CANCELLED")
    .slice(0, 5);

  return (
    <div className="rounded-xl border border-[#eaecf0] bg-white p-4">
      <h3 className="mb-3 text-sm font-semibold text-[var(--color-primary)]">Próximos Eventos</h3>
      {upcoming.length === 0 ? (
        <p className="text-xs text-[#9ba3af]">Sin próximos eventos.</p>
      ) : (
        <div className="space-y-2">
          {upcoming.map((e) => {
            const cfg = EVENT_TYPE_CONFIG[e.type];
            const statusCfg = EVENT_STATUS_CONFIG[e.status];
            const start = new Date(e.startsAt);
            return (
              <button
                key={e.id}
                type="button"
                onClick={() => onEventClick(e)}
                className="flex w-full items-start gap-3 rounded-xl border border-[#f3f4f6] p-3 text-left transition hover:border-[#e5e7eb] hover:shadow-sm"
              >
                <div className="flex flex-col items-center">
                  <span className="text-[0.6rem] font-bold uppercase text-[#9ba3af]">
                    {MONTHS_ES[start.getMonth()].slice(0, 3).toUpperCase()}
                  </span>
                  <span className="text-lg font-bold leading-none text-[var(--color-primary)]">{start.getDate()}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-1 text-xs font-semibold text-[var(--color-primary)]">{e.title}</p>
                  <p className="mt-0.5 text-[0.6rem] text-[#9ba3af]">
                    {formatTime(start)}{e.endsAt && !isSameDay(new Date(e.startsAt), new Date(e.endsAt)) ? "" : ` - ${formatTime(new Date(e.endsAt))}`} hs
                  </p>
                  <span className={cn("mt-1 inline-block rounded-full px-1.5 py-0.5 text-[0.55rem] font-medium", statusCfg.badge)}>
                    {e.status === "LIVE" ? "En vivo" : cfg.label}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Filters Panel ─────────────────────────────────────────────────────────────

function FiltersPanel({
  filters,
  onChange,
  courses,
}: {
  filters: ActiveFilters;
  onChange: (f: ActiveFilters) => void;
  courses: CalendarCourse[];
}) {
  const typeGroups: Array<{ type: CalendarEventType; label: string; dotColor: string }> = [
    { type: "LIVE_WEBINAR", label: "Webinars en vivo", dotColor: "bg-blue-500" },
    { type: "GROUP_TUTORING", label: "Tutorías grupales", dotColor: "bg-indigo-500" },
    { type: "ASSIGNMENT_DEADLINE", label: "Entregas y plazos", dotColor: "bg-red-500" },
    { type: "EVALUATION", label: "Evaluaciones", dotColor: "bg-orange-500" },
    { type: "LIVE_CLASS", label: "Clases en directo", dotColor: "bg-emerald-500" },
    { type: "INFO_SESSION", label: "Sesiones informativas", dotColor: "bg-gray-400" },
  ];

  function toggleType(t: CalendarEventType) {
    const next = new Set(filters.types);
    if (next.has(t)) next.delete(t); else next.add(t);
    onChange({ ...filters, types: next });
  }

  function toggleStatus(s: CalendarEventStatus) {
    const next = new Set(filters.statuses);
    if (next.has(s)) next.delete(s); else next.add(s);
    onChange({ ...filters, statuses: next });
  }

  return (
    <div className="space-y-4">
      {/* Type */}
      <div className="rounded-xl border border-[#eaecf0] bg-white p-4">
        <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-[#9ba3af]">Tipo de evento</h3>
        <div className="space-y-2">
          {typeGroups.map(({ type, label, dotColor }) => (
            <label key={type} className="flex cursor-pointer items-center gap-2.5">
              <input
                type="checkbox"
                checked={filters.types.has(type)}
                onChange={() => toggleType(type)}
                className="h-3.5 w-3.5 rounded border-gray-300 accent-[#163c58]"
              />
              <span className={cn("h-2 w-2 rounded-full", dotColor)} />
              <span className="text-xs text-[#374151]">{label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Courses */}
      {courses.length > 0 && (
        <div className="rounded-xl border border-[#eaecf0] bg-white p-4">
          <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-[#9ba3af]">Mis cursos</h3>
          <div className="space-y-2">
            <label className="flex cursor-pointer items-center gap-2.5">
              <input
                type="radio"
                name="calCourse"
                value=""
                checked={filters.courseId === ""}
                onChange={() => onChange({ ...filters, courseId: "" })}
                className="h-3.5 w-3.5 accent-[#163c58]"
              />
              <span className="text-xs text-[#374151]">Todos los cursos</span>
            </label>
            {courses.map((c) => (
              <label key={c.id} className="flex cursor-pointer items-center gap-2.5">
                <input
                  type="radio"
                  name="calCourse"
                  value={c.id}
                  checked={filters.courseId === c.id}
                  onChange={() => onChange({ ...filters, courseId: c.id })}
                  className="h-3.5 w-3.5 accent-[#163c58]"
                />
                <span className="truncate text-xs text-[#374151]">{c.title}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Status */}
      <div className="rounded-xl border border-[#eaecf0] bg-white p-4">
        <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-[#9ba3af]">Estado</h3>
        <div className="space-y-2">
          {(["SCHEDULED", "LIVE", "FINISHED"] as CalendarEventStatus[]).map((s) => (
            <label key={s} className="flex cursor-pointer items-center gap-2.5">
              <input
                type="checkbox"
                checked={filters.statuses.has(s)}
                onChange={() => toggleStatus(s)}
                className="h-3.5 w-3.5 rounded border-gray-300 accent-[#163c58]"
              />
              <span className="text-xs text-[#374151]">{EVENT_STATUS_CONFIG[s].label}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Event Modal ───────────────────────────────────────────────────────────────

function EventModal({
  event,
  onClose,
  canManage,
  onEdit,
  onCancel,
}: {
  event: CalendarEventItem;
  onClose: () => void;
  canManage: boolean;
  onEdit: (e: CalendarEventItem) => void;
  onCancel: (e: CalendarEventItem) => void;
}) {
  const cfg = EVENT_TYPE_CONFIG[event.type];
  const statusCfg = EVENT_STATUS_CONFIG[event.status];
  const start = new Date(event.startsAt);
  const end = new Date(event.endsAt);
  const canEdit = canManage && event.isManaged;

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="w-full max-w-md overflow-hidden rounded-xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header band */}
        <div className={cn("px-5 py-4", cfg.color.replace("border-", "").split(" ")[0])}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <span className={cn("rounded-full px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-wide", cfg.color)}>
                  {cfg.label}
                </span>
                <span className={cn("rounded-full px-2 py-0.5 text-[0.6rem] font-medium", statusCfg.badge)}>
                  {statusCfg.label}
                </span>
              </div>
              <h2 className="text-base font-bold leading-snug text-[var(--color-primary)]">{event.title}</h2>
            </div>
            <button type="button" onClick={onClose} className="shrink-0 rounded-lg p-1 text-[#9ba3af] hover:bg-black/5">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="space-y-3 p-5">
          {/* Date/time */}
          <div className="flex items-start gap-2 text-sm text-[#374151]">
            <Clock className="mt-0.5 h-4 w-4 shrink-0 text-[#9ba3af]" />
            <div>
              <p>{formatDateFull(start)}</p>
              <p className="text-xs text-[#9ba3af]">
                {formatTime(start)} – {formatTime(end)} hs
              </p>
            </div>
          </div>

          {/* Course */}
          {event.courseTitle && (
            <div className="flex items-center gap-2 text-sm text-[#374151]">
              <GraduationCap className="h-4 w-4 shrink-0 text-[#9ba3af]" />
              <span>{event.courseTitle}</span>
            </div>
          )}

          {/* Location */}
          {event.location && (
            <div className="flex items-center gap-2 text-sm text-[#374151]">
              <MapPin className="h-4 w-4 shrink-0 text-[#9ba3af]" />
              <span>{event.location}</span>
            </div>
          )}

          {/* Description */}
          {event.description && (
            <p className="rounded-lg bg-[#f8fafc] px-3 py-2 text-sm text-[#6b7280] leading-relaxed">
              {event.description}
            </p>
          )}

          {/* Meeting link */}
          {event.meetingUrl && event.status !== "CANCELLED" && (
            <a
              href={event.meetingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#163c58] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1e4f73]"
            >
              <Video className="h-4 w-4" /> Entrar al evento
              <ExternalLink className="h-3.5 w-3.5 opacity-70" />
            </a>
          )}

          {/* Go to course */}
          {event.courseSlug && (
            <a
              href={`/mis-cursos/${event.courseSlug}`}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#d0d5dd] px-4 py-2.5 text-sm font-medium text-[#374151] transition hover:bg-[#f3f4f6]"
            >
              <GraduationCap className="h-4 w-4" /> Ir al curso
            </a>
          )}
        </div>

        {/* Footer actions for manage */}
        {canEdit && event.status !== "CANCELLED" && (
          <div className="flex gap-2 border-t border-[#eaecf0] px-5 py-3">
            <button
              type="button"
              onClick={() => onEdit(event)}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-[#d0d5dd] px-3 py-2 text-sm font-medium text-[#374151] hover:bg-[#f3f4f6]"
            >
              <Edit2 className="h-3.5 w-3.5" /> Editar
            </button>
            <button
              type="button"
              onClick={() => onCancel(event)}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
            >
              <XCircle className="h-3.5 w-3.5" /> Cancelar evento
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Cancel Confirm ────────────────────────────────────────────────────────────

function CancelConfirmDialog({
  event,
  onClose,
}: {
  event: CalendarEventItem | null;
  onClose: () => void;
}) {
  const [state, formAction, pending] = useActionState(cancelCalendarEventAction, {});

  useEffect(() => {
    if (state.success) onClose();
  }, [state.success, onClose]);

  if (!event) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-2xl">
        <h2 className="text-base font-semibold text-[var(--color-primary)]">Cancelar evento</h2>
        <p className="mt-2 text-sm text-[#6b7280]">
          ¿Cancelar &ldquo;{event.title}&rdquo;? Esta acción no se puede deshacer.
        </p>
        {state.error && (
          <div className="mt-3 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{state.error}</div>
        )}
        <form action={formAction}>
          <input type="hidden" name="id" value={event.id} />
          <div className="mt-5 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="rounded-lg border border-[#d0d5dd] px-4 py-2 text-sm text-[#374151] hover:bg-[#f3f4f6]">
              Volver
            </button>
            <button type="submit" disabled={pending} className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60">
              {pending && <Loader2 className="h-4 w-4 animate-spin" />} Cancelar evento
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Event Form ────────────────────────────────────────────────────────────────

function EventFormDialog({
  open,
  onClose,
  courses,
  editEvent,
}: {
  open: boolean;
  onClose: () => void;
  courses: CalendarCourse[];
  editEvent?: CalendarEventItem | null;
}) {
  const isEdit = Boolean(editEvent);
  const [state, formAction, pending] = useActionState(
    isEdit ? updateCalendarEventAction : createCalendarEventAction,
    {}
  );

  useEffect(() => {
    if (state.success) onClose();
  }, [state.success, onClose]);

  if (!open) return null;

  function toDatetimeLocal(d: Date) {
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  const defaultStart = editEvent ? toDatetimeLocal(new Date(editEvent.startsAt)) : "";
  const defaultEnd = editEvent ? toDatetimeLocal(new Date(editEvent.endsAt)) : "";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg overflow-hidden rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#eaecf0] px-6 py-4">
          <h2 className="text-base font-semibold text-[var(--color-primary)]">
            {isEdit ? "Editar evento" : "Nuevo evento"}
          </h2>
          <button type="button" onClick={onClose} className="text-[#9ba3af] hover:text-[var(--color-primary)]">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form action={formAction} className="space-y-4 p-6">
          {isEdit && <input type="hidden" name="id" value={editEvent?.id} />}
          {state.error && (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{state.error}</div>
          )}

          <div>
            <label className="mb-1 block text-xs font-medium text-[#374151]">Título *</label>
            <input
              name="title"
              required
              defaultValue={editEvent?.title ?? ""}
              className="w-full rounded-lg border border-[#d0d5dd] px-3 py-2 text-sm outline-none focus:border-[#163c58] focus:ring-2 focus:ring-[#163c58]/10"
              placeholder="Nombre del evento"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-[#374151]">Descripción</label>
            <textarea
              name="description"
              rows={2}
              defaultValue={editEvent?.description ?? ""}
              className="w-full rounded-lg border border-[#d0d5dd] px-3 py-2 text-sm outline-none focus:border-[#163c58]"
              placeholder="Descripción opcional"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-[#374151]">Tipo *</label>
              <select
                name="type"
                required
                defaultValue={editEvent?.type ?? "LIVE_WEBINAR"}
                className="w-full rounded-lg border border-[#d0d5dd] px-3 py-2 text-sm outline-none focus:border-[#163c58]"
              >
                {Object.entries(EVENT_TYPE_CONFIG).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-[#374151]">Visibilidad *</label>
              <select
                name="visibility"
                required
                defaultValue={editEvent?.visibility ?? "COURSE"}
                className="w-full rounded-lg border border-[#d0d5dd] px-3 py-2 text-sm outline-none focus:border-[#163c58]"
              >
                {Object.entries(VISIBILITY_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-[#374151]">Inicio *</label>
              <input
                type="datetime-local"
                name="startsAt"
                required
                defaultValue={defaultStart}
                className="w-full rounded-lg border border-[#d0d5dd] px-3 py-2 text-sm outline-none focus:border-[#163c58]"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-[#374151]">Fin *</label>
              <input
                type="datetime-local"
                name="endsAt"
                required
                defaultValue={defaultEnd}
                className="w-full rounded-lg border border-[#d0d5dd] px-3 py-2 text-sm outline-none focus:border-[#163c58]"
              />
            </div>
          </div>

          {courses.length > 0 && (
            <div>
              <label className="mb-1 block text-xs font-medium text-[#374151]">Curso asociado</label>
              <select
                name="courseId"
                defaultValue={editEvent?.courseId ?? ""}
                className="w-full rounded-lg border border-[#d0d5dd] px-3 py-2 text-sm outline-none focus:border-[#163c58]"
              >
                <option value="">Sin curso específico</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="mb-1 block text-xs font-medium text-[#374151]">Enlace de reunión</label>
            <input
              type="url"
              name="meetingUrl"
              defaultValue={editEvent?.meetingUrl ?? ""}
              className="w-full rounded-lg border border-[#d0d5dd] px-3 py-2 text-sm outline-none focus:border-[#163c58]"
              placeholder="https://meet.google.com/..."
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-[#374151]">Ubicación</label>
            <input
              name="location"
              defaultValue={editEvent?.location ?? ""}
              className="w-full rounded-lg border border-[#d0d5dd] px-3 py-2 text-sm outline-none focus:border-[#163c58]"
              placeholder="Aula 3, sala online..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="rounded-lg border border-[#d0d5dd] px-4 py-2 text-sm text-[#374151] hover:bg-[#f3f4f6]">
              Cancelar
            </button>
            <button type="submit" disabled={pending} className="flex items-center gap-2 rounded-lg bg-[#163c58] px-4 py-2 text-sm font-medium text-white hover:bg-[#1e4f73] disabled:opacity-60">
              {pending && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEdit ? "Guardar cambios" : "Crear evento"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main CalendarPage ─────────────────────────────────────────────────────────

export function CalendarPage({ events, courses, canManage }: CalendarPageProps) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [weekAnchor, setWeekAnchor] = useState(today);
  const [filters, setFilters] = useState<ActiveFilters>({
    types: new Set(),
    courseId: "",
    statuses: new Set(),
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEventItem | null>(null);
  const [editEvent, setEditEvent] = useState<CalendarEventItem | null>(null);
  const [cancelEvent, setCancelEvent] = useState<CalendarEventItem | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const filteredEvents = useMemo(() => applyFilters(events, filters), [events, filters]);

  function goToPrevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  }
  function goToNextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  }
  function goToToday() {
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    setWeekAnchor(today);
  }

  function handleEventClick(e: CalendarEventItem) {
    setSelectedEvent(e);
  }

  function handleEdit(e: CalendarEventItem) {
    setSelectedEvent(null);
    setEditEvent(e);
  }
  function handleCancel(e: CalendarEventItem) {
    setSelectedEvent(null);
    setCancelEvent(e);
  }

  const weekDays = useMemo(() => buildWeekDays(weekAnchor), [weekAnchor]);

  const hasActiveFilters = filters.types.size > 0 || filters.courseId !== "" || filters.statuses.size > 0;

  return (
    <div className="min-h-screen">
      <div className="px-5 py-8 sm:px-8 xl:px-10">

        {/* ── Top header ── */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {/* Month navigation */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={viewMode === "week" ? () => setWeekAnchor(d => { const n = new Date(d); n.setDate(n.getDate() - 7); return n; }) : goToPrevMonth}
                className="rounded-lg border border-[#d0d5dd] bg-white p-1.5 text-[#6b7280] hover:bg-[#f3f4f6]"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={goToToday}
                className="rounded-lg border border-[#d0d5dd] bg-white px-3 py-1.5 text-sm font-medium text-[#374151] hover:bg-[#f3f4f6]"
              >
                Hoy
              </button>
              <button
                type="button"
                onClick={viewMode === "week" ? () => setWeekAnchor(d => { const n = new Date(d); n.setDate(n.getDate() + 7); return n; }) : goToNextMonth}
                className="rounded-lg border border-[#d0d5dd] bg-white p-1.5 text-[#6b7280] hover:bg-[#f3f4f6]"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <h1 className="text-xl font-bold text-[var(--color-primary)]">
              {viewMode === "week"
                ? `${formatDateShort(weekDays[0])} – ${formatDateShort(weekDays[6])}`
                : `${MONTHS_ES[viewMonth]} ${viewYear}`}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            {/* View mode */}
            <div className="flex overflow-hidden rounded-lg border border-[#d0d5dd] bg-white">
              <button
                type="button"
                onClick={() => setViewMode("month")}
                className={cn("px-3 py-1.5 text-sm font-medium transition", viewMode === "month" ? "bg-[#163c58] text-white" : "text-[#374151] hover:bg-[#f3f4f6]")}
              >
                Mes
              </button>
              <button
                type="button"
                onClick={() => setViewMode("week")}
                className={cn("px-3 py-1.5 text-sm font-medium transition", viewMode === "week" ? "bg-[#163c58] text-white" : "text-[#374151] hover:bg-[#f3f4f6]")}
              >
                Semana
              </button>
              <button
                type="button"
                onClick={() => setViewMode("agenda")}
                className={cn("px-3 py-1.5 text-sm font-medium transition sm:hidden", viewMode === "agenda" ? "bg-[#163c58] text-white" : "text-[#374151] hover:bg-[#f3f4f6]")}
              >
                Agenda
              </button>
            </div>

            {/* Mobile filter toggle */}
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={cn("flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition xl:hidden", hasActiveFilters ? "border-[#163c58] bg-[#163c58] text-white" : "border-[#d0d5dd] bg-white text-[#374151] hover:bg-[#f3f4f6]")}
            >
              <Filter className="h-4 w-4" />
              Filtros
              {hasActiveFilters && <span className="rounded-full bg-white/30 px-1 text-[0.6rem] font-bold">{filters.types.size + (filters.courseId ? 1 : 0) + filters.statuses.size}</span>}
            </button>

            {canManage && (
              <button
                type="button"
                onClick={() => setShowCreateForm(true)}
                className="flex items-center gap-1.5 rounded-lg bg-[#163c58] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#1e4f73]"
              >
                <Plus className="h-4 w-4" /> Nuevo evento
              </button>
            )}
          </div>
        </div>

        {/* ── Main layout ── */}
        <div className="flex gap-5">
          {/* Calendar area */}
          <div className="min-w-0 flex-1">
            {/* Mobile: agenda by default */}
            <div className="sm:hidden">
              <AgendaView events={filteredEvents} onEventClick={handleEventClick} />
            </div>

            {/* Desktop: month / week */}
            <div className="hidden sm:flex sm:flex-col">
              {viewMode === "agenda" ? (
                <AgendaView events={filteredEvents} onEventClick={handleEventClick} />
              ) : viewMode === "week" ? (
                <WeekGrid weekDays={weekDays} events={filteredEvents} onEventClick={handleEventClick} />
              ) : (
                <MonthGrid year={viewYear} month={viewMonth} events={filteredEvents} onEventClick={handleEventClick} />
              )}
            </div>
          </div>

          {/* Right sidebar (desktop) */}
          <aside className="hidden w-64 shrink-0 space-y-4 xl:block">
            <FiltersPanel filters={filters} onChange={setFilters} courses={courses} />
            <UpcomingEventsPanel events={filteredEvents} onEventClick={handleEventClick} />
          </aside>
        </div>

        {/* Mobile filters drawer */}
        {showFilters && (
          <div className="fixed inset-0 z-40 flex justify-end xl:hidden" onClick={() => setShowFilters(false)}>
            <div className="absolute inset-0 bg-black/30" />
            <div
              className="relative z-50 h-full w-[min(320px,90vw)] overflow-y-auto bg-[#f7f8fc] p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-[var(--color-primary)]">Filtros</h2>
                <button type="button" onClick={() => setShowFilters(false)} className="text-[#9ba3af]">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <FiltersPanel filters={filters} onChange={setFilters} courses={courses} />
              <div className="mt-4">
                <UpcomingEventsPanel events={filteredEvents} onEventClick={handleEventClick} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {selectedEvent && (
        <EventModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          canManage={canManage}
          onEdit={handleEdit}
          onCancel={handleCancel}
        />
      )}

      <EventFormDialog
        open={showCreateForm || Boolean(editEvent)}
        onClose={() => { setShowCreateForm(false); setEditEvent(null); }}
        courses={courses}
        editEvent={editEvent}
      />

      <CancelConfirmDialog
        event={cancelEvent}
        onClose={() => setCancelEvent(null)}
      />
    </div>
  );
}

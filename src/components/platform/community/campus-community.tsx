"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Clock,
  HelpCircle,
  MessageSquare,
  Megaphone,
  PenLine,
  Pin,
  Plus,
  Search,
  SlidersHorizontal,
  Users,
  Video,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type DiscussionStatus = "open" | "resolved" | "unanswered" | "pinned";
type AuthorRole = "alumno" | "docente" | "admin";
type FilterId =
  | "todas"
  | "anuncios"
  | "dudas"
  | "recursos"
  | "casos"
  | "webinars"
  | "mis"
  | "sin-responder"
  | "resueltas";

type DiscussionThread = {
  id: string;
  filter: FilterId;
  title: string;
  excerpt: string;
  author: { name: string; initials: string; role: AuthorRole };
  createdAt: string;
  lastActivity: string;
  replyCount: number;
  status: DiscussionStatus;
  isPinned?: boolean;
  hasAttachment?: boolean;
  isAnnouncement?: boolean;
};

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_THREADS: DiscussionThread[] = [
  {
    id: "announce-1",
    filter: "anuncios",
    title: "📌 Bienvenidos al nuevo espacio de comunidad — Normas y guía de uso",
    excerpt:
      "Por favor lean el syllabus del curso antes de comenzar. Las clases en vivo serán los Jueves a las 18:00 hrs. Cualquier duda sobre el acceso, escribid aquí.",
    author: { name: "Prof. Martín Gómez", initials: "MG", role: "docente" },
    createdAt: "15 ene",
    lastActivity: "Hace 2 horas",
    replyCount: 4,
    status: "pinned",
    isPinned: true,
    isAnnouncement: true,
  },
  {
    id: "1",
    filter: "casos",
    title: "Adaptación de materiales para alumno con TDAH y TEA nivel 1",
    excerpt:
      "Estoy trabajando con un niño de 8 años que presenta mucha resistencia a las actividades escritas prolongadas. He intentado fraccionar las tareas, pero continúa sin completarlas dentro del tiempo de clase.",
    author: { name: "Lic. Laura Gómez", initials: "LG", role: "alumno" },
    createdAt: "18 ene",
    lastActivity: "Hace 2 horas",
    replyCount: 12,
    status: "open",
    hasAttachment: false,
  },
  {
    id: "2",
    filter: "dudas",
    title: "Dudas sobre el módulo 3: Implementación de apoyos visuales",
    excerpt:
      "En la lección sobre pictogramas, se menciona que deben ser lo menos abstractos posible inicialmente. ¿Tienen algún banco de imágenes recomendado más allá de ARASAAC?",
    author: { name: "Martín Ruiz", initials: "MR", role: "alumno" },
    createdAt: "17 ene",
    lastActivity: "Ayer",
    replyCount: 5,
    status: "resolved",
  },
  {
    id: "3",
    filter: "recursos",
    title: "Plantillas para agenda visual semanal — ¿cuál usan en el aula?",
    excerpt:
      "He visto varias versiones de agendas visuales. Me gustaría saber cuál formato están usando en sus aulas y qué criterios siguieron para elegirlo.",
    author: { name: "Ana Bermúdez", initials: "AB", role: "alumno" },
    createdAt: "14 ene",
    lastActivity: "Hace 3 días",
    replyCount: 0,
    status: "unanswered",
    hasAttachment: true,
  },
  {
    id: "4",
    filter: "casos",
    title: "Transición de primaria a secundaria en alumnado con TEA — experiencias",
    excerpt:
      "El módulo 5 toca este tema brevemente, pero me encantaría recoger experiencias reales. ¿Cómo han gestionado la transición en sus centros?",
    author: { name: "Roberto Leal", initials: "RL", role: "alumno" },
    createdAt: "10 ene",
    lastActivity: "Hace 5 días",
    replyCount: 19,
    status: "open",
  },
  {
    id: "5",
    filter: "webinars",
    title: "Resumen y recursos del webinar del 12 de enero sobre comunicación funcional",
    excerpt:
      "Dejo aquí el enlace a la grabación y las diapositivas del webinar de la semana pasada. También he subido las referencias bibliográficas que se mencionaron.",
    author: { name: "Prof. Martín Gómez", initials: "MG", role: "docente" },
    createdAt: "12 ene",
    lastActivity: "Hace 6 días",
    replyCount: 7,
    status: "open",
    hasAttachment: true,
  },
];

// ─── Filter config ────────────────────────────────────────────────────────────

type FilterConfig = {
  id: FilterId;
  label: string;
  Icon: LucideIcon;
};

const FILTERS: FilterConfig[] = [
  { id: "todas", label: "Todas las discusiones", Icon: MessageSquare },
  { id: "anuncios", label: "Anuncios", Icon: Megaphone },
  { id: "dudas", label: "Dudas", Icon: HelpCircle },
  { id: "recursos", label: "Recursos compartidos", Icon: BookOpen },
  { id: "casos", label: "Casos prácticos", Icon: Users },
  { id: "webinars", label: "Webinars", Icon: Video },
  { id: "sin-responder", label: "Sin responder", Icon: Clock },
  { id: "resueltas", label: "Resueltas", Icon: CheckCircle2 },
];

function countForFilter(id: FilterId, threads: DiscussionThread[]) {
  if (id === "todas") return threads.length;
  if (id === "sin-responder") return threads.filter((t) => t.status === "unanswered").length;
  if (id === "resueltas") return threads.filter((t) => t.status === "resolved").length;
  if (id === "mis") return 0;
  return threads.filter((t) => t.filter === id).length;
}

// ─── Role badge ───────────────────────────────────────────────────────────────

const ROLE_STYLES: Record<AuthorRole, string> = {
  docente: "bg-[#163c58] text-white",
  admin: "bg-[#7c3aed] text-white",
  alumno: "bg-[rgba(22,60,88,0.08)] text-[#4a6780]",
};
const ROLE_LABELS: Record<AuthorRole, string> = {
  docente: "Docente",
  admin: "Admin",
  alumno: "Estudiante",
};

function RoleBadge({ role }: { role: AuthorRole }) {
  if (role === "alumno") return null;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[0.62rem] font-bold uppercase tracking-[0.06em]",
        ROLE_STYLES[role],
      )}
    >
      {ROLE_LABELS[role]}
    </span>
  );
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: DiscussionStatus }) {
  if (status === "open") return null;
  if (status === "pinned") return null;

  if (status === "resolved") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-[#d8f3e8] px-2.5 py-0.5 text-[0.7rem] font-semibold text-[#0d6832]">
        <CheckCircle2 className="h-3 w-3" strokeWidth={2.5} />
        Resuelta
      </span>
    );
  }
  if (status === "unanswered") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-[#fff3cd] px-2.5 py-0.5 text-[0.7rem] font-semibold text-[#856404]">
        <Clock className="h-3 w-3" strokeWidth={2.5} />
        Sin responder
      </span>
    );
  }
  return null;
}

// ─── Announcement card ────────────────────────────────────────────────────────

function AnnouncementCard({ thread }: { thread: DiscussionThread }) {
  return (
    <Link
      className="block overflow-hidden rounded-2xl border border-[#c7dff0] bg-[#eef6ff] px-5 py-4 transition hover:border-[#163c58] hover:shadow-[0_2px_8px_rgba(22,60,88,0.08)]"
      href={`/comunidad/${thread.id}`}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#163c58] text-white">
          <Pin className="h-3.5 w-3.5" strokeWidth={2} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[0.7rem] font-bold uppercase tracking-[0.08em] text-[#163c58]">
              Anuncio del docente
            </span>
            <RoleBadge role={thread.author.role} />
          </div>
          <p className="mt-1 text-sm font-bold text-[#163c58] leading-snug">
            {thread.title.replace("📌 ", "")}
          </p>
          <p className="mt-1 line-clamp-2 text-[0.8rem] text-[#4a6780]">{thread.excerpt}</p>
          <div className="mt-2 flex items-center gap-3 text-[0.72rem] text-[#4a6780]">
            <span>{thread.author.name}</span>
            <span>·</span>
            <span>{thread.lastActivity}</span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              {thread.replyCount} respuestas
            </span>
          </div>
        </div>
        <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-[#163c58]" strokeWidth={2} />
      </div>
    </Link>
  );
}

// ─── Discussion card ──────────────────────────────────────────────────────────

const FILTER_LABEL: Record<FilterId, string> = {
  todas: "General",
  anuncios: "Anuncio",
  dudas: "Duda",
  recursos: "Recurso",
  casos: "Caso práctico",
  webinars: "Webinar",
  mis: "Mis publicaciones",
  "sin-responder": "Sin responder",
  resueltas: "Resuelta",
};

const FILTER_COLORS: Record<FilterId, string> = {
  todas: "bg-[rgba(22,60,88,0.08)] text-[#4a6780]",
  anuncios: "bg-[#163c58] text-white",
  dudas: "bg-[#dbeafe] text-[#1e40af]",
  recursos: "bg-[#d1fae5] text-[#065f46]",
  casos: "bg-[#fce7f3] text-[#9d174d]",
  webinars: "bg-[#ede9fe] text-[#5b21b6]",
  mis: "bg-[rgba(22,60,88,0.08)] text-[#4a6780]",
  "sin-responder": "bg-[#fff3cd] text-[#856404]",
  resueltas: "bg-[#d8f3e8] text-[#0d6832]",
};

function DiscussionCard({ thread }: { thread: DiscussionThread }) {
  return (
    <Link
      className={cn(
        "group block border-b border-[rgba(22,60,88,0.07)] px-5 py-4 transition last:border-0 hover:bg-[rgba(22,60,88,0.018)]",
        thread.status === "resolved" && "opacity-85",
      )}
      href={`/comunidad/${thread.id}`}
    >
      <div className="flex items-start gap-3 sm:gap-4">
        {/* Avatar */}
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[var(--color-primary)] text-[0.7rem] font-bold text-white">
          {thread.author.initials}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          {/* Top row: category + status */}
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center rounded-full px-2.5 py-0.5 text-[0.68rem] font-semibold",
                FILTER_COLORS[thread.filter],
              )}
            >
              {FILTER_LABEL[thread.filter]}
            </span>
            <StatusBadge status={thread.status} />
            {thread.hasAttachment && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[rgba(22,60,88,0.07)] px-2 py-0.5 text-[0.68rem] text-[#4a6780]">
                <PenLine className="h-2.5 w-2.5" />
                Adjunto
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className="mt-1.5 text-[0.95rem] font-bold leading-snug text-[var(--color-ink)] transition group-hover:text-[var(--color-primary)]">
            {thread.title}
          </h3>

          {/* Excerpt */}
          <p className="mt-1 line-clamp-2 text-[0.8rem] leading-relaxed text-[var(--color-ink-soft)]">
            {thread.excerpt}
          </p>

          {/* Meta */}
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.72rem] text-[var(--color-muted)]">
            <span className="font-semibold text-[var(--color-ink-soft)]">
              {thread.author.name}
            </span>
            <RoleBadge role={thread.author.role} />
            <span>·</span>
            <span>{thread.lastActivity}</span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              {thread.replyCount === 0
                ? "Sin respuestas"
                : `${thread.replyCount} respuesta${thread.replyCount !== 1 ? "s" : ""}`}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

// ─── Left filter panel ────────────────────────────────────────────────────────

function FilterPanel({
  activeFilter,
  threads,
  courseTitle,
  onChange,
}: {
  activeFilter: FilterId;
  threads: DiscussionThread[];
  courseTitle: string | null;
  onChange: (id: FilterId) => void;
}) {
  return (
    <aside className="flex flex-col gap-5">
      {/* Course context */}
      {courseTitle && (
        <div className="rounded-2xl border border-[rgba(22,60,88,0.08)] bg-white p-4">
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.1em] text-[var(--color-muted)]">
            Comunidad de
          </p>
          <p className="mt-1 text-sm font-bold leading-snug text-[var(--color-ink)]">
            {courseTitle}
          </p>
          <div className="mt-3 flex items-center gap-2 text-[0.75rem] text-[var(--color-muted)]">
            <Users className="h-3.5 w-3.5" strokeWidth={2} />
            <span>Foro académico privado</span>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="rounded-2xl border border-[rgba(22,60,88,0.08)] bg-white p-3">
        <p className="mb-2 px-2 text-[0.65rem] font-bold uppercase tracking-[0.1em] text-[var(--color-muted)]">
          Categorías
        </p>
        <nav className="space-y-0.5">
          {FILTERS.map(({ id, label, Icon }) => {
            const count = countForFilter(id, threads);
            const isActive = activeFilter === id;
            return (
              <button
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]",
                  isActive
                    ? "bg-[var(--color-primary)] text-white"
                    : "text-[var(--color-ink-soft)] hover:bg-[rgba(22,60,88,0.05)] hover:text-[var(--color-ink)]",
                )}
                key={id}
                onClick={() => onChange(id)}
                type="button"
              >
                <Icon className="h-4 w-4 shrink-0" strokeWidth={2} />
                <span className="flex-1 text-left">{label}</span>
                {count > 0 && (
                  <span
                    className={cn(
                      "grid h-5 min-w-5 place-items-center rounded-full px-1.5 text-[0.62rem] font-bold",
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-[rgba(22,60,88,0.08)] text-[var(--color-ink-soft)]",
                    )}
                  >
                    {count > 99 ? "99+" : count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}

// ─── Mobile filter drawer ──────────────────────────────────────────────────────

function MobileFilters({
  activeFilter,
  threads,
  onChange,
}: {
  activeFilter: FilterId;
  threads: DiscussionThread[];
  onChange: (id: FilterId) => void;
}) {
  const [open, setOpen] = useState(false);
  const active = FILTERS.find((f) => f.id === activeFilter);

  return (
    <div className="lg:hidden">
      <button
        className="flex items-center gap-2 rounded-xl border border-[rgba(22,60,88,0.12)] bg-white px-4 py-2.5 text-sm font-medium text-[var(--color-ink-soft)] transition hover:border-[var(--color-primary)]"
        onClick={() => setOpen((v) => !v)}
        type="button"
      >
        <SlidersHorizontal className="h-4 w-4" strokeWidth={2} />
        {active?.label ?? "Filtrar"}
      </button>

      {open && (
        <div className="absolute left-4 right-4 top-full z-30 mt-1 rounded-2xl border border-[rgba(22,60,88,0.1)] bg-white p-2 shadow-[0_8px_24px_rgba(22,60,88,0.12)]">
          {FILTERS.map(({ id, label, Icon }) => {
            const count = countForFilter(id, threads);
            return (
              <button
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                  activeFilter === id
                    ? "bg-[var(--color-primary)] text-white"
                    : "text-[var(--color-ink-soft)] hover:bg-[rgba(22,60,88,0.05)]",
                )}
                key={id}
                onClick={() => { onChange(id); setOpen(false); }}
                type="button"
              >
                <Icon className="h-4 w-4 shrink-0" strokeWidth={2} />
                <span className="flex-1 text-left">{label}</span>
                {count > 0 && (
                  <span className={cn("rounded-full px-1.5 py-0.5 text-[0.62rem] font-bold", activeFilter === id ? "bg-white/20 text-white" : "bg-[rgba(22,60,88,0.08)] text-[var(--color-ink-soft)]")}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ filter }: { filter: FilterId }) {
  const messages: Partial<Record<FilterId, string>> = {
    "sin-responder": "No hay discusiones sin respuesta. ¡La comunidad está al día!",
    resueltas: "No hay discusiones marcadas como resueltas todavía.",
    mis: "Todavía no has publicado ninguna discusión.",
  };
  return (
    <div className="flex flex-col items-center py-16 text-center">
      <MessageSquare className="h-10 w-10 text-[var(--color-border-subtle)]" strokeWidth={1.5} />
      <p className="mt-4 text-sm font-medium text-[var(--color-ink-soft)]">
        {messages[filter] ?? "No hay discusiones en esta categoría todavía."}
      </p>
      <p className="mt-1 text-[0.8rem] text-[var(--color-muted)]">
        Sé el primero en abrir una conversación.
      </p>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

type CampusCommunityProps = {
  primaryCourseTitle: string | null;
};

export function CampusCommunity({ primaryCourseTitle }: CampusCommunityProps) {
  const [activeFilter, setActiveFilter] = useState<FilterId>("todas");
  const [searchQuery, setSearchQuery] = useState("");

  // Filter threads
  const filtered = MOCK_THREADS.filter((t) => {
    if (t.isAnnouncement) return false; // announcements shown separately
    if (activeFilter === "sin-responder") return t.status === "unanswered";
    if (activeFilter === "resueltas") return t.status === "resolved";
    if (activeFilter === "mis") return false; // no user context in mock
    if (activeFilter !== "todas") return t.filter === activeFilter;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        t.title.toLowerCase().includes(q) ||
        t.excerpt.toLowerCase().includes(q)
      );
    }
    return true;
  }).filter((t) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return t.title.toLowerCase().includes(q) || t.excerpt.toLowerCase().includes(q);
  });

  const announcement = MOCK_THREADS.find((t) => t.isAnnouncement);

  return (
    <div className="site-container py-8 sm:py-10">
      {/* ── Page header ─────────────────────────────────────── */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[1.6rem] font-bold tracking-[-0.03em] text-[var(--color-ink)]">
            Comunidad
          </h1>
          <p className="mt-0.5 text-sm text-[var(--color-ink-soft)]">
            Espacio de discusión académica del campus.
          </p>
        </div>
        <Link
          className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-white shadow-[var(--shadow-soft)] transition hover:bg-[var(--color-primary-strong,#1e3a5f)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
          href="/comunidad/nueva"
        >
          <Plus className="h-4 w-4" strokeWidth={2.5} />
          Nueva discusión
        </Link>
      </div>

      {/* ── Layout ──────────────────────────────────────────── */}
      <div className="grid gap-5 lg:grid-cols-[220px_minmax(0,1fr)] xl:grid-cols-[240px_minmax(0,1fr)]">

        {/* Left: filters (desktop) */}
        <div className="hidden lg:block">
          <FilterPanel
            activeFilter={activeFilter}
            courseTitle={primaryCourseTitle}
            onChange={setActiveFilter}
            threads={MOCK_THREADS}
          />
        </div>

        {/* Right: main content */}
        <div className="min-w-0">
          {/* Search + mobile filter row */}
          <div className="relative mb-4 flex items-center gap-2">
            <div className="flex flex-1 items-center gap-2 rounded-xl border border-[rgba(22,60,88,0.12)] bg-white px-4 py-2.5 focus-within:border-[var(--color-primary)] focus-within:ring-2 focus-within:ring-[var(--color-primary)] focus-within:ring-offset-1">
              <Search className="h-4 w-4 shrink-0 text-[var(--color-muted)]" strokeWidth={2} />
              <input
                aria-label="Buscar discusiones"
                className="min-w-0 flex-1 bg-transparent text-sm text-[var(--color-ink)] placeholder:text-[var(--color-muted)] focus:outline-none"
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar discusiones..."
                type="text"
                value={searchQuery}
              />
            </div>
            <MobileFilters
              activeFilter={activeFilter}
              onChange={setActiveFilter}
              threads={MOCK_THREADS}
            />
          </div>

          {/* Pinned announcement */}
          {announcement && activeFilter === "todas" && !searchQuery && (
            <div className="mb-4">
              <AnnouncementCard thread={announcement} />
            </div>
          )}

          {/* Thread list */}
          <div className="overflow-hidden rounded-2xl border border-[rgba(22,60,88,0.08)] bg-white">
            {/* List header */}
            <div className="flex items-center justify-between border-b border-[rgba(22,60,88,0.07)] px-5 py-3">
              <p className="text-[0.8rem] font-semibold text-[var(--color-ink-soft)]">
                {filtered.length === 0
                  ? "Sin discusiones"
                  : `${filtered.length} discusión${filtered.length !== 1 ? "es" : ""}`}
              </p>
              <span className="text-[0.75rem] text-[var(--color-muted)]">
                {FILTERS.find((f) => f.id === activeFilter)?.label}
              </span>
            </div>

            {filtered.length > 0 ? (
              filtered.map((thread) => (
                <DiscussionCard key={thread.id} thread={thread} />
              ))
            ) : (
              <EmptyState filter={activeFilter} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  CheckCircle2,
  MessageSquare,
  Pin,
  Plus,
  Search,
  Shield,
  Tag,
  Users,
} from "lucide-react";
import type { CommunityFeedCourse, CommunityFeedThread } from "@/lib/forum-read";
import { cn } from "@/lib/utils";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(date: Date): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return mins <= 1 ? "Hace un momento" : `Hace ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return hrs === 1 ? "Hace 1 hora" : `Hace ${hrs} horas`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "Ayer";
  if (days < 7) return `Hace ${days} días`;
  return new Date(date).toLocaleDateString("es-ES", { day: "numeric", month: "short" });
}

function threadHref(t: CommunityFeedThread) {
  return `/mis-cursos/${t.courseSlug}/foro/${t.categorySlug}/${t.id}`;
}

function newThreadForCourse(courseSlug: string) {
  return `/mis-cursos/${courseSlug}/foro/nuevo`;
}

// ─── Thread card ──────────────────────────────────────────────────────────────

function ThreadCard({ thread }: { thread: CommunityFeedThread }) {
  return (
    <Link
      href={threadHref(thread)}
      className="block bg-[#ffffff] rounded-xl border border-[#c4c6cf] p-5 hover:border-[#74777f] transition-all cursor-pointer group"
      style={{ boxShadow: "0px 4px 12px rgba(30,58,95,0.03)" }}
    >
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            {thread.isPinned && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-[#e7eeff] text-[var(--color-primary)] border border-[#c4c6cf]">
                <Pin className="h-3 w-3" /> Fijado
              </span>
            )}
            <span className="px-2.5 py-0.5 rounded text-[12px] font-medium bg-[#adf0df] text-[#2c6f62] border border-[#91d3c3]">
              {thread.categoryTitle}
            </span>
            {thread.isResolved && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-[#f0f3ff] text-[#25695c] border border-[#91d3c3]">
                <CheckCircle2 className="h-3 w-3" /> Resuelta
              </span>
            )}
            <span className="text-xs text-[#43474e]">{timeAgo(thread.lastActivityAt)}</span>
          </div>

          <h3 className="text-[18px] font-semibold text-[#111c2c] group-hover:text-[var(--color-primary)] transition-colors leading-snug mb-2 line-clamp-2">
            {thread.title}
          </h3>

          {thread.excerpt && (
            <p className="text-sm text-[#43474e] line-clamp-2 leading-relaxed">
              {thread.excerpt}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#c4c6cf]">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border shrink-0",
            thread.isStaff
              ? "border-[#25695c] bg-[#adf0df] text-[#2c6f62]"
              : "border-[#c4c6cf] bg-[#e7eeff] text-[var(--color-primary)]",
          )}>
            {thread.authorInitials}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-[#111c2c] leading-none truncate">
              {thread.authorName}
            </p>
            <p className="text-[11px] text-[#43474e] mt-0.5 truncate">
              {thread.courseTitle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-[#43474e]">
          <div className="flex items-center gap-1.5 text-sm">
            <MessageSquare className="h-4 w-4" />
            <span>{thread.replyCount}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ newThreadHref }: { newThreadHref: string | null }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-full bg-[#e7eeff] flex items-center justify-center mb-4">
        <Users className="h-8 w-8 text-[var(--color-primary)]" />
      </div>
      <h3 className="text-lg font-semibold text-[#111c2c] mb-2">Sin discusiones todavía</h3>
      <p className="text-sm text-[#43474e] max-w-xs mb-6">
        Sé el primero en iniciar una conversación en la comunidad del campus.
      </p>
      {newThreadHref && (
        <Link
          href={newThreadHref}
          className="flex items-center gap-2 bg-[var(--color-primary)] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-[var(--color-primary-strong)] transition-colors"
        >
          <Plus className="h-4 w-4" /> Nueva Consulta
        </Link>
      )}
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

type Props = {
  threads: CommunityFeedThread[];
  courses: CommunityFeedCourse[];
  newThreadHref: string | null;
  userInitials: string;
};

// ─── Main component ───────────────────────────────────────────────────────────

export function CampusCommunity({ threads, courses, newThreadHref, userInitials }: Props) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"recientes" | "sin-respuesta">("recientes");
  const [activeCourse, setActiveCourse] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let result = [...threads];
    if (activeCourse) result = result.filter((t) => t.courseSlug === activeCourse);
    if (filter === "sin-respuesta") result = result.filter((t) => t.replyCount === 0);
    if (q.trim()) {
      const lq = q.toLowerCase();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(lq) ||
          t.excerpt.toLowerCase().includes(lq) ||
          t.categoryTitle.toLowerCase().includes(lq),
      );
    }
    return result;
  }, [threads, activeCourse, filter, q]);

  const primaryCourse = courses[0];

  return (
    <div className="min-h-screen">
      <div className="px-5 py-8 sm:px-8 xl:px-10">

        {/* Hero header */}
        <header
          className="bg-[#ffffff] rounded-xl border border-[#c4c6cf] p-6 md:p-8 mb-6 relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
          style={{ boxShadow: "0px 4px 12px rgba(30,58,95,0.05)" }}
        >
          {/* Decorative blob */}
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-[#adc8f5] rounded-full opacity-10 blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-2xl">
            {activeCourse && (
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#dee8ff] text-[var(--color-primary)] mb-3 text-xs font-medium">
                <BookOpen className="h-3.5 w-3.5" />
                {courses.find((c) => c.courseSlug === activeCourse)?.courseTitle}
              </div>
            )}
            <h2 className="text-2xl md:text-[32px] font-bold text-[var(--color-primary)] mb-2 leading-tight">
              Comunidad
            </h2>
            <p className="text-sm text-[#43474e]">
              Un espacio seguro y estructurado para compartir dudas, debatir casos clínicos y enriquecer la práctica profesional conjunta.
            </p>
          </div>

          {(newThreadHref || primaryCourse) && (
            <div className="relative z-10 shrink-0 w-full md:w-auto">
              <Link
                href={activeCourse ? newThreadForCourse(activeCourse) : (newThreadHref ?? "#")}
                className="flex items-center justify-center gap-2 bg-[var(--color-primary)] text-white px-6 py-3 rounded-lg text-sm font-medium hover:bg-[var(--color-primary-strong)] transition-colors w-full md:w-auto"
                style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.12)" }}
              >
                <Plus className="h-4 w-4" />
                Nueva Consulta
              </Link>
            </div>
          )}
        </header>

        {/* Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* ── Main feed ─────────────────────────────────────────── */}
          <div className="lg:col-span-8 flex flex-col gap-4">

            {/* Filter / search bar */}
            <div
              className="bg-[#ffffff] p-4 rounded-xl border border-[#c4c6cf] flex flex-col sm:flex-row items-center justify-between gap-3"
              style={{ boxShadow: "0px 4px 12px rgba(30,58,95,0.03)" }}
            >
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setFilter("recientes")}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors",
                    filter === "recientes"
                      ? "bg-[#dee8ff] text-[var(--color-primary)]"
                      : "text-[#43474e] hover:bg-[#f0f3ff] hover:text-[#111c2c]",
                  )}
                >
                  Más recientes
                </button>
                <button
                  type="button"
                  onClick={() => setFilter("sin-respuesta")}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors",
                    filter === "sin-respuesta"
                      ? "bg-[#dee8ff] text-[var(--color-primary)]"
                      : "text-[#43474e] hover:bg-[#f0f3ff] hover:text-[#111c2c]",
                  )}
                >
                  Sin respuesta
                </button>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#74777f]" />
                <input
                  type="text"
                  placeholder="Buscar discusiones..."
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-[#f9f9ff] border border-[#c4c6cf] rounded-lg text-sm text-[#111c2c] placeholder:text-[#74777f] focus:outline-none focus:ring-2 focus:ring-[#022448] focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Thread list */}
            {filtered.length === 0 ? (
              <EmptyState newThreadHref={newThreadHref} />
            ) : (
              <div className="space-y-4">
                {filtered.map((thread) => (
                  <ThreadCard key={thread.id} thread={thread} />
                ))}
              </div>
            )}
          </div>

          {/* ── Right sidebar ─────────────────────────────────────── */}
          <aside className="lg:col-span-4 hidden lg:flex flex-col gap-5">

            {/* Mis comunidades */}
            {courses.length > 0 && (
              <div
                className="bg-[#ffffff] rounded-xl border border-[#c4c6cf] p-5"
                style={{ boxShadow: "0px 4px 12px rgba(30,58,95,0.05)" }}
              >
                <h4 className="text-base font-semibold text-[var(--color-primary)] mb-4 flex items-center gap-2 border-b border-[#c4c6cf] pb-3">
                  <Users className="h-5 w-5" />
                  Mis comunidades
                </h4>
                <ul className="space-y-1">
                  <li>
                    <button
                      type="button"
                      onClick={() => setActiveCourse(null)}
                      className={cn(
                        "w-full text-left flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors",
                        activeCourse === null
                          ? "bg-[#1e3a5f] text-white font-semibold"
                          : "text-[#43474e] hover:bg-[#f0f3ff] hover:text-[#111c2c]",
                      )}
                    >
                      <span>Todas las discusiones</span>
                      <span className={cn(
                        "text-xs px-2 py-0.5 rounded-full",
                        activeCourse === null ? "bg-white/20 text-white" : "bg-[#dee8ff] text-[var(--color-primary)]",
                      )}>
                        {threads.length}
                      </span>
                    </button>
                  </li>
                  {courses.map((course) => (
                    <li key={course.courseSlug}>
                      <button
                        type="button"
                        onClick={() => setActiveCourse(
                          activeCourse === course.courseSlug ? null : course.courseSlug
                        )}
                        className={cn(
                          "w-full text-left flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors",
                          activeCourse === course.courseSlug
                            ? "bg-[#1e3a5f] text-white font-semibold"
                            : "text-[#43474e] hover:bg-[#f0f3ff] hover:text-[#111c2c]",
                        )}
                      >
                        <span className="truncate pr-2">{course.courseTitle}</span>
                        <span className={cn(
                          "text-xs px-2 py-0.5 rounded-full shrink-0",
                          activeCourse === course.courseSlug ? "bg-white/20 text-white" : "bg-[#dee8ff] text-[var(--color-primary)]",
                        )}>
                          {course.threadCount}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Temas populares */}
            <div
              className="bg-[#ffffff] rounded-xl border border-[#c4c6cf] p-5"
              style={{ boxShadow: "0px 4px 12px rgba(30,58,95,0.05)" }}
            >
              <h4 className="text-base font-semibold text-[var(--color-primary)] mb-4 flex items-center gap-2 border-b border-[#c4c6cf] pb-3">
                <Tag className="h-5 w-5" />
                Categorías activas
              </h4>
              {threads.length === 0 ? (
                <p className="text-sm text-[#43474e]">Sin categorías todavía.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {Array.from(new Set(threads.map((t) => t.categoryTitle)))
                    .slice(0, 8)
                    .map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setQ(cat)}
                        className="px-3 py-1.5 bg-[#f9f9ff] border border-[#c4c6cf] rounded-md text-xs font-medium text-[#43474e] hover:text-[var(--color-primary)] hover:border-[var(--color-primary)] transition-colors"
                      >
                        {cat}
                      </button>
                    ))}
                </div>
              )}
            </div>

            {/* Normas */}
            <div
              className="bg-[#f0f3ff] rounded-xl border border-[#c4c6cf] p-4 text-center"
              style={{ boxShadow: "0px 4px 12px rgba(30,58,95,0.03)" }}
            >
              <Shield className="h-6 w-6 text-[var(--color-primary)] mx-auto mb-2" />
              <h5 className="text-sm font-semibold text-[#111c2c] mb-1">Normas de la Comunidad</h5>
              <p className="text-xs text-[#43474e] mb-3 leading-relaxed">
                Mantenemos un entorno seguro, respetuoso y basado en evidencia.
              </p>
              <Link href="/soporte" className="text-xs text-[var(--color-primary)] hover:underline font-medium">
                Leer lineamientos
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

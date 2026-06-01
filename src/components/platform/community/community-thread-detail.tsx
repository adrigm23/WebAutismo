"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Bookmark,
  Download,
  Eye,
  FileText,
  MessageCircle,
  Play,
  Search,
  ThumbsUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── types ────────────────────────────────────────────────────────────────────

type CategoryColor = "teal" | "blue" | "purple" | "orange" | "rose";

type ThreadReply = {
  id: string;
  authorName: string;
  authorInitials: string;
  authorSpecialty: string;
  authorInstitution?: string;
  timeAgo: string;
  content: string;
  likeCount: number;
};

type ThreadParticipant = {
  id: string;
  name: string;
  initials: string;
  role: string;
  isExpert?: boolean;
};

type RelatedThread = {
  id: string;
  title: string;
  category: string;
  replyCount: number;
  isVideo?: boolean;
};

type ThreadDetail = {
  id: string;
  category: string;
  categoryColor: CategoryColor;
  isPublic: boolean;
  title: string;
  author: {
    name: string;
    initials: string;
    specialty: string;
    institution: string;
  };
  timeAgo: string;
  contentParagraphs: string[];
  attachment?: {
    filename: string;
    sizeLabel: string;
    mimeLabel: string;
  };
  likeCount: number;
  replyCount: number;
  replies: ThreadReply[];
  participants: ThreadParticipant[];
  relatedThreads: RelatedThread[];
};

// ─── mock data — replace with real API when backend is ready ─────────────────

const THREAD_DETAILS: Record<string, ThreadDetail> = {
  "1": {
    id: "1",
    category: "Casos Clínicos",
    categoryColor: "teal",
    isPublic: true,
    title: "Adaptación de materiales para alumno con TDAH y TEA nivel 1",
    author: {
      name: "Lic. Laura Gómez",
      initials: "LG",
      specialty: "Psicopedagoga",
      institution: "Colegio San Marcos",
    },
    timeAgo: "Hace 2 días",
    contentParagraphs: [
      "Hola comunidad, estoy trabajando con un alumno de 8 años (2do grado) con diagnóstico reciente de TDAH combinado y TEA nivel 1. Presenta muchas dificultades para iniciar las tareas escritas y mantener la atención en consignas de más de dos pasos.",
      "He probado fraccionar las actividades, pero sigue mostrando altos niveles de frustración. Adjunto el esquema visual de transición que intentamos implementar esta semana sin mucho éxito.",
      "¿Tienen recomendaciones sobre cómo estructurar visualmente las guías de matemáticas para reducir la carga cognitiva sin infantilizar el material?",
    ],
    attachment: {
      filename: "Esquema_Transicion_Aula.pdf",
      sizeLabel: "1.2 MB",
      mimeLabel: "Documento PDF",
    },
    likeCount: 12,
    replyCount: 4,
    replies: [
      {
        id: "r1",
        authorName: "Carlos Ruiz",
        authorInitials: "CR",
        authorSpecialty: "Docente Inclusivo",
        authorInstitution: "CEIP Las Acacias",
        timeAgo: "Hace 1 día",
        content:
          'Laura, a nosotros nos ha funcionado muy bien utilizar el método de "revelación progresiva". En lugar de entregar la hoja completa, le entregamos tiras con un solo ejercicio. La sobrecarga visual de la hoja A4 completa suele ser el principal detonante en casos de TEA+TDAH.',
        likeCount: 5,
      },
      {
        id: "r2",
        authorName: "Dra. Elena Silva",
        authorInitials: "ES",
        authorSpecialty: "Neuróloga Infantil",
        authorInstitution: "Hospital Universitario",
        timeAgo: "Hace 22 horas",
        content:
          "Completamente de acuerdo con Carlos. Añadiría también el uso de marcos de color para delimitar cada tarea, y reducir los estímulos decorativos de la página. A veces el problema no es el contenido sino el fondo visual. Comparto un recurso que uso habitualmente con familias.",
        likeCount: 9,
      },
    ],
    participants: [
      { id: "p1", name: "Lic. Laura Gómez", initials: "LG", role: "Autor" },
      { id: "p2", name: "Dra. Elena Silva", initials: "ES", role: "Docente Experta", isExpert: true },
      { id: "p3", name: "Carlos Ruiz", initials: "CR", role: "Miembro" },
    ],
    relatedThreads: [
      { id: "rt1", title: "Estrategias de regulación sensorial en recreos", category: "Foro General", replyCount: 12 },
      { id: "rt2", title: "Uso de anticipadores visuales en el hogar", category: "Materiales", replyCount: 8 },
      { id: "rt3", title: "TDAH y funciones ejecutivas: Taller grabado", category: "Videoteca", replyCount: 0, isVideo: true },
    ],
  },
  "2": {
    id: "2",
    category: "Metodología",
    categoryColor: "blue",
    isPublic: true,
    title: "Dudas sobre el módulo 3: Implementación de apoyos visuales",
    author: {
      name: "Martín Ruiz",
      initials: "MR",
      specialty: "Docente Inclusivo",
      institution: "CEIP Las Acacias",
    },
    timeAgo: "Ayer",
    contentParagraphs: [
      "En la lección sobre pictogramas, se menciona que deben ser lo menos abstractos posible inicialmente. ¿Tienen algún banco de imágenes recomendado más allá de ARASAAC?",
      "También me pregunto si existe alguna guía sobre cómo introducir los pictogramas de forma gradual, sin saturar al alumno en las primeras semanas.",
    ],
    likeCount: 8,
    replyCount: 5,
    replies: [
      {
        id: "r1",
        authorName: "Ana Bermúdez",
        authorInitials: "AB",
        authorSpecialty: "PT de Audición y Lenguaje",
        timeAgo: "Hace 18 horas",
        content:
          "Para imágenes más realistas te recomiendo Mulberry Symbols (libre) y también el banco de Pictogram.no. Respecto a la introducción gradual, el protocolo de Mirenda (2003) sigue siendo una referencia sólida.",
        likeCount: 7,
      },
    ],
    participants: [
      { id: "p1", name: "Martín Ruiz", initials: "MR", role: "Autor" },
      { id: "p2", name: "Ana Bermúdez", initials: "AB", role: "Miembro" },
    ],
    relatedThreads: [
      { id: "rt1", title: "Adaptación de materiales para alumno con TDAH y TEA nivel 1", category: "Casos Clínicos", replyCount: 12 },
      { id: "rt2", title: "Plantillas para agenda visual semanal", category: "Recursos", replyCount: 0 },
    ],
  },
};

// Generic fallback for threads 3, 4, etc.
function getThreadDetail(id: string): ThreadDetail | null {
  if (THREAD_DETAILS[id]) return THREAD_DETAILS[id];
  return null;
}

// ─── helpers ──────────────────────────────────────────────────────────────────

const CATEGORY_STYLES: Record<CategoryColor, string> = {
  teal: "bg-emerald-100 text-emerald-700",
  blue: "bg-blue-100 text-blue-700",
  purple: "bg-violet-100 text-violet-700",
  orange: "bg-orange-100 text-orange-700",
  rose: "bg-rose-100 text-rose-700",
};

// ─── reply card ───────────────────────────────────────────────────────────────

function ReplyCard({ reply }: { reply: ThreadReply }) {
  const [liked, setLiked] = useState(false);
  const likeCount = liked ? reply.likeCount + 1 : reply.likeCount;

  return (
    <div className="rounded-2xl border border-[rgba(22,60,88,0.08)] bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[var(--color-primary)] text-xs font-bold text-white">
            {reply.authorInitials}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[var(--color-ink)]">{reply.authorName}</p>
            <p className="text-xs text-[var(--color-muted)]">
              {reply.authorSpecialty}
              {reply.authorInstitution ? ` · ${reply.authorInstitution}` : ""}
            </p>
          </div>
        </div>
        <span className="shrink-0 text-xs text-[var(--color-muted)]">{reply.timeAgo}</span>
      </div>

      <p className="mt-3 text-sm leading-relaxed text-[var(--color-ink-soft)]">{reply.content}</p>

      <div className="mt-4 flex items-center gap-4 border-t border-[rgba(22,60,88,0.06)] pt-3">
        <button
          onClick={() => setLiked((v) => !v)}
          type="button"
          className={cn(
            "flex items-center gap-1.5 text-xs font-medium transition",
            liked ? "text-[var(--color-primary)]" : "text-[var(--color-muted)] hover:text-[var(--color-primary)]",
          )}
        >
          <ThumbsUp className="h-3.5 w-3.5" />
          {likeCount}
        </button>
        <button
          type="button"
          className="flex items-center gap-1.5 text-xs font-medium text-[var(--color-muted)] transition hover:text-[var(--color-primary)]"
        >
          <MessageCircle className="h-3.5 w-3.5" />
          Responder
        </button>
      </div>
    </div>
  );
}

// ─── sidebar cards ────────────────────────────────────────────────────────────

function ParticipantsCard({ participants }: { participants: ThreadParticipant[] }) {
  return (
    <div className="rounded-2xl border border-[rgba(22,60,88,0.08)] bg-white p-5">
      <h2 className="text-sm font-bold text-[var(--color-ink)]">Participantes en el debate</h2>
      <div className="mt-1 h-px bg-[rgba(22,60,88,0.07)]" />
      <div className="mt-4 space-y-3">
        {participants.map((p) => (
          <div key={p.id} className="flex items-center gap-3">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[var(--color-primary)] text-xs font-bold text-white">
              {p.initials}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[var(--color-ink)]">{p.name}</p>
              <p
                className={cn(
                  "truncate text-xs",
                  p.isExpert ? "font-medium text-[var(--color-primary)]" : "text-[var(--color-muted)]",
                )}
              >
                {p.role}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RelatedTopicsCard({ threads }: { threads: RelatedThread[] }) {
  return (
    <div className="rounded-2xl border border-[rgba(22,60,88,0.08)] bg-white p-5">
      <h2 className="text-sm font-bold text-[var(--color-ink)]">Temas Relacionados</h2>
      <div className="mt-4 space-y-4">
        {threads.map((t) => (
          <Link
            key={t.id}
            href={`/comunidad/${t.id}`}
            className="group block"
          >
            <p className="text-sm font-medium leading-snug text-[var(--color-ink)] transition group-hover:text-[var(--color-primary)] line-clamp-2">
              {t.title}
            </p>
            <div className="mt-1 flex items-center gap-2 text-xs text-[var(--color-muted)]">
              {t.isVideo ? (
                <span className="flex items-center gap-1 text-[var(--color-primary)]">
                  <Play className="h-3 w-3" />
                  {t.category}
                </span>
              ) : (
                <span>{t.category}</span>
              )}
              {t.replyCount > 0 && (
                <>
                  <span>·</span>
                  <span>{t.replyCount} respuestas</span>
                </>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

// ─── main component ───────────────────────────────────────────────────────────

type CommunityThreadDetailProps = {
  threadId: string;
};

export function CommunityThreadDetail({ threadId }: CommunityThreadDetailProps) {
  const thread = getThreadDetail(threadId);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);

  if (!thread) {
    return (
      <div className="site-container py-16 text-center">
        <p className="text-sm text-[var(--color-ink-soft)]">Discusión no encontrada.</p>
        <Link
          href="/comunidad"
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--color-primary)] hover:underline"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Volver a la comunidad
        </Link>
      </div>
    );
  }

  const categoryStyle = CATEGORY_STYLES[thread.categoryColor];
  const likeCount = liked ? thread.likeCount + 1 : thread.likeCount;

  return (
    <div className="site-container py-8 sm:py-10">

      {/* ── Search bar ────────────────────────────────────────── */}
      <div className="flex items-center gap-2 rounded-2xl border border-[rgba(22,60,88,0.1)] bg-white px-5 py-3 shadow-[0_1px_4px_rgba(30,58,95,0.06)]">
        <Search className="h-4 w-4 shrink-0 text-[var(--color-muted)]" />
        <input
          aria-label="Buscar en la comunidad"
          className="flex-1 bg-transparent text-sm text-[var(--color-ink)] placeholder:text-[var(--color-muted)] focus:outline-none"
          placeholder="Buscar en la comunidad..."
          type="text"
        />
      </div>

      {/* ── Back link + meta ──────────────────────────────────── */}
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Link
          href="/comunidad"
          className="flex items-center gap-1.5 text-sm text-[var(--color-muted)] transition hover:text-[var(--color-primary)]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Comunidad
        </Link>
        <span className="text-[var(--color-muted)]">/</span>
        <span
          className={cn(
            "inline-flex items-center rounded-full px-2.5 py-0.5 text-[0.72rem] font-semibold",
            categoryStyle,
          )}
        >
          {thread.category}
        </span>
        {thread.isPublic && (
          <span className="flex items-center gap-1 text-xs text-[var(--color-muted)]">
            <Eye className="h-3.5 w-3.5" />
            Público
          </span>
        )}
      </div>

      {/* ── Title ─────────────────────────────────────────────── */}
      <h1 className="mt-3 font-premium text-[1.6rem] font-bold leading-tight tracking-tight text-[var(--color-ink)] sm:text-[1.9rem]">
        {thread.title}
      </h1>

      {/* ── Main grid ─────────────────────────────────────────── */}
      <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px] xl:grid-cols-[minmax(0,1fr)_300px]">

        {/* ── Content column ─────────────────────────────────── */}
        <div className="space-y-4">

          {/* Main post card */}
          <div className="overflow-hidden rounded-2xl border border-[rgba(22,60,88,0.08)] bg-white p-6">
            {/* Author row */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[var(--color-primary)] text-sm font-bold text-white">
                  {thread.author.initials}
                </div>
                <div>
                  <p className="font-semibold text-[var(--color-ink)]">{thread.author.name}</p>
                  <p className="text-xs text-[var(--color-muted)]">
                    {thread.author.specialty} · {thread.author.institution}
                  </p>
                </div>
              </div>
              <span className="shrink-0 text-xs text-[var(--color-muted)]">{thread.timeAgo}</span>
            </div>

            {/* Content */}
            <div className="mt-5 space-y-3">
              {thread.contentParagraphs.map((para, i) => (
                <p
                  key={i}
                  className="text-sm leading-relaxed text-[var(--color-ink-soft)]"
                >
                  {para}
                </p>
              ))}
            </div>

            {/* Attachment */}
            {thread.attachment && (
              <div className="mt-5 flex items-center gap-3 rounded-xl border border-[rgba(22,60,88,0.1)] bg-[#f8fafc] px-4 py-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-red-50 text-red-500">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-[var(--color-ink)]">
                    {thread.attachment.filename}
                  </p>
                  <p className="text-xs text-[var(--color-muted)]">
                    {thread.attachment.sizeLabel} · {thread.attachment.mimeLabel}
                  </p>
                </div>
                <button
                  type="button"
                  aria-label="Descargar archivo"
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-[rgba(22,60,88,0.1)] bg-white text-[var(--color-ink-soft)] transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
                >
                  <Download className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* Interactions */}
            <div className="mt-5 flex items-center gap-1 border-t border-[rgba(22,60,88,0.07)] pt-4">
              <button
                onClick={() => setLiked((v) => !v)}
                type="button"
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition",
                  liked
                    ? "bg-[var(--color-brand-soft)] text-[var(--color-primary)]"
                    : "text-[var(--color-muted)] hover:bg-[rgba(22,60,88,0.05)] hover:text-[var(--color-primary)]",
                )}
              >
                <ThumbsUp className="h-4 w-4" />
                {likeCount}
              </button>

              <button
                type="button"
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-[var(--color-muted)] transition hover:bg-[rgba(22,60,88,0.05)] hover:text-[var(--color-primary)]"
              >
                <MessageCircle className="h-4 w-4" />
                {thread.replyCount} Respuestas
              </button>

              <button
                onClick={() => setSaved((v) => !v)}
                type="button"
                className={cn(
                  "ml-auto flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition",
                  saved
                    ? "bg-[var(--color-brand-soft)] text-[var(--color-primary)]"
                    : "text-[var(--color-muted)] hover:bg-[rgba(22,60,88,0.05)] hover:text-[var(--color-primary)]",
                )}
              >
                <Bookmark className={cn("h-4 w-4", saved && "fill-current")} />
                Guardar
              </button>
            </div>
          </div>

          {/* Replies */}
          {thread.replies.length > 0 && (
            <div className="space-y-3">
              {thread.replies.map((reply) => (
                <ReplyCard key={reply.id} reply={reply} />
              ))}
            </div>
          )}

          {/* Reply composer placeholder */}
          <div className="overflow-hidden rounded-2xl border border-dashed border-[rgba(22,60,88,0.15)] bg-white p-4">
            <p className="text-center text-sm text-[var(--color-muted)]">
              Escribe tu respuesta a esta discusión...
            </p>
          </div>
        </div>

        {/* ── Right sidebar ──────────────────────────────────── */}
        <aside className="space-y-4">
          <ParticipantsCard participants={thread.participants} />
          <RelatedTopicsCard threads={thread.relatedThreads} />
        </aside>
      </div>
    </div>
  );
}

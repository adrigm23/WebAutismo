"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  BookOpen,
  Info,
  Plus,
  Undo2,
  Users,
  X,
} from "lucide-react";
import { createCourseAction } from "@/actions/admin/courses";
import { cn } from "@/lib/utils";

type Teacher = { id: string; name: string; email: string };
type Props = { teachers: Teacher[] };

const CATEGORIES = [
  "General",
  "Fundamentos",
  "Intervención Clínica",
  "Educativo",
  "Familia",
  "Diagnóstico",
  "Terapia",
  "Herramientas",
];
const LEVELS = ["Básico", "Intermedio", "Avanzado", "General"];

export function CreateCoursePage({ teachers }: Props) {
  const [title, setTitle] = useState("");
  const [slugOverride, setSlugOverride] = useState<string | null>(null);
  const [shortDescription, setShortDescription] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("General");
  const [level, setLevel] = useState("Básico");
  const [status, setStatus] = useState<"ACTIVE" | "INACTIVE">("INACTIVE");
  const [duration, setDuration] = useState("");
  const [priceInCents, setPriceInCents] = useState(0);
  const [accentFrom, setAccentFrom] = useState("#163c58");
  const [accentTo, setAccentTo] = useState("#2e6b8a");
  const [selectedTeachers, setSelectedTeachers] = useState<Teacher[]>([]);
  const [teacherSelectValue, setTeacherSelectValue] = useState("");

  const generatedSlug = useMemo(
    () =>
      title
        .toLowerCase()
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/[^a-z0-9\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-")
        .slice(0, 60),
    [title],
  );

  const slug = slugOverride !== null ? slugOverride : generatedSlug;

  return (
    <div className="min-h-screen bg-[#f3f4f6]">
      {/* Form content */}
      <form id="create-course-form" action={createCourseAction}>
        {/* Hidden fields for state */}
        <input type="hidden" name="accentFrom" value={accentFrom} />
        <input type="hidden" name="accentTo" value={accentTo} />
        <input type="hidden" name="duration" value={duration} />
        <input type="hidden" name="priceInCents" value={String(priceInCents)} />
        {selectedTeachers.map((t) => (
          <input key={t.id} type="hidden" name="teacherIds" value={t.id} />
        ))}

        <div className="mx-auto max-w-[1200px] px-4 py-8 md:px-6 xl:px-10">
          {/* Page header */}
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-[1.9rem] font-bold tracking-[-0.04em] text-[var(--color-ink)]">
                Nuevo curso
              </h1>
              <p className="mt-1 text-sm text-[var(--color-muted)]">
                Rellena la información base. Podrás añadir módulos y recursos después.
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Link
                href="/admin/courses"
                className="inline-flex items-center gap-1.5 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white px-4 py-2 text-sm font-medium text-[var(--color-ink-soft)] transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
              >
                <Undo2 className="h-3.5 w-3.5" />
                Cancelar
              </Link>
              <button
                form="create-course-form"
                name="status"
                value="INACTIVE"
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white px-4 py-2 text-sm font-medium text-[var(--color-ink)] transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
              >
                Guardar borrador
              </button>
              <button
                form="create-course-form"
                name="status"
                value="ACTIVE"
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-[var(--radius-md)] bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white shadow-[var(--shadow-soft)] transition hover:bg-[var(--color-primary-strong)]"
              >
                Publicar curso
              </button>
            </div>
          </div>
          <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-start">
            {/* ── Left column: form ── */}
            <div className="space-y-6">
              {/* Sección: Información General */}
              <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-white shadow-[var(--shadow-xs)]">
                <div className="flex items-center gap-2 border-b border-[var(--color-border-subtle)] px-6 py-4">
                  <Info className="h-4 w-4 text-[var(--color-muted)]" />
                  <h2 className="text-sm font-semibold text-[var(--color-ink)]">
                    Información General
                  </h2>
                </div>
                <div className="space-y-5 px-6 py-6">
                  {/* Nombre + Slug */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-[0.8rem] font-medium text-[var(--color-ink-soft)]">
                        Nombre del Curso *
                      </label>
                      <input
                        name="title"
                        required
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Ej. Módulo 1: Fundamentos del TEA"
                        className="h-10 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white px-3.5 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-muted)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/10 transition"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-[0.8rem] font-medium text-[var(--color-ink-soft)]">
                        Slug (URL amigable) *
                      </label>
                      <div className="flex h-10 items-center rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[rgba(22,60,88,0.03)] px-3.5 text-sm focus-within:border-[var(--color-primary)] focus-within:ring-2 focus-within:ring-[var(--color-primary)]/10 transition">
                        <span className="shrink-0 text-[var(--color-muted)]">
                          /cursos/
                        </span>
                        <input
                          name="slug"
                          required
                          value={slug}
                          onChange={(e) => setSlugOverride(e.target.value)}
                          placeholder="nombre-del-curso"
                          className="flex-1 bg-transparent text-[var(--color-ink)] placeholder:text-[var(--color-muted)] focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Descripción corta */}
                  <div>
                    <label className="mb-1.5 block text-[0.8rem] font-medium text-[var(--color-ink-soft)]">
                      Descripción Corta *
                    </label>
                    <textarea
                      name="shortDescription"
                      required
                      rows={2}
                      value={shortDescription}
                      onChange={(e) => setShortDescription(e.target.value)}
                      placeholder="Breve resumen del curso para tarjetas..."
                      className="w-full resize-none rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white px-3.5 py-2.5 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-muted)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/10 transition"
                    />
                  </div>

                  {/* Descripción completa con toolbar */}
                  <div>
                    <label className="mb-1.5 block text-[0.8rem] font-medium text-[var(--color-ink-soft)]">
                      Descripción Completa
                    </label>
                    {/* Toolbar */}
                    <div className="flex items-center gap-1 rounded-t-[var(--radius-md)] border border-b-0 border-[var(--color-border)] bg-[rgba(22,60,88,0.02)] px-2.5 py-1.5">
                      {(
                        [
                          { label: "B", action: "bold", className: "font-bold" },
                          { label: "I", action: "italic", className: "italic" },
                          { label: "≡", action: "list", className: "" },
                          { label: "🔗", action: "link", className: "" },
                        ] as const
                      ).map((btn) => (
                        <button
                          key={btn.action}
                          type="button"
                          onClick={() => {
                            const map: Record<string, string> = {
                              bold: "**texto**",
                              italic: "*texto*",
                              list: "\n- elemento",
                              link: "[texto](url)",
                            };
                            setDescription((prev) => prev + map[btn.action]);
                          }}
                          className={cn(
                            "grid h-7 w-7 place-items-center rounded-lg text-[0.82rem] text-[var(--color-ink-soft)] transition hover:bg-[rgba(22,60,88,0.08)] hover:text-[var(--color-ink)]",
                            btn.className,
                          )}
                        >
                          {btn.label}
                        </button>
                      ))}
                    </div>
                    <textarea
                      name="description"
                      rows={5}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Detalle completo del programa..."
                      className="w-full resize-y rounded-b-[var(--radius-md)] border border-[var(--color-border)] bg-white px-3.5 py-2.5 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-muted)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/10 transition"
                    />
                  </div>

                  {/* Categoría / Nivel / Estado */}
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div>
                      <label className="mb-1.5 block text-[0.8rem] font-medium text-[var(--color-ink-soft)]">
                        Categoría
                      </label>
                      <select
                        name="category"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="h-10 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white px-3 text-sm text-[var(--color-ink)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/10 transition"
                      >
                        {CATEGORIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-[0.8rem] font-medium text-[var(--color-ink-soft)]">
                        Nivel
                      </label>
                      <select
                        name="level"
                        value={level}
                        onChange={(e) => setLevel(e.target.value)}
                        className="h-10 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white px-3 text-sm text-[var(--color-ink)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/10 transition"
                      >
                        {LEVELS.map((l) => (
                          <option key={l} value={l}>
                            {l}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-[0.8rem] font-medium text-[var(--color-ink-soft)]">
                        Estado Inicial
                      </label>
                      <select
                        value={status}
                        onChange={(e) =>
                          setStatus(e.target.value as "ACTIVE" | "INACTIVE")
                        }
                        className="h-10 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white px-3 text-sm text-[var(--color-ink)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/10 transition"
                      >
                        <option value="INACTIVE">Borrador</option>
                        <option value="ACTIVE">Publicado</option>
                      </select>
                    </div>
                  </div>

                  {/* Portada — colores del gradiente */}
                  <div>
                    <label className="mb-2 block text-[0.8rem] font-medium text-[var(--color-ink-soft)]">
                      Imagen de Portada
                    </label>
                    <div className="overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[rgba(22,60,88,0.02)] p-4">
                      <div className="flex items-center gap-4">
                        {/* Preview thumbnail */}
                        <div
                          className="h-16 w-28 shrink-0 rounded-lg"
                          style={{
                            background: `linear-gradient(135deg, ${accentFrom} 0%, ${accentTo} 100%)`,
                          }}
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-[var(--color-ink)]">
                            Gradiente de portada
                          </p>
                          <p className="mt-0.5 text-xs text-[var(--color-muted)]">
                            Selecciona los colores del gradiente del curso
                          </p>
                          <div className="mt-2 flex items-center gap-3">
                            <div className="flex items-center gap-1.5">
                              <label className="text-xs text-[var(--color-muted)]">
                                Inicio
                              </label>
                              <input
                                type="color"
                                value={accentFrom}
                                onChange={(e) => setAccentFrom(e.target.value)}
                                className="h-7 w-10 cursor-pointer rounded border border-[var(--color-border)] p-0.5"
                              />
                            </div>
                            <div className="flex items-center gap-1.5">
                              <label className="text-xs text-[var(--color-muted)]">
                                Final
                              </label>
                              <input
                                type="color"
                                value={accentTo}
                                onChange={(e) => setAccentTo(e.target.value)}
                                className="h-7 w-10 cursor-pointer rounded border border-[var(--color-border)] p-0.5"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sección: Detalles del Curso */}
              <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-white shadow-[var(--shadow-xs)]">
                <div className="flex items-center gap-2 border-b border-[var(--color-border-subtle)] px-6 py-4">
                  <BookOpen className="h-4 w-4 text-[var(--color-muted)]" />
                  <h2 className="text-sm font-semibold text-[var(--color-ink)]">
                    Detalles del Curso
                  </h2>
                </div>
                <div className="grid gap-4 px-6 py-6 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-[0.8rem] font-medium text-[var(--color-ink-soft)]">
                      Duración estimada
                    </label>
                    <input
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      placeholder="Ej. 40 horas"
                      className="h-10 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white px-3.5 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-muted)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/10 transition"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[0.8rem] font-medium text-[var(--color-ink-soft)]">
                      Precio (€)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-[var(--color-muted)]">
                        €
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={priceInCents / 100 || ""}
                        onChange={(e) =>
                          setPriceInCents(
                            Math.round(
                              parseFloat(e.target.value || "0") * 100,
                            ),
                          )
                        }
                        placeholder="0.00"
                        className="h-10 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white pl-8 pr-3.5 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-muted)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/10 transition"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Right column: preview + teachers ── */}
            <div className="space-y-5 xl:sticky xl:top-[calc(var(--topbar-height,3.5rem)+3.5rem)]">
              {/* Vista Previa */}
              <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-white shadow-[var(--shadow-xs)]">
                <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)] px-5 py-3.5">
                  <span className="text-[0.8rem] font-semibold text-[var(--color-ink-soft)]">
                    Vista Previa del Alumno
                  </span>
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-0.5 text-[0.65rem] font-semibold",
                      status === "ACTIVE"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-amber-50 text-amber-700",
                    )}
                  >
                    {status === "ACTIVE" ? "En Catálogo" : "Borrador"}
                  </span>
                </div>
                <div className="p-4">
                  {/* Course card preview */}
                  <div className="overflow-hidden rounded-xl border border-[var(--color-border-subtle)] shadow-[var(--shadow-xs)]">
                    {/* Artwork */}
                    <div
                      className="h-36 w-full"
                      style={{
                        background: `linear-gradient(135deg, ${accentFrom} 0%, ${accentTo} 100%)`,
                      }}
                    />
                    {/* Content */}
                    <div className="bg-white p-4">
                      {category && (
                        <span className="inline-block rounded-full bg-[var(--color-brand-soft)] px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-[var(--color-primary)]">
                          {category}
                        </span>
                      )}
                      <h3 className="mt-2 line-clamp-2 text-[1rem] font-bold leading-snug text-[var(--color-ink)]">
                        {title || "Nombre del curso"}
                      </h3>
                      <p className="mt-1 line-clamp-2 text-xs text-[var(--color-muted)]">
                        {shortDescription || "Breve descripción del curso..."}
                      </p>
                      <div className="mt-3 flex items-center gap-3 text-xs text-[var(--color-muted)]">
                        {duration && <span>⏱ {duration}</span>}
                        {level && <span>· {level}</span>}
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-sm font-semibold text-[var(--color-ink)]">
                          {priceInCents > 0
                            ? `${(priceInCents / 100).toFixed(2)} €`
                            : "Gratuito"}
                        </span>
                        <span className="text-xs font-medium text-[var(--color-primary)]">
                          Ver detalles →
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="mt-3 text-[0.72rem] leading-relaxed text-[var(--color-muted)]">
                    Esta tarjeta se actualizará en tiempo real a medida que
                    edites la información general.
                  </p>
                </div>
              </div>

              {/* Equipo Docente */}
              <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-white shadow-[var(--shadow-xs)]">
                <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)] px-5 py-3.5">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-[var(--color-muted)]" />
                    <span className="text-[0.8rem] font-semibold text-[var(--color-ink-soft)]">
                      Equipo Docente
                    </span>
                  </div>
                </div>
                <div className="space-y-3 px-5 py-4">
                  {/* Selected teachers */}
                  {selectedTeachers.map((teacher) => (
                    <div
                      key={teacher.id}
                      className="flex items-center gap-3 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[rgba(22,60,88,0.02)] px-3.5 py-3"
                    >
                      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[var(--color-primary)] text-xs font-semibold text-white">
                        {teacher.name
                          .split(" ")
                          .slice(0, 2)
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-[var(--color-ink)]">
                          {teacher.name}
                        </p>
                        <p className="truncate text-xs text-[var(--color-muted)]">
                          {teacher.email}
                        </p>
                      </div>
                      <span className="rounded-full bg-[var(--color-brand-soft)] px-2 py-0.5 text-[0.65rem] font-semibold text-[var(--color-primary)]">
                        Docente
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedTeachers((prev) =>
                            prev.filter((t) => t.id !== teacher.id),
                          )
                        }
                        className="text-[var(--color-muted)] hover:text-[var(--color-danger)] transition"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}

                  {/* Add teacher */}
                  {teachers.filter(
                    (t) => !selectedTeachers.find((s) => s.id === t.id),
                  ).length > 0 && (
                    <div className="flex items-center gap-2">
                      <select
                        value={teacherSelectValue}
                        onChange={(e) => setTeacherSelectValue(e.target.value)}
                        className="h-9 flex-1 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white px-3 text-sm text-[var(--color-ink)] focus:border-[var(--color-primary)] focus:outline-none transition"
                      >
                        <option value="">Seleccionar docente...</option>
                        {teachers
                          .filter(
                            (t) => !selectedTeachers.find((s) => s.id === t.id),
                          )
                          .map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.name}
                            </option>
                          ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => {
                          const teacher = teachers.find(
                            (t) => t.id === teacherSelectValue,
                          );
                          if (teacher) {
                            setSelectedTeachers((prev) => [...prev, teacher]);
                            setTeacherSelectValue("");
                          }
                        }}
                        disabled={!teacherSelectValue}
                        className="grid h-9 w-9 shrink-0 place-items-center rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white text-[var(--color-muted)] transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] disabled:opacity-40"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  )}

                  {selectedTeachers.length === 0 && (
                    <p className="text-xs text-[var(--color-muted)]">
                      Aún no hay docentes asignados.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useState } from "react";
import {
  BookOpen,
  CheckCircle2,
  CircleHelp,
  Compass,
  FileText,
  FolderOpen,
  MessageSquareText,
  LineChart,
  ShieldCheck
} from "lucide-react";
import { CourseProgressToggleForm } from "@/components/learning/course-progress-toggle-form";
import { CourseArtwork } from "@/components/course-artwork";
import { Badge } from "@/components/ui/badge";
import type { CatalogCourse } from "@/lib/course-catalog";
import type { CourseProgressDetails } from "@/lib/course-progress";
import { cn, formatDate } from "@/lib/utils";

type LearningShellProps = {
  course: CatalogCourse;
  forumCategories: Array<{
    id: string;
    slug: string;
    title: string;
    description: string;
    _count: {
      threads: number;
    };
  }>;
  resources: Array<{
    id: string;
    title: string;
    description: string;
  }>;
  progress: CourseProgressDetails;
  roleLabel: string;
  canModerate: boolean;
  editionLabel?: string | null;
  accessUntil?: Date | null;
};

type SidebarTab = "content" | "resources" | "support";

export function CourseLearningShell({
  course,
  forumCategories,
  resources,
  progress,
  roleLabel,
  canModerate,
  editionLabel,
  accessUntil
}: LearningShellProps) {
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>("content");
  const [selectedModuleIndex, setSelectedModuleIndex] = useState(0);
  const currentModule = progress.modules[selectedModuleIndex] ?? progress.modules[0] ?? null;

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      <div className="flex items-center justify-between border-b border-[rgba(12,113,195,0.14)] bg-white px-6 py-5 lg:px-12">
        <div className="flex min-w-0 items-center gap-5">
          <Link
            className="whitespace-nowrap text-xl font-medium text-[var(--color-primary)]"
            href="/mi-cuenta"
          >
            Volver a Mi cuenta
          </Link>
          <div className="hidden h-12 w-px bg-[var(--color-border)] lg:block" />
          <h1 className="truncate text-[1.9rem] font-semibold tracking-[-0.04em] text-[var(--color-ink)]">
            {course.title}
          </h1>
        </div>

        <div className="hidden items-center gap-3 lg:flex">
          <Badge tone={canModerate ? "teacher" : "student"}>{roleLabel}</Badge>
          <Badge tone="muted">{canModerate ? "Espacio de seguimiento" : "Acceso vigente"}</Badge>
        </div>
      </div>

      <div className="grid min-h-[calc(100vh-93px)] lg:grid-cols-[1fr_400px]">
        <section className="px-6 py-10 lg:px-12">
          <div className="overflow-hidden rounded-[30px] border border-[rgba(12,113,195,0.14)] bg-white shadow-[0_22px_48px_rgba(34,34,33,0.06)]">
            <div className="grid gap-8 px-6 py-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(18rem,0.9fr)] lg:px-8 lg:py-8">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={canModerate ? "teacher" : "student"}>{roleLabel}</Badge>
                  <Badge tone="muted">{course.level}</Badge>
                  <Badge tone="muted">{course.format}</Badge>
                </div>
                <h2 className="mt-5 text-5xl font-semibold tracking-[-0.05em] text-[var(--color-ink)]">
                  Campus del curso
                </h2>
                <p className="mt-4 max-w-3xl text-lg leading-8 text-[var(--color-muted)]">
                  Este espacio organiza el programa, los recursos disponibles y el acceso al
                  foro privado del curso. El seguimiento es manual y verificable: puedes marcar
                  cada modulo cuando realmente lo hayas revisado.
                </p>

                {editionLabel ? (
                  <p className="mt-4 text-sm leading-7 text-[var(--color-muted)]">
                    Edicion asociada: <strong className="text-[var(--color-ink)]">{editionLabel}</strong>
                    {accessUntil ? ` · Acceso previsto hasta ${formatDate(accessUntil)}` : ""}
                  </p>
                ) : null}

                <div className="mt-8 rounded-[24px] border border-[rgba(12,113,195,0.12)] bg-[var(--color-surface)] p-5">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">
                        Progreso guardado
                      </p>
                      <p className="mt-2 text-2xl font-semibold text-[var(--color-ink)]">
                        {progress.completedModules} de {progress.totalModules} modulos revisados
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">
                        Ultima actividad
                      </p>
                      <p className="mt-2 text-lg font-semibold text-[var(--color-ink)]">
                        {progress.lastCompletedAt ? formatDate(progress.lastCompletedAt) : "Sin actividad"}
                      </p>
                    </div>
                  </div>
                  <div className="mt-5 h-3 overflow-hidden rounded-full bg-white">
                    <div
                      aria-hidden="true"
                      className="h-full rounded-full bg-[var(--color-primary)] transition-[width]"
                      style={{ width: `${progress.completionRate}%` }}
                    />
                  </div>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm text-[var(--color-muted)]">
                    <span>{progress.completionRate}% marcado como revisado</span>
                    <span>{progress.pendingModules} modulos pendientes</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4 rounded-[26px] border border-[rgba(12,113,195,0.14)] bg-[var(--color-surface)] p-4">
                <CourseArtwork
                  className="h-[19rem] w-full rounded-[20px] border-0"
                  course={course}
                  variant="hero"
                />
                <div className="rounded-[20px] bg-white p-4">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">
                    Estado del curso
                  </p>
                  <p className="mt-2 text-sm leading-7 text-[var(--color-ink)]">
                    {progress.isCompleted
                      ? "Has marcado todos los modulos del curso como revisados."
                      : progress.hasStarted
                        ? `Ya has avanzado sobre ${progress.completedModules} modulos y puedes seguir desde el contenido pendiente.`
                        : "Todavia no has marcado modulos. Puedes empezar por el primero y registrar tu avance de forma manual."}
                  </p>
                </div>
                <div className="rounded-[20px] bg-white p-4">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">
                    Continuidad
                  </p>
                  <div className="mt-3 flex flex-wrap gap-3">
                    <Link
                      className="inline-flex items-center rounded-xl bg-[var(--color-primary)] px-4 py-3 text-sm font-semibold text-white"
                      href={`/mis-cursos/${course.slug}/foro`}
                    >
                      Abrir foro privado
                    </Link>
                    <Link
                      className="inline-flex items-center rounded-xl border border-[var(--color-primary)] px-4 py-3 text-sm font-semibold text-[var(--color-primary)]"
                      href="/mi-cuenta"
                    >
                      Volver a Mi cuenta
                    </Link>
                    {canModerate ? (
                      <Link
                        className="inline-flex items-center rounded-xl border border-[var(--color-primary)] px-4 py-3 text-sm font-semibold text-[var(--color-primary)]"
                        href={`/mis-cursos/${course.slug}/seguimiento`}
                      >
                        <LineChart className="mr-2 h-4 w-4" />
                        Ver seguimiento
                      </Link>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="thin-divider mt-10 pt-8">
            <div className="flex items-center gap-3">
              <Compass className="h-5 w-5 text-[var(--color-primary)]" />
              <h2 className="text-[2.2rem] font-semibold tracking-[-0.04em] text-[var(--color-ink)]">
                Enfoque del curso
              </h2>
            </div>

            <div className="prose-copy mt-8 max-w-4xl text-[1.08rem] leading-10 text-[var(--color-ink)]">
              <p>{course.description}</p>
              <p>
                El progreso no se calcula por visionado, tiempo ni automatismos. Solo queda
                registrado cuando tu mismo marcas un modulo como revisado dentro del campus.
              </p>
            </div>
          </div>
        </section>

        <aside className="flex min-h-full flex-col border-l border-[rgba(12,113,195,0.14)] bg-white">
          <div className="flex border-b border-[rgba(12,113,195,0.14)]">
            {[
              { id: "content" as const, label: "Contenido", icon: BookOpen },
              { id: "resources" as const, label: "Recursos", icon: FolderOpen },
              { id: "support" as const, label: "Soporte", icon: CircleHelp }
            ].map(({ id, label, icon: Icon }) => (
              <button
                className={cn(
                  "flex flex-1 items-center justify-center gap-2 border-b-2 px-4 py-6 text-lg font-medium transition",
                  sidebarTab === id
                    ? "border-[var(--color-primary)] text-[var(--color-primary)]"
                    : "border-transparent text-[var(--color-ink)]"
                )}
                key={id}
                onClick={() => setSidebarTab(id)}
                type="button"
              >
                <Icon className="h-5 w-5" />
                {label}
              </button>
            ))}
          </div>

          {sidebarTab === "content" ? (
            <>
              <div className="flex items-center justify-between border-b border-[rgba(12,113,195,0.14)] px-6 py-6">
                <div>
                  <p className="text-[1.75rem] font-medium text-[var(--color-ink)]">
                    Programa del curso
                  </p>
                  <p className="mt-2 text-sm text-[var(--color-muted)]">
                    Marca cada modulo cuando ya lo hayas revisado.
                  </p>
                </div>
                <p className="text-lg text-[var(--color-ink)]">{course.modules.length} modulos</p>
              </div>

              <div className="campus-scrollbar flex-1 overflow-y-auto">
                {progress.modules.map((module) => {
                  const isCurrentModule = module.index === selectedModuleIndex;

                  return (
                    <div className="border-b border-[rgba(12,113,195,0.14)]" key={module.id}>
                      <button
                        aria-expanded={isCurrentModule}
                        className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                        onClick={() => setSelectedModuleIndex(module.index)}
                        type="button"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">
                            Modulo {module.index + 1}
                          </p>
                          <p className="mt-2 text-[1.15rem] font-medium text-[var(--color-ink)]">
                            {module.title}
                          </p>
                        </div>
                        <Badge tone={module.isCompleted ? "teacher" : isCurrentModule ? "student" : "muted"}>
                          {module.isCompleted ? "Revisado" : isCurrentModule ? "Seleccionado" : "Pendiente"}
                        </Badge>
                      </button>

                      {isCurrentModule ? (
                        <div className="space-y-4 border-t border-[rgba(12,113,195,0.08)] bg-[var(--color-surface)] px-6 py-5">
                          <p className="text-[1rem] leading-7 text-[var(--color-ink)]">
                            {module.description}
                          </p>
                          <div className="flex flex-wrap gap-3 text-sm text-[var(--color-muted)]">
                            <span>{module.estimatedTime}</span>
                            <span>{module.resourcesSummary}</span>
                          </div>
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <p className="text-sm text-[var(--color-muted)]">
                              {module.completedAt
                                ? `Marcado como revisado el ${formatDate(module.completedAt)}`
                                : "Aun no lo has marcado como revisado."}
                            </p>
                            <CourseProgressToggleForm
                              courseSlug={course.slug}
                              isCompleted={module.isCompleted}
                              moduleId={module.id}
                              nextPath={`/mis-cursos/${course.slug}`}
                            />
                          </div>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </>
          ) : null}

          {sidebarTab === "resources" ? (
            <div className="campus-scrollbar flex-1 space-y-4 overflow-y-auto px-6 py-6">
              {resources.map((resource) => (
                <div
                  className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5"
                  key={resource.id}
                >
                  <div className="flex items-center gap-3">
                    <div className="grid h-11 w-11 place-items-center rounded-full bg-white text-[var(--color-primary)]">
                      {resource.id === "guia" ? (
                        <FileText className="h-5 w-5" />
                      ) : (
                        <ShieldCheck className="h-5 w-5" />
                      )}
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-[var(--color-ink)]">
                        {resource.title}
                      </p>
                      <Badge tone={canModerate ? "teacher" : "student"}>{roleLabel}</Badge>
                    </div>
                  </div>
                  <p className="mt-4 text-sm leading-7 text-[var(--color-muted)]">
                    {resource.description}
                  </p>
                </div>
              ))}
              <div className="rounded-2xl border border-dashed border-[rgba(12,113,195,0.18)] bg-white p-5 text-sm leading-7 text-[var(--color-muted)]">
                Los recursos visibles aqui representan el material actualmente modelado en la
                plataforma. Si se incorporan nuevas descargas o recursos privados, apareceran
                aqui como accesos directos verificables.
              </div>
            </div>
          ) : null}

          {sidebarTab === "support" ? (
            <div className="campus-scrollbar flex-1 space-y-4 overflow-y-auto px-6 py-6">
              <Link
                className="block rounded-2xl border border-[var(--color-primary)] bg-white p-5 text-[var(--color-primary)] shadow-[0_16px_28px_rgba(12,113,195,0.08)] transition hover:bg-[var(--color-primary-soft)]"
                href={`/mis-cursos/${course.slug}/foro`}
              >
                <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em]">
                  <MessageSquareText className="h-4 w-4" />
                  Foro del curso
                </p>
                <p className="mt-2 text-lg font-semibold">Abrir todas las categorias del foro</p>
              </Link>

              {forumCategories.length ? (
                forumCategories.map((category) => (
                  <Link
                    className="block rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 transition hover:border-[var(--color-primary)]"
                    href={`/mis-cursos/${course.slug}/foro/${category.slug}`}
                    key={category.id}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-lg font-semibold text-[var(--color-ink)]">
                          {category.title}
                        </p>
                        <p className="mt-3 text-sm leading-7 text-[var(--color-muted)]">
                          {category.description}
                        </p>
                      </div>
                      <Badge tone="muted">{category._count.threads} hilos</Badge>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-[rgba(12,113,195,0.18)] bg-white p-5 text-sm leading-7 text-[var(--color-muted)]">
                  Aun no hay categorias activas en el foro de este curso.
                </div>
              )}

              <div className="rounded-2xl border border-[var(--color-border)] bg-white p-5">
                <p className="text-base font-semibold text-[var(--color-ink)]">Tu rol en el campus</p>
                <p className="mt-3 text-sm leading-7 text-[var(--color-muted)]">
                  {canModerate
                    ? "Como docente o administracion puedes responder, fijar hilos y orientar la comunidad del curso."
                    : "Como alumno puedes consultar el programa, usar recursos y participar en el foro privado del curso."}
                </p>
              </div>
            </div>
          ) : null}

          <div className="border-t border-[rgba(12,113,195,0.14)] px-6 py-6">
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-4 text-sm leading-7 text-[var(--color-muted)]">
              {currentModule ? (
                <div className="flex items-start gap-3">
                  <CheckCircle2
                    className={cn(
                      "mt-0.5 h-5 w-5 shrink-0",
                      currentModule.isCompleted ? "text-[var(--color-success)]" : "text-[var(--color-muted)]"
                    )}
                  />
                  <div>
                    <span className="block font-semibold text-[var(--color-ink)]">
                      {currentModule.isCompleted ? "Modulo revisado" : "Modulo pendiente"}
                    </span>
                    <span className="mt-2 block">{currentModule.title}</span>
                  </div>
                </div>
              ) : (
                "Selecciona un modulo para revisar su descripcion."
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { logoutAction } from "@/actions/session";
import {
  BarChart2,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Eye,
  FileText,
  FolderOpen,
  GripVertical,
  LayoutDashboard,
  LogOut,
  MessageCircle,
  Menu,
  Plus,
  Settings,
  Tag,
  Upload,
  Video,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

export type BuilderResource = {
  id: string;
  title: string;
  type: "MATERIAL" | "EXERCISE";
  source: "FILE" | "LINK";
  mimeType: string | null;
  estimatedTime?: string | null;
};

export type BuilderModule = {
  id: string;
  title: string;
  position: number;
  resources: BuilderResource[];
};

export type BuilderCourse = {
  id: string;
  slug: string;
  title: string;
  category: string;
  status: "ACTIVE" | "INACTIVE";
  accentFrom: string;
  accentTo: string;
  modules: BuilderModule[];
};

type Tab = "constructor" | "preview" | "config" | "participants";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getResourceIcon(resource: BuilderResource) {
  if (resource.type === "EXERCISE") {
    return { Icon: FileText, bg: "bg-[#ede9fe]", text: "text-[#7c3aed]" };
  }
  if (resource.mimeType?.startsWith("video/")) {
    return { Icon: Video, bg: "bg-[#dbeafe]", text: "text-[#2563eb]" };
  }
  if (resource.mimeType === "application/pdf") {
    return { Icon: FileText, bg: "bg-[#dcfce7]", text: "text-[#16a34a]" };
  }
  return { Icon: FileText, bg: "bg-[rgba(22,60,88,0.08)]", text: "text-[var(--color-ink-soft)]" };
}

function getResourceSubtitle(resource: BuilderResource) {
  if (resource.type === "EXERCISE") return "Tarea · Requiere entrega";
  if (resource.mimeType?.startsWith("video/")) {
    return `Vídeo${resource.estimatedTime ? ` · ${resource.estimatedTime}` : ""}`;
  }
  if (resource.mimeType === "application/pdf") return "Documento PDF";
  if (resource.source === "LINK") return "Enlace externo";
  return "Material";
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

const SIDEBAR_NAV = [
  { label: "Panel de Control", href: "/mis-cursos", icon: LayoutDashboard },
  { label: "Mis Cursos", href: "/mis-cursos", icon: BookOpen },
  { label: "Recursos", href: "#", icon: FolderOpen, disabled: true },
  { label: "Comunidad", href: "#", icon: MessageCircle, disabled: true },
  { label: "Reportes", href: "#", icon: BarChart2, disabled: true },
];

function BuilderSidebar({
  onClose,
  onAddModule,
}: {
  courseSlug?: string;
  onClose?: () => void;
  onAddModule: () => void;
}) {
  return (
    <div className="flex h-full flex-col bg-white">
      {/* Branding */}
      <div className="border-b border-[rgba(22,60,88,0.08)] px-5 py-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-[var(--color-ink)]">
              Panel Docente
            </p>
            <p className="text-xs text-[var(--color-muted)]">
              Constructor de Cursos
            </p>
          </div>
          {onClose && (
            <button
              aria-label="Cerrar menú"
              className="grid h-8 w-8 place-items-center rounded-lg text-[var(--color-muted)] transition hover:bg-[rgba(22,60,88,0.06)]"
              onClick={onClose}
              type="button"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4" aria-label="Navegación docente">
        {SIDEBAR_NAV.map((item) => {
          const isActive = item.label === "Mis Cursos";
          return (
            <Link
              aria-disabled={item.disabled}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                isActive
                  ? "bg-[var(--color-primary)] text-white"
                  : item.disabled
                    ? "cursor-not-allowed text-[var(--color-border)] opacity-50"
                    : "text-[var(--color-muted)] hover:bg-[rgba(22,60,88,0.05)] hover:text-[var(--color-ink)]",
              )}
              href={item.disabled ? "#" : item.href}
              key={item.label}
              onClick={onClose}
            >
              <item.icon
                className={cn("h-4 w-4 shrink-0", isActive && "text-white")}
                strokeWidth={2}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* + Nuevo Módulo */}
      <div className="px-3 pb-4">
        <button
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--color-primary-strong)]"
          onClick={onAddModule}
          type="button"
        >
          <Plus className="h-4 w-4" strokeWidth={2.5} />
          Nuevo Módulo
        </button>
      </div>

      {/* Footer */}
      <div className="border-t border-[rgba(22,60,88,0.08)] space-y-0.5 px-3 py-3">
        <Link
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[var(--color-muted)] transition hover:bg-[rgba(22,60,88,0.05)] hover:text-[var(--color-ink)]"
          href="/mi-cuenta"
          onClick={onClose}
        >
          <Settings className="h-4 w-4 shrink-0" strokeWidth={2} />
          Ajustes
        </Link>
        <form action={logoutAction}>
          <button
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-[var(--color-muted)] transition hover:bg-[rgba(22,60,88,0.05)] hover:text-[var(--color-ink)]"
            type="submit"
          >
            <LogOut className="h-4 w-4 shrink-0" strokeWidth={2} />
            Cerrar Sesión
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Topbar ───────────────────────────────────────────────────────────────────

const BUILDER_TABS: { id: Tab; label: string }[] = [
  { id: "constructor", label: "Constructor" },
  { id: "preview", label: "Vista Previa" },
  { id: "config", label: "Configuración" },
  { id: "participants", label: "Participantes" },
];

function BuilderTopbar({
  activeTab,
  courseSlug,
  onTabChange,
  onMobileMenuOpen,
}: {
  activeTab: Tab;
  courseSlug: string;
  onTabChange: (tab: Tab) => void;
  onMobileMenuOpen: () => void;
}) {
  return (
    <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center justify-between border-b border-[rgba(22,60,88,0.08)] bg-white px-4 shadow-sm lg:px-6">
      {/* Left: mobile menu + brand */}
      <div className="flex min-w-0 items-center gap-3">
        <button
          aria-label="Abrir menú"
          className="grid h-8 w-8 place-items-center rounded-lg text-[var(--color-muted)] transition hover:bg-[rgba(22,60,88,0.06)] lg:hidden"
          onClick={onMobileMenuOpen}
          type="button"
        >
          <Menu className="h-4 w-4" />
        </button>
        <span className="hidden truncate text-sm font-bold text-[var(--color-ink)] lg:block">
          Campus Autismo Córdoba
        </span>
      </div>

      {/* Center: tabs */}
      <nav
        aria-label="Secciones del constructor"
        className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-0.5 lg:flex"
      >
        {BUILDER_TABS.map(({ id, label }) =>
          id === "preview" ? (
            <Link
              className="rounded-lg px-4 py-1.5 text-sm font-medium text-[var(--color-muted)] transition hover:text-[var(--color-ink)]"
              href={`/cursos/${courseSlug}`}
              key={id}
              target="_blank"
            >
              {label}
            </Link>
          ) : (
            <button
              className={cn(
                "rounded-lg px-4 py-1.5 text-sm font-medium transition",
                activeTab === id
                  ? "border-b-2 border-[var(--color-primary)] text-[var(--color-primary)]"
                  : "text-[var(--color-muted)] hover:text-[var(--color-ink)]",
              )}
              key={id}
              onClick={() => onTabChange(id)}
              type="button"
            >
              {label}
            </button>
          ),
        )}
      </nav>

      {/* Right: actions */}
      <div className="flex shrink-0 items-center gap-2">
        <Link
          className="hidden rounded-xl border border-[rgba(22,60,88,0.2)] bg-white px-4 py-2 text-sm font-semibold text-[var(--color-ink)] transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] sm:block"
          href={`/admin/courses?courseId=#course-detail`}
        >
          Guardar Borrador
        </Link>
        <Link
          className="rounded-xl bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--color-primary-strong)]"
          href={`/admin/courses?courseId=#course-detail`}
        >
          Publicar Curso
        </Link>
      </div>
    </header>
  );
}

// ─── Lesson row ───────────────────────────────────────────────────────────────

function LessonRow({ resource }: { resource: BuilderResource }) {
  const { Icon, bg, text } = getResourceIcon(resource);
  const subtitle = getResourceSubtitle(resource);

  return (
    <div className="flex items-center gap-3 rounded-xl border border-[rgba(22,60,88,0.08)] bg-white px-4 py-3 shadow-[0_1px_3px_rgba(22,60,88,0.06)]">
      <div
        className={cn(
          "grid h-8 w-8 shrink-0 place-items-center rounded-lg",
          bg,
          text,
        )}
      >
        <Icon className="h-4 w-4" strokeWidth={2} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-[var(--color-ink)]">
          {resource.title}
        </p>
        <p className="text-[0.72rem] text-[var(--color-muted)]">{subtitle}</p>
      </div>
    </div>
  );
}

// ─── Module card ──────────────────────────────────────────────────────────────

function ModuleCard({ module: mod }: { module: BuilderModule }) {
  const [open, setOpen] = useState(mod.position === 1);

  return (
    <div className="overflow-hidden rounded-2xl border border-[rgba(22,60,88,0.1)] bg-white shadow-[0_1px_4px_rgba(22,60,88,0.06)]">
      {/* Header */}
      <button
        className="flex w-full items-center gap-3 px-5 py-4 text-left transition hover:bg-[rgba(22,60,88,0.018)]"
        onClick={() => setOpen((v) => !v)}
        type="button"
      >
        <GripVertical
          className="h-5 w-5 shrink-0 cursor-grab text-[var(--color-border)] active:cursor-grabbing"
          strokeWidth={2}
        />
        <span className="flex-1 text-[0.95rem] font-bold text-[var(--color-ink)]">
          {mod.title}
        </span>
        <span className="rounded-full bg-[rgba(22,60,88,0.07)] px-2.5 py-0.5 text-[0.7rem] font-semibold text-[var(--color-ink-soft)]">
          {mod.resources.length} Lecciones
        </span>
        {open ? (
          <ChevronUp className="h-4 w-4 shrink-0 text-[var(--color-muted)]" strokeWidth={2} />
        ) : (
          <ChevronDown className="h-4 w-4 shrink-0 text-[var(--color-muted)]" strokeWidth={2} />
        )}
      </button>

      {/* Lessons */}
      {open && (
        <div className="space-y-2 border-t border-[rgba(22,60,88,0.07)] px-5 pb-4 pt-3">
          {mod.resources.length > 0 ? (
            mod.resources.map((res) => (
              <LessonRow key={res.id} resource={res} />
            ))
          ) : (
            <p className="py-2 text-sm text-[var(--color-muted)]">
              Sin lecciones todavía.
            </p>
          )}

          {/* Add lesson */}
          <button
            className="flex w-full items-center gap-2 rounded-xl border border-dashed border-[rgba(22,60,88,0.2)] px-4 py-2.5 text-sm font-medium text-[var(--color-muted)] transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
            type="button"
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} />
            Añadir Lección
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Config panel ─────────────────────────────────────────────────────────────

function ConfigPanel({ course }: { course: BuilderCourse }) {
  const [visibility, setVisibility] = useState<"draft" | "public" | "private">(
    course.status === "ACTIVE" ? "public" : "draft",
  );

  const VISIBILITY_OPTIONS = [
    {
      id: "draft" as const,
      label: "Borrador Oculto",
      desc: "Solo visible para creadores.",
    },
    {
      id: "public" as const,
      label: "Público (Catálogo)",
      desc: "Visible para todos los alumnos.",
    },
    {
      id: "private" as const,
      label: "Privado (Solo Enlace)",
      desc: "Requiere invitación directa.",
    },
  ];

  return (
    <aside className="flex h-full flex-col overflow-y-auto border-l border-[rgba(22,60,88,0.1)] bg-white">
      <div className="border-b border-[rgba(22,60,88,0.08)] px-6 py-5">
        <h2 className="text-[1rem] font-bold text-[var(--color-ink)]">
          Configuración del Curso
        </h2>
        <p className="mt-0.5 text-[0.8rem] text-[var(--color-muted)]">
          Ajustes generales y metadatos.
        </p>
      </div>

      <div className="flex-1 space-y-7 overflow-y-auto px-6 py-6">
        {/* Miniatura */}
        <section>
          <div className="mb-3 flex items-center gap-2">
            <Upload className="h-4 w-4 text-[var(--color-muted)]" strokeWidth={2} />
            <h3 className="text-sm font-semibold text-[var(--color-ink)]">
              Miniatura del Curso
            </h3>
          </div>
          <div
            className="overflow-hidden rounded-xl"
            style={{
              background: `linear-gradient(135deg, ${course.accentFrom} 0%, ${course.accentTo} 100%)`,
              aspectRatio: "16/9",
            }}
          />
          <p className="mt-2 text-[0.7rem] leading-relaxed text-[var(--color-muted)]">
            Resolución recomendada: 1280×720px. Formatos: JPG, PNG.
          </p>
        </section>

        {/* Categoría */}
        <section>
          <div className="mb-3 flex items-center gap-2">
            <Tag className="h-4 w-4 text-[var(--color-muted)]" strokeWidth={2} />
            <h3 className="text-sm font-semibold text-[var(--color-ink)]">
              Categoría
            </h3>
          </div>
          <div className="relative">
            <select
              className="h-10 w-full cursor-pointer appearance-none rounded-xl border border-[rgba(22,60,88,0.15)] bg-white pl-3 pr-8 text-sm font-medium text-[var(--color-ink)] focus-visible:border-[var(--color-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
              defaultValue={course.category}
            >
              <option value={course.category}>{course.category || "Sin categoría"}</option>
              <option value="Intervención Clínica">Intervención Clínica</option>
              <option value="Educativo">Educativo</option>
              <option value="Herramientas">Herramientas</option>
              <option value="Familia">Familia</option>
            </select>
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)]">
              <ChevronDown className="h-3.5 w-3.5" strokeWidth={2.5} />
            </span>
          </div>
        </section>

        {/* Estado de visibilidad */}
        <section>
          <div className="mb-3 flex items-center gap-2">
            <Eye className="h-4 w-4 text-[var(--color-muted)]" strokeWidth={2} />
            <h3 className="text-sm font-semibold text-[var(--color-ink)]">
              Estado de Visibilidad
            </h3>
          </div>
          <div className="space-y-2">
            {VISIBILITY_OPTIONS.map((opt) => (
              <button
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl border p-3.5 text-left transition",
                  visibility === opt.id
                    ? "border-[var(--color-primary)] bg-[rgba(22,60,88,0.04)]"
                    : "border-[rgba(22,60,88,0.12)] hover:border-[rgba(22,60,88,0.25)]",
                )}
                key={opt.id}
                onClick={() => setVisibility(opt.id)}
                type="button"
              >
                <div
                  className={cn(
                    "grid h-4 w-4 shrink-0 place-items-center rounded-full border-2",
                    visibility === opt.id
                      ? "border-[var(--color-primary)]"
                      : "border-[rgba(22,60,88,0.2)]",
                  )}
                >
                  {visibility === opt.id && (
                    <span className="h-2 w-2 rounded-full bg-[var(--color-primary)]" />
                  )}
                </div>
                <div className="min-w-0">
                  <p
                    className={cn(
                      "text-sm font-semibold",
                      visibility === opt.id
                        ? "text-[var(--color-primary)]"
                        : "text-[var(--color-ink)]",
                    )}
                  >
                    {opt.label}
                  </p>
                  <p className="text-[0.72rem] text-[var(--color-muted)]">
                    {opt.desc}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </section>
      </div>
    </aside>
  );
}

// ─── Add module zone ──────────────────────────────────────────────────────────

function AddModuleZone({ onClick }: { onClick: () => void }) {
  return (
    <button
      className="flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[rgba(22,60,88,0.15)] py-10 transition hover:border-[var(--color-primary)] hover:bg-[rgba(22,60,88,0.018)]"
      onClick={onClick}
      type="button"
    >
      <div className="grid h-10 w-10 place-items-center rounded-xl border border-[rgba(22,60,88,0.15)] bg-white text-[var(--color-muted)]">
        <Plus className="h-5 w-5" strokeWidth={2} />
      </div>
      <span className="text-sm font-semibold text-[var(--color-muted)]">
        Añadir Nuevo Módulo
      </span>
    </button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function CourseBuilder({ course }: { course: BuilderCourse }) {
  const [activeTab, setActiveTab] = useState<Tab>("config");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [modules, setModules] = useState<BuilderModule[]>(course.modules);

  function handleAddModule() {
    const newModule: BuilderModule = {
      id: `local-${Date.now()}`,
      title: `Módulo ${modules.length + 1}: Nuevo Módulo`,
      position: modules.length + 1,
      resources: [],
    };
    setModules((prev) => [...prev, newModule]);
  }

  const showConfig = activeTab === "config" || activeTab === "constructor";

  return (
    <div className="flex h-screen overflow-hidden bg-[#f5f6fa]">
      {/* Desktop sidebar */}
      <aside className="hidden w-52 shrink-0 border-r border-[rgba(22,60,88,0.08)] bg-white lg:flex lg:flex-col">
        <BuilderSidebar
          courseSlug={course.slug}
          onAddModule={handleAddModule}
        />
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <button
            aria-label="Cerrar menú"
            className="absolute inset-0 bg-[rgba(15,23,32,0.45)] backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
            type="button"
          />
          <aside className="relative z-10 w-52 flex-col bg-white shadow-2xl">
            <BuilderSidebar
              courseSlug={course.slug}
              onAddModule={handleAddModule}
              onClose={() => setMobileOpen(false)}
            />
          </aside>
        </div>
      )}

      {/* Right side */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Topbar */}
        <BuilderTopbar
          activeTab={activeTab}
          courseSlug={course.slug}
          onMobileMenuOpen={() => setMobileOpen(true)}
          onTabChange={setActiveTab}
        />

        {/* Content area */}
        <div className="flex min-h-0 flex-1 overflow-hidden">
          {/* Main modules area */}
          <main
            className="flex-1 overflow-y-auto"
            style={{
              backgroundImage:
                "radial-gradient(circle, rgba(22,60,88,0.08) 1px, transparent 1px)",
              backgroundSize: "22px 22px",
            }}
          >
            <div className="mx-auto max-w-2xl px-5 py-8 sm:px-8">
              {/* Course title */}
              <h1 className="mb-7 text-[2rem] font-bold tracking-[-0.03em] text-[var(--color-ink)] sm:text-[2.4rem]">
                {course.title}
              </h1>

              {/* Modules */}
              <div className="space-y-4">
                {modules.map((mod) => (
                  <ModuleCard key={mod.id} module={mod} />
                ))}
                <AddModuleZone onClick={handleAddModule} />
              </div>
            </div>
          </main>

          {/* Config panel (desktop) */}
          {showConfig && (
            <div className="hidden w-[22rem] shrink-0 xl:flex xl:flex-col">
              <ConfigPanel course={course} />
            </div>
          )}
        </div>

        {/* Config panel (tablet / below main on < xl) */}
        {showConfig && (
          <div className="border-t border-[rgba(22,60,88,0.08)] xl:hidden">
            <details className="group">
              <summary className="flex cursor-pointer items-center justify-between bg-white px-5 py-4 text-sm font-semibold text-[var(--color-ink)] select-none">
                Configuración del Curso
                <ChevronDown className="h-4 w-4 text-[var(--color-muted)] transition group-open:rotate-180" />
              </summary>
              <div className="max-h-[60vh] overflow-y-auto">
                <ConfigPanel course={course} />
              </div>
            </details>
          </div>
        )}
      </div>
    </div>
  );
}

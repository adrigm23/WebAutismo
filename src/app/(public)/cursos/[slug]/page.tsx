import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  ChevronRight,
  ChevronDown,
  PlayCircle,
  FileText,
  CheckCircle2,
  Clock,
  BarChart2,
  User,
} from "lucide-react";
import { PurchaseCard } from "@/components/purchase-card";
import { getCatalogCourseBySlug, getCatalogCourses } from "@/lib/course-catalog";
import { getPurchaseRuntimeMode } from "@/lib/purchase-runtime";
import { absoluteUrl } from "@/lib/site";
import type { CatalogCourse } from "@/lib/course-catalog";

type CoursePageProps = {
  params: Promise<{ slug: string }>;
};

export const revalidate = 3600;
export const dynamicParams = false;

export async function generateStaticParams() {
  const courses = await getCatalogCourses();
  return courses.map((course) => ({ slug: course.slug }));
}

export async function generateMetadata({ params }: CoursePageProps): Promise<Metadata> {
  const { slug } = await params;
  const course = await getCatalogCourseBySlug(slug);

  if (!course) return { title: "Curso no encontrado" };

  return {
    title: { absolute: course.seoTitle },
    description: course.seoDescription,
    alternates: { canonical: absoluteUrl(`/cursos/${course.slug}`) },
    openGraph: {
      title: course.title,
      description: course.seoDescription,
      url: absoluteUrl(`/cursos/${course.slug}`),
      type: "article",
    },
  };
}

// ─── sub-components ───────────────────────────────────────────────────────────

function TeacherInitials({ name }: { name: string }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => (p[0] ?? "").toUpperCase())
    .join("");
  return <>{initials || "AC"}</>;
}

function CourseProgram({ course }: { course: CatalogCourse }) {
  return (
    <section className="rounded-xl border border-[var(--color-border)] bg-white p-6 lg:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-[var(--color-ink)]">Programa del curso</h2>
        <span className="rounded-full bg-[var(--color-surface)] px-3 py-1 text-xs font-semibold text-[var(--color-muted)]">
          {course.modules.length} Módulos · {course.duration}
        </span>
      </div>

      <div className="mt-5 divide-y divide-[var(--color-border)] border-y border-[var(--color-border)]">
        {course.modules.map((module, index) => (
          <details
            className="group"
            key={module.id}
            open={index === 0}
          >
            {/* Module header row */}
            <summary className="flex cursor-pointer list-none items-center gap-4 py-4">
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  index === 0
                    ? "bg-[var(--color-primary)] text-white"
                    : "border-2 border-[var(--color-border)] text-[var(--color-muted)]"
                }`}
              >
                {index + 1}
              </span>
              <span className="flex-1 text-sm font-semibold text-[var(--color-ink)]">
                {module.title}
              </span>
              <span className="hidden shrink-0 text-xs text-[var(--color-muted)] sm:block">
                {module.estimatedTime}
              </span>
              <ChevronDown className="h-4 w-4 shrink-0 text-[var(--color-muted)] transition-transform group-open:rotate-180" />
            </summary>

            {/* Lesson items */}
            <div className="space-y-1 pb-4 pl-11">
              {/* Main lesson (video) */}
              <div className="flex items-center gap-3 rounded-lg px-2 py-2 transition hover:bg-[var(--color-surface)]">
                <PlayCircle className="h-4 w-4 shrink-0 text-[var(--color-primary)]" />
                <span className="flex-1 text-sm text-[var(--color-ink)]">{module.title}</span>
                <span className="shrink-0 text-xs text-[var(--color-muted)]">
                  {module.estimatedTime}
                </span>
              </div>

              {/* Supporting material */}
              {module.resourcesSummary && (
                <div className="flex items-center gap-3 rounded-lg px-2 py-2 transition hover:bg-[var(--color-surface)]">
                  <FileText className="h-4 w-4 shrink-0 text-[var(--color-muted)]" />
                  <span className="flex-1 text-sm text-[var(--color-muted)]">
                    {module.resourcesSummary}
                  </span>
                  <span className="shrink-0 text-xs text-[var(--color-muted)]">PDF</span>
                </div>
              )}

              {/* Module description */}
              {module.description && (
                <p className="px-2 pt-1 text-xs leading-5 text-[var(--color-muted)]">
                  {module.description}
                </p>
              )}
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default async function CoursePage({ params }: CoursePageProps) {
  const { slug } = await params;
  const course = await getCatalogCourseBySlug(slug);

  if (!course) notFound();

  const purchaseMode = getPurchaseRuntimeMode();
  const leadTeacher = course.teachers[0] ?? null;

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Course",
        name: course.title,
        description: course.description,
        provider: {
          "@type": "Organization",
          name: "Autismo Cordoba",
          url: absoluteUrl("/"),
        },
      },
      {
        "@type": "Product",
        name: course.title,
        description: course.seoDescription,
        offers: {
          "@type": "Offer",
          availability: "https://schema.org/InStock",
          priceCurrency: "EUR",
          price: course.priceInCents / 100,
          url: absoluteUrl(`/checkout/${course.slug}`),
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Inicio", item: absoluteUrl("/") },
          { "@type": "ListItem", position: 2, name: "Cursos", item: absoluteUrl("/cursos") },
          {
            "@type": "ListItem",
            position: 3,
            name: course.title,
            item: absoluteUrl(`/cursos/${course.slug}`),
          },
        ],
      },
    ],
  };

  return (
    <div className="min-h-screen bg-[#f9f9f9] pb-16">
      <script
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        type="application/ld+json"
      />

      <div className="site-container py-6 lg:py-8">
        {/* Breadcrumb */}
        <nav
          aria-label="Ruta de navegación"
          className="flex flex-wrap items-center gap-1.5 text-xs text-[var(--color-muted)]"
        >
          <Link className="transition hover:text-[var(--color-primary)]" href="/">
            Inicio
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-[var(--color-border)]" />
          <Link className="transition hover:text-[var(--color-primary)]" href="/cursos">
            Cursos Profesionales
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-[var(--color-border)]" />
          <span className="font-semibold text-[var(--color-ink)]">{course.category}</span>
        </nav>

        {/* Two-column layout */}
        <div className="mt-5 grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(300px,360px)] xl:items-start">
          {/* ── LEFT ──────────────────────────────────── */}
          <div className="space-y-5">
            {/* Hero card */}
            <div className="rounded-xl border border-[var(--color-border)] bg-white p-6 lg:p-8">
              <h1 className="text-[1.9rem] font-bold leading-[1.15] tracking-tight text-[var(--color-ink)] lg:text-[2.3rem]">
                {course.title}
              </h1>

              <p className="mt-4 text-[1rem] leading-relaxed text-[var(--color-muted)]">
                {course.shortDescription}
              </p>

              {/* Stats row */}
              <div className="mt-6 flex flex-wrap items-start gap-6 border-t border-[var(--color-border)] pt-5">
                {leadTeacher && (
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.76),rgba(217,232,251,0.92))] text-sm font-bold text-[var(--color-primary)]">
                      <TeacherInitials name={leadTeacher.name} />
                    </div>
                    <div>
                      <p className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-[var(--color-muted)]">
                        Instructor Principal
                      </p>
                      <p className="text-sm font-semibold text-[var(--color-primary)]">
                        {leadTeacher.name}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-[var(--color-muted)]" />
                  <div>
                    <p className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-[var(--color-muted)]">
                      Duración
                    </p>
                    <p className="text-sm font-semibold text-[var(--color-ink)]">
                      {course.duration}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <BarChart2 className="h-4 w-4 text-[var(--color-muted)]" />
                  <div>
                    <p className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-[var(--color-muted)]">
                      Nivel
                    </p>
                    <p className="text-sm font-semibold text-[var(--color-ink)]">{course.level}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* What you'll learn */}
            <section className="rounded-xl border border-[var(--color-border)] bg-white p-6 lg:p-8">
              <h2 className="text-xl font-bold text-[var(--color-ink)]">Qué aprenderás</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {course.outcomes.map((outcome) => (
                  <div className="flex items-start gap-3" key={outcome}>
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
                    <span className="text-sm leading-relaxed text-[var(--color-ink)]">
                      {outcome}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            {/* Program */}
            <CourseProgram course={course} />

            {/* Teachers */}
            {course.teachers.length > 0 && (
              <section className="rounded-xl border border-[var(--color-border)] bg-white p-6 lg:p-8">
                <h2 className="text-xl font-bold text-[var(--color-ink)]">Equipo docente</h2>
                <div className="mt-5 space-y-6">
                  {course.teachers.map((teacher) => (
                    <div
                      className="flex items-start gap-4"
                      key={`${teacher.name}-${teacher.role}`}
                    >
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.76),rgba(217,232,251,0.92))] text-base font-bold text-[var(--color-primary)]">
                        <TeacherInitials name={teacher.name} />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-[var(--color-ink)]">{teacher.name}</p>
                        <p className="text-sm text-[var(--color-primary)]">{teacher.role}</p>
                        <p className="mt-2 text-sm leading-relaxed text-[var(--color-muted)]">
                          {teacher.bio}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* FAQ */}
            {course.faq.length > 0 && (
              <section className="rounded-xl border border-[var(--color-border)] bg-white p-6 lg:p-8">
                <h2 className="text-xl font-bold text-[var(--color-ink)]">
                  Preguntas frecuentes
                </h2>
                <div className="mt-5 divide-y divide-[var(--color-border)]">
                  {course.faq.map((item) => (
                    <details className="group py-4 first:pt-0" key={item.question}>
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
                        <span className="text-sm font-semibold text-[var(--color-ink)]">
                          {item.question}
                        </span>
                        <ChevronDown className="h-4 w-4 shrink-0 text-[var(--color-muted)] transition-transform group-open:rotate-180" />
                      </summary>
                      <p className="mt-3 text-sm leading-relaxed text-[var(--color-muted)]">
                        {item.answer}
                      </p>
                    </details>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* ── RIGHT ─────────────────────────────────── */}
          <aside className="space-y-4 xl:sticky xl:top-20">
            <PurchaseCard course={course} purchaseMode={purchaseMode} />
          </aside>
        </div>
      </div>
    </div>
  );
}

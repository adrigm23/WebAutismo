import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowUpRight, ChevronRight } from "lucide-react";
import { PurchaseCard } from "@/components/purchase-card";
import { getCatalogCourseBySlug, getCatalogCourses } from "@/lib/course-catalog";
import { absoluteUrl } from "@/lib/site";
import { getStripe } from "@/lib/stripe";

type CoursePageProps = {
  params: Promise<{ slug: string }>;
};

export const revalidate = 3600;
export const dynamicParams = false;

export async function generateStaticParams() {
  const courses = await getCatalogCourses();
  return courses.map((course) => ({ slug: course.slug }));
}

export async function generateMetadata({
  params
}: CoursePageProps): Promise<Metadata> {
  const { slug } = await params;
  const course = await getCatalogCourseBySlug(slug);

  if (!course) {
    return {
      title: "Curso no encontrado"
    };
  }

  return {
    title: {
      absolute: course.seoTitle
    },
    description: course.seoDescription,
    alternates: {
      canonical: absoluteUrl(`/cursos/${course.slug}`)
    },
    openGraph: {
      title: course.title,
      description: course.seoDescription,
      url: absoluteUrl(`/cursos/${course.slug}`),
      type: "article"
    }
  };
}

function SectionHeading(input: {
  eyebrow: string;
  title: string;
  description: string;
  headingId?: string;
}) {
  return (
    <div className="max-w-3xl">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-primary)]">
        {input.eyebrow}
      </p>
      <h2
        className="mt-4 text-[clamp(2.2rem,4vw,3.4rem)] font-semibold leading-[0.98] tracking-[-0.06em] text-[var(--color-ink)]"
        id={input.headingId}
      >
        {input.title}
      </h2>
      <p className="mt-4 text-[1.03rem] leading-8 text-[var(--color-muted)]">
        {input.description}
      </p>
    </div>
  );
}

function EditorialDividerList(input: {
  items: Array<{
    title: string;
    detail?: string;
    meta?: string;
  }>;
}) {
  return (
    <div className="divide-y divide-[rgba(12,113,195,0.12)] border-y border-[rgba(12,113,195,0.12)]">
      {input.items.map((item) => (
        <article className="py-6 first:pt-0 last:pb-0" key={`${item.title}-${item.meta ?? ""}`}>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between lg:gap-8">
            <div className="min-w-0">
              <h3 className="text-[1.45rem] font-semibold leading-tight tracking-[-0.04em] text-[var(--color-ink)]">
                {item.title}
              </h3>
              {item.detail ? (
                <p className="mt-3 max-w-3xl text-[1rem] leading-8 text-[var(--color-muted)]">
                  {item.detail}
                </p>
              ) : null}
            </div>
            {item.meta ? (
              <p className="shrink-0 text-sm font-medium text-[var(--color-muted)] lg:pt-1">
                {item.meta}
              </p>
            ) : null}
          </div>
        </article>
      ))}
    </div>
  );
}

function TeacherInitials(input: { name: string }) {
  const initials = input.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  return <span>{initials || "AC"}</span>;
}

export default async function CoursePage({ params }: CoursePageProps) {
  const { slug } = await params;
  const course = await getCatalogCourseBySlug(slug);

  if (!course) {
    notFound();
  }

  const purchaseMode = getStripe() ? "live" : "demo";

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
          url: absoluteUrl("/")
        }
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
          url: absoluteUrl(`/checkout/${course.slug}`)
        }
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Inicio",
            item: absoluteUrl("/")
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Cursos",
            item: absoluteUrl("/cursos")
          },
          {
            "@type": "ListItem",
            position: 3,
            name: course.title,
            item: absoluteUrl(`/cursos/${course.slug}`)
          }
        ]
      }
    ]
  };

  return (
    <div className="relative overflow-hidden pb-24 pt-10 lg:pt-14">
      <script
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        type="application/ld+json"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[38rem] opacity-80"
        style={{
          background: `radial-gradient(circle at top left, ${course.accentFrom}16 0%, transparent 32%), radial-gradient(circle at 82% 12%, ${course.accentTo}18 0%, transparent 22%), linear-gradient(180deg, rgba(255,255,255,0.36), transparent 78%)`
        }}
      />

      <div className="site-container relative">
        <nav
          aria-label="Ruta de navegacion del curso"
          className="flex flex-wrap items-center gap-2 text-sm font-medium text-[var(--color-muted)]"
        >
          <Link className="transition hover:text-[var(--color-primary)]" href="/">
            Inicio
          </Link>
          <ChevronRight className="h-4 w-4 text-[var(--color-border)]" />
          <Link className="transition hover:text-[var(--color-primary)]" href="/cursos">
            Catalogo de cursos
          </Link>
          <ChevronRight className="h-4 w-4 text-[var(--color-border)]" />
          <span className="text-[var(--color-ink)]">{course.title}</span>
        </nav>

        <section className="mt-8 grid gap-10 xl:grid-cols-[minmax(0,1fr)_minmax(320px,380px)] xl:items-start">
          <div className="max-w-4xl">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center rounded-full bg-[var(--color-surface)] px-4 py-2 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">
                {purchaseMode === "live" ? "Compra online" : "Modo demo"}
              </span>
              <span className="inline-flex items-center rounded-full border border-[rgba(12,113,195,0.16)] px-4 py-2 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">
                {course.category}
              </span>
            </div>

            <h1 className="mt-6 max-w-5xl text-[clamp(3rem,7vw,5.8rem)] font-semibold leading-[0.92] tracking-[-0.09em] text-[var(--color-ink)]">
              {course.title}
            </h1>

            <p className="mt-6 max-w-3xl text-[1.22rem] font-medium leading-9 text-[var(--color-ink)]/88">
              {course.shortDescription}
            </p>
            <p className="mt-5 max-w-3xl text-[1.03rem] leading-8 text-[var(--color-muted)]">
              {course.description}
            </p>

            <p className="mt-6 max-w-3xl text-sm leading-7 text-[var(--color-muted)]">
              <span className="font-semibold text-[var(--color-ink)]">Ideal para </span>
              {course.audience.join(", ").toLowerCase()}.
              <span className="hidden sm:inline">
                {" "}
                {course.duration} · {course.format} · {course.level}.
              </span>
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <a
                className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-primary)] transition hover:gap-3"
                href="#purchase-panel"
              >
                Ver acceso y precio
                <ArrowUpRight className="h-4 w-4" />
              </a>
              <Link
                className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-ink)] underline-offset-4 transition hover:text-[var(--color-primary)] hover:underline"
                href="#course-program-heading"
              >
                Ver programa
              </Link>
            </div>
          </div>

          <aside className="xl:sticky xl:top-28" id="purchase-panel">
            <PurchaseCard course={course} purchaseMode={purchaseMode} />
          </aside>
        </section>

        <section
          aria-labelledby="course-outcomes-heading"
          className="mt-20 grid gap-10 lg:mt-24 xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]"
        >
          <SectionHeading
            description="La ficha pone el foco en el cambio que deberia producir el curso, no en una suma de bloques que compiten entre si."
            eyebrow="Valor academico"
            headingId="course-outcomes-heading"
            title="Que deberia cambiar en tu practica al terminar el curso"
          />

          <EditorialDividerList
            items={course.outcomes.map((outcome, index) => ({
              title: outcome,
              detail:
                index === 0
                  ? "La propuesta del curso prioriza aplicacion real, criterio y continuidad en la practica profesional."
                  : undefined
            }))}
          />
        </section>

        <section aria-labelledby="course-program-heading" className="mt-20 lg:mt-24">
          <SectionHeading
            description="El programa se presenta como un recorrido claro y escaneable antes de comprar."
            eyebrow="Programa"
            headingId="course-program-heading"
            title="Un temario limpio y facil de recorrer"
          />

          <div className="mt-10 divide-y divide-[rgba(12,113,195,0.12)] border-y border-[rgba(12,113,195,0.12)]">
            {course.modules.map((module, index) => (
              <article
                className="grid gap-5 py-7 lg:grid-cols-[5.5rem_minmax(0,1fr)_15rem] lg:items-start lg:gap-8"
                key={module.id}
              >
                <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-primary)]">
                  M{index + 1}
                </div>

                <div>
                  <h3 className="text-[2rem] font-semibold leading-tight tracking-[-0.05em] text-[var(--color-ink)]">
                    {module.title}
                  </h3>
                  <p className="mt-3 max-w-3xl text-[1rem] leading-8 text-[var(--color-muted)]">
                    {module.description}
                  </p>
                </div>

                <dl className="space-y-3 text-sm leading-6 text-[var(--color-muted)]">
                  <div>
                    <dt className="font-semibold uppercase tracking-[0.16em] text-[var(--color-ink)]">
                      Tiempo
                    </dt>
                    <dd className="mt-1">{module.estimatedTime}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold uppercase tracking-[0.16em] text-[var(--color-ink)]">
                      Recurso clave
                    </dt>
                    <dd className="mt-1">{module.resourcesSummary}</dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
        </section>

        <section
          aria-labelledby="course-methodology-heading"
          className="mt-20 grid gap-10 lg:mt-24 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]"
        >
          <SectionHeading
            description="La metodologia se explica como experiencia de estudio, no como un conjunto de tarjetas de apoyo."
            eyebrow="Metodologia"
            headingId="course-methodology-heading"
            title="Una experiencia de estudio clara y acompasada"
          />

          <div className="divide-y divide-[rgba(12,113,195,0.12)] border-y border-[rgba(12,113,195,0.12)]">
            {course.methodology.map((item, index) => (
              <article className="py-6" key={item}>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-primary)]">
                  Paso {index + 1}
                </p>
                <p className="mt-3 text-[1.45rem] font-semibold leading-tight tracking-[-0.04em] text-[var(--color-ink)]">
                  {item}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section aria-labelledby="course-teachers-heading" className="mt-20 lg:mt-24">
          <SectionHeading
            description="La presentacion docente debe aportar solvencia sin convertir el tramo final en otro bloque pesado."
            eyebrow="Equipo docente"
            headingId="course-teachers-heading"
            title="Quien sostiene el recorrido academico"
          />

          <div className="mt-10 divide-y divide-[rgba(12,113,195,0.12)] border-y border-[rgba(12,113,195,0.12)]">
            {course.teachers.map((teacher) => (
              <article
                className="grid gap-5 py-7 md:grid-cols-[7rem_minmax(0,1fr)] md:items-start md:gap-8"
                key={`${teacher.name}-${teacher.role}`}
              >
                <div className="grid h-24 w-24 place-items-center rounded-[2rem] bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.76),rgba(217,232,251,0.92))] text-[1.8rem] font-semibold tracking-[-0.05em] text-[var(--color-primary)]">
                  <TeacherInitials name={teacher.name} />
                </div>

                <div>
                  <h3 className="text-[2rem] font-semibold tracking-[-0.05em] text-[var(--color-ink)]">
                    {teacher.name}
                  </h3>
                  <p className="mt-2 text-[1rem] font-medium text-[var(--color-primary)]">
                    {teacher.role}
                  </p>
                  <p className="mt-4 max-w-3xl text-[1rem] leading-8 text-[var(--color-muted)]">
                    {teacher.bio}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section
          aria-labelledby="course-faq-heading"
          className="mt-20 grid gap-10 lg:mt-24 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]"
        >
          <SectionHeading
            description="Las dudas finales se resuelven con respuestas directas y poco ruido visual."
            eyebrow="Preguntas frecuentes"
            headingId="course-faq-heading"
            title="Lo importante antes de pasar al checkout"
          />

          <div className="divide-y divide-[rgba(12,113,195,0.12)] border-y border-[rgba(12,113,195,0.12)]">
            {course.faq.map((item) => (
              <article className="py-6" key={item.question}>
                <h3 className="text-[1.45rem] font-semibold leading-tight tracking-[-0.03em] text-[var(--color-ink)]">
                  {item.question}
                </h3>
                <p className="mt-3 text-[1rem] leading-8 text-[var(--color-muted)]">
                  {item.answer}
                </p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  BookOpenCheck,
  CalendarCheck2,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Lock,
  MonitorPlay,
  UserRound
} from "lucide-react";
import { CourseArtwork } from "@/components/course-artwork";
import { PurchaseCard } from "@/components/purchase-card";
import { Card } from "@/components/ui/card";
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

export default async function CoursePage({ params }: CoursePageProps) {
  const { slug } = await params;
  const course = await getCatalogCourseBySlug(slug);

  if (!course) {
    notFound();
  }

  const purchaseMode = getStripe() ? "live" : "demo";
  const leadEdition = course.activeEdition;

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
    <div className="pb-24 pt-12 lg:pt-14">
      <script
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        type="application/ld+json"
      />

      <div className="site-container">
        <div className="flex flex-wrap items-center gap-2 text-sm font-medium text-[var(--color-ink)]">
          <span>Inicio</span>
          <ChevronRight className="h-4 w-4 text-[var(--color-muted)]" />
          <span>Catalogo de cursos</span>
          <ChevronRight className="h-4 w-4 text-[var(--color-muted)]" />
          <span>{course.category}</span>
        </div>

        <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_332px] lg:items-start">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center gap-2 rounded-full bg-[var(--color-surface)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">
                <Lock className="h-3.5 w-3.5" />
                {purchaseMode === "live" ? "Compra online activa" : "Modo demo local"}
              </div>
              <div className="inline-flex rounded-full border border-[var(--color-border)] bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">
                {course.level}
              </div>
            </div>

            <h1 className="mt-5 max-w-5xl text-[3.9rem] font-semibold leading-[0.98] tracking-[-0.08em] text-[var(--color-primary)] lg:text-[4.6rem]">
              {course.title}
            </h1>
            <p className="mt-5 max-w-5xl text-[1.18rem] leading-10 text-[var(--color-ink)]/88">
              {course.description}
            </p>

            {leadEdition ? (
              <div className="mt-6 rounded-2xl border border-[rgba(12,113,195,0.16)] bg-white px-5 py-4 text-sm leading-7 text-[var(--color-ink)]">
                Esta compra se vincula a <strong>{leadEdition.label}</strong>. El acceso depende
                de la edicion, del estado de tu matricula y, si la edicion finaliza, de su
                ventana de consulta posterior.
              </div>
            ) : null}

            <div className="mt-8">
              <CourseArtwork className="h-[25rem] w-full rounded-[22px]" course={course} variant="hero" />
            </div>
          </div>

          <aside className="lg:sticky lg:top-28">
            <PurchaseCard course={course} purchaseMode={purchaseMode} />
          </aside>
        </div>

        <section className="mt-20">
          <h2 className="text-[3rem] font-semibold tracking-[-0.06em] text-[var(--color-ink)]">
            Objetivos del curso
          </h2>

          <div className="mt-8 grid gap-3 lg:grid-cols-2">
            <Card className="border-l-4 border-l-[var(--color-accent)] p-8 lg:col-span-2">
              <div className="mb-6 grid h-12 w-12 place-items-center rounded-full bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
                <BookOpenCheck className="h-5 w-5" />
              </div>
              <h3 className="text-[2.1rem] font-semibold tracking-[-0.05em] text-[var(--color-ink)]">
                {course.outcomes[0]}
              </h3>
              <p className="mt-4 max-w-4xl text-[1.04rem] leading-8 text-[var(--color-ink)]/84">
                Un itinerario centrado en comprension profunda, aplicacion real y decisiones
                respetuosas con el perfil de cada persona.
              </p>
            </Card>

            {course.outcomes.slice(1).map((outcome) => (
              <Card className="p-6" key={outcome}>
                <div className="mb-5 grid h-11 w-11 place-items-center rounded-full bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
                  <MonitorPlay className="h-5 w-5" />
                </div>
                <h3 className="text-[1.55rem] font-semibold tracking-[-0.04em] text-[var(--color-ink)]">
                  {outcome}
                </h3>
              </Card>
            ))}
          </div>
        </section>

        <section className="mt-20 max-w-[760px]">
          <h2 className="text-[3rem] font-semibold tracking-[-0.06em] text-[var(--color-ink)]">
            Programa de estudio
          </h2>

          <div className="mt-8 space-y-4">
            {course.modules.map((module, index) => (
              <Card className="p-6" key={module.id}>
                <div className="flex items-start gap-5">
                  <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-[var(--color-primary-soft)] text-lg font-semibold text-[var(--color-ink)]">
                    M{index + 1}
                  </div>

                  <div className="min-w-0">
                    <h3 className="text-[2rem] font-semibold tracking-[-0.05em] text-[var(--color-ink)]">
                      {module.title}
                    </h3>
                    <p className="mt-3 text-[1.04rem] leading-8 text-[var(--color-ink)]/84">
                      {module.description}
                    </p>
                    <div className="mt-5 flex flex-wrap gap-5 text-sm font-medium text-[var(--color-muted)]">
                      <span>{module.estimatedTime}</span>
                      <span>{module.resourcesSummary}</span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>

        <section className="mt-20 max-w-[760px]">
          <h2 className="text-[3rem] font-semibold tracking-[-0.06em] text-[var(--color-ink)]">
            Metodologia
          </h2>

          <div className="mt-8 grid gap-4 rounded-[24px] border border-[var(--color-border)] bg-[rgba(255,255,255,0.7)] p-6 md:grid-cols-3">
            {[
              {
                icon: MonitorPlay,
                title: "Contenido guiado",
                description:
                  course.methodology[0] ?? "Aprende a tu ritmo con materiales disponibles en el campus."
              },
              {
                icon: CircleHelp,
                title: "Material de apoyo",
                description:
                  course.methodology[1] ?? "Material complementario para aplicar el contenido."
              },
              {
                icon: CalendarCheck2,
                title: "Acceso privado",
                description:
                  course.methodology[2] ??
                  "Acceso en tu cuenta sujeto a la edicion en la que te matricules."
              }
            ].map(({ icon: Icon, title, description }) => (
              <div
                className="flex flex-col items-center justify-start px-6 py-4 text-center md:border-l md:first:border-l-0 md:border-[rgba(12,113,195,0.14)]"
                key={title}
              >
                <div className="grid h-[4.5rem] w-[4.5rem] place-items-center rounded-full border border-[var(--color-border)] bg-white text-[var(--color-primary)] shadow-sm">
                  <Icon className="h-7 w-7" />
                </div>
                <h3 className="mt-5 text-[1.8rem] font-semibold tracking-[-0.04em] text-[var(--color-ink)]">
                  {title}
                </h3>
                <p className="mt-3 text-[1rem] leading-8 text-[var(--color-ink)]/82">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-20 max-w-[760px]">
          <h2 className="text-[3rem] font-semibold tracking-[-0.06em] text-[var(--color-ink)]">
            Equipo docente
          </h2>

          <div className="mt-8 space-y-4">
            {course.teachers.map((teacher) => (
              <Card className="p-8" key={`${teacher.name}-${teacher.role}`}>
                <div className="flex flex-col gap-6 md:flex-row md:items-center">
                  <div className="grid h-28 w-28 shrink-0 place-items-center rounded-full bg-[var(--color-surface)] text-[var(--color-primary)]">
                    <UserRound className="h-12 w-12" />
                  </div>

                  <div>
                    <h3 className="text-[2.2rem] font-semibold tracking-[-0.05em] text-[var(--color-ink)]">
                      {teacher.name}
                    </h3>
                    <p className="mt-2 text-[1.2rem] font-medium text-[var(--color-primary)]">
                      {teacher.role}
                    </p>
                    <p className="mt-4 text-[1.04rem] leading-8 text-[var(--color-ink)]/84">
                      {teacher.bio}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>

        <section className="mt-20 max-w-[760px]">
          <h2 className="text-[3rem] font-semibold tracking-[-0.06em] text-[var(--color-ink)]">
            Preguntas frecuentes
          </h2>

          <div className="mt-8 space-y-3">
            {course.faq.map((item, index) => (
              <details
                className="rounded-[18px] border border-[var(--color-border)] bg-white px-6 py-5"
                key={item.question}
                open={index === 0}
              >
                <summary className="flex cursor-pointer items-center justify-between gap-4">
                  <span className="text-[1.2rem] font-medium text-[var(--color-ink)]">
                    {item.question}
                  </span>
                  <ChevronDown className="h-5 w-5 shrink-0 text-[var(--color-muted)]" />
                </summary>
                <p className="mt-4 pr-6 text-[1rem] leading-8 text-[var(--color-ink)]/82">
                  {item.answer}
                </p>
              </details>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  ArrowUpRight,
  BadgeCheck,
  BookOpenCheck,
  CalendarCheck2,
  ChevronDown,
  ChevronRight,
  Clock3,
  CircleHelp,
  GraduationCap,
  Lock,
  MonitorPlay,
  ShieldCheck,
  UserRound
} from "lucide-react";
import { CourseArtwork } from "@/components/course-artwork";
import { PurchaseCard } from "@/components/purchase-card";
import { Card } from "@/components/ui/card";
import { getCatalogCourseBySlug, getCatalogCourses } from "@/lib/course-catalog";
import { absoluteUrl } from "@/lib/site";
import { getStripe } from "@/lib/stripe";
import { formatPrice } from "@/lib/utils";

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
}) {
  return (
    <div className="max-w-3xl">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-primary)]">
        {input.eyebrow}
      </p>
      <h2 className="mt-4 text-[clamp(2.2rem,4vw,3.4rem)] font-semibold leading-[0.98] tracking-[-0.06em] text-[var(--color-ink)]">
        {input.title}
      </h2>
      <p className="mt-4 text-[1.03rem] leading-8 text-[var(--color-muted)]">
        {input.description}
      </p>
    </div>
  );
}

function HeroFact(input: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  const Icon = input.icon;

  return (
    <div className="rounded-[24px] border border-[rgba(12,113,195,0.12)] bg-white/92 p-5 shadow-[0_18px_40px_rgba(21,35,50,0.05)] backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">
            {input.label}
          </p>
          <p className="mt-1 text-base font-semibold leading-6 text-[var(--color-ink)]">
            {input.value}
          </p>
        </div>
      </div>
    </div>
  );
}

function OutcomeCard(input: {
  title: string;
  detail?: string;
  emphasis?: boolean;
}) {
  return (
    <article
      className={
        input.emphasis
          ? "rounded-[32px] border border-[rgba(12,113,195,0.16)] bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(225,236,248,0.78))] p-8 shadow-[0_24px_54px_rgba(21,35,50,0.07)] lg:p-10"
          : "rounded-[28px] border border-[rgba(12,113,195,0.12)] bg-white p-6 shadow-[0_18px_40px_rgba(21,35,50,0.05)]"
      }
    >
      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
        <BookOpenCheck className="h-5 w-5" />
      </div>
      <h3
        className={
          input.emphasis
            ? "mt-6 max-w-3xl text-[clamp(2rem,3.2vw,2.8rem)] font-semibold leading-[1.02] tracking-[-0.05em] text-[var(--color-ink)]"
            : "mt-5 text-[1.5rem] font-semibold leading-tight tracking-[-0.04em] text-[var(--color-ink)]"
        }
      >
        {input.title}
      </h3>
      {input.detail ? (
        <p className="mt-4 max-w-3xl text-[1rem] leading-8 text-[var(--color-muted)]">{input.detail}</p>
      ) : null}
    </article>
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
  const leadEdition = course.activeEdition;
  const heroFacts = [
    {
      label: "Duracion",
      value: course.duration,
      icon: Clock3
    },
    {
      label: "Formato",
      value: course.format,
      icon: MonitorPlay
    },
    {
      label: "Nivel",
      value: course.level,
      icon: GraduationCap
    },
    {
      label: "Precio",
      value: formatPrice(course.priceInCents),
      icon: BadgeCheck
    }
  ];
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
        className="pointer-events-none absolute inset-x-0 top-0 h-[44rem] opacity-80"
        style={{
          background: `radial-gradient(circle at top left, ${course.accentFrom}18 0%, transparent 34%), radial-gradient(circle at 78% 16%, ${course.accentTo}20 0%, transparent 24%), linear-gradient(180deg, rgba(255,255,255,0.4), transparent 78%)`
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

        <section className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,370px)] xl:items-start">
          <div className="space-y-8">
            <div className="relative overflow-hidden rounded-[36px] border border-[rgba(12,113,195,0.12)] bg-[rgba(255,255,255,0.92)] p-6 shadow-[0_24px_54px_rgba(21,35,50,0.07)] backdrop-blur-sm lg:p-8">
              <div
                aria-hidden="true"
                className="absolute -right-24 -top-24 h-64 w-64 rounded-full blur-3xl"
                style={{ backgroundColor: `${course.accentFrom}22` }}
              />
              <div
                aria-hidden="true"
                className="absolute bottom-0 left-0 h-48 w-48 rounded-full blur-3xl"
                style={{ backgroundColor: `${course.accentTo}18` }}
              />

              <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1.04fr)_minmax(18rem,0.96fr)]">
                <div className="space-y-6">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="inline-flex items-center gap-2 rounded-full bg-[var(--color-surface)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">
                      <Lock className="h-3.5 w-3.5" />
                      {purchaseMode === "live" ? "Compra online activa" : "Modo demo local"}
                    </div>
                    <div className="inline-flex rounded-full border border-[var(--color-border)] bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">
                      {course.category}
                    </div>
                    <div className="inline-flex rounded-full border border-[var(--color-border)] bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">
                      {course.level}
                    </div>
                  </div>

                  <div>
                    <h1 className="max-w-4xl text-[clamp(3rem,7vw,5.4rem)] font-semibold leading-[0.94] tracking-[-0.08em] text-[var(--color-ink)]">
                      {course.title}
                    </h1>
                    <p className="mt-5 max-w-3xl text-[1.22rem] font-medium leading-9 text-[var(--color-ink)]/88">
                      {course.shortDescription}
                    </p>
                    <p className="mt-4 max-w-3xl text-[1.03rem] leading-8 text-[var(--color-muted)]">
                      {course.description}
                    </p>
                  </div>

                  <div className="rounded-[28px] border border-[rgba(12,113,195,0.1)] bg-white/88 p-5">
                    <div className="flex items-center gap-3">
                      <ShieldCheck className="h-5 w-5 text-[var(--color-primary)]" />
                      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-primary)]">
                        Pensado para
                      </p>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-3">
                      {course.audience.map((item) => (
                        <span
                          className="rounded-full border border-[rgba(12,113,195,0.12)] bg-[var(--color-primary-soft)] px-4 py-2 text-sm font-medium text-[var(--color-ink)]"
                          key={item}
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4">
                    <a
                      className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-primary)] transition hover:gap-3"
                      href="#purchase-panel"
                    >
                      Ver precio y acceso
                      <ArrowUpRight className="h-4 w-4" />
                    </a>
                    <Link
                      className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-ink)] underline-offset-4 transition hover:text-[var(--color-primary)] hover:underline"
                      href="/cursos"
                    >
                      Volver al catalogo
                    </Link>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="overflow-hidden rounded-[30px] border border-[rgba(12,113,195,0.12)] bg-white p-4 shadow-[0_22px_44px_rgba(21,35,50,0.06)]">
                    <CourseArtwork className="h-[19rem] w-full rounded-[24px] border-0" course={course} variant="hero" />
                  </div>

                  {leadEdition ? (
                    <div className="rounded-[28px] border border-[rgba(12,113,195,0.14)] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(233,241,250,0.78))] p-5">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-primary)]">
                        Edicion activa
                      </p>
                      <p className="mt-3 text-[1.45rem] font-semibold tracking-[-0.04em] text-[var(--color-ink)]">
                        {leadEdition.label}
                      </p>
                      <p className="mt-3 text-sm leading-7 text-[var(--color-muted)]">
                        Esta compra se vincula a esta edicion. El acceso depende del estado de tu
                        matricula y de la ventana de consulta posterior configurada para el curso.
                      </p>
                    </div>
                  ) : null}

                  {leadTeacher ? (
                    <div className="rounded-[28px] border border-[rgba(12,113,195,0.12)] bg-white p-5">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-primary)]">
                        Referencia docente
                      </p>
                      <p className="mt-3 text-[1.35rem] font-semibold leading-tight tracking-[-0.04em] text-[var(--color-ink)]">
                        {leadTeacher.name}
                      </p>
                      <p className="mt-2 text-sm font-medium text-[var(--color-primary)]">
                        {leadTeacher.role}
                      </p>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {heroFacts.map((fact) => (
                <HeroFact icon={fact.icon} key={fact.label} label={fact.label} value={fact.value} />
              ))}
            </div>
          </div>

          <aside className="space-y-4 xl:sticky xl:top-28" id="purchase-panel">
            <div className="rounded-[28px] border border-[rgba(12,113,195,0.12)] bg-white px-5 py-4 shadow-[0_18px_40px_rgba(21,35,50,0.05)]">
              <div className="flex items-start gap-3">
                <CalendarCheck2 className="mt-0.5 h-5 w-5 text-[var(--color-primary)]" />
                <div>
                  <p className="text-sm font-semibold text-[var(--color-ink)]">Acceso y matricula claros</p>
                  <p className="mt-2 text-sm leading-7 text-[var(--color-muted)]">
                    El CTA principal mantiene el flujo actual y te lleva al checkout del curso sin cambiar la logica de compra.
                  </p>
                </div>
              </div>
            </div>
            <PurchaseCard course={course} purchaseMode={purchaseMode} />
          </aside>
        </section>

        <section
          aria-labelledby="course-outcomes-heading"
          className="mt-18 grid gap-6 lg:mt-20 xl:grid-cols-[minmax(0,1.08fr)_minmax(18rem,0.92fr)]"
        >
          <div className="space-y-6">
            <SectionHeading
              description="Esta formacion no vende amplitud sin criterio. El recorrido pone el foco en aplicacion real, decisiones consistentes y una experiencia de estudio clara desde la compra hasta el acceso."
              eyebrow="Valor academico"
              title="Que deberia cambiar en tu practica al terminar el curso"
            />

            <div className="grid gap-4">
              <OutcomeCard
                detail="Una ficha de curso premium necesita dejar claro el resultado, no solo enumerar contenido. Aqui priorizamos lo que el alumno podra comprender, aplicar y sostener despues."
                emphasis
                title={course.outcomes[0] ?? "Recorrido claro y aplicable desde el primer modulo."}
              />
              {course.outcomes.slice(1).map((outcome) => (
                <OutcomeCard key={outcome} title={outcome} />
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <Card className="overflow-hidden border-[rgba(12,113,195,0.14)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(242,239,233,0.92))] p-7">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-primary)]">
                Lo que recibes
              </p>
              <div className="mt-6 space-y-5">
                <div className="flex gap-4">
                  <MonitorPlay className="mt-1 h-5 w-5 text-[var(--color-primary)]" />
                  <div>
                    <p className="text-base font-semibold text-[var(--color-ink)]">{course.format}</p>
                    <p className="mt-1 text-sm leading-7 text-[var(--color-muted)]">
                      Contenido estructurado para entrar, avanzar y volver al material sin friccion.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <Clock3 className="mt-1 h-5 w-5 text-[var(--color-primary)]" />
                  <div>
                    <p className="text-base font-semibold text-[var(--color-ink)]">{course.duration}</p>
                    <p className="mt-1 text-sm leading-7 text-[var(--color-muted)]">
                      Carga asumible, secuenciada y visible desde la ficha antes de comprar.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <Lock className="mt-1 h-5 w-5 text-[var(--color-primary)]" />
                  <div>
                    <p className="text-base font-semibold text-[var(--color-ink)]">
                      Acceso por edicion y cuenta personal
                    </p>
                    <p className="mt-1 text-sm leading-7 text-[var(--color-muted)]">
                      Sin promesas ambiguas: el campus activa el contenido segun la matricula y la edicion correspondiente.
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-7">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-primary)]">
                Decision de compra
              </p>
              <p className="mt-4 text-[2.4rem] font-semibold tracking-[-0.06em] text-[var(--color-ink)]">
                {formatPrice(course.priceInCents)}
              </p>
              <p className="mt-3 text-sm leading-7 text-[var(--color-muted)]">
                Precio visible desde el primer bloque para reducir incertidumbre antes de pasar al checkout.
              </p>
            </Card>
          </div>
        </section>

        <section aria-labelledby="course-program-heading" className="mt-20">
          <SectionHeading
            description="El programa se presenta como un recorrido legible. Cada modulo deja ver de un vistazo el bloque, el tiempo estimado y el tipo de recurso que lo acompana."
            eyebrow="Programa"
            title="Un temario escaneable antes de comprar"
          />

          <ol className="mt-10 grid gap-4">
            {course.modules.map((module, index) => (
              <li key={module.id}>
                <article className="grid gap-5 rounded-[30px] border border-[rgba(12,113,195,0.12)] bg-white p-6 shadow-[0_16px_36px_rgba(21,35,50,0.05)] lg:grid-cols-[5.25rem_minmax(0,1fr)_minmax(16rem,0.72fr)] lg:items-start lg:p-7">
                  <div className="grid h-14 w-14 place-items-center rounded-2xl bg-[var(--color-primary-soft)] text-lg font-semibold text-[var(--color-ink)]">
                    M{index + 1}
                  </div>

                  <div className="min-w-0">
                    <h3 className="text-[2rem] font-semibold leading-tight tracking-[-0.05em] text-[var(--color-ink)]">
                      {module.title}
                    </h3>
                    <p className="mt-4 max-w-3xl text-[1.02rem] leading-8 text-[var(--color-muted)]">
                      {module.description}
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                    <div className="rounded-[22px] bg-[var(--color-surface)] px-5 py-4">
                      <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">
                        Tiempo estimado
                      </p>
                      <p className="mt-2 text-base font-semibold text-[var(--color-ink)]">
                        {module.estimatedTime}
                      </p>
                    </div>
                    <div className="rounded-[22px] bg-[var(--color-surface)] px-5 py-4">
                      <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">
                        Recurso clave
                      </p>
                      <p className="mt-2 text-base font-semibold text-[var(--color-ink)]">
                        {module.resourcesSummary}
                      </p>
                    </div>
                  </div>
                </article>
              </li>
            ))}
          </ol>
        </section>

        <section
          aria-labelledby="course-methodology-heading"
          className="mt-20 grid gap-6 xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]"
        >
          <Card className="overflow-hidden border-[rgba(12,113,195,0.14)] bg-[linear-gradient(160deg,rgba(255,255,255,0.98),rgba(224,236,248,0.72))] p-8 lg:p-9">
            <SectionHeading
              description="La metodologia debe explicar como sera estudiar dentro del producto, no quedarse en tres cajas repetidas. Aqui se presenta como una experiencia de uso y seguimiento."
              eyebrow="Metodologia"
              title="Una experiencia de estudio clara, acompasada y profesional"
            />
            <div className="mt-8 rounded-[26px] border border-[rgba(12,113,195,0.12)] bg-white/88 p-6">
              <p className="text-sm leading-8 text-[var(--color-muted)]">
                El curso esta planteado para que la persona comprenda rapidamente como entrar,
                consumir el contenido, apoyarse en materiales y llegar al campus con un flujo sin
                ambiguedades.
              </p>
            </div>
          </Card>

          <div className="grid gap-4">
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
            ].map(({ icon: Icon, title, description }, index) => (
              <article
                className="grid gap-4 rounded-[28px] border border-[rgba(12,113,195,0.12)] bg-white p-6 shadow-[0_16px_36px_rgba(21,35,50,0.05)] sm:grid-cols-[4.5rem_minmax(0,1fr)] sm:items-start"
                key={title}
              >
                <div className="flex items-center gap-3 sm:block">
                  <div className="grid h-[4.25rem] w-[4.25rem] place-items-center rounded-[1.4rem] bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
                    <Icon className="h-6 w-6" />
                  </div>
                  <span className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)] sm:mt-3 sm:block">
                    Paso {index + 1}
                  </span>
                </div>
                <div>
                  <h3 className="text-[1.6rem] font-semibold tracking-[-0.04em] text-[var(--color-ink)]">
                    {title}
                  </h3>
                  <p className="mt-3 text-[1rem] leading-8 text-[var(--color-muted)]">
                    {description}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section aria-labelledby="course-teachers-heading" className="mt-20">
          <SectionHeading
            description="La presentacion docente debe transmitir criterio y solvencia. Aunque no haya retratos, la ficha puede comunicar mejor quien sostiene la formacion."
            eyebrow="Equipo docente"
            title="Quien sostiene el recorrido academico"
          />

          <div className="mt-10 grid gap-4 lg:grid-cols-2">
            {course.teachers.map((teacher, index) => (
              <article
                className={
                  index === 0 && course.teachers.length === 1
                    ? "grid gap-6 rounded-[32px] border border-[rgba(12,113,195,0.14)] bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(242,239,233,0.92))] p-8 shadow-[0_20px_46px_rgba(21,35,50,0.06)] md:grid-cols-[8rem_minmax(0,1fr)] md:items-center"
                    : "grid gap-5 rounded-[28px] border border-[rgba(12,113,195,0.12)] bg-white p-7 shadow-[0_16px_36px_rgba(21,35,50,0.05)] md:grid-cols-[6.5rem_minmax(0,1fr)] md:items-start"
                }
                key={`${teacher.name}-${teacher.role}`}
              >
                <div className="relative">
                  <div className="grid h-28 w-28 place-items-center rounded-[2rem] bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.7),rgba(217,232,251,0.92))] text-[2rem] font-semibold tracking-[-0.05em] text-[var(--color-primary)] shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]">
                    <TeacherInitials name={teacher.name} />
                  </div>
                  <div className="absolute -bottom-2 -right-2 grid h-10 w-10 place-items-center rounded-xl bg-white text-[var(--color-primary)] shadow-[0_12px_20px_rgba(21,35,50,0.08)]">
                    <UserRound className="h-5 w-5" />
                  </div>
                </div>

                <div>
                  <h3 className="text-[2rem] font-semibold tracking-[-0.05em] text-[var(--color-ink)]">
                    {teacher.name}
                  </h3>
                  <p className="mt-2 text-[1.05rem] font-medium text-[var(--color-primary)]">
                    {teacher.role}
                  </p>
                  <p className="mt-4 text-[1.02rem] leading-8 text-[var(--color-muted)]">
                    {teacher.bio}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section
          aria-labelledby="course-faq-heading"
          className="mt-20 grid gap-6 xl:grid-cols-[minmax(0,0.88fr)_minmax(0,1.12fr)]"
        >
          <Card className="border-[rgba(12,113,195,0.14)] bg-[linear-gradient(145deg,rgba(255,255,255,0.98),rgba(224,236,248,0.72))] p-8 lg:p-9">
            <SectionHeading
              description="La decision final suele depender de dudas concretas sobre acceso, materiales y flujo posterior a la compra. Este bloque intenta resolverlas sin ruido."
              eyebrow="Preguntas frecuentes"
              title="Lo importante antes de pasar al checkout"
            />
            <div className="mt-8 rounded-[24px] border border-[rgba(12,113,195,0.12)] bg-white/92 p-5">
              <p className="text-sm leading-7 text-[var(--color-muted)]">
                El enlace principal de compra sigue intacto y te llevara al checkout del curso con la misma logica actual. Esta fase mejora presentacion y confianza previa, no el flujo de pago.
              </p>
            </div>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2">
            {course.faq.map((item, index) => (
              <article
                className={
                  index === 0
                    ? "rounded-[28px] border border-[rgba(12,113,195,0.14)] bg-white p-7 shadow-[0_18px_40px_rgba(21,35,50,0.05)] sm:col-span-2"
                    : "rounded-[28px] border border-[rgba(12,113,195,0.12)] bg-white p-6 shadow-[0_16px_34px_rgba(21,35,50,0.05)]"
                }
                key={item.question}
              >
                <div className="flex items-start gap-3">
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
                    <ChevronDown className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-[1.35rem] font-semibold leading-tight tracking-[-0.03em] text-[var(--color-ink)]">
                      {item.question}
                    </h3>
                    <p className="mt-3 text-[1rem] leading-8 text-[var(--color-muted)]">
                      {item.answer}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

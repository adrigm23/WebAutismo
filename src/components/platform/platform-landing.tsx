import { ArrowRight, BookOpenText, CheckCircle2, ShieldCheck, Sparkles } from "lucide-react";
import { CourseCard } from "@/components/course-card";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getFeaturedCatalogCourses } from "@/lib/course-catalog";
import { siteConfig } from "@/lib/site";

const benefits = [
  {
    title: "Compra clara y acceso inmediato",
    description:
      "Registro, pago y acceso al campus resueltos en un mismo flujo, sin saltos innecesarios."
  },
  {
    title: "Area privada por cuenta",
    description:
      "Cada compra queda disponible en tu cuenta para consultar el material y participar en el foro del curso."
  },
  {
    title: "Contenido protegido",
    description:
      "El acceso al campus y a los adjuntos del foro se valida desde la sesion del usuario."
  }
];

const steps = [
  "Explora el catalogo y revisa el enfoque, el programa y la metodologia de cada curso.",
  "Crea tu cuenta o inicia sesion antes de completar la compra o activar el modo local de prueba.",
  "Accede al campus, marca tu progreso real por modulo y participa en el foro privado asociado al curso."
];

export async function PlatformLanding() {
  const featuredCourses = await getFeaturedCatalogCourses();

  return (
    <div className="pb-20">
      <section className="mx-auto grid w-full max-w-7xl gap-12 px-6 pb-16 pt-14 lg:grid-cols-[1.08fr_0.92fr] lg:px-8 lg:pt-20">
        <div className="space-y-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-muted)] shadow-sm">
            <Sparkles className="h-4 w-4 text-[var(--color-coral)]" />
            Formacion digital especializada
          </div>

          <div className="space-y-6">
            <h1 className="max-w-4xl font-display text-5xl leading-[1.02] tracking-[-0.06em] text-[var(--color-ink)] sm:text-6xl">
              Formacion especializada en autismo con compra directa, campus privado y un
              recorrido de acceso claro.
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-[var(--color-muted)]">
              {siteConfig.name} reune catalogo, checkout y area privada en una sola
              plataforma. El objetivo es simple: explicar bien cada curso, facilitar la
              compra y proteger el contenido para familias, profesionales y entidades.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/cursos">Ver cursos</ButtonLink>
            <ButtonLink href="/registro" variant="secondary">
              Crear cuenta
            </ButtonLink>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-muted)]">
                Catalogo
              </p>
              <p className="mt-3 text-2xl font-semibold text-[var(--color-ink)]">Informacion util</p>
              <p className="mt-2 text-sm leading-7 text-[var(--color-muted)]">
                Fichas completas, metadata y rutas pensadas para descubrimiento real.
              </p>
            </Card>
            <Card className="p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-muted)]">
                Acceso
              </p>
              <p className="mt-3 text-2xl font-semibold text-[var(--color-ink)]">
                Por edicion
              </p>
              <p className="mt-2 text-sm leading-7 text-[var(--color-muted)]">
                El acceso se controla desde tu cuenta segun matricula y ventana vigente.
              </p>
            </Card>
            <Card className="p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-muted)]">
                Seguridad
              </p>
              <p className="mt-3 text-2xl font-semibold text-[var(--color-ink)]">
                Privado
              </p>
              <p className="mt-2 text-sm leading-7 text-[var(--color-muted)]">
                Materiales y adjuntos servidos solo a usuarios con permiso.
              </p>
            </Card>
          </div>
        </div>

        <div className="relative">
          <div className="absolute inset-0 -z-10 rounded-[40px] bg-[linear-gradient(135deg,rgba(13,99,86,0.12),rgba(232,133,100,0.18))] blur-3xl" />
          <Card className="overflow-hidden p-6">
            <div className="grid-mesh rounded-[28px] border border-white/70 bg-[linear-gradient(135deg,#0d6356,#e88564)] p-6 text-white">
              <div className="max-w-sm space-y-4">
                <p className="text-xs font-semibold uppercase tracking-[0.26em] text-white/70">
                  Flujo principal
                </p>
                <h2 className="font-display text-3xl leading-tight">
                  Del catalogo al campus sin friccion y sin promesas falsas.
                </h2>
                <p className="text-sm leading-7 text-white/82">
                  El producto prioriza compra clara, acceso real al contenido, progreso
                  manual verificable y foro privado por curso.
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
              <div className="rounded-[28px] bg-[var(--color-surface)] p-5">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-[var(--color-ink)]">
                    Vista del curso
                  </p>
                  <span className="rounded-full bg-white px-3 py-1 text-xs text-[var(--color-muted)]">
                    Informacion real
                  </span>
                </div>
                <div className="mt-4 space-y-4">
                  <div className="rounded-[24px] bg-white p-4">
                    <p className="text-xs uppercase tracking-[0.22em] text-[var(--color-muted)]">
                      Programa
                    </p>
                    <div className="mt-3 space-y-3 text-sm text-[var(--color-muted)]">
                      <div className="rounded-2xl bg-[var(--color-surface)] px-4 py-3">
                        Modulos, objetivos, metodologia y docente.
                      </div>
                      <div className="rounded-2xl bg-[var(--color-surface)] px-4 py-3">
                        Tiempos y recursos definidos por modulo.
                      </div>
                    </div>
                  </div>
                  <div className="rounded-[24px] bg-white p-4">
                    <p className="text-xs uppercase tracking-[0.22em] text-[var(--color-muted)]">
                      Campus y foro
                    </p>
                    <p className="mt-3 text-sm leading-7 text-[var(--color-muted)]">
                      Resumen del curso, progreso manual, materiales y acceso al foro privado
                      desde la misma cuenta.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-[28px] border border-[color:var(--color-border)] bg-white p-5">
                <p className="text-xs uppercase tracking-[0.22em] text-[var(--color-muted)]">
                  Inscripcion
                </p>
                <p className="mt-3 font-display text-4xl text-[var(--color-ink)]">
                  Clara
                </p>
                <div className="mt-5 space-y-3">
                  <div className="flex items-center gap-3 rounded-2xl bg-[var(--color-surface)] px-4 py-3 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-[var(--color-teal)]" />
                    Pago seguro cuando Stripe esta activo
                  </div>
                  <div className="flex items-center gap-3 rounded-2xl bg-[var(--color-surface)] px-4 py-3 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-[var(--color-teal)]" />
                    Modo demo local claramente identificado
                  </div>
                  <div className="flex items-center gap-3 rounded-2xl bg-[var(--color-surface)] px-4 py-3 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-[var(--color-teal)]" />
                    Activacion y correo solo cuando corresponde
                  </div>
                </div>
                <ButtonLink className="mt-6" href="/cursos" variant="ghost">
                  Explorar cursos
                  <ArrowRight className="ml-2 h-4 w-4" />
                </ButtonLink>
              </div>
            </div>
          </Card>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-6 py-10 lg:px-8">
        <div className="mb-10 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--color-muted)]">
              Cursos destacados
            </p>
            <h2 className="font-display text-4xl text-[var(--color-ink)]">
              Catalogo orientado a decision y confianza
            </h2>
          </div>
          <p className="max-w-2xl text-sm leading-7 text-[var(--color-muted)]">
            Cada curso se presenta con informacion util: enfoque, destinatarios, programa,
            metodologia, docente y una llamada a la accion clara.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {featuredCourses.map((course) => (
            <CourseCard course={course} key={course.slug} />
          ))}
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-7xl gap-6 px-6 py-12 lg:grid-cols-3 lg:px-8">
        {benefits.map((benefit) => (
          <Card className="p-7" key={benefit.title}>
            <div className="mb-5 inline-flex rounded-2xl bg-[var(--color-surface)] p-3">
              {benefit.title.includes("Compra") ? (
                <BookOpenText className="h-6 w-6 text-[var(--color-teal)]" />
              ) : benefit.title.includes("Area") ? (
                <ShieldCheck className="h-6 w-6 text-[var(--color-teal)]" />
              ) : (
                <CheckCircle2 className="h-6 w-6 text-[var(--color-teal)]" />
              )}
            </div>
            <h3 className="font-display text-2xl text-[var(--color-ink)]">{benefit.title}</h3>
            <p className="mt-3 text-sm leading-7 text-[var(--color-muted)]">
              {benefit.description}
            </p>
          </Card>
        ))}
      </section>

      <section className="mx-auto w-full max-w-7xl px-6 py-12 lg:px-8">
        <Card className="grid gap-8 p-8 lg:grid-cols-[0.95fr_1.05fr] lg:p-10">
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--color-muted)]">
              Como funciona
            </p>
            <h2 className="font-display text-4xl text-[var(--color-ink)]">
              Un recorrido honesto desde la compra hasta el campus
            </h2>
            <p className="text-sm leading-7 text-[var(--color-muted)]">
              La plataforma evita maquetas enganiosas y prioriza informacion fiable, acceso
              controlado y una navegacion clara entre cuenta, cursos y foro.
            </p>
          </div>
          <div className="space-y-4">
            {steps.map((step, index) => (
              <div
                className="flex gap-4 rounded-[28px] border border-[color:var(--color-border)] bg-[var(--color-surface-strong)] p-5"
                key={step}
              >
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[var(--color-teal)] text-sm font-semibold text-white">
                  0{index + 1}
                </div>
                <p className="text-sm leading-7 text-[var(--color-ink)]">{step}</p>
              </div>
            ))}
          </div>
        </Card>
      </section>
    </div>
  );
}

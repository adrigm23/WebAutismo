import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CalendarClock, ShieldCheck } from "lucide-react";
import { notFound } from "next/navigation";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/lib/auth";
import { getCatalogCourseBySlug } from "@/lib/course-catalog";
import { canAccessCourseCommunityForCourse } from "@/lib/course-community";
import { formatDate, formatPrice } from "@/lib/utils";

type RenewAccessPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: RenewAccessPageProps): Promise<Metadata> {
  const { slug } = await params;
  const course = await getCatalogCourseBySlug(slug);

  return {
    title: course ? `Renovar acceso | ${course.title}` : "Renovar acceso"
  };
}

export default async function RenewAccessPage({ params }: RenewAccessPageProps) {
  const { slug } = await params;
  const course = await getCatalogCourseBySlug(slug);

  if (!course) {
    notFound();
  }

  const user = await requireUser(`/mis-cursos/${course.slug}/renovar-acceso`);
  const access = await canAccessCourseCommunityForCourse({
    userId: user.id,
    email: user.email,
    course,
    userGlobalRole: user.globalRole,
    userIsActive: user.isActive
  });

  if (access.allowed) {
    redirect(`/mis-cursos/${course.slug}`);
  }

  const edition = course.activeEdition;

  return (
    <div className="site-container py-14 lg:py-20">
      <div className="mx-auto max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-primary)]">
          Acceso al campus
        </p>
        <h1 className="mt-3 text-display-lg font-semibold text-[var(--color-ink)]">
          Renueva el acceso a {course.title}
        </h1>
        <p className="mt-4 text-body-lg text-[var(--color-muted)]">
          Tu matrícula anterior ya no está vigente o aún no tienes acceso a esta edición. Puedes
          inscribirte de nuevo para recuperar el campus, los materiales y el foro del curso.
        </p>

        <Card className="mt-8 space-y-4 p-6">
          <div className="flex items-start gap-3">
            <ShieldCheck aria-hidden className="mt-0.5 h-5 w-5 text-[var(--color-primary)]" />
            <p className="text-sm leading-7 text-[var(--color-ink)]">
              El acceso se valida en servidor según edición y ventana de matrícula. No compartimos
              materiales fuera de tu cuenta.
            </p>
          </div>
          {edition ? (
            <div className="flex items-start gap-3">
              <CalendarClock aria-hidden className="mt-0.5 h-5 w-5 text-[var(--color-primary)]" />
              <p className="text-sm leading-7 text-[var(--color-ink)]">
                Edición actual: <strong>{edition.label}</strong>
                {edition.accessUntil
                  ? ` · acceso hasta ${formatDate(edition.accessUntil)}`
                  : null}
              </p>
            </div>
          ) : null}
          <p className="text-2xl font-semibold tracking-[-0.04em] text-[var(--color-primary)] tabular-nums">
            {formatPrice(course.priceInCents)}
          </p>
        </Card>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <ButtonLink href={`/checkout/${course.slug}`}>Continuar con la inscripción</ButtonLink>
          <ButtonLink href={`/cursos/${course.slug}`} variant="secondary">
            Ver ficha del curso
          </ButtonLink>
        </div>
      </div>
    </div>
  );
}

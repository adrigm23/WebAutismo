import type { Metadata } from "next";
import type { CourseEnrollmentStatus } from "@prisma/client";
import { BarChart3, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/lib/auth";
import { getCatalogCourseBySlug } from "@/lib/course-catalog";
import { canAccessCourseCommunity, getRoleLabel } from "@/lib/course-community";
import { getEnrollmentAccessState } from "@/lib/course-editions";
import { isDatabaseConnectionError } from "@/lib/db-errors";
import { isDemoUserId } from "@/lib/demo-auth";
import { canViewCourseProgress } from "@/lib/course-permissions";
import { getLearnerProgressRowsForCourse } from "@/lib/course-progress";
import { getDb } from "@/lib/prisma";
import { formatDate, formatDateTime } from "@/lib/utils";

type TrackingPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params
}: TrackingPageProps): Promise<Metadata> {
  const { slug } = await params;
  const course = await getCatalogCourseBySlug(slug);

  return {
    title: course ? `Seguimiento | ${course.title}` : "Seguimiento",
    robots: {
      index: false,
      follow: false
    }
  };
}

export default async function CourseTrackingPage({ params }: TrackingPageProps) {
  const { slug } = await params;
  const course = await getCatalogCourseBySlug(slug);

  if (!course) {
    notFound();
  }

  const user = await requireUser(`/mis-cursos/${slug}/seguimiento`);
  const access = await canAccessCourseCommunity({
    userId: user.id,
    email: user.email,
    courseSlug: slug
  });

  if (!access.allowed) {
    redirect(`/checkout/${slug}`);
  }

  if (
    !canViewCourseProgress({
      globalRole: user.globalRole,
      viewerRole: access.role
    })
  ) {
    redirect(`/mis-cursos/${slug}`);
  }

  let progressRows = [] as Awaited<ReturnType<typeof getLearnerProgressRowsForCourse>>;
  let enrollments: Array<{
    userId: string;
    status: CourseEnrollmentStatus;
    accessStartsAt: Date;
    accessUntil: Date | null;
    user: { id: string };
  }> = [];

  try {
    [progressRows, enrollments] = await Promise.all([
      getLearnerProgressRowsForCourse(slug),
      getDb().courseEnrollment.findMany({
        where: {
          course: {
            slug
          }
        },
        include: {
          user: {
            select: {
              id: true
            }
          }
        },
        orderBy: {
          createdAt: "desc"
        }
      })
    ]);
  } catch (error) {
    if (!isDatabaseConnectionError(error)) {
      throw error;
    }

    progressRows = await getLearnerProgressRowsForCourse(slug);
  }

  const latestEnrollmentByUser = new Map<string, (typeof enrollments)[number]>();

  for (const enrollment of enrollments) {
    if (!latestEnrollmentByUser.has(enrollment.userId)) {
      latestEnrollmentByUser.set(enrollment.userId, enrollment);
    }
  }

  return (
    <div className="pb-20 pt-14 lg:pt-16">
      <div className="site-container space-y-8">
        <Link
          className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-primary)]"
          href={`/mis-cursos/${slug}`}
        >
          <ChevronLeft className="h-4 w-4" />
          Volver al curso
        </Link>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-primary)]">
              Seguimiento academico
            </p>
            <h1 className="mt-3 text-[3.6rem] font-semibold tracking-[-0.08em] text-[var(--color-ink)]">
              {course.title}
            </h1>
            <p className="mt-3 max-w-3xl text-[1.06rem] leading-8 text-[var(--color-ink)]/84">
              Vista para {getRoleLabel(access.role)}. Solo muestra alumnado con matriculas
              registradas en este curso y su progreso manual por modulo.
            </p>
          </div>
          <div className="rounded-2xl border border-[var(--color-border)] bg-white px-5 py-4 text-sm text-[var(--color-muted)]">
            {progressRows.length} alumnos con historico
          </div>
        </div>

        <div className="space-y-4">
          {progressRows.map((row) => {
            const enrollment = latestEnrollmentByUser.get(row.userId);
            const accessState = enrollment
              ? getEnrollmentAccessState({
                  status: enrollment.status,
                  accessStartsAt: enrollment.accessStartsAt,
                  accessUntil: enrollment.accessUntil
                })
              : isDemoUserId(user.id)
                ? "active"
                : "inactive";

            return (
              <Card className="p-6" key={row.userId}>
                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-[1.2rem] font-semibold text-[var(--color-ink)]">
                      {row.learnerName}
                    </p>
                    <p className="mt-1 text-sm text-[var(--color-muted)]">{row.learnerEmail}</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-6 text-sm text-[var(--color-muted)]">
                    <span>
                      Estado de acceso: <strong className="text-[var(--color-ink)]">{accessState}</strong>
                    </span>
                    <span>
                      Ultima actividad:{" "}
                      <strong className="text-[var(--color-ink)]">
                        {row.lastCompletedAt ? formatDateTime(row.lastCompletedAt) : "Sin actividad"}
                      </strong>
                    </span>
                    {enrollment?.accessUntil ? (
                      <span>
                        Acceso hasta{" "}
                        <strong className="text-[var(--color-ink)]">
                          {formatDate(enrollment.accessUntil)}
                        </strong>
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-[220px_1fr_240px]">
                  <div className="rounded-2xl bg-[var(--color-surface)] px-5 py-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-muted)]">
                      Progreso
                    </p>
                    <p className="mt-2 text-[2rem] font-semibold text-[var(--color-ink)]">
                      {row.completionRate}%
                    </p>
                  </div>

                  <div className="rounded-2xl bg-[var(--color-surface)] px-5 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-muted)]">
                        Modulos completados
                      </p>
                      <BarChart3 className="h-4 w-4 text-[var(--color-primary)]" />
                    </div>
                    <div className="mt-4 h-3 overflow-hidden rounded-full bg-white">
                      <div
                        aria-hidden="true"
                        className="h-full rounded-full bg-[var(--color-primary)]"
                        style={{ width: `${row.completionRate}%` }}
                      />
                    </div>
                    <p className="mt-3 text-sm text-[var(--color-ink)]">
                      {row.completedModules} de {row.totalModules} modulos
                    </p>
                  </div>

                  <div className="rounded-2xl bg-[var(--color-surface)] px-5 py-4 text-sm leading-7 text-[var(--color-muted)]">
                    El progreso se basa en marcas manuales del alumno. No se infiere visionado ni
                    tiempo de reproduccion.
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {!progressRows.length ? (
          <Card className="p-8 text-[1.02rem] leading-8 text-[var(--color-muted)]">
            Todavia no hay matriculas registradas o no existe progreso manual guardado para
            este curso.
          </Card>
        ) : null}
      </div>
    </div>
  );
}

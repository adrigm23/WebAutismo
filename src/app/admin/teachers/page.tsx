import type { UserGlobalRole } from "@prisma/client";
import { BookCopy, GraduationCap, Search, UsersRound } from "lucide-react";
import { AdminMetricCard } from "@/components/admin/admin-metric-card";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { CreateTeacherCard } from "@/components/admin/teachers/create-teacher-card";
import { DemoTeacherDetailCard } from "@/components/admin/teachers/demo-teacher-detail-card";
import { TeacherCard } from "@/components/admin/teachers/teacher-card";
import { TeacherDetailCard } from "@/components/admin/teachers/teacher-detail-card";
import type {
  TeacherCourseOption,
  TeacherSummary
} from "@/components/admin/teachers/types";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { getSearchParamValue } from "@/lib/admin-console";
import { requireAdminConsoleUser } from "@/lib/admin-console-server";
import { demoAdminTeachers } from "@/lib/admin-demo";
import { isDemoUserId } from "@/lib/demo-auth";
import { getDb } from "@/lib/prisma";
import { cn, formatCompactNumber } from "@/lib/utils";

type TeachersPageProps = {
  searchParams: Promise<{
    q?: string | string[];
    view?: string | string[];
    teacherId?: string | string[];
  }>;
};

export default async function AdminTeachersPage({ searchParams }: TeachersPageProps) {
  const currentUser = await requireAdminConsoleUser("/admin/teachers");
  const params = await searchParams;
  const q = getSearchParamValue(params.q);
  const view = getSearchParamValue(params.view, "all");
  const teacherId = getSearchParamValue(params.teacherId);

  if (isDemoUserId(currentUser.id)) {
    const demoTeachers = demoAdminTeachers
      .filter((teacher) => {
        const matchesQ =
          !q ||
          teacher.name.toLowerCase().includes(q.toLowerCase()) ||
          teacher.email.toLowerCase().includes(q.toLowerCase()) ||
          teacher.courseAssignments.some((course) =>
            course.title.toLowerCase().includes(q.toLowerCase())
          );

        if (view === "high") {
          return matchesQ && teacher.activeStudents >= 75;
        }

        if (view === "pending") {
          return matchesQ && teacher.courseAssignments.length < 1;
        }

        return matchesQ;
      })
      .map((teacher) => ({
        ...teacher,
        globalRole: "TEACHER" as UserGlobalRole,
        editionAssignments: teacher.courseAssignments.flatMap((assignment) =>
          assignment.editions.map((edition, index) => ({
            courseEditionId: `${assignment.id}-${index}`,
            courseEdition: {
              id: `${assignment.id}-${index}`,
              label: edition,
              courseId: assignment.id,
              course: {
                title: assignment.title,
                slug: assignment.slug
              }
            }
          }))
        ),
        courseAssignments: teacher.courseAssignments.map((assignment) => ({
          courseId: assignment.id,
          course: {
            id: assignment.id,
            title: assignment.title,
            slug: assignment.slug,
            editions: assignment.editions.map((edition, index) => ({
              id: `${assignment.id}-${index}`,
              label: edition
            }))
          }
        }))
      }));

    const selectedDemoTeacher =
      demoTeachers.find((teacher) => teacher.id === teacherId) ?? demoTeachers[0] ?? null;
    const totalStudents = demoAdminTeachers.reduce((sum, teacher) => sum + teacher.activeStudents, 0);
    const totalEditions = demoAdminTeachers.reduce((sum, teacher) => sum + teacher.activeEditions, 0);

    const buildDemoQuery = (input?: { nextView?: string; nextTeacherId?: string }) => {
      const qs = new URLSearchParams();
      const nextView = input?.nextView ?? view;
      const nextTeacherId = input?.nextTeacherId ?? teacherId;

      if (q) {
        qs.set("q", q);
      }

      if (nextView && nextView !== "all") {
        qs.set("view", nextView);
      }

      if (nextTeacherId) {
        qs.set("teacherId", nextTeacherId);
      }

      return `/admin/teachers${qs.size > 0 ? `?${qs.toString()}` : ""}`;
    };

    return (
      <div className="space-y-8">
        <AdminPageHeader
          actions={<ButtonLink href="/admin/users" variant="secondary">Ver usuarios demo</ButtonLink>}
          description="Vista demo del portal docente. La asignacion de cursos y la carga academica se muestran con datos simulados."
          title="Portal docente"
        />

        <section className="grid gap-5 xl:grid-cols-3">
          <AdminMetricCard accent="primary" icon={<GraduationCap className="h-6 w-6" strokeWidth={1.8} />} label="Docentes activos" meta="3 cuentas de ejemplo" value={demoAdminTeachers.length} />
          <AdminMetricCard accent="neutral" icon={<UsersRound className="h-6 w-6" strokeWidth={1.8} />} label="Alumnado supervisado" meta="Carga agregada simulada" value={formatCompactNumber(totalStudents)} />
          <AdminMetricCard accent="warning" icon={<BookCopy className="h-6 w-6" strokeWidth={1.8} />} label="Ediciones en curso" meta="Seguimiento operativo demo" value={totalEditions} />
        </section>

        <Card className="rounded-[2rem] p-5">
          <div className="flex flex-wrap gap-2">
            {[
              { id: "all", label: "Todo activo", count: demoAdminTeachers.length },
              { id: "high", label: "Carga alta", count: demoAdminTeachers.filter((teacher) => teacher.activeStudents >= 75).length },
              { id: "pending", label: "Sin asignar", count: demoAdminTeachers.filter((teacher) => teacher.courseAssignments.length < 1).length }
            ].map(({ id, label, count }) => (
              <ButtonLink
                className={cn("rounded-full px-4 py-2 text-sm shadow-none", view === id && "bg-[var(--color-primary-soft)]")}
                href={buildDemoQuery({ nextView: id })}
                key={id}
                variant={view === id ? "secondary" : "ghost"}
              >
                {label}
                <span className="ml-2 text-xs opacity-70">{count}</span>
              </ButtonLink>
            ))}
          </div>
        </Card>

        <section className="grid gap-6 2xl:grid-cols-[minmax(0,1.55fr)_420px]">
          <div className="grid gap-5 xl:grid-cols-2">
            {demoTeachers.map((teacher) => (
              <TeacherCard
                isSelected={selectedDemoTeacher?.id === teacher.id}
                key={teacher.id}
                teacher={teacher}
                teacherHref={buildDemoQuery({ nextTeacherId: teacher.id })}
              />
            ))}
          </div>

          {selectedDemoTeacher ? <DemoTeacherDetailCard selectedTeacher={selectedDemoTeacher} /> : null}
        </section>
      </div>
    );
  }

  const db = getDb();

  const [teachers, allCourses, activeEnrollmentCounts] = await Promise.all([
    db.user.findMany({
      where: {
        globalRole: {
          in: ["TEACHER", "ADMIN"] as UserGlobalRole[]
        },
        ...(q
          ? {
              OR: [
                { name: { contains: q } },
                { email: { contains: q } },
                {
                  courseAssignments: {
                    some: {
                      course: {
                        title: {
                          contains: q
                        }
                      }
                    }
                  }
                }
              ]
            }
          : {})
      },
      include: {
        editionAssignments: {
          include: {
            courseEdition: {
              include: {
                course: {
                  select: {
                    title: true,
                    slug: true
                  }
                }
              }
            }
          }
        },
        courseAssignments: {
          include: {
            course: {
              include: {
                editions: {
                  where: {
                    isActive: true,
                    status: {
                      in: ["ACTIVE", "SCHEDULED"]
                    }
                  },
                  orderBy: {
                    startsAt: "asc"
                  },
                  select: {
                    id: true,
                    label: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        name: "asc"
      }
    }),
    db.course.findMany({
      where: {
        status: "ACTIVE"
      },
      select: {
        id: true,
        title: true,
        slug: true,
        editions: {
          where: {
            isActive: true,
            status: {
              in: ["ACTIVE", "SCHEDULED"]
            }
          },
          select: {
            id: true,
            label: true,
            status: true
          },
          orderBy: {
            startsAt: "asc"
          }
        }
      },
      orderBy: {
        title: "asc"
      }
    }),
    db.courseEnrollment.groupBy({
      by: ["courseId"],
      where: {
        status: "ACTIVE"
      },
      _count: {
        courseId: true
      }
    })
  ]);

  const enrollmentCountByCourseId = new Map(
    activeEnrollmentCounts.map((entry) => [entry.courseId, entry._count.courseId])
  );

  const teacherSummaries: TeacherSummary[] = teachers.map((teacher) => {
    const supervisedCourseIds = new Set([
      ...teacher.courseAssignments.map((assignment) => assignment.course.id),
      ...teacher.editionAssignments.map((assignment) => assignment.courseEdition.courseId)
    ]);
    const activeStudents = Array.from(supervisedCourseIds).reduce(
      (sum, supervisedCourseId) => sum + (enrollmentCountByCourseId.get(supervisedCourseId) ?? 0),
      0
    );
    const activeEditions = new Set([
      ...teacher.courseAssignments.flatMap((assignment) =>
        assignment.course.editions.map((edition) => edition.id)
      ),
      ...teacher.editionAssignments.map((assignment) => assignment.courseEditionId)
    ]).size;

    return {
      ...teacher,
      activeStudents,
      activeEditions
    };
  });

  const visibleTeachers = teacherSummaries.filter((teacher) => {
    if (view === "high") {
      return teacher.activeStudents >= 75;
    }

    if (view === "pending") {
      return teacher.courseAssignments.length === 0 && teacher.editionAssignments.length === 0;
    }

    return true;
  });

  const selectedTeacher =
    visibleTeachers.find((teacher) => teacher.id === teacherId) ?? visibleTeachers[0] ?? null;
  const totalStudents = teacherSummaries.reduce((sum, teacher) => sum + teacher.activeStudents, 0);
  const totalActiveEditions = teacherSummaries.reduce(
    (sum, teacher) => sum + teacher.activeEditions,
    0
  );

  const buildTeachersQuery = (input?: {
    nextView?: string;
    nextTeacherId?: string;
    nextSearch?: string;
  }) => {
    const qs = new URLSearchParams();
    const nextSearch = input?.nextSearch ?? q;
    const nextView = input?.nextView ?? view;
    const nextTeacherId = input?.nextTeacherId ?? teacherId;

    if (nextSearch) {
      qs.set("q", nextSearch);
    }

    if (nextView && nextView !== "all") {
      qs.set("view", nextView);
    }

    if (nextTeacherId) {
      qs.set("teacherId", nextTeacherId);
    }

    return `/admin/teachers${qs.size > 0 ? `?${qs.toString()}` : ""}`;
  };

  const courseOptions: TeacherCourseOption[] = allCourses;

  return (
    <div className="space-y-8">
      <AdminPageHeader
        actions={<ButtonLink href="#create-teacher">Crear docente</ButtonLink>}
        description="Gestion del equipo docente, carga academica y cursos asignados en el campus."
        title="Portal docente"
      />

      <section className="grid gap-5 xl:grid-cols-3">
        <AdminMetricCard
          accent="primary"
          icon={<GraduationCap className="h-6 w-6" strokeWidth={1.8} />}
          label="Docentes activos"
          meta={`${teacherSummaries.filter((teacher) => teacher.globalRole === "ADMIN").length} con permisos de administracion`}
          value={teacherSummaries.length}
        />
        <AdminMetricCard
          accent="neutral"
          icon={<UsersRound className="h-6 w-6" strokeWidth={1.8} />}
          label="Alumnado supervisado"
          meta="Matriculas activas en cursos asignados"
          value={formatCompactNumber(totalStudents)}
        />
        <AdminMetricCard
          accent="warning"
          icon={<BookCopy className="h-6 w-6" strokeWidth={1.8} />}
          label="Ediciones en curso"
          meta={`${teacherSummaries.filter((teacher) => teacher.activeStudents >= 75).length} docentes con carga alta`}
          value={totalActiveEditions}
        />
      </section>

      <Card className="rounded-[2rem] p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap gap-2">
            {[
              {
                id: "all",
                label: "Todo activo",
                count: teacherSummaries.length
              },
              {
                id: "high",
                label: "Carga alta",
                count: teacherSummaries.filter((teacher) => teacher.activeStudents >= 75).length
              },
              {
                id: "pending",
                label: "Sin asignar",
                count: teacherSummaries.filter(
                  (teacher) =>
                    teacher.courseAssignments.length === 0 &&
                    teacher.editionAssignments.length === 0
                ).length
              }
            ].map(({ id, label, count }) => (
              <ButtonLink
                className={cn(
                  "rounded-full px-4 py-2 text-sm shadow-none",
                  view === id && "bg-[var(--color-primary-soft)]"
                )}
                href={buildTeachersQuery({ nextView: id })}
                key={id}
                variant={view === id ? "secondary" : "ghost"}
              >
                {label}
                <span className="ml-2 text-xs opacity-70">{count}</span>
              </ButtonLink>
            ))}
          </div>

          <form action="/admin/teachers" className="flex w-full max-w-[32rem] gap-3">
            {view !== "all" ? <input name="view" type="hidden" value={view} /> : null}
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#607185]" strokeWidth={1.8} />
              <Input
                className="pl-10"
                defaultValue={q}
                name="q"
                placeholder="Filtrar por docente, email o curso..."
              />
            </div>
            <SubmitButton pendingLabel="Buscando..." variant="secondary">
              Buscar
            </SubmitButton>
          </form>
        </div>
      </Card>

      <section className="grid gap-6 2xl:grid-cols-[minmax(0,1.55fr)_420px]">
        <div className="grid gap-5 xl:grid-cols-2">
          {visibleTeachers.length > 0 ? (
            visibleTeachers.map((teacher) => (
              <TeacherCard
                isSelected={selectedTeacher?.id === teacher.id}
                key={teacher.id}
                teacher={teacher}
                teacherHref={buildTeachersQuery({ nextTeacherId: teacher.id })}
              />
            ))
          ) : (
            <Card className="rounded-[2rem] p-8 xl:col-span-2">
              <p className="text-[1.35rem] font-semibold text-[var(--color-ink)]">
                No hay docentes que coincidan con los filtros.
              </p>
              <p className="mt-2 text-sm leading-7 text-[#5d7084]">
                Ajusta la busqueda o cambia la vista para recuperar el directorio completo.
              </p>
            </Card>
          )}
        </div>

        <div className="space-y-6 2xl:sticky 2xl:top-6 2xl:self-start">
          {selectedTeacher ? (
            <TeacherDetailCard allCourses={courseOptions} selectedTeacher={selectedTeacher} />
          ) : null}

          <CreateTeacherCard />
        </div>
      </section>
    </div>
  );
}

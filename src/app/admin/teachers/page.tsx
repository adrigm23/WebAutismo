import type { UserGlobalRole } from "@prisma/client";
import Link from "next/link";
import { AlertTriangle, BookCopy, GraduationCap, Search, UserPlus, UsersRound } from "lucide-react";
import {
  createTeacherAction,
  syncTeacherCourseAssignmentsAction
} from "@/actions/admin";
import { AdminMetricCard } from "@/components/admin/admin-metric-card";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import {
  getRoleFilterLabel,
  getRoleTone,
  getSearchParamValue,
  getUserInitials
} from "@/lib/admin-console";
import { requireAdminConsoleUser } from "@/lib/admin-console-server";
import { getDb } from "@/lib/prisma";
import { cn, formatCompactNumber, formatDate } from "@/lib/utils";

type TeachersPageProps = {
  searchParams: Promise<{
    q?: string | string[];
    view?: string | string[];
    teacherId?: string | string[];
  }>;
};

type TeacherSummary = {
  id: string;
  name: string;
  email: string;
  globalRole: UserGlobalRole;
  createdAt: Date;
  updatedAt: Date;
  courseAssignments: Array<{
    courseId: string;
    course: {
      id: string;
      title: string;
      slug: string;
      editions: Array<{
        id: string;
        label: string;
      }>;
    };
  }>;
  activeStudents: number;
  activeEditions: number;
};

export default async function AdminTeachersPage({ searchParams }: TeachersPageProps) {
  await requireAdminConsoleUser("/admin/teachers");
  const params = await searchParams;
  const q = getSearchParamValue(params.q);
  const view = getSearchParamValue(params.view, "all");
  const teacherId = getSearchParamValue(params.teacherId);
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
        slug: true
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
    const activeStudents = teacher.courseAssignments.reduce(
      (sum, assignment) => sum + (enrollmentCountByCourseId.get(assignment.course.id) ?? 0),
      0
    );
    const activeEditions = teacher.courseAssignments.reduce(
      (sum, assignment) => sum + assignment.course.editions.length,
      0
    );

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
      return teacher.courseAssignments.length === 0;
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
                count: teacherSummaries.filter((teacher) => teacher.courseAssignments.length === 0).length
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
            <Card className="overflow-hidden rounded-[2rem]">
              <div className="border-b border-[#dde4ec] px-7 py-7">
                <div className="flex items-start gap-4">
                  <div className="grid h-14 w-14 place-items-center rounded-full bg-[rgba(12,113,195,0.12)] text-base font-semibold text-[var(--color-primary)]">
                    {getUserInitials(selectedTeacher.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-[2rem] font-semibold leading-none tracking-[-0.06em] text-[var(--color-ink)]">
                      {selectedTeacher.name}
                    </h2>
                    <p className="mt-2 truncate text-sm text-[#5b6d80]">{selectedTeacher.email}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <AdminStatusBadge tone={getRoleTone(selectedTeacher.globalRole)}>
                        {getRoleFilterLabel(selectedTeacher.globalRole)}
                      </AdminStatusBadge>
                      <AdminStatusBadge
                        tone={selectedTeacher.activeStudents >= 75 ? "danger" : "primary"}
                      >
                        {selectedTeacher.activeStudents >= 75 ? "Carga alta" : "Carga estable"}
                      </AdminStatusBadge>
                    </div>
                  </div>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-[1.4rem] bg-[#f6fafc] px-4 py-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#5a6c80]">
                      Alta
                    </p>
                    <p className="mt-2 text-base font-semibold text-[var(--color-ink)]">
                      {formatDate(selectedTeacher.createdAt)}
                    </p>
                  </div>
                  <div className="rounded-[1.4rem] bg-[#f6fafc] px-4 py-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#5a6c80]">
                      Cursos
                    </p>
                    <p className="mt-2 text-base font-semibold text-[var(--color-ink)]">
                      {selectedTeacher.courseAssignments.length} asignados
                    </p>
                  </div>
                  <div className="rounded-[1.4rem] bg-[#f6fafc] px-4 py-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#5a6c80]">
                      Revision
                    </p>
                    <p className="mt-2 text-base font-semibold text-[var(--color-ink)]">
                      {formatDate(selectedTeacher.updatedAt)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="px-7 py-7">
                <div
                  className={cn(
                    "rounded-[1.5rem] border px-5 py-4 text-sm leading-7",
                    selectedTeacher.activeStudents >= 75
                      ? "border-[#f3b3ac] bg-[#fff2f0] text-[#a03329]"
                      : "border-[#dbe6ef] bg-[#f7fafc] text-[#44586d]"
                  )}
                >
                  <div className="flex items-center gap-3 font-semibold">
                    <AlertTriangle className="h-4 w-4" strokeWidth={1.8} />
                    {selectedTeacher.activeStudents >= 75
                      ? "Alerta de carga alta"
                      : "Seguimiento operativo estable"}
                  </div>
                  <p className="mt-2">
                    {selectedTeacher.activeStudents >= 75
                      ? "La carga actual supera el umbral recomendado. Conviene revisar apoyo docente, ediciones abiertas y reparto de cursos."
                      : "La distribucion de alumnado y cursos permanece dentro del rango previsto para esta cuenta docente."}
                  </p>
                </div>

                <form action={syncTeacherCourseAssignmentsAction} className="mt-6 space-y-5">
                  <input name="teacherUserId" type="hidden" value={selectedTeacher.id} />

                  <div>
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#314255]">
                          Asignacion de cursos
                        </p>
                        <p className="mt-2 text-sm leading-6 text-[#5c6f83]">
                          Marca los cursos que deben quedar bajo supervision de este docente.
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 space-y-3">
                      {allCourses.map((course) => {
                        const checked = selectedTeacher.courseAssignments.some(
                          (assignment) => assignment.courseId === course.id
                        );

                        return (
                          <label
                            className="flex items-start gap-3 rounded-[1.2rem] border border-[#d9e1e8] bg-[#fbfcfd] px-4 py-4 text-sm text-[#33475b]"
                            key={course.id}
                          >
                            <input
                              defaultChecked={checked}
                              name="courseIds"
                              type="checkbox"
                              value={course.id}
                            />
                            <span className="min-w-0 flex-1">
                              <span className="block font-medium text-[var(--color-ink)]">
                                {course.title}
                              </span>
                              <span className="mt-1 block text-xs uppercase tracking-[0.14em] text-[#6a7b8d]">
                                /cursos/{course.slug}
                              </span>
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#314255]">
                      Ediciones activas
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {selectedTeacher.courseAssignments.flatMap((assignment) =>
                        assignment.course.editions.map((edition) => (
                          <AdminStatusBadge key={edition.id} tone="neutral">
                            {assignment.course.title} - {edition.label}
                          </AdminStatusBadge>
                        ))
                      )}
                      {selectedTeacher.courseAssignments.length === 0 ? (
                        <p className="text-sm text-[#647589]">Sin cursos ni ediciones asignadas.</p>
                      ) : null}
                    </div>
                  </div>

                  <SubmitButton className="w-full" pendingLabel="Guardando asignaciones...">
                    Guardar asignaciones
                  </SubmitButton>
                </form>
              </div>
            </Card>
          ) : null}

          <Card className="rounded-[2rem] p-7" id="create-teacher">
            <div className="flex items-start gap-4">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[rgba(12,113,195,0.12)] text-[var(--color-primary)]">
                <UserPlus className="h-5 w-5" strokeWidth={1.8} />
              </div>
              <div>
                <h2 className="text-[1.8rem] font-semibold tracking-[-0.05em] text-[var(--color-ink)]">
                  Alta de docente
                </h2>
                <p className="mt-2 text-sm leading-7 text-[#52667b]">
                  Crea una cuenta activa con acceso inmediato al campus y al seguimiento academico.
                </p>
              </div>
            </div>

            <form action={createTeacherAction} className="mt-6 space-y-4">
              <input name="returnTo" type="hidden" value="/admin/teachers" />
              <Input name="name" placeholder="Nombre y apellidos" required />
              <Input name="email" placeholder="correo@dominio.com" required type="email" />
              <Input
                minLength={8}
                name="password"
                placeholder="Contrasena temporal"
                required
                type="password"
              />
              <div className="rounded-[1.4rem] border border-[#d8e0e8] bg-[#f7fafc] px-4 py-4 text-sm leading-7 text-[#4c6074]">
                La cuenta se crea como docente, activa y con preferencias basicas de notificacion.
              </div>
              <SubmitButton className="w-full" pendingLabel="Creando docente...">
                Crear docente
              </SubmitButton>
            </form>
          </Card>
        </div>
      </section>
    </div>
  );
}

function TeacherCard({
  teacher,
  teacherHref,
  isSelected
}: {
  teacher: TeacherSummary;
  teacherHref: string;
  isSelected: boolean;
}) {
  return (
    <Link
      className={cn(
        "block rounded-[2rem] border border-[#d4dde6] bg-white p-6 text-left shadow-[0_16px_36px_rgba(15,44,76,0.05)] transition hover:border-[var(--color-primary)] hover:shadow-[0_22px_42px_rgba(15,44,76,0.08)]",
        isSelected && "border-[var(--color-primary)] ring-2 ring-[rgba(12,113,195,0.08)]"
      )}
      href={teacherHref}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="grid h-12 w-12 place-items-center rounded-full bg-[#eef2f6] text-base font-semibold text-[#2d3d4c]">
            {getUserInitials(teacher.name)}
          </div>
          <div className="min-w-0">
            <p className="truncate text-[1.3rem] font-semibold leading-none text-[var(--color-ink)]">
              {teacher.name}
            </p>
            <p className="mt-2 truncate text-sm text-[#5b6d80]">{teacher.email}</p>
          </div>
        </div>

        {teacher.activeStudents >= 75 ? (
          <span className="mt-1 h-3 w-3 rounded-full bg-[#cf3328]" />
        ) : null}
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <AdminStatusBadge tone={getRoleTone(teacher.globalRole)}>
          {getRoleFilterLabel(teacher.globalRole)}
        </AdminStatusBadge>
        <AdminStatusBadge tone={teacher.activeStudents >= 75 ? "danger" : "neutral"}>
          {teacher.activeStudents} alumnos
        </AdminStatusBadge>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-3 border-t border-[#e3e9f0] pt-5">
        <TeacherStat label="Alumnos" value={teacher.activeStudents} />
        <TeacherStat label="Ediciones" value={teacher.activeEditions} />
        <TeacherStat label="Cursos" value={teacher.courseAssignments.length} />
      </div>
    </Link>
  );
}

function TeacherStat({
  label,
  value
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div>
      <p className="text-[1.45rem] font-semibold tracking-[-0.04em] text-[var(--color-ink)]">
        {value}
      </p>
      <p className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#627487]">
        {label}
      </p>
    </div>
  );
}

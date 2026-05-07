import type { UserGlobalRole } from "@prisma/client";
import Link from "next/link";
import { GraduationCap, UsersRound } from "lucide-react";
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
import { cn, formatCompactNumber } from "@/lib/utils";

type TeachersPageProps = {
  searchParams: Promise<{
    q?: string | string[];
    view?: string | string[];
    teacherId?: string | string[];
  }>;
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

  const teacherCards = teachers
    .map((teacher) => {
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
    })
    .filter((teacher) => {
      if (view === "high") {
        return teacher.activeStudents >= 75;
      }

      if (view === "pending") {
        return teacher.courseAssignments.length === 0;
      }

      return true;
    });

  const selectedTeacher =
    teacherCards.find((teacher) => teacher.id === teacherId) ?? teacherCards[0] ?? null;

  const viewQuery = (nextView: string) => {
    const qs = new URLSearchParams();

    if (q) {
      qs.set("q", q);
    }

    qs.set("view", nextView);
    return `/admin/teachers?${qs.toString()}`;
  };

  return (
    <div className="space-y-9">
      <AdminPageHeader
        actions={
          <ButtonLink href="#create-teacher">Crear docente</ButtonLink>
        }
        description="Gestion de profesorado, asignaciones por curso y carga academica sobre cursos activos."
        title="Portal docente"
      />

      <section className="grid gap-5 xl:grid-cols-[1.3fr_1fr_1fr]">
        <AdminMetricCard
          accent="primary"
          icon={<GraduationCap className="h-6 w-6" strokeWidth={1.8} />}
          label="Docentes y admins docentes"
          meta={`${teacherCards.filter((teacher) => teacher.globalRole === "ADMIN").length} administradores con acceso docente`}
          value={teacherCards.length}
        />
        <AdminMetricCard
          accent="neutral"
          icon={<UsersRound className="h-6 w-6" strokeWidth={1.8} />}
          label="Alumnado bajo supervision"
          meta="Suma de matriculas activas en cursos asignados"
          value={formatCompactNumber(
            teacherCards.reduce((sum, teacher) => sum + teacher.activeStudents, 0)
          )}
        />
        <Card className="rounded-[1.9rem] p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#314255]">
            Vista
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {[
              ["all", "Todo activo"],
              ["high", "Carga alta"],
              ["pending", "Sin asignar"]
            ].map(([id, label]) => (
              <ButtonLink
                className={cn(
                  "rounded-full px-4 py-2 text-sm shadow-none",
                  view === id && "bg-[var(--color-primary-soft)]"
                )}
                href={viewQuery(id)}
                key={id}
                variant={view === id ? "secondary" : "ghost"}
              >
                {label}
              </ButtonLink>
            ))}
          </div>
        </Card>
      </section>

      <section className="grid gap-6 2xl:grid-cols-[1.55fr_0.88fr]">
        <div className="space-y-5">
          {teacherCards.map((teacher) => (
            <LinkTeacherCard
              isSelected={selectedTeacher?.id === teacher.id}
              key={teacher.id}
              q={q}
              teacher={teacher}
              view={view}
            />
          ))}
        </div>

        <div className="space-y-6">
          {selectedTeacher ? (
            <Card className="rounded-[2rem] p-7">
              <div className="flex items-center gap-4">
                <div className="grid h-14 w-14 place-items-center rounded-full bg-[rgba(12,113,195,0.12)] text-base font-semibold text-[var(--color-primary)]">
                  {getUserInitials(selectedTeacher.name)}
                </div>
                <div>
                  <h2 className="text-[1.9rem] font-semibold tracking-[-0.05em] text-[var(--color-ink)]">
                    {selectedTeacher.name}
                  </h2>
                  <p className="text-sm text-[#55687c]">{selectedTeacher.email}</p>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <AdminStatusBadge tone={getRoleTone(selectedTeacher.globalRole)}>
                  {getRoleFilterLabel(selectedTeacher.globalRole)}
                </AdminStatusBadge>
                <AdminStatusBadge
                  tone={selectedTeacher.activeStudents >= 75 ? "warning" : "primary"}
                >
                  {selectedTeacher.activeStudents} alumnos activos
                </AdminStatusBadge>
              </div>

              <div className="mt-6 rounded-[1.4rem] border border-[#f0d098] bg-[#fff1cf] px-4 py-4 text-sm leading-7 text-[#7a5b18]">
                {selectedTeacher.activeStudents >= 75
                  ? "La carga esta cerca del umbral de revision operativa. Conviene revisar apoyo docente y ediciones activas."
                  : "Carga docente en rango operativo normal segun matriculas activas."}
              </div>

              <form action={syncTeacherCourseAssignmentsAction} className="mt-6 space-y-5">
                <input name="teacherUserId" type="hidden" value={selectedTeacher.id} />
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#314255]">
                    Asignar cursos
                  </p>
                  <div className="mt-3 space-y-3 rounded-[1.4rem] border border-[#d9e1e8] bg-[#fbfcfd] p-4">
                    {allCourses.map((course) => {
                      const checked = selectedTeacher.courseAssignments.some(
                        (assignment) => assignment.courseId === course.id
                      );

                      return (
                        <label className="flex items-start gap-3 text-sm text-[#33475b]" key={course.id}>
                          <input
                            defaultChecked={checked}
                            name="courseIds"
                            type="checkbox"
                            value={course.id}
                          />
                          <span>{course.title}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#314255]">
                    Ediciones activas
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {selectedTeacher.courseAssignments.flatMap((assignment) =>
                      assignment.course.editions.map((edition) => (
                        <AdminStatusBadge key={edition.id} tone="neutral">
                          {assignment.course.title} · {edition.label}
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
            </Card>
          ) : null}

          <Card className="rounded-[2rem] p-7" id="create-teacher">
            <h2 className="text-[1.8rem] font-semibold tracking-[-0.05em] text-[var(--color-ink)]">
              Alta de docente
            </h2>
            <p className="mt-2 text-sm leading-7 text-[#52667b]">
              Crea una cuenta docente lista para entrar al campus y al seguimiento academico.
            </p>
            <form action={createTeacherAction} className="mt-5 space-y-4">
              <Input name="name" placeholder="Nombre y apellidos" required />
              <Input name="email" placeholder="correo@dominio.com" required type="email" />
              <Input name="password" placeholder="Contrasena temporal" required type="password" />
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

function LinkTeacherCard({
  teacher,
  q,
  view,
  isSelected
}: {
  teacher: {
    id: string;
    name: string;
    email: string;
    globalRole: UserGlobalRole;
    courseAssignments: Array<{
      courseId: string;
      course: {
        id: string;
        title: string;
      };
    }>;
    activeStudents: number;
    activeEditions: number;
  };
  q: string;
  view: string;
  isSelected: boolean;
}) {
  const qs = new URLSearchParams();

  if (q) {
    qs.set("q", q);
  }

  if (view && view !== "all") {
    qs.set("view", view);
  }

  qs.set("teacherId", teacher.id);

  return (
    <Link
      className={cn(
        "block rounded-[2rem] border border-[#d4dde6] bg-white p-7 text-left shadow-[0_16px_36px_rgba(15,44,76,0.05)]",
        isSelected && "border-[var(--color-primary)] ring-2 ring-[rgba(12,113,195,0.08)]"
      )}
      href={`/admin/teachers?${qs.toString()}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div className="flex items-center gap-4">
          <div className="grid h-14 w-14 place-items-center rounded-full bg-[rgba(12,113,195,0.12)] text-base font-semibold text-[var(--color-primary)]">
            {getUserInitials(teacher.name)}
          </div>
          <div>
            <p className="text-[1.2rem] font-semibold text-[var(--color-ink)]">{teacher.name}</p>
            <p className="text-sm text-[#586a7d]">{teacher.email}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {teacher.courseAssignments.map((assignment) => (
                <AdminStatusBadge key={assignment.course.id} tone="neutral">
                  {assignment.course.title}
                </AdminStatusBadge>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-2 text-right">
          <p className="text-[3rem] font-semibold leading-none tracking-[-0.07em] text-[var(--color-primary)]">
            {teacher.activeStudents}
          </p>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#384b60]">
            alumnos
          </p>
          <p className="text-base text-[#536579]">{teacher.activeEditions} ediciones activas</p>
        </div>
      </div>
    </Link>
  );
}

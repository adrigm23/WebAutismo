import Link from "next/link";
import { AlertTriangle, UsersRound } from "lucide-react";
import { updateEnrollmentAccessAction } from "@/actions/admin";
import { AdminMetricCard } from "@/components/admin/admin-metric-card";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import {
  getAccessStateLabel,
  getAccessStateTone,
  getEnrollmentStatusLabel,
  getSearchParamValue,
  getUserInitials
} from "@/lib/admin-console";
import { requireAdminConsoleUser } from "@/lib/admin-console-server";
import { demoAdminSupervisionRows } from "@/lib/admin-demo";
import { isDemoUserId } from "@/lib/demo-auth";
import { getEnrollmentAccessState } from "@/lib/course-editions";
import { getDb } from "@/lib/prisma";
import { formatDate, formatDateTime } from "@/lib/utils";

type SupervisionPageProps = {
  searchParams: Promise<{
    q?: string | string[];
    courseId?: string | string[];
    teacherId?: string | string[];
    accessState?: string | string[];
    enrollmentId?: string | string[];
  }>;
};

type ProgressSummary = {
  completedModules: number;
  totalModules: number;
  completionRate: number;
  lastCompletedAt: Date | null;
};

function summarizeProgress(input: {
  totalModules: number;
  records: Array<{
    moduleId: string;
    moduleIndex: number | null;
    completedAt: Date;
  }>;
}) {
  const completedKeys = new Map<string, Date>();

  for (const record of input.records) {
    const key = record.moduleId || `legacy-${record.moduleIndex ?? "x"}`;
    const previous = completedKeys.get(key);

    if (!previous || previous.getTime() < record.completedAt.getTime()) {
      completedKeys.set(key, record.completedAt);
    }
  }

  const completedModules = completedKeys.size;
  const totalModules = input.totalModules;

  return {
    completedModules,
    totalModules,
    completionRate: totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0,
    lastCompletedAt:
      completedKeys.size > 0
        ? Array.from(completedKeys.values()).sort((left, right) => right.getTime() - left.getTime())[0]
        : null
  } satisfies ProgressSummary;
}

export default async function AdminSupervisionPage({ searchParams }: SupervisionPageProps) {
  const currentUser = await requireAdminConsoleUser("/admin/supervision");
  const params = await searchParams;
  const q = getSearchParamValue(params.q);
  const courseId = getSearchParamValue(params.courseId, "ALL");
  const teacherId = getSearchParamValue(params.teacherId, "ALL");
  const accessStateFilter = getSearchParamValue(params.accessState, "ALL");
  const enrollmentId = getSearchParamValue(params.enrollmentId);

  if (isDemoUserId(currentUser.id)) {
    const visibleRows = demoAdminSupervisionRows.filter((row) => {
      const matchesQ =
        !q ||
        row.studentName.toLowerCase().includes(q.toLowerCase()) ||
        row.studentEmail.toLowerCase().includes(q.toLowerCase()) ||
        row.courseTitle.toLowerCase().includes(q.toLowerCase());
      const matchesAccess = accessStateFilter === "ALL" || row.accessState === accessStateFilter;
      return matchesQ && matchesAccess;
    });
    const selectedDemoEnrollment =
      visibleRows.find((row) => row.id === enrollmentId) ?? visibleRows[0] ?? null;
    const expiringSoonCount = visibleRows.filter((row) => row.accessState === "active").length;
    const averageProgress =
      visibleRows.length > 0
        ? Math.round(visibleRows.reduce((sum, row) => sum + row.completionRate, 0) / visibleRows.length)
        : 0;

    return (
      <div className="space-y-9">
        <AdminPageHeader
          description="Seguimiento demo del alumnado y de la vigencia de sus accesos."
          title="Supervision academica"
        />
        <section className="grid gap-5 xl:grid-cols-3">
          <AdminMetricCard accent="primary" icon={<UsersRound className="h-6 w-6" strokeWidth={1.8} />} label="Matriculas visibles" meta="Muestra simulada" value={visibleRows.length} />
          <AdminMetricCard accent="danger" icon={<AlertTriangle className="h-6 w-6" strokeWidth={1.8} />} label="Accesos que expiran pronto" meta="Ejemplo de seguimiento" value={expiringSoonCount} />
          <AdminMetricCard accent="warning" label="Progreso medio" meta="Sobre filas demo" value={`${averageProgress}%`} />
        </section>
        <section className="grid gap-6 2xl:grid-cols-[1.22fr_0.78fr]">
          <Card className="overflow-hidden rounded-[2rem]">
            <div className="border-b border-[#dde4ec] px-7 py-6">
              <h2 className="text-[2rem] font-semibold tracking-[-0.06em] text-[var(--color-ink)]">Seguimiento de matriculas</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead>
                  <tr className="border-b border-[#dde4ec] text-sm uppercase tracking-[0.16em] text-[#3b4f64]">
                    <th className="px-7 py-4">Alumno</th>
                    <th className="px-4 py-4">Curso y edicion</th>
                    <th className="px-4 py-4">Progreso</th>
                    <th className="px-4 py-4">Ultima actividad</th>
                    <th className="px-7 py-4">Acceso</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e0e7ee]">
                  {visibleRows.map((row) => (
                    <tr key={row.id}>
                      <td className="px-7 py-5">
                        <Link href={`/admin/supervision?enrollmentId=${row.id}`}>
                          <span className="block text-[1.1rem] font-semibold text-[var(--color-ink)]">{row.studentName}</span>
                          <span className="mt-1 block text-sm text-[#647487]">{row.studentEmail}</span>
                        </Link>
                      </td>
                      <td className="px-4 py-5 text-[#34485c]">
                        <div>{row.courseTitle}</div>
                        <div className="mt-1 text-sm text-[#617386]">{row.editionLabel}</div>
                      </td>
                      <td className="px-4 py-5 text-[#34485c]">{row.completionRate}% - {row.completedModules}/{row.totalModules} modulos</td>
                      <td className="px-4 py-5 text-[#34485c]">{formatDateTime(row.lastCompletedAt)}</td>
                      <td className="px-7 py-5">
                        <AdminStatusBadge tone={getAccessStateTone(row.accessState as never)}>
                          {getAccessStateLabel(row.accessState as never)}
                        </AdminStatusBadge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {selectedDemoEnrollment ? (
            <Card className="rounded-[2rem] p-7">
              <div className="flex items-center gap-4">
                <div className="grid h-14 w-14 place-items-center rounded-full bg-[rgba(12,113,195,0.12)] text-base font-semibold text-[var(--color-primary)]">
                  {getUserInitials(selectedDemoEnrollment.studentName)}
                </div>
                <div>
                  <h2 className="text-[1.8rem] font-semibold tracking-[-0.05em] text-[var(--color-ink)]">{selectedDemoEnrollment.studentName}</h2>
                  <p className="text-sm text-[#5a6c80]">{selectedDemoEnrollment.courseTitle}</p>
                </div>
              </div>
              <div className="mt-6 grid gap-4 text-sm text-[#405365] md:grid-cols-2">
                <div><p className="font-semibold text-[#24384b]">Estado matricula</p><p className="mt-1">{getEnrollmentStatusLabel(selectedDemoEnrollment.status as never)}</p></div>
                <div><p className="font-semibold text-[#24384b]">Acceso hasta</p><p className="mt-1">{formatDate(selectedDemoEnrollment.accessUntil)}</p></div>
                <div><p className="font-semibold text-[#24384b]">Ultima actividad</p><p className="mt-1">{formatDateTime(selectedDemoEnrollment.lastCompletedAt)}</p></div>
                <div><p className="font-semibold text-[#24384b]">Docentes del curso</p><p className="mt-1">{selectedDemoEnrollment.teachers.join(", ")}</p></div>
              </div>
            </Card>
          ) : null}
        </section>
      </div>
    );
  }

  const db = getDb();
  const now = new Date();

  const [courses, teachers, enrollments] = await Promise.all([
    db.course.findMany({
      select: {
        id: true,
        title: true
      },
      orderBy: {
        title: "asc"
      }
    }),
    db.user.findMany({
      where: {
        OR: [
          { globalRole: "ADMIN" },
          { globalRole: "TEACHER" }
        ]
      },
      select: {
        id: true,
        name: true
      },
      orderBy: {
        name: "asc"
      }
    }),
    db.courseEnrollment.findMany({
      where: {
        ...(q
          ? {
              OR: [
                { user: { name: { contains: q } } },
                { user: { email: { contains: q } } },
                { course: { title: { contains: q } } }
              ]
            }
          : {}),
        ...(courseId !== "ALL" ? { courseId } : {}),
        ...(teacherId !== "ALL"
          ? {
              course: {
                teacherAssignments: {
                  some: {
                    userId: teacherId
                  }
                }
              }
            }
          : {})
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            isActive: true
          }
        },
        course: {
          include: {
            modules: {
              orderBy: {
                position: "asc"
              }
            },
            teacherAssignments: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              }
            }
          }
        },
        courseEdition: {
          select: {
            label: true
          }
        }
      },
      orderBy: {
        updatedAt: "desc"
      },
      take: 80
    })
  ]);

  const progressRecords = await db.courseModuleProgress.findMany({
    where: {
      userId: {
        in: Array.from(new Set(enrollments.map((enrollment) => enrollment.userId)))
      },
      courseSlug: {
        in: Array.from(new Set(enrollments.map((enrollment) => enrollment.course.slug)))
      }
    },
    select: {
      userId: true,
      courseSlug: true,
      moduleId: true,
      moduleIndex: true,
      completedAt: true
    }
  });

  const progressByEnrollment = new Map<string, ProgressSummary>();

  for (const enrollment of enrollments) {
    const records = progressRecords.filter(
      (record) => record.userId === enrollment.userId && record.courseSlug === enrollment.course.slug
    );

    progressByEnrollment.set(
      enrollment.id,
      summarizeProgress({
        totalModules: enrollment.course.modules.length,
        records
      })
    );
  }

  const visibleRows = enrollments
    .map((enrollment) => {
      const progress = progressByEnrollment.get(enrollment.id) ?? {
        completedModules: 0,
        totalModules: enrollment.course.modules.length,
        completionRate: 0,
        lastCompletedAt: null
      };
      const accessState = getEnrollmentAccessState({
        status: enrollment.status,
        accessStartsAt: enrollment.accessStartsAt,
        accessUntil: enrollment.accessUntil
      });

      return {
        ...enrollment,
        progress,
        accessState
      };
    })
    .filter((row) => (accessStateFilter === "ALL" ? true : row.accessState === accessStateFilter));

  const selectedEnrollment = visibleRows.find((row) => row.id === enrollmentId) ?? visibleRows[0] ?? null;
  const expiringSoonCount = visibleRows.filter((row) => {
    if (!row.accessUntil) {
      return false;
    }

    const diff = row.accessUntil.getTime() - now.getTime();
    return diff > 0 && diff <= 30 * 24 * 60 * 60 * 1000;
  }).length;
  const averageProgress =
    visibleRows.length > 0
      ? Math.round(
          visibleRows.reduce((sum, row) => sum + row.progress.completionRate, 0) / visibleRows.length
        )
      : 0;

  return (
    <div className="space-y-9">
      <AdminPageHeader
        description="Monitoriza progreso del alumnado, vigencia de accesos y coherencia entre matricula, edicion y ventana posterior."
        title="Supervision academica"
      />

      <Card className="rounded-[2rem] p-7">
        <form className="grid gap-3 xl:grid-cols-[1.2fr_1fr_1fr_1fr_auto]">
          <Input defaultValue={q} name="q" placeholder="Buscar estudiantes o cursos..." />
          <select
            className="h-12 rounded-xl border border-[var(--color-border)] bg-white px-4 text-sm"
            defaultValue={courseId}
            name="courseId"
          >
            <option value="ALL">Todos los cursos</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.title}
              </option>
            ))}
          </select>
          <select
            className="h-12 rounded-xl border border-[var(--color-border)] bg-white px-4 text-sm"
            defaultValue={teacherId}
            name="teacherId"
          >
            <option value="ALL">Todo el profesorado</option>
            {teachers.map((teacher) => (
              <option key={teacher.id} value={teacher.id}>
                {teacher.name}
              </option>
            ))}
          </select>
          <select
            className="h-12 rounded-xl border border-[var(--color-border)] bg-white px-4 text-sm"
            defaultValue={accessStateFilter}
            name="accessState"
          >
            <option value="ALL">Todos los accesos</option>
            <option value="active">Vigentes</option>
            <option value="scheduled">Programados</option>
            <option value="expired">Caducados</option>
            <option value="inactive">Inactivos</option>
          </select>
          <SubmitButton pendingLabel="Filtrando..." variant="secondary">
            Aplicar filtros
          </SubmitButton>
        </form>
      </Card>

      <section className="grid gap-5 xl:grid-cols-3">
        <AdminMetricCard
          accent="primary"
          icon={<UsersRound className="h-6 w-6" strokeWidth={1.8} />}
          label="Matriculas visibles"
          meta="Base operativa actual"
          value={visibleRows.length}
        />
        <AdminMetricCard
          accent="danger"
          icon={<AlertTriangle className="h-6 w-6" strokeWidth={1.8} />}
          label="Accesos que expiran pronto"
          meta="Proximos 30 dias"
          value={expiringSoonCount}
        />
        <AdminMetricCard
          accent="warning"
          label="Progreso medio"
          meta="Sobre matriculas filtradas"
          value={`${averageProgress}%`}
        />
      </section>

      <section className="grid gap-6 2xl:grid-cols-[1.22fr_0.78fr]">
        <Card className="overflow-hidden rounded-[2rem]">
          <div className="border-b border-[#dde4ec] px-7 py-6">
            <h2 className="text-[2rem] font-semibold tracking-[-0.06em] text-[var(--color-ink)]">
              Seguimiento de matriculas
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead>
                <tr className="border-b border-[#dde4ec] text-sm uppercase tracking-[0.16em] text-[#3b4f64]">
                  <th className="px-7 py-4">Alumno</th>
                  <th className="px-4 py-4">Curso y edicion</th>
                  <th className="px-4 py-4">Progreso</th>
                  <th className="px-4 py-4">Ultima actividad</th>
                  <th className="px-7 py-4">Acceso</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e0e7ee]">
                {visibleRows.map((row) => (
                  <tr key={row.id}>
                    <td className="px-7 py-5">
                      <Link href={`/admin/supervision?enrollmentId=${row.id}`}>
                        <span className="block text-[1.1rem] font-semibold text-[var(--color-ink)]">
                          {row.user.name}
                        </span>
                        <span className="mt-1 block text-sm text-[#647487]">{row.user.email}</span>
                      </Link>
                    </td>
                    <td className="px-4 py-5 text-[#34485c]">
                      <div>{row.course.title}</div>
                      <div className="mt-1 text-sm text-[#617386]">
                        {row.courseEdition?.label ?? "Sin edicion"}
                      </div>
                    </td>
                    <td className="px-4 py-5 text-[#34485c]">
                      {row.progress.completionRate}% · {row.progress.completedModules}/
                      {row.progress.totalModules} modulos
                    </td>
                    <td className="px-4 py-5 text-[#34485c]">
                      {row.progress.lastCompletedAt ? formatDateTime(row.progress.lastCompletedAt) : "Sin actividad"}
                    </td>
                    <td className="px-7 py-5">
                      <AdminStatusBadge tone={getAccessStateTone(row.accessState)}>
                        {getAccessStateLabel(row.accessState)}
                      </AdminStatusBadge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {selectedEnrollment ? (
          <Card className="rounded-[2rem] p-7">
            <div className="flex items-center gap-4">
              <div className="grid h-14 w-14 place-items-center rounded-full bg-[rgba(12,113,195,0.12)] text-base font-semibold text-[var(--color-primary)]">
                {getUserInitials(selectedEnrollment.user.name)}
              </div>
              <div>
                <h2 className="text-[1.8rem] font-semibold tracking-[-0.05em] text-[var(--color-ink)]">
                  {selectedEnrollment.user.name}
                </h2>
                <p className="text-sm text-[#5a6c80]">{selectedEnrollment.course.title}</p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 text-sm text-[#405365] md:grid-cols-2">
              <div>
                <p className="font-semibold text-[#24384b]">Estado matricula</p>
                <p className="mt-1">{getEnrollmentStatusLabel(selectedEnrollment.status)}</p>
              </div>
              <div>
                <p className="font-semibold text-[#24384b]">Acceso hasta</p>
                <p className="mt-1">
                  {selectedEnrollment.accessUntil ? formatDate(selectedEnrollment.accessUntil) : "Sin limite"}
                </p>
              </div>
              <div>
                <p className="font-semibold text-[#24384b]">Ultima actividad</p>
                <p className="mt-1">
                  {selectedEnrollment.progress.lastCompletedAt
                    ? formatDateTime(selectedEnrollment.progress.lastCompletedAt)
                    : "Sin actividad"}
                </p>
              </div>
              <div>
                <p className="font-semibold text-[#24384b]">Docentes del curso</p>
                <p className="mt-1">
                  {selectedEnrollment.course.teacherAssignments.map((assignment) => assignment.user.name).join(", ") || "Sin asignar"}
                </p>
              </div>
            </div>

            <form action={updateEnrollmentAccessAction} className="mt-6 space-y-4">
              <input name="enrollmentId" type="hidden" value={selectedEnrollment.id} />
              <select
                className="h-12 w-full rounded-xl border border-[var(--color-border)] bg-white px-4 text-sm"
                defaultValue={selectedEnrollment.status}
                name="status"
              >
                <option value="ACTIVE">Activa</option>
                <option value="CANCELLED">Baja</option>
                <option value="REVOKED">Revocada</option>
                <option value="EXPIRED">Expirada</option>
              </select>
              <Input
                defaultValue={selectedEnrollment.accessUntil ? new Date(selectedEnrollment.accessUntil).toISOString().slice(0, 16) : ""}
                name="accessUntil"
                type="datetime-local"
              />
              <textarea
                className="min-h-28 w-full rounded-xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm text-[var(--color-ink)] shadow-sm outline-none transition placeholder:text-slate-400 focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[color:rgba(12,113,195,0.18)]"
                defaultValue={selectedEnrollment.notes ?? ""}
                name="notes"
                placeholder="Notas internas sobre la baja, reactivacion o extension..."
              />
              <SubmitButton className="w-full" pendingLabel="Actualizando acceso..." variant="secondary">
                Guardar acceso
              </SubmitButton>
            </form>
          </Card>
        ) : null}
      </section>
    </div>
  );
}

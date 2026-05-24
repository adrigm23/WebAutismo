import { AlertTriangle, UsersRound } from "lucide-react";
import { AdminMetricCard } from "@/components/admin/admin-metric-card";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { SupervisionDetailCard } from "@/components/admin/supervision/supervision-detail-card";
import { SupervisionFiltersCard } from "@/components/admin/supervision/supervision-filters-card";
import { SupervisionTableCard } from "@/components/admin/supervision/supervision-table-card";
import { summarizeProgress } from "@/components/admin/supervision/supervision-utils";
import type {
  ProgressSummary,
  SupervisionAccessState,
  SupervisionDetailData,
  SupervisionTableRow
} from "@/components/admin/supervision/types";
import {
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

function buildSelectionHref(input: {
  q: string;
  courseId: string;
  teacherId: string;
  accessState: string;
  enrollmentId: string;
}) {
  const qs = new URLSearchParams();

  if (input.q) {
    qs.set("q", input.q);
  }

  if (input.courseId !== "ALL") {
    qs.set("courseId", input.courseId);
  }

  if (input.teacherId !== "ALL") {
    qs.set("teacherId", input.teacherId);
  }

  if (input.accessState !== "ALL") {
    qs.set("accessState", input.accessState);
  }

  qs.set("enrollmentId", input.enrollmentId);

  return `/admin/supervision?${qs.toString()}`;
}

export default async function AdminSupervisionPage({ searchParams }: SupervisionPageProps) {
  const currentUser = await requireAdminConsoleUser("/admin/supervision");
  const params = await searchParams;
  const q = getSearchParamValue(params.q);
  const courseId = getSearchParamValue(params.courseId, "ALL");
  const teacherId = getSearchParamValue(params.teacherId, "ALL");
  const accessStateFilter = getSearchParamValue(params.accessState, "ALL") as
    | "ALL"
    | SupervisionAccessState;
  const enrollmentId = getSearchParamValue(params.enrollmentId);

  const buildExportHref = (dataset: "enrollments" | "progress" | "submissions" | "grades") => {
    const qs = new URLSearchParams();

    if (q) {
      qs.set("q", q);
    }

    if (courseId !== "ALL") {
      qs.set("courseId", courseId);
    }

    if (teacherId !== "ALL") {
      qs.set("teacherId", teacherId);
    }

    if (accessStateFilter !== "ALL") {
      qs.set("accessState", accessStateFilter);
    }

    qs.set("dataset", dataset);

    return `/admin/supervision/export?${qs.toString()}`;
  };

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
    const demoTableRows: SupervisionTableRow[] = visibleRows.map((row) => ({
      id: row.id,
      href: buildSelectionHref({
        q,
        courseId,
        teacherId,
        accessState: accessStateFilter,
        enrollmentId: row.id
      }),
      studentName: row.studentName,
      studentEmail: row.studentEmail,
      courseTitle: row.courseTitle,
      editionLabel: row.editionLabel,
      completionRate: row.completionRate,
      completedModules: row.completedModules,
      totalModules: row.totalModules,
      lastCompletedAt: row.lastCompletedAt,
      accessState: row.accessState
    }));
    const demoDetail: SupervisionDetailData | null = selectedDemoEnrollment
      ? {
          enrollmentId: selectedDemoEnrollment.id,
          studentName: selectedDemoEnrollment.studentName,
          studentInitials: getUserInitials(selectedDemoEnrollment.studentName),
          courseTitle: selectedDemoEnrollment.courseTitle,
          enrollmentStatusLabel: getEnrollmentStatusLabel(selectedDemoEnrollment.status as never),
          accessUntilLabel: formatDate(selectedDemoEnrollment.accessUntil),
          lastCompletedLabel: formatDateTime(selectedDemoEnrollment.lastCompletedAt),
          teachersLabel: selectedDemoEnrollment.teachers.join(", ")
        }
      : null;
    const demoCourses = Array.from(
      new Map(
        demoAdminSupervisionRows.map((row) => [
          row.courseTitle,
          {
            id: row.courseTitle,
            title: row.courseTitle
          }
        ])
      ).values()
    );
    const demoTeachers = Array.from(
      new Map(
        demoAdminSupervisionRows.flatMap((row) =>
          row.teachers.map((teacher) => [
            teacher,
            {
              id: teacher,
              name: teacher
            }
          ])
        )
      ).values()
    );

    return (
      <div className="space-y-9">
        <AdminPageHeader
          description="Seguimiento demo del alumnado y de la vigencia de sus accesos."
          title="Supervision academica"
        />
        <SupervisionFiltersCard
          accessState={accessStateFilter}
          courseId={courseId}
          courses={demoCourses}
          exportLinks={[
            { href: buildExportHref("enrollments"), label: "Exportar matriculas" },
            { href: buildExportHref("progress"), label: "Exportar progreso" },
            { href: buildExportHref("submissions"), label: "Exportar entregas" },
            { href: buildExportHref("grades"), label: "Exportar notas" }
          ]}
          q={q}
          teacherId={teacherId}
          teachers={demoTeachers}
        />
        <section className="grid gap-5 xl:grid-cols-3">
          <AdminMetricCard
            accent="primary"
            icon={<UsersRound className="h-6 w-6" strokeWidth={1.8} />}
            label="Matriculas visibles"
            meta="Muestra simulada"
            value={visibleRows.length}
          />
          <AdminMetricCard
            accent="danger"
            icon={<AlertTriangle className="h-6 w-6" strokeWidth={1.8} />}
            label="Accesos que expiran pronto"
            meta="Ejemplo de seguimiento"
            value={expiringSoonCount}
          />
          <AdminMetricCard
            accent="warning"
            label="Progreso medio"
            meta="Sobre filas demo"
            value={`${averageProgress}%`}
          />
        </section>
        <section className="grid min-w-0 gap-6 2xl:grid-cols-[1.22fr_0.78fr]">
          <SupervisionTableCard
            countLabel={`${demoTableRows.length} matriculas visibles en la consulta actual`}
            rows={demoTableRows}
          />
          {demoDetail ? <SupervisionDetailCard detail={demoDetail} /> : null}
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
        OR: [{ globalRole: "ADMIN" }, { globalRole: "TEACHER" }]
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
              OR: [
                {
                  course: {
                    teacherAssignments: {
                      some: {
                        userId: teacherId
                      }
                    }
                  }
                },
                {
                  courseEdition: {
                    teacherAssignments: {
                      some: {
                        userId: teacherId
                      }
                    }
                  }
                }
              ]
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
  const tableRows: SupervisionTableRow[] = visibleRows.map((row) => ({
    id: row.id,
    href: buildSelectionHref({
      q,
      courseId,
      teacherId,
      accessState: accessStateFilter,
      enrollmentId: row.id
    }),
    studentName: row.user.name,
    studentEmail: row.user.email,
    courseTitle: row.course.title,
    editionLabel: row.courseEdition?.label ?? "Sin edicion",
    completionRate: row.progress.completionRate,
    completedModules: row.progress.completedModules,
    totalModules: row.progress.totalModules,
    lastCompletedAt: row.progress.lastCompletedAt,
    accessState: row.accessState
  }));
  const selectedDetail: SupervisionDetailData | null = selectedEnrollment
    ? {
        enrollmentId: selectedEnrollment.id,
        studentName: selectedEnrollment.user.name,
        studentInitials: getUserInitials(selectedEnrollment.user.name),
        courseTitle: selectedEnrollment.course.title,
        enrollmentStatusLabel: getEnrollmentStatusLabel(selectedEnrollment.status),
        accessUntilLabel: selectedEnrollment.accessUntil
          ? formatDate(selectedEnrollment.accessUntil)
          : "Sin limite",
        lastCompletedLabel: selectedEnrollment.progress.lastCompletedAt
          ? formatDateTime(selectedEnrollment.progress.lastCompletedAt)
          : "Sin actividad",
        teachersLabel:
          selectedEnrollment.course.teacherAssignments.map((assignment) => assignment.user.name).join(", ") ||
          "Sin asignar",
        formStatusValue: selectedEnrollment.status,
        formAccessUntilValue: selectedEnrollment.accessUntil
          ? new Date(selectedEnrollment.accessUntil).toISOString().slice(0, 16)
          : "",
        formNotesValue: selectedEnrollment.notes ?? ""
      }
    : null;

  return (
    <div className="space-y-9">
      <AdminPageHeader
        description="Monitoriza progreso del alumnado, vigencia de accesos y coherencia entre matricula, edicion y ventana posterior."
        title="Supervision academica"
      />

      <SupervisionFiltersCard
        accessState={accessStateFilter}
        courseId={courseId}
        courses={courses}
        exportLinks={[
          { href: buildExportHref("enrollments"), label: "Exportar matrículas" },
          { href: buildExportHref("progress"), label: "Exportar progreso" },
          { href: buildExportHref("submissions"), label: "Exportar entregas" },
          { href: buildExportHref("grades"), label: "Exportar notas" }
        ]}
        q={q}
        teacherId={teacherId}
        teachers={teachers}
      />

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

      <section className="grid min-w-0 gap-6 2xl:grid-cols-[1.22fr_0.78fr]">
        <SupervisionTableCard
          countLabel={`${tableRows.length} matriculas visibles en la consulta actual`}
          rows={tableRows}
        />
        {selectedDetail ? <SupervisionDetailCard detail={selectedDetail} editable /> : null}
      </section>
    </div>
  );
}

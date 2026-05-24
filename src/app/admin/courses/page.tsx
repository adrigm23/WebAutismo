import { BookCopy, Layers3, PencilLine } from "lucide-react";
import { AdminMetricCard } from "@/components/admin/admin-metric-card";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { CourseDetailCard } from "@/components/admin/courses/course-detail-card";
import { CourseFiltersCard } from "@/components/admin/courses/course-filters-card";
import { CourseTableCard } from "@/components/admin/courses/course-table-card";
import { CreateCourseCard } from "@/components/admin/courses/create-course-card";
import { CreateCourseEditionCard } from "@/components/admin/courses/create-course-edition-card";
import { DemoCourseDetailCard } from "@/components/admin/courses/demo-course-detail-card";
import type {
  CourseFilterStatus,
  CourseTableRow,
  DemoCourseDetail,
  EditableCourseDetail,
} from "@/components/admin/courses/types";
import { ButtonLink } from "@/components/ui/button";
import { SurfaceCard } from "@/components/ui/surface-card";
import { getSearchParamValue } from "@/lib/admin-console";
import { requireAdminConsoleUser } from "@/lib/admin-console-server";
import { demoAdminCourses } from "@/lib/admin-demo";
import { isDemoUserId } from "@/lib/demo-auth";
import { getDb } from "@/lib/prisma";

type CoursesPageProps = {
  searchParams: Promise<{
    q?: string | string[];
    status?: string | string[];
    courseId?: string | string[];
    create?: string | string[];
  }>;
};

function buildCourseHref(input: {
  q: string;
  status: CourseFilterStatus;
  courseId: string;
  create: string;
}) {
  const qs = new URLSearchParams();

  if (input.q) {
    qs.set("q", input.q);
  }

  if (input.status !== "ALL") {
    qs.set("status", input.status);
  }

  if (input.create === "1") {
    qs.set("create", "1");
  }

  qs.set("courseId", input.courseId);

  return `/admin/courses?${qs.toString()}#course-detail`;
}

export default async function AdminCoursesPage({
  searchParams,
}: CoursesPageProps) {
  const currentUser = await requireAdminConsoleUser("/admin/courses");
  const params = await searchParams;
  const q = getSearchParamValue(params.q);
  const status = getSearchParamValue(
    params.status,
    "ALL",
  ) as CourseFilterStatus;
  const courseId = getSearchParamValue(params.courseId);
  const create = getSearchParamValue(params.create);

  if (isDemoUserId(currentUser.id)) {
    const visibleCourses = demoAdminCourses.filter((course) => {
      const matchesQ =
        !q ||
        course.title.toLowerCase().includes(q.toLowerCase()) ||
        course.slug.toLowerCase().includes(q.toLowerCase()) ||
        course.teachers.some((teacher) =>
          teacher.toLowerCase().includes(q.toLowerCase()),
        );
      const matchesStatus = status === "ALL" || course.status === status;
      return matchesQ && matchesStatus;
    });
    const selectedDemoCourse =
      visibleCourses.find((course) => course.id === courseId) ??
      visibleCourses[0] ??
      null;
    const activeEditions = demoAdminCourses.reduce(
      (sum, course) => sum + course.activeEditions,
      0,
    );
    const inactiveCourses = demoAdminCourses.filter(
      (course) => course.status === "INACTIVE",
    ).length;
    const demoRows: CourseTableRow[] = visibleCourses.map((course) => ({
      id: course.id,
      href: buildCourseHref({
        q,
        status,
        courseId: course.id,
        create,
      }),
      isSelected: course.id === selectedDemoCourse?.id,
      title: course.title,
      slug: course.slug,
      status: course.status as "ACTIVE" | "INACTIVE",
      priceInCents: course.priceInCents,
      modulesCount: course.modules,
      editionsCount: course.editions,
      teachersCount: course.teachers.length,
    }));
    const demoDetail: DemoCourseDetail | null = selectedDemoCourse
      ? {
          title: selectedDemoCourse.title,
          slug: selectedDemoCourse.slug,
          shortDescription: selectedDemoCourse.shortDescription,
          status: selectedDemoCourse.status as "ACTIVE" | "INACTIVE",
          teachers: selectedDemoCourse.teachers,
        }
      : null;

    return (
      <div className="space-y-9">
        <AdminPageHeader
          actions={
            <ButtonLink href="/admin/promotions" variant="neutral">
              Ir a promociones
            </ButtonLink>
          }
          description="Catálogo demo para validar estructura, estados y panel de gestión sin dependencia de la base de datos."
          title="Catálogo de cursos"
        />

        <section className="grid gap-5 xl:grid-cols-3">
          <AdminMetricCard
            accent="primary"
            icon={<BookCopy className="h-6 w-6" strokeWidth={1.8} />}
            label="Cursos totales"
            meta="Base curricular demo"
            value={demoAdminCourses.length}
          />
          <AdminMetricCard
            accent="neutral"
            icon={<Layers3 className="h-6 w-6" strokeWidth={1.8} />}
            label="Ediciones activas"
            meta="Sesiones simuladas"
            value={activeEditions}
          />
          <AdminMetricCard
            accent="warning"
            icon={<PencilLine className="h-6 w-6" strokeWidth={1.8} />}
            label="Cursos inactivos"
            meta="Pendientes de activar"
            value={inactiveCourses}
          />
        </section>

        <CourseFiltersCard q={q} status={status} />
        <CourseTableCard rows={demoRows} />
        {demoDetail ? <DemoCourseDetailCard course={demoDetail} /> : null}
      </div>
    );
  }

  const db = getDb();

  const [courses, teacherCandidates] = await Promise.all([
    db.course.findMany({
      where: {
        ...(q
          ? {
              OR: [
                { title: { contains: q } },
                { slug: { contains: q } },
                {
                  teacherAssignments: {
                    some: {
                      user: {
                        name: {
                          contains: q,
                        },
                      },
                    },
                  },
                },
              ],
            }
          : {}),
        ...(status !== "ALL"
          ? {
              status: status === "ACTIVE" ? "ACTIVE" : "INACTIVE",
            }
          : {}),
      },
      include: {
        modules: {
          orderBy: {
            position: "asc",
          },
        },
        editions: {
          orderBy: {
            editionNumber: "desc",
          },
        },
        teacherAssignments: {
          include: {
            user: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
    db.user.findMany({
      where: {
        globalRole: {
          in: ["TEACHER", "ADMIN"],
        },
      },
      orderBy: {
        name: "asc",
      },
    }),
  ]);

  const selectedCourse =
    courses.find((course) => course.id === courseId) ?? courses[0] ?? null;
  const activeEditions = courses.reduce(
    (sum, course) =>
      sum +
      course.editions.filter((edition) => edition.status === "ACTIVE").length,
    0,
  );
  const draftCourses = courses.filter(
    (course) => course.status === "INACTIVE",
  ).length;
  const tableRows: CourseTableRow[] = courses.map((course) => ({
    id: course.id,
    href: buildCourseHref({
      q,
      status,
      courseId: course.id,
      create,
    }),
    isSelected: course.id === selectedCourse?.id,
    title: course.title,
    slug: course.slug,
    status: course.status,
    priceInCents: course.priceInCents,
    modulesCount: course.modules.length,
    editionsCount: course.editions.length,
    teachersCount: course.teacherAssignments.length,
  }));
  const editableDetail: EditableCourseDetail | null = selectedCourse
    ? {
        id: selectedCourse.id,
        slug: selectedCourse.slug,
        title: selectedCourse.title,
        shortDescription: selectedCourse.shortDescription,
        status: selectedCourse.status,
        priceInCents: selectedCourse.priceInCents,
        teacherAssignments: selectedCourse.teacherAssignments.map(
          (assignment) => ({
            id: assignment.id,
            userId: assignment.user.id,
            name: assignment.user.name,
            email: assignment.user.email,
          }),
        ),
        teacherCandidates: teacherCandidates.map((teacher) => ({
          id: teacher.id,
          name: teacher.name,
          email: teacher.email,
        })),
        editions: selectedCourse.editions.map((edition) => ({
          id: edition.id,
          label: edition.label,
          status: edition.status,
        })),
      }
    : null;

  return (
    <div className="space-y-9">
      <AdminPageHeader
        actions={
          <>
            <ButtonLink href="#course-filters" variant="neutral">
              Filtrar
            </ButtonLink>
            <ButtonLink href="#create-course">Crear curso</ButtonLink>
          </>
        }
        description="Gestiona curriculum, estado del catalogo, docentes asignados y clonado de cursos para acelerar nuevas ediciones."
        title="Catálogo de cursos"
      />

      <section className="grid gap-5 xl:grid-cols-3">
        <AdminMetricCard
          accent="primary"
          icon={<BookCopy className="h-6 w-6" strokeWidth={1.8} />}
          label="Cursos totales"
          meta="Base curricular persistida"
          value={courses.length}
        />
        <AdminMetricCard
          accent="neutral"
          icon={<Layers3 className="h-6 w-6" strokeWidth={1.8} />}
          label="Ediciones activas"
          meta="Sesiones actualmente abiertas"
          value={activeEditions}
        />
        <AdminMetricCard
          accent="warning"
          icon={<PencilLine className="h-6 w-6" strokeWidth={1.8} />}
          label="Cursos inactivos"
          meta="Pendientes de revision"
          value={draftCourses}
        />
      </section>

      <section className="grid gap-6 2xl:grid-cols-[minmax(0,1.15fr)_24rem]">
        <div className="space-y-6 min-w-0">
          <CourseFiltersCard q={q} status={status} />
          <CourseTableCard rows={tableRows} />
          {editableDetail ? <CourseDetailCard course={editableDetail} /> : null}
        </div>

        <div className="space-y-6 self-start 2xl:sticky 2xl:top-28">
          <CreateCourseCard />
          {selectedCourse ? (
            <CreateCourseEditionCard courseId={selectedCourse.id} />
          ) : (
            <SurfaceCard title="Crear edicion">
              <p className="text-sm leading-7 text-[var(--color-muted)]">
                Selecciona un curso en la tabla y pulsa en gestionar curso para
                preparar su siguiente edicion desde este mismo lateral.
              </p>
            </SurfaceCard>
          )}
        </div>
      </section>
    </div>
  );
}

import Link from "next/link";
import { BookCopy, Layers3, PencilLine } from "lucide-react";
import {
  assignTeacherToCourseAction,
  cloneCourseAction,
  createCourseAction,
  createCourseEditionAction,
  unassignTeacherFromCourseAction,
  updateCourseAction
} from "@/actions/admin";
import { AdminMetricCard } from "@/components/admin/admin-metric-card";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import {
  getCourseStatusLabel,
  getCourseStatusTone,
  getSearchParamValue
} from "@/lib/admin-console";
import { requireAdminConsoleUser } from "@/lib/admin-console-server";
import { getDb } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";

type CoursesPageProps = {
  searchParams: Promise<{
    q?: string | string[];
    status?: string | string[];
    courseId?: string | string[];
    create?: string | string[];
  }>;
};

export default async function AdminCoursesPage({ searchParams }: CoursesPageProps) {
  await requireAdminConsoleUser("/admin/courses");
  const params = await searchParams;
  const q = getSearchParamValue(params.q);
  const status = getSearchParamValue(params.status, "ALL");
  const courseId = getSearchParamValue(params.courseId);
  const create = getSearchParamValue(params.create);
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
                          contains: q
                        }
                      }
                    }
                  }
                }
              ]
            }
          : {}),
        ...(status !== "ALL"
          ? {
              status: status === "ACTIVE" ? "ACTIVE" : "INACTIVE"
            }
          : {})
      },
      include: {
        modules: {
          orderBy: {
            position: "asc"
          }
        },
        editions: {
          orderBy: {
            editionNumber: "desc"
          }
        },
        teacherAssignments: {
          include: {
            user: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    }),
    db.user.findMany({
      where: {
        globalRole: {
          in: ["TEACHER", "ADMIN"]
        }
      },
      orderBy: {
        name: "asc"
      }
    })
  ]);

  const selectedCourse = courses.find((course) => course.id === courseId) ?? courses[0] ?? null;
  const activeEditions = courses.reduce(
    (sum, course) => sum + course.editions.filter((edition) => edition.status === "ACTIVE").length,
    0
  );
  const draftCourses = courses.filter((course) => course.status === "INACTIVE").length;

  return (
    <div className="space-y-9">
      <AdminPageHeader
        actions={
          <>
            <ButtonLink href="#course-filters" variant="secondary">
              Filtrar
            </ButtonLink>
            <ButtonLink href="/admin/courses?create=1#create-course">Crear curso</ButtonLink>
          </>
        }
        description="Gestiona curriculum, estado del catalogo, docentes asignados y clonado de cursos para acelerar nuevas ediciones."
        title="Catalogo de cursos"
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

      <Card className="overflow-hidden rounded-[2rem]" id="course-filters">
        <div className="border-b border-[#dde4ec] px-7 py-6">
          <form className="grid gap-3 md:grid-cols-[1fr_220px_auto]">
            <Input defaultValue={q} name="q" placeholder="Filtrar cursos..." />
            <select
              className="h-12 rounded-xl border border-[var(--color-border)] bg-white px-4 text-sm"
              defaultValue={status}
              name="status"
            >
              <option value="ALL">Todos los estados</option>
              <option value="ACTIVE">Activos</option>
              <option value="INACTIVE">Inactivos</option>
            </select>
            <SubmitButton pendingLabel="Aplicando..." variant="secondary">
              Aplicar
            </SubmitButton>
          </form>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead>
              <tr className="border-b border-[#dde4ec] text-sm uppercase tracking-[0.16em] text-[#3b4f64]">
                <th className="px-7 py-4">Curso</th>
                <th className="px-4 py-4">Estado</th>
                <th className="px-4 py-4">Precio</th>
                <th className="px-4 py-4">Detalle</th>
                <th className="px-7 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e0e7ee]">
              {courses.map((course) => (
                <tr className="align-top" key={course.id}>
                  <td className="px-7 py-6">
                    <Link href={`/admin/courses?courseId=${course.id}`}>
                      <span className="block text-[1.16rem] font-semibold text-[var(--color-ink)]">
                        {course.title}
                      </span>
                      <span className="mt-1 block text-sm text-[#647487]">/cursos/{course.slug}</span>
                    </Link>
                  </td>
                  <td className="px-4 py-6">
                    <AdminStatusBadge tone={getCourseStatusTone(course.status)}>
                      {getCourseStatusLabel(course.status)}
                    </AdminStatusBadge>
                  </td>
                  <td className="px-4 py-6 text-[1.08rem] font-medium text-[var(--color-ink)]">
                    {formatPrice(course.priceInCents)}
                  </td>
                  <td className="px-4 py-6 text-sm leading-7 text-[#405365]">
                    <div>{course.modules.length} modulos</div>
                    <div>{course.editions.length} ediciones</div>
                    <div>
                      {course.teacherAssignments.length > 0
                        ? `${course.teacherAssignments.length} docentes`
                        : "Sin docentes"}
                    </div>
                  </td>
                  <td className="px-7 py-6 text-right">
                    <ButtonLink href={`/admin/courses?courseId=${course.id}`} variant="secondary">
                      Gestionar
                    </ButtonLink>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <section className="grid gap-6 2xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-6">
          {selectedCourse ? (
            <Card className="rounded-[2rem] p-7">
              <div className="flex flex-wrap items-start justify-between gap-5">
                <div>
                  <h2 className="text-[2rem] font-semibold tracking-[-0.06em] text-[var(--color-ink)]">
                    {selectedCourse.title}
                  </h2>
                  <p className="mt-2 text-sm text-[#5f7083]">Slug: {selectedCourse.slug}</p>
                </div>
                <AdminStatusBadge tone={getCourseStatusTone(selectedCourse.status)}>
                  {getCourseStatusLabel(selectedCourse.status)}
                </AdminStatusBadge>
              </div>

              <form action={updateCourseAction} className="mt-6 grid gap-4">
                <input name="courseId" type="hidden" value={selectedCourse.id} />
                <div className="grid gap-4 md:grid-cols-2">
                  <Input defaultValue={selectedCourse.title} name="title" />
                  <Input defaultValue={selectedCourse.shortDescription} name="shortDescription" />
                </div>
                <div className="grid gap-4 md:grid-cols-[180px_220px_auto]">
                  <Input defaultValue={String(selectedCourse.priceInCents)} name="priceInCents" type="number" />
                  <select
                    className="h-12 rounded-xl border border-[var(--color-border)] bg-white px-4 text-sm"
                    defaultValue={selectedCourse.status}
                    name="status"
                  >
                    <option value="ACTIVE">Activo</option>
                    <option value="INACTIVE">Inactivo</option>
                  </select>
                  <SubmitButton pendingLabel="Guardando..." variant="secondary">
                    Guardar cambios
                  </SubmitButton>
                </div>
              </form>

              <div className="mt-8 grid gap-6 xl:grid-cols-2">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#314255]">
                    Docentes asignados
                  </p>
                  <div className="mt-4 space-y-3">
                    {selectedCourse.teacherAssignments.length > 0 ? (
                      selectedCourse.teacherAssignments.map((assignment) => (
                        <form
                          action={unassignTeacherFromCourseAction}
                          className="flex items-center justify-between gap-3 rounded-[1.3rem] border border-[#d9e1e8] bg-[#fbfcfd] px-4 py-3"
                          key={assignment.id}
                        >
                          <input name="courseId" type="hidden" value={selectedCourse.id} />
                          <input name="teacherUserId" type="hidden" value={assignment.user.id} />
                          <div>
                            <p className="font-medium text-[var(--color-ink)]">{assignment.user.name}</p>
                            <p className="text-sm text-[#5a6c7f]">{assignment.user.email}</p>
                          </div>
                          <SubmitButton pendingLabel="Quitando..." variant="ghost">
                            Quitar
                          </SubmitButton>
                        </form>
                      ))
                    ) : (
                      <p className="text-sm text-[#607285]">Sin docentes asignados.</p>
                    )}
                  </div>

                  <form action={assignTeacherToCourseAction} className="mt-4 flex flex-wrap gap-3">
                    <input name="courseId" type="hidden" value={selectedCourse.id} />
                    <select
                      className="h-12 min-w-[14rem] flex-1 rounded-xl border border-[var(--color-border)] bg-white px-4 text-sm"
                      name="teacherUserId"
                    >
                      {teacherCandidates.map((teacher) => (
                        <option key={teacher.id} value={teacher.id}>
                          {teacher.name} · {teacher.email}
                        </option>
                      ))}
                    </select>
                    <SubmitButton pendingLabel="Asignando...">Asignar docente</SubmitButton>
                  </form>
                </div>

                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#314255]">
                    Clonado rapido
                  </p>
                  <form action={cloneCourseAction} className="mt-4 space-y-4">
                    <input name="sourceSlug" type="hidden" value={selectedCourse.slug} />
                    <Input name="title" placeholder="Nuevo titulo del clon" required />
                    <Input name="slug" placeholder="nuevo-slug" required />
                    <SubmitButton pendingLabel="Clonando..." variant="secondary">
                      Clonar este curso
                    </SubmitButton>
                  </form>
                </div>
              </div>

              <div className="mt-8">
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#314255]">
                  Ediciones del curso
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {selectedCourse.editions.map((edition) => (
                    <AdminStatusBadge key={edition.id} tone={edition.status === "ACTIVE" ? "primary" : "neutral"}>
                      {edition.label}
                    </AdminStatusBadge>
                  ))}
                </div>
              </div>
            </Card>
          ) : null}
        </div>

        <div className="space-y-6">
          {(create === "1" || courses.length === 0) ? (
            <Card className="rounded-[2rem] p-7" id="create-course">
              <h2 className="text-[1.8rem] font-semibold tracking-[-0.05em] text-[var(--color-ink)]">
                Crear curso
              </h2>
              <form action={createCourseAction} className="mt-5 space-y-4">
                <Input name="title" placeholder="Titulo del curso" required />
                <Input name="slug" placeholder="slug-del-curso" required />
                <Input name="shortDescription" placeholder="Descripcion corta" required />
                <Input min="0" name="priceInCents" placeholder="Precio en centimos" required type="number" />
                <SubmitButton className="w-full" pendingLabel="Creando curso...">
                  Crear curso
                </SubmitButton>
              </form>
            </Card>
          ) : null}

          {selectedCourse ? (
            <Card className="rounded-[2rem] p-7">
              <h2 className="text-[1.8rem] font-semibold tracking-[-0.05em] text-[var(--color-ink)]">
                Crear edicion
              </h2>
              <form action={createCourseEditionAction} className="mt-5 space-y-4">
                <input name="courseId" type="hidden" value={selectedCourse.id} />
                <Input name="label" placeholder="Etiqueta visible" required />
                <div className="grid gap-4 md:grid-cols-2">
                  <Input name="startsAt" type="datetime-local" />
                  <Input name="endsAt" type="datetime-local" />
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <Input name="accessUntil" type="datetime-local" />
                  <Input defaultValue="0" name="graceAccessDays" type="number" />
                  <select
                    className="h-12 rounded-xl border border-[var(--color-border)] bg-white px-4 text-sm"
                    name="status"
                  >
                    <option value="ACTIVE">Activa</option>
                    <option value="SCHEDULED">Programada</option>
                    <option value="CLOSED">Cerrada</option>
                  </select>
                </div>
                <SubmitButton className="w-full" pendingLabel="Creando edicion..." variant="secondary">
                  Crear edicion
                </SubmitButton>
              </form>
            </Card>
          ) : null}
        </div>
      </section>
    </div>
  );
}

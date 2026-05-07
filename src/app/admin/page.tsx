import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  assignTeacherToCourseAction,
  cloneCourseAction,
  createCourseAction,
  createCourseEditionAction,
  createPromotionAction,
  createTeacherAction,
  togglePromotionAction,
  toggleUserActiveAction,
  unassignTeacherFromCourseAction,
  updateCourseAction,
  updateCourseEditionAction,
  updateUserRoleAction
} from "@/actions/admin";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { requireUser } from "@/lib/auth";
import { getCatalogCourses } from "@/lib/course-catalog";
import { canManageUsers, getGlobalRoleLabel } from "@/lib/course-permissions";
import { parseAuditMetadata } from "@/lib/audit";
import { getDb } from "@/lib/prisma";
import { formatDate, formatDateTime, formatPrice } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Administracion",
  robots: {
    index: false,
    follow: false
  }
};

export default async function AdminPage() {
  const user = await requireUser("/admin");

  if (!canManageUsers(user.globalRole)) {
    redirect("/mi-cuenta");
  }

  const db = getDb();
  const [users, teacherCandidates, courses, promotions, auditLogs] = await Promise.all([
    db.user.findMany({
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
    }),
    db.course.findMany({
      include: {
        editions: {
          orderBy: {
            editionNumber: "asc"
          }
        },
        teacherAssignments: {
          include: {
            user: true
          }
        }
      },
      orderBy: {
        createdAt: "asc"
      }
    }),
    db.promotion.findMany({
      include: {
        course: {
          select: {
            title: true
          }
        },
        _count: {
          select: {
            redemptions: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    }),
    db.auditLog.findMany({
      include: {
        actor: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      },
      take: 30
    })
  ]);
  const catalogCourses = await getCatalogCourses(true);

  return (
    <div className="pb-20 pt-14 lg:pt-16">
      <div className="site-container space-y-14">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-primary)]">
            Area de administracion
          </p>
          <h1 className="mt-3 text-[4rem] font-semibold tracking-[-0.08em] text-[var(--color-ink)]">
            Gestion del campus
          </h1>
          <p className="mt-4 max-w-4xl text-[1.08rem] leading-8 text-[var(--color-ink)]/84">
            Desde aqui puedes crear docentes, activar o desactivar cuentas, asignar varios
            profesores por curso, gestionar ediciones, promociones y revisar la auditoria de
            operaciones relevantes.
          </p>
        </div>

        <section className="space-y-6">
          <h2 className="text-[2.4rem] font-semibold tracking-[-0.05em] text-[var(--color-ink)]">
            Usuarios y docentes
          </h2>

          <Card className="p-6">
            <h3 className="text-[1.4rem] font-semibold text-[var(--color-ink)]">
              Crear docente
            </h3>
            <form action={createTeacherAction} className="mt-5 grid gap-4 md:grid-cols-4">
              <Input name="name" placeholder="Nombre completo" />
              <Input name="email" placeholder="Email" type="email" />
              <Input name="password" placeholder="Contrasena temporal" type="password" />
              <Button type="submit">Crear docente</Button>
            </form>
          </Card>

          <div className="space-y-4">
            {users.map((account) => (
              <Card className="space-y-4 p-6" key={account.id}>
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-[1.2rem] font-semibold text-[var(--color-ink)]">
                      {account.name}
                    </p>
                    <p className="text-sm text-[var(--color-muted)]">{account.email}</p>
                  </div>
                  <div className="text-sm text-[var(--color-muted)]">
                    Alta: {formatDate(account.createdAt)}
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <form action={updateUserRoleAction} className="flex flex-wrap items-end gap-3">
                    <input name="userId" type="hidden" value={account.id} />
                    <label className="min-w-[14rem] flex-1">
                      <span className="mb-2 block text-sm font-medium text-[var(--color-ink)]">
                        Rol global
                      </span>
                      <select
                        className="h-11 w-full rounded-xl border border-[var(--color-border)] bg-white px-3 text-sm"
                        defaultValue={account.globalRole}
                        name="globalRole"
                      >
                        <option value="STUDENT">Alumno</option>
                        <option value="TEACHER">Docente</option>
                        <option value="ADMIN">Administrador</option>
                      </select>
                    </label>
                    <Button type="submit" variant="secondary">
                      Guardar rol
                    </Button>
                  </form>

                  <form action={toggleUserActiveAction} className="flex flex-wrap items-end gap-3">
                    <input name="userId" type="hidden" value={account.id} />
                    <input
                      name="active"
                      type="hidden"
                      value={account.isActive ? "false" : "true"}
                    />
                    <div className="flex-1 text-sm text-[var(--color-muted)]">
                      Estado actual:{" "}
                      <strong className="text-[var(--color-ink)]">
                        {account.isActive ? "Activo" : "Desactivado"}
                      </strong>
                    </div>
                    <Button type="submit" variant={account.isActive ? "ghost" : "primary"}>
                      {account.isActive ? "Dar de baja" : "Reactivar"}
                    </Button>
                  </form>
                </div>

                <p className="text-xs uppercase tracking-[0.16em] text-[var(--color-muted)]">
                  Rol actual: {getGlobalRoleLabel(account.globalRole)}
                </p>
              </Card>
            ))}
          </div>
        </section>

        <section className="space-y-6">
          <h2 className="text-[2.4rem] font-semibold tracking-[-0.05em] text-[var(--color-ink)]">
            Cursos y ediciones
          </h2>

          <div className="grid gap-6 xl:grid-cols-2">
            <Card className="p-6">
              <h3 className="text-[1.4rem] font-semibold text-[var(--color-ink)]">Crear curso</h3>
              <form action={createCourseAction} className="mt-5 grid gap-4">
                <Input name="title" placeholder="Titulo del curso" />
                <Input name="slug" placeholder="slug-del-curso" />
                <Input name="shortDescription" placeholder="Descripcion corta" />
                <Input min="0" name="priceInCents" placeholder="Precio en centimos" type="number" />
                <Button type="submit">Crear curso</Button>
              </form>
            </Card>

            <Card className="p-6">
              <h3 className="text-[1.4rem] font-semibold text-[var(--color-ink)]">
                Clonar curso
              </h3>
              <form action={cloneCourseAction} className="mt-5 grid gap-4">
                <select
                  className="h-11 rounded-xl border border-[var(--color-border)] bg-white px-3 text-sm"
                  name="sourceSlug"
                >
                  {catalogCourses.map((course) => (
                    <option key={course.id} value={course.slug}>
                      {course.title}
                    </option>
                  ))}
                </select>
                <Input name="title" placeholder="Nuevo titulo" />
                <Input name="slug" placeholder="nuevo-slug" />
                <Button type="submit" variant="secondary">
                  Clonar curso
                </Button>
              </form>
            </Card>
          </div>

          <div className="space-y-6">
            {courses.map((course) => (
              <Card className="space-y-6 p-6" key={course.id}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h3 className="text-[1.7rem] font-semibold text-[var(--color-ink)]">
                      {course.title}
                    </h3>
                    <p className="mt-1 text-sm text-[var(--color-muted)]">
                      {course.slug} · {formatPrice(course.priceInCents)}
                    </p>
                  </div>
                  <div className="text-sm text-[var(--color-muted)]">
                    Estado: {course.status === "ACTIVE" ? "Activo" : "Inactivo"}
                  </div>
                </div>

                <form action={updateCourseAction} className="grid gap-4 md:grid-cols-4">
                  <input name="courseId" type="hidden" value={course.id} />
                  <Input defaultValue={course.title} name="title" />
                  <Input defaultValue={course.shortDescription} name="shortDescription" />
                  <Input defaultValue={String(course.priceInCents)} name="priceInCents" type="number" />
                  <div className="flex gap-3">
                    <select
                      className="h-11 flex-1 rounded-xl border border-[var(--color-border)] bg-white px-3 text-sm"
                      defaultValue={course.status}
                      name="status"
                    >
                      <option value="ACTIVE">Activo</option>
                      <option value="INACTIVE">Inactivo</option>
                    </select>
                    <Button type="submit" variant="secondary">
                      Guardar
                    </Button>
                  </div>
                </form>

                <div className="grid gap-6 xl:grid-cols-2">
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--color-muted)]">
                        Docentes asignados
                      </p>
                      <div className="mt-3 space-y-3">
                        {course.teacherAssignments.length ? (
                          course.teacherAssignments.map((assignment) => (
                            <form
                              action={unassignTeacherFromCourseAction}
                              className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3"
                              key={assignment.id}
                            >
                              <input name="courseId" type="hidden" value={course.id} />
                              <input name="teacherUserId" type="hidden" value={assignment.user.id} />
                              <div>
                                <p className="font-medium text-[var(--color-ink)]">
                                  {assignment.user.name}
                                </p>
                                <p className="text-sm text-[var(--color-muted)]">
                                  {assignment.user.email}
                                </p>
                              </div>
                              <Button type="submit" variant="ghost">
                                Desasignar
                              </Button>
                            </form>
                          ))
                        ) : (
                          <p className="text-sm text-[var(--color-muted)]">
                            Todavia no hay docentes asignados a este curso.
                          </p>
                        )}
                      </div>
                    </div>

                    <form action={assignTeacherToCourseAction} className="flex flex-wrap gap-3">
                      <input name="courseId" type="hidden" value={course.id} />
                      <select
                        className="h-11 flex-1 rounded-xl border border-[var(--color-border)] bg-white px-3 text-sm"
                        name="teacherUserId"
                      >
                        {teacherCandidates.map((teacher) => (
                          <option key={teacher.id} value={teacher.id}>
                            {teacher.name} · {teacher.email}
                          </option>
                        ))}
                      </select>
                      <Button type="submit">Asignar docente</Button>
                    </form>
                  </div>

                  <div className="space-y-4">
                    <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--color-muted)]">
                      Nueva edicion
                    </p>
                    <form action={createCourseEditionAction} className="grid gap-3">
                      <input name="courseId" type="hidden" value={course.id} />
                      <Input name="label" placeholder="Ej. Edicion septiembre 2026" />
                      <div className="grid gap-3 md:grid-cols-2">
                        <Input name="startsAt" type="datetime-local" />
                        <Input name="endsAt" type="datetime-local" />
                      </div>
                      <div className="grid gap-3 md:grid-cols-3">
                        <Input name="accessUntil" type="datetime-local" />
                        <Input defaultValue="0" name="graceAccessDays" type="number" />
                        <select
                          className="h-11 rounded-xl border border-[var(--color-border)] bg-white px-3 text-sm"
                          name="status"
                        >
                          <option value="ACTIVE">Activa</option>
                          <option value="SCHEDULED">Programada</option>
                          <option value="CLOSED">Cerrada</option>
                        </select>
                      </div>
                      <Button type="submit" variant="secondary">
                        Crear edicion
                      </Button>
                    </form>
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--color-muted)]">
                    Ediciones existentes
                  </p>
                  {course.editions.map((edition) => (
                    <form action={updateCourseEditionAction} className="grid gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4" key={edition.id}>
                      <input name="editionId" type="hidden" value={edition.id} />
                      <div className="grid gap-3 md:grid-cols-2">
                        <Input defaultValue={edition.label} name="label" />
                        <select
                          className="h-11 rounded-xl border border-[var(--color-border)] bg-white px-3 text-sm"
                          defaultValue={edition.status}
                          name="status"
                        >
                          <option value="ACTIVE">Activa</option>
                          <option value="SCHEDULED">Programada</option>
                          <option value="CLOSED">Cerrada</option>
                          <option value="CANCELLED">Cancelada</option>
                        </select>
                      </div>
                      <div className="grid gap-3 md:grid-cols-3">
                        <Input
                          defaultValue={edition.startsAt ? new Date(edition.startsAt).toISOString().slice(0, 16) : ""}
                          name="startsAt"
                          type="datetime-local"
                        />
                        <Input
                          defaultValue={edition.endsAt ? new Date(edition.endsAt).toISOString().slice(0, 16) : ""}
                          name="endsAt"
                          type="datetime-local"
                        />
                        <Input
                          defaultValue={edition.accessUntil ? new Date(edition.accessUntil).toISOString().slice(0, 16) : ""}
                          name="accessUntil"
                          type="datetime-local"
                        />
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                        <Input
                          className="max-w-[11rem]"
                          defaultValue={String(edition.graceAccessDays)}
                          name="graceAccessDays"
                          type="number"
                        />
                        <select
                          className="h-11 rounded-xl border border-[var(--color-border)] bg-white px-3 text-sm"
                          defaultValue={edition.isActive ? "true" : "false"}
                          name="isActive"
                        >
                          <option value="true">Visible</option>
                          <option value="false">Oculta</option>
                        </select>
                        <Button type="submit" variant="ghost">
                          Guardar edicion
                        </Button>
                      </div>
                    </form>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </section>

        <section className="space-y-6">
          <h2 className="text-[2.4rem] font-semibold tracking-[-0.05em] text-[var(--color-ink)]">
            Promociones
          </h2>

          <Card className="p-6">
            <form action={createPromotionAction} className="grid gap-4">
              <div className="grid gap-4 md:grid-cols-4">
                <Input name="code" placeholder="Codigo" />
                <select
                  className="h-11 rounded-xl border border-[var(--color-border)] bg-white px-3 text-sm"
                  name="discountType"
                >
                  <option value="PERCENTAGE">Porcentaje</option>
                  <option value="FIXED_AMOUNT">Importe fijo</option>
                </select>
                <Input name="amountInCents" placeholder="Cantidad" type="number" />
                <select
                  className="h-11 rounded-xl border border-[var(--color-border)] bg-white px-3 text-sm"
                  name="scope"
                >
                  <option value="GLOBAL">Global</option>
                  <option value="COURSE">Solo un curso</option>
                </select>
              </div>
              <Input name="description" placeholder="Descripcion interna" />
              <div className="grid gap-4 md:grid-cols-4">
                <select
                  className="h-11 rounded-xl border border-[var(--color-border)] bg-white px-3 text-sm"
                  name="courseId"
                >
                  <option value="">Sin curso especifico</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.title}
                    </option>
                  ))}
                </select>
                <Input name="usageLimit" placeholder="Limite de usos" type="number" />
                <Input name="validFrom" type="datetime-local" />
                <Input name="validUntil" type="datetime-local" />
              </div>
              <Button type="submit">Crear promocion</Button>
            </form>
          </Card>

          <div className="space-y-4">
            {promotions.map((promotion) => (
              <Card className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between" key={promotion.id}>
                <div>
                  <p className="text-[1.2rem] font-semibold text-[var(--color-ink)]">
                    {promotion.code}
                  </p>
                  <p className="mt-1 text-sm text-[var(--color-muted)]">
                    {promotion.discountType === "PERCENTAGE"
                      ? `${promotion.amountInCents}%`
                      : formatPrice(promotion.amountInCents)}{" "}
                    · {promotion.scope === "COURSE" ? promotion.course?.title ?? "Curso eliminado" : "Global"} ·{" "}
                    {promotion._count.redemptions} usos
                  </p>
                  <p className="mt-1 text-sm text-[var(--color-muted)]">
                    Activa: {promotion.isActive ? "Si" : "No"}
                    {promotion.validUntil ? ` · Hasta ${formatDateTime(promotion.validUntil)}` : ""}
                  </p>
                </div>
                <form action={togglePromotionAction}>
                  <input name="promotionId" type="hidden" value={promotion.id} />
                  <input
                    name="isActive"
                    type="hidden"
                    value={promotion.isActive ? "false" : "true"}
                  />
                  <Button type="submit" variant={promotion.isActive ? "ghost" : "secondary"}>
                    {promotion.isActive ? "Desactivar" : "Activar"}
                  </Button>
                </form>
              </Card>
            ))}
          </div>
        </section>

        <section className="space-y-6">
          <h2 className="text-[2.4rem] font-semibold tracking-[-0.05em] text-[var(--color-ink)]">
            Auditoria
          </h2>

          <div className="space-y-4">
            {auditLogs.map((entry) => {
              const metadata = parseAuditMetadata(entry.metadataJson);

              return (
                <Card className="p-5" key={entry.id}>
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-primary)]">
                        {entry.action}
                      </p>
                      <p className="mt-2 text-[1.1rem] font-semibold text-[var(--color-ink)]">
                        {entry.entityLabel ?? entry.entityType}
                      </p>
                      <p className="mt-2 text-sm text-[var(--color-muted)]">
                        Actor: {entry.actor?.name ?? "Sistema"} · {entry.actor?.email ?? "sin email"}
                      </p>
                    </div>
                    <p className="text-sm text-[var(--color-muted)]">
                      {formatDateTime(entry.createdAt)}
                    </p>
                  </div>
                  {metadata ? (
                    <pre className="mt-4 overflow-x-auto rounded-2xl bg-[var(--color-surface)] px-4 py-3 text-xs text-[var(--color-muted)]">
                      {JSON.stringify(metadata, null, 2)}
                    </pre>
                  ) : null}
                </Card>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}

import type { Metadata } from "next";
import {
  Bell,
  BookOpen,
  GraduationCap,
  Settings2,
  ShieldCheck
} from "lucide-react";
import {
  cancelEnrollmentAction,
  markAllUserNotificationsReadAction,
  markUserNotificationReadAction,
  updateNotificationPreferencesAction
} from "@/actions/account";
import {
  markAllForumNotificationsReadAction,
  markForumNotificationReadAction
} from "@/actions/forum";
import { CourseArtwork } from "@/components/course-artwork";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/lib/auth";
import { getCourseProgressSummariesForUser } from "@/lib/course-progress";
import { getRoleLabel, getUserCourseSpaces } from "@/lib/course-community";
import { isStaffCourseRole } from "@/lib/course-roles";
import { getUserForumNotifications } from "@/lib/forum";
import {
  ensureNotificationPreference,
  getUserPlatformNotifications
} from "@/lib/notifications";
import { formatDate, formatDateTime } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Mi cuenta",
  robots: {
    index: false,
    follow: false
  }
};

export default async function AccountPage() {
  const user = await requireUser("/mi-cuenta");
  const [spaces, preference] = await Promise.all([
    getUserCourseSpaces({
      userId: user.id,
      email: user.email
    }),
    ensureNotificationPreference(user.id)
  ]);
  const [forumNotifications, platformNotifications] = await Promise.all([
    getUserForumNotifications({
      userId: user.id,
      courseSlugs: spaces.map((space) => space.course.slug),
      limit: 6
    }),
    getUserPlatformNotifications({
      userId: user.id,
      limit: 6
    })
  ]);
  const firstName = user.name.split(" ")[0] || user.name;
  const staffSpaces = spaces.filter((space) => isStaffCourseRole(space.role));
  const studentSpaces = spaces.filter((space) => !isStaffCourseRole(space.role));
  const progressByCourse = await getCourseProgressSummariesForUser({
    userId: user.id,
    courseSlugs: studentSpaces.map((space) => space.course.slug)
  });

  return (
    <div className="pb-24 pt-14 lg:pt-16">
      <div className="site-container">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="max-w-4xl">
            <h1 className="text-[4.2rem] font-semibold tracking-[-0.08em] text-[var(--color-ink)]">
              Hola, {firstName}
            </h1>
            <p className="mt-4 text-[1.18rem] leading-10 text-[var(--color-ink)]/84">
              Aqui tienes tu acceso actual al campus, tus avisos recientes y la configuracion
              operativa de tu cuenta.
            </p>
          </div>

          {user.globalRole === "ADMIN" ? (
            <ButtonLink href="/admin" variant="secondary">
              Abrir administracion
            </ButtonLink>
          ) : null}
        </div>

        <section className="mt-16">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Bell className="h-7 w-7 text-[var(--color-primary)]" />
              <h2 className="text-[3rem] font-semibold tracking-[-0.06em] text-[var(--color-ink)]">
                Notificaciones de plataforma
              </h2>
            </div>
            {platformNotifications.unreadCount ? (
              <form action={markAllUserNotificationsReadAction}>
                <input name="nextPath" type="hidden" value="/mi-cuenta" />
                <Button type="submit" variant="ghost">
                  Marcar todas como leidas
                </Button>
              </form>
            ) : null}
          </div>

          {platformNotifications.notifications.length ? (
            <div className="space-y-4">
              {platformNotifications.notifications.map((notification) => (
                <Card
                  className="flex flex-col gap-5 p-6 md:flex-row md:items-center md:justify-between"
                  key={notification.id}
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <Badge tone={notification.readAt ? "muted" : "accent"}>
                        {notification.readAt ? "Leida" : "Nueva"}
                      </Badge>
                      <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-muted)]">
                        {formatDateTime(notification.createdAt)}
                      </p>
                    </div>
                    <p className="mt-4 text-[1.3rem] font-semibold text-[var(--color-ink)]">
                      {notification.title}
                    </p>
                    <p className="mt-2 text-[1rem] leading-8 text-[var(--color-muted)]">
                      {notification.body}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <ButtonLink href={notification.linkPath} variant="secondary">
                      Abrir
                    </ButtonLink>
                    {!notification.readAt ? (
                      <form action={markUserNotificationReadAction}>
                        <input name="notificationId" type="hidden" value={notification.id} />
                        <input name="nextPath" type="hidden" value="/mi-cuenta" />
                        <Button type="submit" variant="ghost">
                          Marcar leida
                        </Button>
                      </form>
                    ) : null}
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-8">
              <p className="text-[1.04rem] leading-8 text-[var(--color-ink)]/84">
                Todavia no tienes avisos generales de compra, acceso o campus.
              </p>
            </Card>
          )}
        </section>

        <section className="mt-16">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Bell className="h-7 w-7 text-[var(--color-primary)]" />
              <h2 className="text-[3rem] font-semibold tracking-[-0.06em] text-[var(--color-ink)]">
                Notificaciones del foro
              </h2>
            </div>
            {forumNotifications.unreadCount ? (
              <form action={markAllForumNotificationsReadAction}>
                <input name="nextPath" type="hidden" value="/mi-cuenta" />
                <Button type="submit" variant="ghost">
                  Marcar todas como leidas
                </Button>
              </form>
            ) : null}
          </div>

          {forumNotifications.notifications.length ? (
            <div className="space-y-4">
              {forumNotifications.notifications.map((notification) => (
                <Card
                  className="flex flex-col gap-5 p-6 md:flex-row md:items-center md:justify-between"
                  key={notification.id}
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <Badge tone={notification.readAt ? "muted" : "accent"}>
                        {notification.readAt ? "Leida" : "Nueva"}
                      </Badge>
                      <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-muted)]">
                        {formatDateTime(notification.createdAt)}
                      </p>
                    </div>
                    <p className="mt-4 text-[1.3rem] font-semibold text-[var(--color-ink)]">
                      {notification.title}
                    </p>
                    <p className="mt-2 text-[1rem] leading-8 text-[var(--color-muted)]">
                      {notification.body}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <ButtonLink href={notification.linkPath} variant="secondary">
                      Abrir
                    </ButtonLink>
                    {!notification.readAt ? (
                      <form action={markForumNotificationReadAction}>
                        <input name="notificationId" type="hidden" value={notification.id} />
                        <input name="nextPath" type="hidden" value="/mi-cuenta" />
                        <Button type="submit" variant="ghost">
                          Marcar leida
                        </Button>
                      </form>
                    ) : null}
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-8">
              <p className="text-[1.04rem] leading-8 text-[var(--color-ink)]/84">
                Todavia no tienes avisos del foro. Cuando haya respuestas, anuncios docentes
                o acciones relevantes apareceran aqui.
              </p>
            </Card>
          )}
        </section>

        <section className="mt-16">
          <div className="mb-6 flex items-center gap-4">
            <GraduationCap className="h-7 w-7 text-[var(--color-primary)]" />
            <h2 className="text-[3rem] font-semibold tracking-[-0.06em] text-[var(--color-ink)]">
              Cursos con acceso
            </h2>
          </div>

          {spaces.length ? (
            <div className="grid gap-6 xl:grid-cols-3">
              {spaces.map((space) => {
                const isStaff = isStaffCourseRole(space.role);
                const progress = isStaff ? null : progressByCourse.get(space.course.slug);

                return (
                  <Card className="overflow-hidden p-0" key={`${space.course.slug}-${space.role}`}>
                    <div className="relative">
                      <CourseArtwork
                        className="h-44 w-full rounded-none border-0"
                        course={space.course}
                      />
                      <div className="absolute right-4 top-4 rounded-full bg-white px-3 py-1 text-xs font-semibold text-[var(--color-primary)] shadow-sm">
                        {isStaff ? getRoleLabel(space.role) : `Acceso ${space.accessState}`}
                      </div>
                    </div>

                    <div className="p-6">
                      <Badge tone={isStaff ? "teacher" : "student"}>
                        {isStaff ? "Espacio de coordinacion" : "Curso disponible"}
                      </Badge>

                      <h3 className="mt-4 text-[2rem] font-semibold leading-tight tracking-[-0.05em] text-[var(--color-ink)]">
                        {space.course.title}
                      </h3>

                      <div className="mt-8 rounded-[24px] border border-[rgba(12,113,195,0.12)] bg-[var(--color-surface)] p-4">
                        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">
                          {isStaff ? "Seguimiento" : "Progreso real"}
                        </p>
                        {!isStaff && progress ? (
                          <div className="mt-4 h-3 overflow-hidden rounded-full bg-white">
                            <div
                              aria-hidden="true"
                              className="h-full rounded-full bg-[var(--color-primary)] transition-[width]"
                              style={{ width: `${progress.completionRate}%` }}
                            />
                          </div>
                        ) : null}
                        <p className="mt-2 text-sm leading-7 text-[var(--color-ink)]">
                          {isStaff
                            ? "Este espacio corresponde a tu rol de coordinacion. Desde aqui puedes abrir el campus y, si procede, el panel de seguimiento del alumnado."
                            : progress
                              ? progress.isCompleted
                                ? `Has marcado ${progress.completedModules} de ${progress.totalModules} modulos. Curso completado en tu seguimiento manual.`
                                : progress.hasStarted
                                  ? `Has marcado ${progress.completedModules} de ${progress.totalModules} modulos. Quedan ${progress.pendingModules} pendientes por revisar.`
                                  : `Aun no has marcado modulos como revisados. Tienes ${progress.totalModules} modulos disponibles en el campus.`
                              : "Todavia no hay seguimiento registrado para este curso."}
                        </p>
                        {space.enrollment?.accessUntil ? (
                          <p className="mt-2 text-xs uppercase tracking-[0.16em] text-[var(--color-muted)]">
                            Acceso hasta {formatDate(space.enrollment.accessUntil)}
                          </p>
                        ) : null}
                        {!isStaff && progress?.lastCompletedAt ? (
                          <p className="mt-2 text-xs uppercase tracking-[0.16em] text-[var(--color-muted)]">
                            Ultima marca: {formatDate(progress.lastCompletedAt)}
                          </p>
                        ) : null}
                      </div>

                      <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
                        <p className="text-sm text-[var(--color-muted)]">
                          {space.purchase
                            ? `Operacion ${space.purchase.status.toLowerCase()} del ${formatDate(space.purchase.createdAt)}`
                            : `Rol ${getRoleLabel(space.role)}`}
                        </p>
                        <div className="flex flex-wrap gap-3">
                          {!isStaff ? (
                            <ButtonLink href={`/mis-cursos/${space.course.slug}/foro`} variant="secondary">
                              Ir al foro
                            </ButtonLink>
                          ) : null}
                          <ButtonLink href={`/mis-cursos/${space.course.slug}`}>
                            {isStaff ? "Entrar al campus" : "Abrir curso"}
                          </ButtonLink>
                        </div>
                      </div>

                      {!isStaff && space.enrollment ? (
                        <form action={cancelEnrollmentAction} className="mt-4">
                          <input name="enrollmentId" type="hidden" value={space.enrollment.id} />
                          <Button type="submit" variant="ghost">
                            Dar de baja esta matricula
                          </Button>
                        </form>
                      ) : null}
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="p-8">
              <p className="text-[1.04rem] leading-8 text-[var(--color-ink)]/84">
                Todavia no tienes cursos asociados. Cuando completes una compra o te asignen un
                curso, apareceran aqui con su estado de acceso real.
              </p>
              <ButtonLink className="mt-6" href="/cursos">
                Explorar cursos
              </ButtonLink>
            </Card>
          )}
        </section>

        <section className="mt-20">
          <div className="mb-6 flex items-center gap-4">
            <ShieldCheck className="h-7 w-7 text-[var(--color-accent)]" />
            <h2 className="text-[3rem] font-semibold tracking-[-0.06em] text-[var(--color-ink)]">
              Roles y coordinacion
            </h2>
          </div>

          {staffSpaces.length ? (
            <div className="space-y-4">
              {staffSpaces.map((space) => (
                <Card
                  className="flex flex-col gap-5 p-6 md:flex-row md:items-center md:justify-between"
                  key={`staff-${space.course.slug}`}
                >
                  <div className="flex items-center gap-5">
                    <div className="grid h-16 w-16 place-items-center rounded-2xl bg-[var(--color-surface)] text-[var(--color-primary)]">
                      <ShieldCheck className="h-7 w-7" />
                    </div>
                    <div>
                      <p className="text-[1.35rem] font-medium text-[var(--color-ink)]">
                        {space.course.title}
                      </p>
                      <p className="mt-2 text-[1rem] text-[var(--color-muted)]">
                        Rol actual: {getRoleLabel(space.role)}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <ButtonLink href={`/mis-cursos/${space.course.slug}`} variant="secondary">
                      Abrir espacio
                    </ButtonLink>
                    <ButtonLink href={`/mis-cursos/${space.course.slug}/seguimiento`}>
                      Ver progreso
                    </ButtonLink>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-8">
              <p className="text-[1.04rem] leading-8 text-[var(--color-ink)]/84">
                No tienes roles de docencia o administracion asignados en este momento.
              </p>
            </Card>
          )}
        </section>

        <section className="mt-20">
          <div className="mb-6 flex items-center gap-4">
            <Settings2 className="h-7 w-7 text-[var(--color-primary)]" />
            <h2 className="text-[3rem] font-semibold tracking-[-0.06em] text-[var(--color-ink)]">
              Preferencias de notificacion
            </h2>
          </div>

          <Card className="p-8">
            <p className="text-[1.04rem] leading-8 text-[var(--color-ink)]/84">
              Configura como quieres recibir avisos de compra, acceso, campus y foro.
            </p>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {[
                {
                  title: "Solo email",
                  emailEnabled: true,
                  webEnabled: false
                },
                {
                  title: "Solo web",
                  emailEnabled: false,
                  webEnabled: true
                },
                {
                  title: "Email y web",
                  emailEnabled: true,
                  webEnabled: true
                }
              ].map((option) => {
                const isSelected =
                  preference.emailEnabled === option.emailEnabled &&
                  preference.webEnabled === option.webEnabled;

                return (
                  <form action={updateNotificationPreferencesAction} key={option.title}>
                    <input
                      name="emailEnabled"
                      type="hidden"
                      value={option.emailEnabled ? "true" : "false"}
                    />
                    <input
                      name="webEnabled"
                      type="hidden"
                      value={option.webEnabled ? "true" : "false"}
                    />
                    <Button className="w-full" type="submit" variant={isSelected ? "primary" : "secondary"}>
                      {option.title}
                    </Button>
                  </form>
                );
              })}
            </div>
          </Card>
        </section>

        {studentSpaces.length ? (
          <section className="mt-20">
            <div className="mb-6 flex items-center gap-4">
              <BookOpen className="h-7 w-7 text-[var(--color-primary)]" />
              <h2 className="text-[3rem] font-semibold tracking-[-0.06em] text-[var(--color-ink)]">
                Transparencia del campus
              </h2>
            </div>
            <Card className="p-8">
              <p className="text-[1.04rem] leading-8 text-[var(--color-ink)]/84">
                El campus ya permite marcar modulos revisados de forma manual y guardar ese
                seguimiento en tu cuenta. No se infiere visionado, tiempo de estudio ni
                certificados automaticamente.
              </p>
            </Card>
          </section>
        ) : null}
      </div>
    </div>
  );
}

import Link from "next/link";
import {
  AlertCircle,
  ArrowUpRight,
  Award,
  CheckCircle2,
  Download,
  Flag,
  HelpCircle,
  MessageSquare,
  TrendingUp,
  UserPlus,
  Users,
  Wallet,
} from "lucide-react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { ButtonLink } from "@/components/ui/button";
import { getAuditActionLabel } from "@/lib/admin-console";
import { requireAdminConsoleUser } from "@/lib/admin-console-server";
import { parseAuditMetadata } from "@/lib/audit";
import { resolveEditionAccessUntil } from "@/lib/course-editions";
import { isDemoUserId } from "@/lib/demo-auth";
import { getDb } from "@/lib/prisma";
import { cn, formatCompactNumber, formatPrice, formatRelativeTime } from "@/lib/utils";

// ─── helpers ──────────────────────────────────────────────────────────────────

function buildActorInitials(name: string | null | undefined) {
  return (name ?? "SYS")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((c) => c[0]?.toUpperCase())
    .join("");
}

function getActivityIcon(action: string) {
  if (action.includes("ENROLLMENT") || action.includes("PURCHASE")) {
    return { Icon: UserPlus, bg: "bg-emerald-50", color: "text-emerald-600" };
  }
  if (action.includes("FORUM") || action.includes("POST")) {
    return { Icon: MessageSquare, bg: "bg-blue-50", color: "text-blue-600" };
  }
  if (action.includes("MODULE") || action.includes("COMPLETE")) {
    return { Icon: CheckCircle2, bg: "bg-gray-100", color: "text-gray-500" };
  }
  return { Icon: Flag, bg: "bg-[var(--color-surface)]", color: "text-[var(--color-muted)]" };
}

// ─── KPI card ─────────────────────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  change,
  changeLabel,
  icon: Icon,
  positive = true,
}: {
  label: string;
  value: string;
  change?: string;
  changeLabel?: string;
  icon: React.ElementType;
  positive?: boolean;
}) {
  return (
    <div className="rounded-xl border border-[var(--color-border-subtle)] bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-[var(--color-muted)]">{label}</p>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-surface)]">
          <Icon className="h-4 w-4 text-[var(--color-muted)]" strokeWidth={1.8} />
        </div>
      </div>
      <p className="mt-3 text-[2.4rem] font-bold leading-none tracking-[-0.04em] text-[var(--color-ink)]">
        {value}
      </p>
      {change && (
        <p
          className={cn(
            "mt-3 flex items-center gap-1 text-sm font-medium",
            positive ? "text-emerald-600" : "text-[var(--color-danger)]",
          )}
        >
          <TrendingUp className="h-3.5 w-3.5" />
          {change}
          {changeLabel && (
            <span className="font-normal text-[var(--color-muted)]">{changeLabel}</span>
          )}
        </p>
      )}
      {!change && changeLabel && (
        <p className="mt-3 text-sm text-[var(--color-muted)]">{changeLabel}</p>
      )}
    </div>
  );
}

// ─── demo fallback ────────────────────────────────────────────────────────────

function DemoAdminDashboard() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        actions={
          <ButtonLink href="/admin/users" variant="neutral">
            Ver usuarios demo
          </ButtonLink>
        }
        description="Modo demo sin base de datos. Las métricas son simuladas."
        title="Vista General"
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard icon={Users} label="Usuarios Activos Hoy" value="3" changeLabel="Entorno de demo" />
        <KpiCard icon={Wallet} label="Ingresos Netos (Mes)" value="€0" changeLabel="Sin pagos reales" />
        <KpiCard icon={Award} label="Matrículas Activas" value="1" changeLabel="Demo" />
        <KpiCard icon={Flag} label="Cursos Activos" value="3" changeLabel="Catálogo demo" />
      </div>

      <p className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] px-5 py-4 text-sm text-[var(--color-muted)]">
        Conecta la base de datos para ver métricas reales, actividad reciente y rendimiento de cursos.
      </p>
    </div>
  );
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default async function AdminDashboardPage() {
  const user = await requireAdminConsoleUser("/admin");

  if (isDemoUserId(user.id)) {
    return <DemoAdminDashboard />;
  }

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
  const db = getDb();

  const [
    activeUsers,
    monthlyRevenue,
    prevMonthRevenue,
    activeEnrollmentsCount,
    activeCoursesCount,
    coursesWithoutTeachers,
    editionsForReview,
    auditLogs,
    topCourses,
  ] = await Promise.all([
    db.user.count({ where: { isActive: true } }),
    db.purchase.aggregate({
      _sum: { totalInCents: true },
      where: { status: "PAID", createdAt: { gte: startOfMonth } },
    }),
    db.purchase.aggregate({
      _sum: { totalInCents: true },
      where: { status: "PAID", createdAt: { gte: startOfPrevMonth, lte: endOfPrevMonth } },
    }),
    db.courseEnrollment.count({ where: { status: "ACTIVE" } }),
    db.course.count({ where: { status: "ACTIVE" } }),
    db.course.findMany({
      where: { status: "ACTIVE", teacherAssignments: { none: {} } },
      select: { id: true, title: true, slug: true },
      orderBy: { updatedAt: "desc" },
      take: 4,
    }),
    db.courseEdition.findMany({
      where: { isActive: true, status: { in: ["ACTIVE", "CLOSED"] } },
      include: { course: { select: { title: true } } },
      orderBy: { updatedAt: "desc" },
    }),
    db.auditLog.findMany({
      include: { actor: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
    db.course.findMany({
      where: { status: "ACTIVE" },
      include: {
        teacherAssignments: {
          include: { user: { select: { name: true } } },
          orderBy: { createdAt: "asc" },
          take: 1,
        },
      },
      orderBy: { updatedAt: "desc" },
      take: 5,
    }),
  ]);

  // Enrollment counts per top course
  const topCourseIds = topCourses.map((c) => c.id);
  const enrollmentGroups = await db.courseEnrollment.groupBy({
    by: ["courseId"],
    where: { status: "ACTIVE", courseId: { in: topCourseIds } },
    _count: { id: true },
  });
  const enrollmentMap = Object.fromEntries(
    enrollmentGroups.map((g) => [g.courseId, g._count.id]),
  );

  // Derive incidents from real operational data
  const postAccessEditions = editionsForReview.filter((ed) => {
    const accessUntil = resolveEditionAccessUntil({
      startsAt: ed.startsAt,
      endsAt: ed.endsAt,
      graceAccessDays: ed.graceAccessDays,
      accessUntil: ed.accessUntil,
    });
    return (
      ed.status === "CLOSED" ||
      (ed.endsAt !== null &&
        ed.endsAt.getTime() <= now.getTime() &&
        accessUntil !== null &&
        accessUntil.getTime() > now.getTime())
    );
  });

  const openIncidentsCount = coursesWithoutTeachers.length + (postAccessEditions.length > 0 ? 1 : 0);

  const revenueEuros = (monthlyRevenue._sum.totalInCents ?? 0) / 100;
  const prevRevenueEuros = (prevMonthRevenue._sum.totalInCents ?? 0) / 100;
  const revenueChangePct = prevRevenueEuros > 0
    ? ((revenueEuros - prevRevenueEuros) / prevRevenueEuros * 100)
    : null;
  const revenueChangeStr = revenueChangePct !== null
    ? `${revenueChangePct >= 0 ? "+" : ""}${revenueChangePct.toFixed(1)}%`
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-ink)]">Vista General</h1>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            Métricas clave y estado del sistema en tiempo real.
          </p>
        </div>
        <Link
          className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-[var(--color-border-subtle)] bg-white px-4 py-2.5 text-sm font-semibold text-[var(--color-ink)] shadow-sm transition hover:bg-[var(--color-surface)]"
          href="/admin/audit/export?range=30d&actorId=ALL&action=ALL&entity=ALL&q="
        >
          <Download className="h-4 w-4" />
          Exportar Reporte
        </Link>
      </div>

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          icon={Users}
          label="Usuarios Registrados"
          value={formatCompactNumber(activeUsers)}
          changeLabel="Usuarios activos en la plataforma"
        />
        <KpiCard
          change={revenueChangeStr ?? undefined}
          changeLabel={revenueChangeStr ? "vs mes anterior" : prevRevenueEuros === 0 ? "Sin ventas el mes anterior" : undefined}
          positive={revenueChangePct !== null ? revenueChangePct >= 0 : true}
          icon={Wallet}
          label="Ingresos Netos (Mes)"
          value={formatPrice(revenueEuros * 100)}
        />
        <KpiCard
          changeLabel="Matrículas activas"
          icon={Award}
          label="Matrículas Activas"
          value={formatCompactNumber(activeEnrollmentsCount)}
        />
        <KpiCard
          changeLabel="Cursos publicados"
          icon={Flag}
          label="Cursos Activos"
          value={String(activeCoursesCount)}
        />
      </div>

      {/* Activity + Incidents */}
      <div className="grid gap-5 xl:grid-cols-2">
        {/* Actividad Reciente */}
        <div className="rounded-xl border border-[var(--color-border-subtle)] bg-white p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[var(--color-ink)]">Actividad Reciente</h2>
            <Link
              className="flex items-center gap-1 text-sm font-medium text-[var(--color-primary)] transition hover:underline"
              href="/admin/audit"
            >
              Ver todo <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="mt-4 divide-y divide-[var(--color-border-subtle)]">
            {auditLogs.length > 0 ? (
              auditLogs.map((log) => {
                const meta = parseAuditMetadata(log.metadataJson);
                const { Icon, bg, color } = getActivityIcon(log.action);
                const actorName = log.actor?.name ?? "Sistema";
                const actionLabel = getAuditActionLabel(log.action);
                const entityLabel = log.entityLabel ?? log.entityType ?? "";
                const detail = [
                  entityLabel,
                  meta?.nextRole ? `Rol: ${String(meta.nextRole)}` : null,
                ]
                  .filter(Boolean)
                  .join(" · ");

                return (
                  <div className="flex items-start gap-3 py-4 first:pt-0 last:pb-0" key={log.id}>
                    <div
                      className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                        bg,
                      )}
                    >
                      <Icon className={cn("h-4 w-4", color)} strokeWidth={2} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm leading-snug text-[var(--color-ink)]">
                        <strong>{actorName}</strong>{" "}
                        <span className="text-[var(--color-muted)]">
                          {actionLabel.toLowerCase()}
                        </span>{" "}
                        {detail && (
                          <span className="font-medium">&ldquo;{detail}&rdquo;</span>
                        )}
                      </p>
                      <p className="mt-1 text-xs text-[var(--color-muted)]">
                        {formatRelativeTime(log.createdAt)}
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="py-8 text-center text-sm text-[var(--color-muted)]">
                No hay actividad reciente.
              </p>
            )}
          </div>
        </div>

        {/* Estado de Incidencias */}
        <div className="rounded-xl border border-[var(--color-border-subtle)] bg-white p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[var(--color-ink)]">
              Estado de Incidencias
            </h2>
            {openIncidentsCount > 0 && (
              <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-bold text-red-700">
                {openIncidentsCount} Abiertas
              </span>
            )}
          </div>

          <div className="mt-4 divide-y divide-[var(--color-border-subtle)]">
            {/* Courses without teachers */}
            {coursesWithoutTeachers.slice(0, 2).map((course, i) => (
              <div className="flex items-start justify-between gap-3 py-4" key={course.id}>
                <div className="flex items-start gap-3">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                  <div>
                    <p className="text-sm font-semibold text-[var(--color-ink)]">
                      Curso sin docente asignado
                    </p>
                    <p className="mt-0.5 text-xs text-[var(--color-muted)]">
                      <Link
                        className="hover:underline"
                        href={`/admin/courses?courseId=${course.id}`}
                      >
                        {course.title}
                      </Link>{" "}
                      · Requiere asignación
                    </p>
                  </div>
                </div>
                <span className="shrink-0 rounded-full bg-red-100 px-2.5 py-1 text-[0.65rem] font-bold text-red-700">
                  Crítica
                </span>
              </div>
            ))}

            {/* Post-access editions */}
            {postAccessEditions.slice(0, 1).map((edition) => (
              <div className="flex items-start justify-between gap-3 py-4" key={edition.id}>
                <div className="flex items-start gap-3">
                  <HelpCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                  <div>
                    <p className="text-sm font-semibold text-[var(--color-ink)]">
                      Revisión de acceso post-edición
                    </p>
                    <p className="mt-0.5 text-xs text-[var(--color-muted)]">
                      {edition.course.title} · Acceso de consulta vigente
                    </p>
                  </div>
                </div>
                <span className="shrink-0 rounded-full bg-amber-100 px-2.5 py-1 text-[0.65rem] font-bold text-amber-700">
                  Media
                </span>
              </div>
            ))}

            {/* Resolved if everything is fine */}
            {openIncidentsCount === 0 && (
              <div className="flex items-start justify-between gap-3 py-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                  <div>
                    <p className="text-sm font-semibold text-[var(--color-ink)]">
                      Sin incidencias activas
                    </p>
                    <p className="mt-0.5 text-xs text-[var(--color-muted)]">
                      Todos los cursos y ediciones están operativos
                    </p>
                  </div>
                </div>
                <span className="shrink-0 rounded-full bg-emerald-100 px-2.5 py-1 text-[0.65rem] font-bold text-emerald-700">
                  OK
                </span>
              </div>
            )}

          </div>

          <div className="mt-4 border-t border-[var(--color-border-subtle)] pt-4">
            <ButtonLink className="w-full justify-center" href="/admin/supervision">
              Gestionar Soporte
            </ButtonLink>
          </div>
        </div>
      </div>

      {/* Course performance table */}
      <div className="rounded-xl border border-[var(--color-border-subtle)] bg-white p-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-[var(--color-ink)]">
              Rendimiento de Cursos (Top 5)
            </h2>
            <p className="mt-0.5 text-xs text-[var(--color-muted)]">
              Basado en inscripciones de los últimos 30 días.
            </p>
          </div>
          <Link
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--color-border-subtle)] text-[var(--color-muted)] transition hover:bg-[var(--color-surface)]"
            href="/admin/courses"
            title="Ver todos los cursos"
          >
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[600px] text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border-subtle)]">
                {["Nombre del Curso", "Instructor", "Inscritos Activos", "Tendencia"].map(
                  (col) => (
                    <th
                      className="pb-3 text-left text-xs font-semibold uppercase tracking-[0.1em] text-[var(--color-muted)]"
                      key={col}
                    >
                      {col}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border-subtle)]">
              {topCourses.length > 0 ? (
                topCourses.map((course) => {
                  const instructor =
                    course.teacherAssignments[0]?.user.name ?? "—";
                  const enrolled = enrollmentMap[course.id] ?? 0;

                  return (
                    <tr className="group" key={course.id}>
                      <td className="py-3.5 pr-4 font-medium text-[var(--color-ink)]">
                        <Link
                          className="hover:text-[var(--color-primary)] hover:underline"
                          href={`/admin/courses?courseId=${course.id}`}
                        >
                          {course.title}
                        </Link>
                      </td>
                      <td className="py-3.5 pr-4 text-[var(--color-muted)]">{instructor}</td>
                      <td className="py-3.5 pr-4 text-[var(--color-ink)]">
                        {formatCompactNumber(enrolled)}
                      </td>
                      <td className="py-3.5">
                        <TrendingUp
                          className={cn(
                            "h-4 w-4",
                            enrolled > 0 ? "text-emerald-500" : "text-[var(--color-muted)]",
                          )}
                        />
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td className="py-8 text-center text-[var(--color-muted)]" colSpan={4}>
                    No hay cursos activos todavía.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

import type { UserGlobalRole } from "@prisma/client";
import { ShieldCheck, UserPlus, UsersRound } from "lucide-react";
import {
  createTeacherAction,
  toggleUserActiveAction,
  updateUserRoleAction
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
import { getDemoUsers, isDemoUserId } from "@/lib/demo-auth";
import { getDb } from "@/lib/prisma";
import { formatDate, formatRelativeTime } from "@/lib/utils";

type UsersPageProps = {
  searchParams: Promise<{
    q?: string | string[];
    role?: string | string[];
    status?: string | string[];
  }>;
};

export default async function AdminUsersPage({ searchParams }: UsersPageProps) {
  const currentUser = await requireAdminConsoleUser("/admin/users");
  const params = await searchParams;
  const q = getSearchParamValue(params.q);
  const role = getSearchParamValue(params.role, "ALL");
  const status = getSearchParamValue(params.status, "ALL");

  if (isDemoUserId(currentUser.id)) {
    const demoUsers = getDemoUsers().filter((user) => {
      const matchesQ =
        !q ||
        user.name.toLowerCase().includes(q.toLowerCase()) ||
        user.email.toLowerCase().includes(q.toLowerCase());
      const matchesRole = role === "ALL" || user.globalRole === role;
      const matchesStatus = status === "ALL" || status === "ACTIVE";

      return matchesQ && matchesRole && matchesStatus;
    });

    return (
      <div className="space-y-9">
        <AdminPageHeader
          actions={
            <ButtonLink href="/admin" variant="secondary">
              Volver al dashboard
            </ButtonLink>
          }
          description="Directorio de demostracion. Estas cuentas solo existen para revisar la interfaz mientras la base de datos sigue pendiente."
          title="Usuarios"
        />

        <section className="grid gap-5 xl:grid-cols-[1.2fr_1fr_1fr]">
          <AdminMetricCard
            accent="primary"
            icon={<UsersRound className="h-6 w-6" strokeWidth={1.8} />}
            label="Usuarios totales"
            meta="3 activos en modo demo"
            value="3"
          />
          <AdminMetricCard
            accent="neutral"
            icon={<ShieldCheck className="h-6 w-6" strokeWidth={1.8} />}
            label="Administradores activos"
            meta="Credenciales de prueba"
            value="1"
          />
          <Card className="rounded-[1.9rem] p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#314255]">
              Filtros
            </p>
            <form className="mt-4 grid gap-3 md:grid-cols-3">
              <Input defaultValue={q} name="q" placeholder="Buscar..." />
              <select
                className="h-12 rounded-xl border border-[var(--color-border)] bg-white px-4 text-sm"
                defaultValue={role}
                name="role"
              >
                <option value="ALL">Todos los roles</option>
                <option value="STUDENT">Alumnos</option>
                <option value="TEACHER">Docentes</option>
                <option value="ADMIN">Administradores</option>
              </select>
              <div className="flex gap-3">
                <select
                  className="h-12 flex-1 rounded-xl border border-[var(--color-border)] bg-white px-4 text-sm"
                  defaultValue={status}
                  name="status"
                >
                  <option value="ALL">Cualquier estado</option>
                  <option value="ACTIVE">Solo activos</option>
                </select>
                <SubmitButton className="px-5" pendingLabel="Filtrando..." variant="secondary">
                  Aplicar
                </SubmitButton>
              </div>
            </form>
          </Card>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.55fr_0.9fr]">
          <Card className="overflow-hidden rounded-[2rem]">
            <div className="border-b border-[#dce3eb] px-7 py-6">
              <h2 className="text-[2rem] font-semibold tracking-[-0.06em] text-[var(--color-ink)]">
                Directorio de usuarios
              </h2>
              <p className="mt-2 text-[1rem] text-[#4f6276]">
                {demoUsers.length} resultados de prueba.
              </p>
            </div>

            <div className="divide-y divide-[#dde5ed]">
              {demoUsers.map((account) => (
                <div className="space-y-5 px-7 py-6" key={account.id}>
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="grid h-14 w-14 place-items-center rounded-full bg-[rgba(12,113,195,0.12)] text-base font-semibold text-[var(--color-primary)]">
                        {getUserInitials(account.name)}
                      </div>
                      <div>
                        <p className="text-[1.2rem] font-semibold text-[var(--color-ink)]">
                          {account.name}
                        </p>
                        <p className="text-sm text-[#5d6d7d]">{account.email}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <AdminStatusBadge tone={getRoleTone(account.globalRole)}>
                        {getRoleFilterLabel(account.globalRole)}
                      </AdminStatusBadge>
                      <AdminStatusBadge tone="primary">Activa</AdminStatusBadge>
                    </div>
                  </div>

                  <div className="grid gap-4 text-sm text-[#425467] md:grid-cols-4">
                    <div>
                      <p className="font-semibold text-[#28394b]">Alta</p>
                      <p className="mt-1">{formatDate(account.createdAt)}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-[#28394b]">Actividad</p>
                      <p className="mt-1">{formatRelativeTime(account.createdAt)}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-[#28394b]">Campus</p>
                      <p className="mt-1">Datos simulados para navegacion</p>
                    </div>
                    <div>
                      <p className="font-semibold text-[#28394b]">Notificaciones</p>
                      <p className="mt-1">Email + web</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="rounded-[2rem] p-7" id="create-teacher">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[rgba(12,113,195,0.1)] text-[var(--color-primary)]">
                <UserPlus className="h-5 w-5" strokeWidth={1.8} />
              </div>
              <div>
                <h2 className="text-[1.8rem] font-semibold tracking-[-0.05em] text-[var(--color-ink)]">
                  Credenciales demo
                </h2>
                <p className="mt-1 text-sm leading-6 text-[#52667b]">
                  Usa estas cuentas en la pantalla de acceso mientras la base de datos no este conectada.
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-4 rounded-2xl border border-[#d8e0e8] bg-[#f7fafc] px-4 py-4 text-sm leading-7 text-[#4c6074]">
              <p>
                <span className="font-mono">admin.demo@autismo.local</span>
              </p>
              <p>
                <span className="font-mono">docente.demo@autismo.local</span>
              </p>
              <p>
                <span className="font-mono">alumno.demo@autismo.local</span>
              </p>
              <p>
                Contrasena: <span className="font-mono">demo12345</span>
              </p>
            </div>
          </Card>
        </section>
      </div>
    );
  }

  const db = getDb();

  const [users, totalUsers, activeUsers, adminUsers] = await Promise.all([
    db.user.findMany({
      where: {
        ...(q
          ? {
              OR: [
                { name: { contains: q } },
                { email: { contains: q } }
              ]
            }
          : {}),
        ...(role !== "ALL"
          ? {
              globalRole: role as UserGlobalRole
            }
          : {}),
        ...(status === "ACTIVE"
          ? { isActive: true }
          : status === "INACTIVE"
            ? { isActive: false }
            : {})
      },
      include: {
        notificationPreference: true,
        _count: {
          select: {
            enrollments: true,
            purchases: true,
            courseAssignments: true
          }
        }
      },
      orderBy: [
        {
          isActive: "desc"
        },
        {
          createdAt: "desc"
        }
      ]
    }),
    db.user.count(),
    db.user.count({ where: { isActive: true } }),
    db.user.count({ where: { globalRole: "ADMIN", isActive: true } })
  ]);

  return (
    <div className="space-y-9">
      <AdminPageHeader
        actions={
          <ButtonLink href="#create-teacher" variant="secondary">
            Crear docente
          </ButtonLink>
        }
        description="Gestion de cuentas, roles globales, estado de acceso y altas de profesorado. El administrador acumula capacidades de docente, pero solo aqui puede gestionar permisos globales."
        title="Usuarios"
      />

      <section className="grid gap-5 xl:grid-cols-[1.2fr_1fr_1fr]">
        <AdminMetricCard
          accent="primary"
          icon={<UsersRound className="h-6 w-6" strokeWidth={1.8} />}
          label="Usuarios totales"
          meta={`${activeUsers} activos`}
          value={totalUsers}
        />
        <AdminMetricCard
          accent="neutral"
          icon={<ShieldCheck className="h-6 w-6" strokeWidth={1.8} />}
          label="Administradores activos"
          meta="El admin mantiene tambien acceso docente"
          value={adminUsers}
        />
        <Card className="rounded-[1.9rem] p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#314255]">
            Filtros
          </p>
          <form className="mt-4 grid gap-3 md:grid-cols-3">
            <Input defaultValue={q} name="q" placeholder="Buscar..." />
            <select
              className="h-12 rounded-xl border border-[var(--color-border)] bg-white px-4 text-sm"
              defaultValue={role}
              name="role"
            >
              <option value="ALL">Todos los roles</option>
              <option value="STUDENT">Alumnos</option>
              <option value="TEACHER">Docentes</option>
              <option value="ADMIN">Administradores</option>
            </select>
            <div className="flex gap-3">
              <select
                className="h-12 flex-1 rounded-xl border border-[var(--color-border)] bg-white px-4 text-sm"
                defaultValue={status}
                name="status"
              >
                <option value="ALL">Cualquier estado</option>
                <option value="ACTIVE">Solo activos</option>
                <option value="INACTIVE">Solo inactivos</option>
              </select>
              <SubmitButton className="px-5" pendingLabel="Filtrando..." variant="secondary">
                Aplicar
              </SubmitButton>
            </div>
          </form>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.55fr_0.9fr]">
        <Card className="overflow-hidden rounded-[2rem]">
          <div className="border-b border-[#dce3eb] px-7 py-6">
            <h2 className="text-[2rem] font-semibold tracking-[-0.06em] text-[var(--color-ink)]">
              Directorio de usuarios
            </h2>
            <p className="mt-2 text-[1rem] text-[#4f6276]">
              {users.length} resultados · filtro por rol, estado y busqueda directa.
            </p>
          </div>

          <div className="divide-y divide-[#dde5ed]">
            {users.map((account) => {
              const notificationSummary = account.notificationPreference
                ? account.notificationPreference.emailEnabled &&
                  account.notificationPreference.webEnabled
                  ? "Email + web"
                  : account.notificationPreference.emailEnabled
                    ? "Solo email"
                    : account.notificationPreference.webEnabled
                      ? "Solo web"
                      : "Sin notificaciones"
                : "Sin configurar";

              return (
                <div className="space-y-5 px-7 py-6" key={account.id}>
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="grid h-14 w-14 place-items-center rounded-full bg-[rgba(12,113,195,0.12)] text-base font-semibold text-[var(--color-primary)]">
                        {getUserInitials(account.name)}
                      </div>
                      <div>
                        <p className="text-[1.2rem] font-semibold text-[var(--color-ink)]">
                          {account.name}
                        </p>
                        <p className="text-sm text-[#5d6d7d]">{account.email}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <AdminStatusBadge tone={getRoleTone(account.globalRole)}>
                        {getRoleFilterLabel(account.globalRole)}
                      </AdminStatusBadge>
                      <AdminStatusBadge tone={account.isActive ? "primary" : "danger"}>
                        {account.isActive ? "Activa" : "Desactivada"}
                      </AdminStatusBadge>
                    </div>
                  </div>

                  <div className="grid gap-4 text-sm text-[#425467] md:grid-cols-4">
                    <div>
                      <p className="font-semibold text-[#28394b]">Alta</p>
                      <p className="mt-1">{formatDate(account.createdAt)}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-[#28394b]">Actividad</p>
                      <p className="mt-1">{formatRelativeTime(account.updatedAt)}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-[#28394b]">Campus</p>
                      <p className="mt-1">
                        {account._count.enrollments} matriculas · {account._count.purchases} compras
                      </p>
                    </div>
                    <div>
                      <p className="font-semibold text-[#28394b]">Notificaciones</p>
                      <p className="mt-1">{notificationSummary}</p>
                    </div>
                  </div>

                  <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
                    <form action={updateUserRoleAction} className="grid gap-3 md:grid-cols-[1fr_auto]">
                      <input name="userId" type="hidden" value={account.id} />
                      <select
                        className="h-12 rounded-xl border border-[var(--color-border)] bg-white px-4 text-sm"
                        defaultValue={account.globalRole}
                        name="globalRole"
                      >
                        <option value="STUDENT">Alumno</option>
                        <option value="TEACHER">Docente</option>
                        <option value="ADMIN">Administrador</option>
                      </select>
                      <SubmitButton pendingLabel="Guardando..." variant="secondary">
                        Guardar rol
                      </SubmitButton>
                    </form>

                    <form action={toggleUserActiveAction} className="grid gap-3 md:grid-cols-[1fr_auto]">
                      <input name="userId" type="hidden" value={account.id} />
                      <input
                        name="active"
                        type="hidden"
                        value={account.isActive ? "false" : "true"}
                      />
                      <div className="rounded-xl border border-[#d5dee7] bg-[#f7fafc] px-4 py-3 text-sm text-[#415467]">
                        {account.isActive
                          ? "Baja logica con historico y auditoria."
                          : "Reactivacion inmediata de la cuenta."}
                      </div>
                      <SubmitButton
                        pendingLabel="Actualizando..."
                        variant={account.isActive ? "ghost" : "primary"}
                      >
                        {account.isActive ? "Dar de baja" : "Reactivar"}
                      </SubmitButton>
                    </form>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="rounded-[2rem] p-7" id="create-teacher">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[rgba(12,113,195,0.1)] text-[var(--color-primary)]">
              <UserPlus className="h-5 w-5" strokeWidth={1.8} />
            </div>
            <div>
              <h2 className="text-[1.8rem] font-semibold tracking-[-0.05em] text-[var(--color-ink)]">
                Crear docente
              </h2>
              <p className="mt-1 text-sm leading-6 text-[#52667b]">
                Alta controlada. Solo administracion puede crear profesorado.
              </p>
            </div>
          </div>

          <form action={createTeacherAction} className="mt-6 space-y-4">
            <Input name="name" placeholder="Nombre y apellidos" required />
            <Input name="email" placeholder="correo@dominio.com" required type="email" />
            <Input
              minLength={8}
              name="password"
              placeholder="Contrasena temporal"
              required
              type="password"
            />
            <div className="rounded-2xl border border-[#d8e0e8] bg-[#f7fafc] px-4 py-4 text-sm leading-7 text-[#4c6074]">
              La cuenta se crea activa, con rol global docente y preferencias basicas de notificacion.
            </div>
            <SubmitButton className="w-full" pendingLabel="Creando docente...">
              Crear docente
            </SubmitButton>
          </form>
        </Card>
      </section>
    </div>
  );
}

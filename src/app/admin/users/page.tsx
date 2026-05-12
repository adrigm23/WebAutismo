import type { UserGlobalRole } from "@prisma/client";
import { ShieldCheck, UsersRound } from "lucide-react";
import { AdminMetricCard } from "@/components/admin/admin-metric-card";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { CreateTeacherCard } from "@/components/admin/users/create-teacher-card";
import { DemoAccessCard } from "@/components/admin/users/demo-access-card";
import { DemoUserDirectoryCard } from "@/components/admin/users/demo-user-directory-card";
import type { UserRoleFilter, UserStatusFilter } from "@/components/admin/users/types";
import { UserDirectoryCard } from "@/components/admin/users/user-directory-card";
import { UserFiltersCard } from "@/components/admin/users/user-filters-card";
import { ButtonLink } from "@/components/ui/button";
import {
  getSearchParamValue
} from "@/lib/admin-console";
import { requireAdminConsoleUser } from "@/lib/admin-console-server";
import { getDemoUsers, isDemoUserId } from "@/lib/demo-auth";
import { getDb } from "@/lib/prisma";

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
  const role = getSearchParamValue(params.role, "ALL") as UserRoleFilter;
  const status = getSearchParamValue(params.status, "ALL") as UserStatusFilter;

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
          <UserFiltersCard includeInactive={false} q={q} role={role} status={status} />
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.55fr_0.9fr]">
          <DemoUserDirectoryCard users={demoUsers} />
          <DemoAccessCard />
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
        <UserFiltersCard includeInactive q={q} role={role} status={status} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.55fr_0.9fr]">
        <UserDirectoryCard users={users} />
        <CreateTeacherCard />
      </section>
    </div>
  );
}

import {
  toggleUserActiveAction,
  updateUserRoleAction
} from "@/actions/admin";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { Card } from "@/components/ui/card";
import { SubmitButton } from "@/components/ui/submit-button";
import {
  getRoleFilterLabel,
  getRoleTone,
  getUserInitials
} from "@/lib/admin-console";
import { formatDate, formatRelativeTime } from "@/lib/utils";
import type { UserDirectoryItem } from "./types";

function getNotificationSummary(user: UserDirectoryItem) {
  if (!user.notificationPreference) {
    return "Sin configurar";
  }

  if (user.notificationPreference.emailEnabled && user.notificationPreference.webEnabled) {
    return "Email + web";
  }

  if (user.notificationPreference.emailEnabled) {
    return "Solo email";
  }

  if (user.notificationPreference.webEnabled) {
    return "Solo web";
  }

  return "Sin notificaciones";
}

export function UserDirectoryCard({
  users
}: {
  users: UserDirectoryItem[];
}) {
  return (
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
        {users.map((account) => (
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
                <p className="mt-1">{getNotificationSummary(account)}</p>
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
                <input name="active" type="hidden" value={account.isActive ? "false" : "true"} />
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
        ))}
      </div>
    </Card>
  );
}

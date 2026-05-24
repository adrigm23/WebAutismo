import {
  toggleUserActiveAction,
  updateUserRoleAction
} from "@/actions/admin";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ListRow } from "@/components/ui/list-row";
import { SubmitButton } from "@/components/ui/submit-button";
import { SurfaceCard } from "@/components/ui/surface-card";
import {
  getRoleFilterLabel,
  getRoleTone,
  getUserInitials
} from "@/lib/admin-console";
import { formatDate, formatRelativeTime } from "@/lib/utils";
import type { UserDirectoryItem } from "./types";

const nativeSelectClassName =
  "ui-control-base h-[var(--control-height-md)] w-full min-w-0 bg-[color:var(--color-surface-elevated)] px-4 text-sm text-[var(--color-ink)]";

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
    <SurfaceCard className="min-w-0 overflow-hidden p-0">
      <div className="border-b border-[var(--color-border-subtle)] px-4 py-5 sm:px-6 sm:py-6">
        <h2 className="text-display-md font-semibold text-[var(--color-ink)]">
          Directorio de usuarios
        </h2>
        <p className="mt-2 text-sm leading-7 text-[var(--color-muted)]">
          {users.length} resultados - filtro por rol, estado y busqueda directa.
        </p>
      </div>

      <div className="divide-y divide-[var(--color-border-subtle)]">
        {users.length ? users.map((account) => (
          <div className="space-y-4 px-4 py-4 sm:px-6 sm:py-5" key={account.id}>
            <ListRow
              className="gap-3 border-0 bg-transparent px-0 py-0 [&>div:nth-child(2)>p:first-of-type]:text-lg [&>div:nth-child(2)>p:first-of-type]:leading-7"
              description={<span className="block break-all">{account.email}</span>}
              leading={
                <div className="grid size-12 place-items-center rounded-full bg-[color:color-mix(in_srgb,var(--color-primary-soft)_76%,white)] text-sm font-semibold text-[var(--color-primary)]">
                  {getUserInitials(account.name)}
                </div>
              }
              title={account.name}
              trailing={
                <div className="flex max-w-full flex-wrap items-center gap-2">
                  <AdminStatusBadge tone={getRoleTone(account.globalRole)}>
                    {getRoleFilterLabel(account.globalRole)}
                  </AdminStatusBadge>
                  <AdminStatusBadge tone={account.isActive ? "primary" : "danger"}>
                    {account.isActive ? "Activa" : "Desactivada"}
                  </AdminStatusBadge>
                </div>
              }
            />

            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
              <ListRow
                className="min-w-0 gap-2.5 px-3.5 py-3"
                emphasis="muted"
                eyebrow="Alta"
                title={formatDate(account.createdAt)}
              />
              <ListRow
                className="min-w-0 gap-2.5 px-3.5 py-3"
                emphasis="muted"
                eyebrow="Actividad"
                title={formatRelativeTime(account.updatedAt)}
              />
              <ListRow
                className="min-w-0 gap-2.5 px-3.5 py-3"
                emphasis="muted"
                eyebrow="Campus"
                title={`${account._count.enrollments} matriculas`}
                description={`${account._count.purchases} compras`}
              />
              <ListRow
                className="min-w-0 gap-2.5 px-3.5 py-3"
                emphasis="muted"
                eyebrow="Notificaciones"
                title={getNotificationSummary(account)}
              />
            </div>

            <div className="grid gap-3 2xl:grid-cols-2">
              <form
                action={updateUserRoleAction}
                className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[color:var(--color-surface)] p-3.5"
              >
                <input name="userId" type="hidden" value={account.id} />
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                  <label className="min-w-0 flex-1">
                    <span className="mb-1.5 block text-meta-xs font-semibold text-[var(--color-muted)]">
                      Rol global
                    </span>
                    <select
                      aria-label={`Rol global de ${account.name}`}
                      className={nativeSelectClassName}
                      defaultValue={account.globalRole}
                      name="globalRole"
                    >
                      <option value="STUDENT">Alumno</option>
                      <option value="TEACHER">Docente</option>
                      <option value="ADMIN">Administrador</option>
                    </select>
                  </label>
                  <SubmitButton
                    className="w-full sm:w-auto sm:shrink-0"
                    pendingLabel="Guardando..."
                    size="sm"
                    variant="secondary"
                  >
                    Guardar rol
                  </SubmitButton>
                </div>
              </form>

              <form
                action={toggleUserActiveAction}
                className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[color:var(--color-surface)] p-3.5"
              >
                <input name="userId" type="hidden" value={account.id} />
                <input name="active" type="hidden" value={account.isActive ? "false" : "true"} />
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                  <div className="min-w-0 flex-1 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[color:var(--color-bg-subtle)] px-3.5 py-3">
                    <p className="text-meta-xs font-semibold text-[var(--color-ink-soft)]">
                      Estado de acceso
                    </p>
                    <p className="mt-1.5 text-sm leading-6 text-[var(--color-muted)]">
                      {account.isActive
                        ? "Baja logica con historico y auditoria."
                        : "Reactivacion inmediata de la cuenta."}
                    </p>
                  </div>
                  <SubmitButton
                    className="w-full sm:w-auto sm:shrink-0"
                    pendingLabel="Actualizando..."
                    size="sm"
                    variant={account.isActive ? "ghost" : "primary"}
                  >
                    {account.isActive ? "Dar de baja" : "Reactivar"}
                  </SubmitButton>
                </div>
              </form>
            </div>
          </div>
        )) : (
          <div className="px-4 py-5 sm:px-6 sm:py-6">
            <EmptyState
              align="center"
              description="Ajusta la busqueda, el rol o el estado para encontrar la cuenta que necesitas gestionar."
              title="No hay usuarios visibles"
              tone="subtle"
            />
          </div>
        )}
      </div>
    </SurfaceCard>
  );
}

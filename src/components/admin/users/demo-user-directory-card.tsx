import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ListRow } from "@/components/ui/list-row";
import { SurfaceCard } from "@/components/ui/surface-card";
import {
  getRoleFilterLabel,
  getRoleTone,
  getUserInitials
} from "@/lib/admin-console";
import { formatDate, formatRelativeTime } from "@/lib/utils";
import type { DemoUserDirectoryItem } from "./types";

export function DemoUserDirectoryCard({
  users
}: {
  users: DemoUserDirectoryItem[];
}) {
  return (
    <SurfaceCard className="min-w-0 overflow-hidden p-0">
      <div className="border-b border-[var(--color-border-subtle)] px-4 py-5 sm:px-6 sm:py-6">
        <h2 className="text-display-md font-semibold text-[var(--color-ink)]">
          Directorio de usuarios
        </h2>
        <p className="mt-2 text-sm leading-7 text-[var(--color-muted)]">
          {users.length} resultados de prueba.
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
                  <AdminStatusBadge tone="primary">Activa</AdminStatusBadge>
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
                title={formatRelativeTime(account.createdAt)}
              />
              <ListRow
                className="min-w-0 gap-2.5 px-3.5 py-3"
                emphasis="muted"
                eyebrow="Campus"
                title="Datos simulados"
                description="Solo navegacion demo"
              />
              <ListRow
                className="min-w-0 gap-2.5 px-3.5 py-3"
                emphasis="muted"
                eyebrow="Notificaciones"
                title="Email + web"
              />
            </div>
          </div>
        )) : (
          <div className="px-4 py-5 sm:px-6 sm:py-6">
            <EmptyState
              align="center"
              description="Ajusta los filtros activos para volver a mostrar las cuentas demo disponibles."
              title="No hay usuarios demo visibles"
              tone="subtle"
            />
          </div>
        )}
      </div>
    </SurfaceCard>
  );
}

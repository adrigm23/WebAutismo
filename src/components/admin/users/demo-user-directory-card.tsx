import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { Card } from "@/components/ui/card";
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
    <Card className="overflow-hidden rounded-[2rem]">
      <div className="border-b border-[#dce3eb] px-7 py-6">
        <h2 className="text-[2rem] font-semibold tracking-[-0.06em] text-[var(--color-ink)]">
          Directorio de usuarios
        </h2>
        <p className="mt-2 text-[1rem] text-[#4f6276]">{users.length} resultados de prueba.</p>
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
  );
}

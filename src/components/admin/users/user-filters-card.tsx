import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import type { UserRoleFilter, UserStatusFilter } from "./types";

export function UserFiltersCard({
  q,
  role,
  status,
  includeInactive,
}: {
  q: string;
  role: UserRoleFilter;
  status: UserStatusFilter;
  includeInactive: boolean;
}) {
  return (
    <Card className="rounded-[1.9rem] p-5 sm:p-6">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#314255]">
        Filtros
      </p>
      <form className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.95fr)]">
        <Input
          className="min-w-0 w-full"
          defaultValue={q}
          name="q"
          placeholder="Buscar..."
        />
        <select
          className="h-12 min-w-0 w-full rounded-xl border border-[var(--color-border)] bg-white px-4 text-sm"
          defaultValue={role}
          name="role"
        >
          <option value="ALL">Todos los roles</option>
          <option value="STUDENT">Alumnos</option>
          <option value="TEACHER">Docentes</option>
          <option value="ADMIN">Administradores</option>
        </select>
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] md:col-span-2 xl:col-span-1 2xl:col-span-2">
          <select
            className="h-12 min-w-0 w-full rounded-xl border border-[var(--color-border)] bg-white px-4 text-sm"
            defaultValue={status}
            name="status"
          >
            <option value="ALL">Cualquier estado</option>
            <option value="ACTIVE">Solo activos</option>
            {includeInactive ? (
              <option value="INACTIVE">Solo inactivos</option>
            ) : null}
          </select>
          <SubmitButton
            className="w-full sm:w-auto sm:px-5"
            pendingLabel="Filtrando..."
            variant="secondary"
          >
            Aplicar
          </SubmitButton>
        </div>
      </form>
    </Card>
  );
}

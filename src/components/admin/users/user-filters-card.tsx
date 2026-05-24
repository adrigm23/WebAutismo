import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import { SurfaceCard } from "@/components/ui/surface-card";
import type { UserRoleFilter, UserStatusFilter } from "./types";

export function UserFiltersCard({
  q,
  role,
  status,
  includeInactive
}: {
  q: string;
  role: UserRoleFilter;
  status: UserStatusFilter;
  includeInactive: boolean;
}) {
  return (
    <SurfaceCard
      className="scroll-mt-28"
      id="user-filters"
      padding="md"
      title="Filtros"
      description="Refina el directorio por busqueda directa, rol global y estado de acceso."
    >
      <form className="grid gap-3 md:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.95fr)]">
        <label className="relative block">
          <span className="sr-only">Buscar por nombre o correo</span>
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[var(--color-text-muted)]"
            strokeWidth={2}
          />
          <Input
            className="min-w-0 w-full pl-11"
            defaultValue={q}
            name="q"
            placeholder="Buscar nombre o correo..."
          />
        </label>

        <Select defaultValue={role} name="role">
          <SelectTrigger aria-label="Rol global">
            <SelectValue placeholder="Todos los roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos los roles</SelectItem>
            <SelectItem value="STUDENT">Alumnos</SelectItem>
            <SelectItem value="TEACHER">Docentes</SelectItem>
            <SelectItem value="ADMIN">Administradores</SelectItem>
          </SelectContent>
        </Select>

        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] md:col-span-2 xl:col-span-1 2xl:col-span-2">
          <Select defaultValue={status} name="status">
            <SelectTrigger aria-label="Estado de la cuenta">
              <SelectValue placeholder="Cualquier estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Cualquier estado</SelectItem>
              <SelectItem value="ACTIVE">Solo activos</SelectItem>
              {includeInactive ? (
                <SelectItem value="INACTIVE">Solo inactivos</SelectItem>
              ) : null}
            </SelectContent>
          </Select>

          <SubmitButton
            className="w-full sm:w-auto sm:px-5"
            pendingLabel="Filtrando..."
            variant="secondary"
          >
            Aplicar
          </SubmitButton>
        </div>
      </form>
    </SurfaceCard>
  );
}

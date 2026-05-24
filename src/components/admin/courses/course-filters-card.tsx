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
import type { CourseFilterStatus } from "./types";

export function CourseFiltersCard({
  q,
  status
}: {
  q: string;
  status: CourseFilterStatus;
}) {
  return (
    <SurfaceCard
      className="scroll-mt-28"
      id="course-filters"
      padding="md"
    >
      <form className="grid gap-3 md:grid-cols-[minmax(0,1fr)_18rem_auto]">
        <label className="relative block">
          <span className="sr-only">Buscar cursos, slugs o docentes</span>
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[var(--color-text-muted)]"
            strokeWidth={2}
          />
          <Input
            className="pl-11"
            defaultValue={q}
            name="q"
            placeholder="Filtrar cursos..."
          />
        </label>

        <Select defaultValue={status} name="status">
          <SelectTrigger aria-label="Estado del curso">
            <SelectValue placeholder="Todos los estados" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos los estados</SelectItem>
            <SelectItem value="ACTIVE">Activos</SelectItem>
            <SelectItem value="INACTIVE">Inactivos</SelectItem>
          </SelectContent>
        </Select>

        <SubmitButton pendingLabel="Aplicando..." variant="secondary">
          Aplicar
        </SubmitButton>
      </form>
    </SurfaceCard>
  );
}

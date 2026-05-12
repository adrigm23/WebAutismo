import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import type { CourseFilterStatus } from "./types";

export function CourseFiltersCard({
  q,
  status
}: {
  q: string;
  status: CourseFilterStatus;
}) {
  return (
    <Card className="overflow-hidden rounded-[2rem]" id="course-filters">
      <div className="border-b border-[#dde4ec] px-7 py-6">
        <form className="grid gap-3 md:grid-cols-[1fr_220px_auto]">
          <Input defaultValue={q} name="q" placeholder="Filtrar cursos..." />
          <select
            className="h-12 rounded-xl border border-[var(--color-border)] bg-white px-4 text-sm"
            defaultValue={status}
            name="status"
          >
            <option value="ALL">Todos los estados</option>
            <option value="ACTIVE">Activos</option>
            <option value="INACTIVE">Inactivos</option>
          </select>
          <SubmitButton pendingLabel="Aplicando..." variant="secondary">
            Aplicar
          </SubmitButton>
        </form>
      </div>
    </Card>
  );
}

import { createCourseEditionAction } from "@/actions/admin";
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

export function CreateCourseEditionCard({
  courseId
}: {
  courseId: string;
}) {
  return (
    <SurfaceCard
      description="Genera una nueva convocatoria del curso seleccionado con sus fechas y ventana de acceso."
      title="Crear edicion"
    >
      <form action={createCourseEditionAction} className="mt-5 space-y-4">
        <input name="courseId" type="hidden" value={courseId} />
        <Input name="label" placeholder="Etiqueta visible" required />
        <div className="grid gap-4 md:grid-cols-2">
          <Input name="startsAt" type="datetime-local" />
          <Input name="endsAt" type="datetime-local" />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <Input name="accessUntil" type="datetime-local" />
          <Input defaultValue="0" name="graceAccessDays" type="number" />
          <Select defaultValue="ACTIVE" name="status">
            <SelectTrigger aria-label="Estado de la edicion">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ACTIVE">Activa</SelectItem>
              <SelectItem value="SCHEDULED">Programada</SelectItem>
              <SelectItem value="CLOSED">Cerrada</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <SubmitButton className="w-full" pendingLabel="Creando edicion..." variant="secondary">
          Crear edicion
        </SubmitButton>
      </form>
    </SurfaceCard>
  );
}

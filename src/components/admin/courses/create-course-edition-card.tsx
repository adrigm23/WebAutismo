import { createCourseEditionAction } from "@/actions/admin";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";

export function CreateCourseEditionCard({
  courseId
}: {
  courseId: string;
}) {
  return (
    <Card className="rounded-[2rem] p-7">
      <h2 className="text-[1.8rem] font-semibold tracking-[-0.05em] text-[var(--color-ink)]">
        Crear edicion
      </h2>
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
          <select
            className="h-12 rounded-xl border border-[var(--color-border)] bg-white px-4 text-sm"
            name="status"
          >
            <option value="ACTIVE">Activa</option>
            <option value="SCHEDULED">Programada</option>
            <option value="CLOSED">Cerrada</option>
          </select>
        </div>
        <SubmitButton className="w-full" pendingLabel="Creando edicion..." variant="secondary">
          Crear edicion
        </SubmitButton>
      </form>
    </Card>
  );
}

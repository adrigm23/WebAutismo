import { updateEnrollmentAccessAction } from "@/actions/admin";
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
import { Textarea } from "@/components/ui/textarea";
import type { SupervisionDetailData } from "./types";

export function SupervisionDetailCard({
  detail,
  editable
}: {
  detail: SupervisionDetailData;
  editable?: boolean;
}) {
  return (
    <SurfaceCard className="w-full min-w-0">
      <div className="flex items-center gap-4">
        <div className="grid h-14 w-14 place-items-center rounded-full bg-[color:color-mix(in_srgb,var(--color-primary-soft)_76%,white)] text-base font-semibold text-[var(--color-primary)]">
          {detail.studentInitials}
        </div>
        <div>
          <h2 className="text-[1.8rem] font-semibold tracking-[-0.05em] text-[var(--color-ink)]">
            {detail.studentName}
          </h2>
          <p className="text-sm text-[var(--color-muted)]">{detail.courseTitle}</p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 text-sm text-[var(--color-muted)] md:grid-cols-2">
        <div>
          <p className="font-semibold text-[var(--color-ink)]">Estado matricula</p>
          <p className="mt-1">{detail.enrollmentStatusLabel}</p>
        </div>
        <div>
          <p className="font-semibold text-[var(--color-ink)]">Acceso hasta</p>
          <p className="mt-1">{detail.accessUntilLabel}</p>
        </div>
        <div>
          <p className="font-semibold text-[var(--color-ink)]">Ultima actividad</p>
          <p className="mt-1">{detail.lastCompletedLabel}</p>
        </div>
        <div>
          <p className="font-semibold text-[var(--color-ink)]">Docentes del curso</p>
          <p className="mt-1">{detail.teachersLabel}</p>
        </div>
      </div>

      {editable ? (
        <form action={updateEnrollmentAccessAction} className="mt-6 space-y-4">
          <input name="enrollmentId" type="hidden" value={detail.enrollmentId} />
          <Select defaultValue={detail.formStatusValue} name="status">
            <SelectTrigger aria-label="Estado de la matricula">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ACTIVE">Activa</SelectItem>
              <SelectItem value="CANCELLED">Baja</SelectItem>
              <SelectItem value="REVOKED">Revocada</SelectItem>
              <SelectItem value="EXPIRED">Expirada</SelectItem>
            </SelectContent>
          </Select>
          <Input
            defaultValue={detail.formAccessUntilValue}
            name="accessUntil"
            type="datetime-local"
          />
          <Textarea
            className="min-h-28"
            defaultValue={detail.formNotesValue}
            name="notes"
            placeholder="Notas internas sobre la baja, reactivacion o extension..."
          />
          <SubmitButton className="w-full" pendingLabel="Actualizando acceso..." variant="secondary">
            Guardar acceso
          </SubmitButton>
        </form>
      ) : null}
    </SurfaceCard>
  );
}

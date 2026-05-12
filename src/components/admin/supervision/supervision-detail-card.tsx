import { updateEnrollmentAccessAction } from "@/actions/admin";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
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
    <Card className="rounded-[2rem] p-7">
      <div className="flex items-center gap-4">
        <div className="grid h-14 w-14 place-items-center rounded-full bg-[rgba(12,113,195,0.12)] text-base font-semibold text-[var(--color-primary)]">
          {detail.studentInitials}
        </div>
        <div>
          <h2 className="text-[1.8rem] font-semibold tracking-[-0.05em] text-[var(--color-ink)]">
            {detail.studentName}
          </h2>
          <p className="text-sm text-[#5a6c80]">{detail.courseTitle}</p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 text-sm text-[#405365] md:grid-cols-2">
        <div>
          <p className="font-semibold text-[#24384b]">Estado matricula</p>
          <p className="mt-1">{detail.enrollmentStatusLabel}</p>
        </div>
        <div>
          <p className="font-semibold text-[#24384b]">Acceso hasta</p>
          <p className="mt-1">{detail.accessUntilLabel}</p>
        </div>
        <div>
          <p className="font-semibold text-[#24384b]">Ultima actividad</p>
          <p className="mt-1">{detail.lastCompletedLabel}</p>
        </div>
        <div>
          <p className="font-semibold text-[#24384b]">Docentes del curso</p>
          <p className="mt-1">{detail.teachersLabel}</p>
        </div>
      </div>

      {editable ? (
        <form action={updateEnrollmentAccessAction} className="mt-6 space-y-4">
          <input name="enrollmentId" type="hidden" value={detail.enrollmentId} />
          <select
            className="h-12 w-full rounded-xl border border-[var(--color-border)] bg-white px-4 text-sm"
            defaultValue={detail.formStatusValue}
            name="status"
          >
            <option value="ACTIVE">Activa</option>
            <option value="CANCELLED">Baja</option>
            <option value="REVOKED">Revocada</option>
            <option value="EXPIRED">Expirada</option>
          </select>
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
    </Card>
  );
}

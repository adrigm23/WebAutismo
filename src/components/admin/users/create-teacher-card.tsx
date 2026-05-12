import { UserPlus } from "lucide-react";
import { createTeacherAction } from "@/actions/admin";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";

export function CreateTeacherCard() {
  return (
    <Card className="rounded-[2rem] p-7" id="create-teacher">
      <div className="flex items-center gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[rgba(12,113,195,0.1)] text-[var(--color-primary)]">
          <UserPlus className="h-5 w-5" strokeWidth={1.8} />
        </div>
        <div>
          <h2 className="text-[1.8rem] font-semibold tracking-[-0.05em] text-[var(--color-ink)]">
            Crear docente
          </h2>
          <p className="mt-1 text-sm leading-6 text-[#52667b]">
            Alta controlada. Solo administracion puede crear profesorado.
          </p>
        </div>
      </div>

      <form action={createTeacherAction} className="mt-6 space-y-4">
        <input name="returnTo" type="hidden" value="/admin/users" />
        <Input name="name" placeholder="Nombre y apellidos" required />
        <Input name="email" placeholder="correo@dominio.com" required type="email" />
        <Input
          minLength={8}
          name="password"
          placeholder="Contrasena temporal"
          required
          type="password"
        />
        <div className="rounded-2xl border border-[#d8e0e8] bg-[#f7fafc] px-4 py-4 text-sm leading-7 text-[#4c6074]">
          La cuenta se crea activa, con rol global docente y preferencias basicas de notificacion.
        </div>
        <SubmitButton className="w-full" pendingLabel="Creando docente...">
          Crear docente
        </SubmitButton>
      </form>
    </Card>
  );
}

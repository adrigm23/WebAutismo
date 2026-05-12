import { UserPlus } from "lucide-react";
import { createTeacherAction } from "@/actions/admin";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";

export function CreateTeacherCard() {
  return (
    <Card className="rounded-[2rem] p-7" id="create-teacher">
      <div className="flex items-start gap-4">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[rgba(12,113,195,0.12)] text-[var(--color-primary)]">
          <UserPlus className="h-5 w-5" strokeWidth={1.8} />
        </div>
        <div>
          <h2 className="text-[1.8rem] font-semibold tracking-[-0.05em] text-[var(--color-ink)]">
            Alta de docente
          </h2>
          <p className="mt-2 text-sm leading-7 text-[#52667b]">
            Crea una cuenta activa con acceso inmediato al campus y al seguimiento academico.
          </p>
        </div>
      </div>

      <form action={createTeacherAction} className="mt-6 space-y-4">
        <input name="returnTo" type="hidden" value="/admin/teachers" />
        <Input name="name" placeholder="Nombre y apellidos" required />
        <Input name="email" placeholder="correo@dominio.com" required type="email" />
        <Input minLength={8} name="password" placeholder="Contrasena temporal" required type="password" />
        <div className="rounded-[1.4rem] border border-[#d8e0e8] bg-[#f7fafc] px-4 py-4 text-sm leading-7 text-[#4c6074]">
          La cuenta se crea como docente, activa y con preferencias basicas de notificacion.
        </div>
        <SubmitButton className="w-full" pendingLabel="Creando docente...">
          Crear docente
        </SubmitButton>
      </form>
    </Card>
  );
}

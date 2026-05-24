import { UserPlus } from "lucide-react";
import { createTeacherAction } from "@/actions/admin";
import { Input } from "@/components/ui/input";
import { StateBanner } from "@/components/ui/state-banner";
import { SubmitButton } from "@/components/ui/submit-button";
import { SurfaceCard } from "@/components/ui/surface-card";

export function CreateTeacherCard() {
  return (
    <SurfaceCard
      id="create-teacher"
      padding="md"
      title="Crear docente"
      description="Alta controlada. Solo administracion puede crear profesorado."
    >
      <div className="mb-5 flex items-start gap-3 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[color:color-mix(in_srgb,var(--color-primary-soft)_26%,white)] p-4">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-[var(--radius-md)] bg-[color:color-mix(in_srgb,var(--color-primary-soft)_72%,white)] text-[var(--color-primary)]">
          <UserPlus className="h-5 w-5" strokeWidth={1.8} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[var(--color-ink)]">Provision segura</p>
          <p className="mt-1 text-sm leading-6 text-[var(--color-muted)]">
            Crea una nueva cuenta docente sin salir del panel de administracion.
          </p>
        </div>
      </div>

      <form action={createTeacherAction} className="space-y-4">
        <input name="returnTo" type="hidden" value="/admin/users" />
        <Input name="name" placeholder="Nombre y apellidos" required />
        <Input
          name="email"
          placeholder="correo@dominio.com"
          required
          type="email"
        />
        <Input
          minLength={8}
          name="password"
          placeholder="Contrasena temporal"
          required
          type="password"
        />
        <StateBanner
          description="La cuenta se crea activa, con rol global docente y preferencias basicas de notificacion."
          tone="info"
        />
        <SubmitButton className="w-full" pendingLabel="Creando docente...">
          Crear docente
        </SubmitButton>
      </form>
    </SurfaceCard>
  );
}

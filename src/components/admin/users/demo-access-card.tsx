import { UserPlus } from "lucide-react";
import { StateBanner } from "@/components/ui/state-banner";
import { SurfaceCard } from "@/components/ui/surface-card";

export function DemoAccessCard() {
  return (
    <SurfaceCard
      id="create-teacher"
      padding="md"
      title="Acceso demo"
      description="El modo demo solo puede habilitarse por configuracion local y ya no expone credenciales en la interfaz."
    >
      <div className="flex items-center gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-[var(--radius-md)] bg-[color:color-mix(in_srgb,var(--color-primary-soft)_72%,white)] text-[var(--color-primary)]">
          <UserPlus className="h-5 w-5" strokeWidth={1.8} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[var(--color-ink)]">
            Entorno local controlado
          </p>
          <p className="mt-1 text-sm leading-6 text-[var(--color-muted)]">
            Conserva solo los datos simulados necesarios para revisar la interfaz.
          </p>
        </div>
      </div>

      <StateBanner
        className="mt-5"
        description="Define DEMO_AUTH_ENABLED=true, ALLOW_DEMO_AUTH=true y una contrasena segura solo en tu entorno local."
        tone="info"
      />
    </SurfaceCard>
  );
}

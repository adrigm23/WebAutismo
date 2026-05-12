import { UserPlus } from "lucide-react";
import { Card } from "@/components/ui/card";

export function DemoAccessCard() {
  return (
    <Card className="rounded-[2rem] p-7" id="create-teacher">
      <div className="flex items-center gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[rgba(12,113,195,0.1)] text-[var(--color-primary)]">
          <UserPlus className="h-5 w-5" strokeWidth={1.8} />
        </div>
        <div>
          <h2 className="text-[1.8rem] font-semibold tracking-[-0.05em] text-[var(--color-ink)]">
            Acceso demo
          </h2>
          <p className="mt-1 text-sm leading-6 text-[#52667b]">
            El modo demo solo puede habilitarse por configuracion local y ya no expone
            credenciales en la interfaz.
          </p>
        </div>
      </div>

      <div className="mt-6 space-y-4 rounded-2xl border border-[#d8e0e8] bg-[#f7fafc] px-4 py-4 text-sm leading-7 text-[#4c6074]">
        <p>Define `DEMO_AUTH_ENABLED=true` y credenciales seguras en variables de entorno.</p>
        <p>Este panel conserva solo datos simulados para revisar la interfaz.</p>
      </div>
    </Card>
  );
}

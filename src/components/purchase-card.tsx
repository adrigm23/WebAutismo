import { BadgeCheck, CalendarCheck2, Clock3, Lock, MonitorPlay } from "lucide-react";
import { PurchaseForm } from "@/components/purchase-form";
import { ButtonLink } from "@/components/ui/button";
import type { CatalogCourse } from "@/lib/course-catalog";
import { formatPrice } from "@/lib/utils";

type PurchaseCardProps = {
  course: CatalogCourse;
  isAuthenticated: boolean;
  ownsCourse: boolean;
  purchaseMode: "live" | "demo";
};

export function PurchaseCard({
  course,
  isAuthenticated,
  ownsCourse,
  purchaseMode
}: PurchaseCardProps) {
  const isLiveMode = purchaseMode === "live";

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-white p-10 shadow-[0_18px_40px_rgba(34,34,33,0.06)]">
      <div className="flex items-center justify-between gap-4">
        <p className="text-base font-medium text-[var(--color-ink)]">Precio de inscripcion</p>
        <div className="inline-flex items-center gap-2 rounded-full bg-[var(--color-surface)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-muted)]">
          <Lock className="h-3.5 w-3.5" />
          {isLiveMode ? "Pago real" : "Modo demo"}
        </div>
      </div>

      <p className="mt-2 text-[4rem] font-semibold tracking-[-0.06em] text-[var(--color-ink)]">
        {formatPrice(course.priceInCents)}
      </p>

      <div className="mt-8 space-y-5 border-t border-[rgba(12,113,195,0.14)] pt-8 text-[1.05rem] text-[var(--color-ink)]">
        <div className="flex gap-4">
          <MonitorPlay className="mt-1 h-5 w-5 text-[var(--color-primary)]" />
          <span>{course.format}</span>
        </div>
        <div className="flex gap-4">
          <Clock3 className="mt-1 h-5 w-5 text-[var(--color-primary)]" />
          <span>Duracion estimada: {course.duration}</span>
        </div>
        <div className="flex gap-4">
          <CalendarCheck2 className="mt-1 h-5 w-5 text-[var(--color-primary)]" />
          <span>
            Acceso segun la edicion activa y, si aplica, su ventana de consulta posterior.
          </span>
        </div>
        <div className="flex gap-4">
          <BadgeCheck className="mt-1 h-5 w-5 text-[var(--color-primary)]" />
          <span>
            {isLiveMode
              ? "Checkout seguro con Stripe y confirmacion automatica por correo."
              : "Activacion local de prueba sin cobro real, pensada para este entorno."}
          </span>
        </div>
      </div>

      {!isLiveMode ? (
        <div className="mt-8 rounded-2xl border border-[rgba(255,182,6,0.4)] bg-[var(--color-accent-soft)] px-4 py-4 text-sm leading-7 text-[var(--color-ink)]">
          Este curso se esta mostrando en modo demo. El boton final activa acceso local de
          prueba y no procesa ningun pago real.
        </div>
      ) : null}

      <div className="mt-10">
        {ownsCourse ? (
          <ButtonLink className="w-full" href={`/mis-cursos/${course.slug}`}>
            Ir al curso
          </ButtonLink>
        ) : isAuthenticated ? (
          <PurchaseForm
            buttonLabel={isLiveMode ? "Continuar con la compra" : "Activar acceso demo"}
            buttonVariant="accent"
            courseSlug={course.slug}
            courseEditionId={course.activeEdition?.id ?? null}
            pendingLabel={isLiveMode ? "Preparando pasarela..." : "Activando acceso local..."}
          />
        ) : (
          <div className="space-y-3">
            <ButtonLink className="w-full" href={`/registro?next=/checkout/${course.slug}`} variant="accent">
              Crear cuenta para continuar
            </ButtonLink>
            <ButtonLink className="w-full" href={`/acceder?next=/checkout/${course.slug}`} variant="secondary">
              Ya tengo cuenta
            </ButtonLink>
          </div>
        )}
      </div>

      <p className="mt-8 text-center text-sm font-medium text-[var(--color-ink)]">
        {isLiveMode
          ? "Compra protegida y acceso individual al contenido adquirido."
          : "Entorno de validacion con acceso individual sin cobro real."}
      </p>
    </div>
  );
}

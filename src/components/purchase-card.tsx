import { Clock3, Lock, MonitorPlay } from "lucide-react";
import { CourseArtwork } from "@/components/course-artwork";
import { ButtonLink } from "@/components/ui/button";
import type { CatalogCourse } from "@/lib/course-catalog";
import type { PurchaseRuntimeMode } from "@/lib/purchase-runtime";
import { formatPrice } from "@/lib/utils";

type PurchaseCardProps = {
  course: CatalogCourse;
  purchaseMode: PurchaseRuntimeMode;
};

export function PurchaseCard({ course, purchaseMode }: PurchaseCardProps) {
  const isLiveMode = purchaseMode === "live";
  const isDemoMode = purchaseMode === "demo";
  const leadTeacher = course.teachers[0] ?? null;
  const editionLabel = course.activeEdition?.label ?? null;

  return (
    <div className="rounded-[28px] border border-[rgba(12,113,195,0.12)] bg-white p-6 shadow-[0_18px_40px_rgba(34,34,33,0.06)] lg:p-7">
      <CourseArtwork
        className="mb-5 hidden h-44 w-full rounded-[24px] border-0 lg:block"
        course={course}
        variant="hero"
      />

      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[var(--color-primary)]">
            Inscripcion
          </p>
          <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
            Compra clara, acceso personal y activacion vinculada a tu cuenta.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full bg-[var(--color-surface)] px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[var(--color-muted)]">
          <Lock className="h-3.5 w-3.5" />
          {isLiveMode ? "Pago real" : isDemoMode ? "Modo demo" : "Compra desactivada"}
        </div>
      </div>

      <p className="mt-5 text-[3.5rem] font-semibold tracking-[-0.07em] text-[var(--color-ink)] lg:text-[4rem]">
        {formatPrice(course.priceInCents)}
      </p>
      <p className="mt-3 text-sm leading-7 text-[var(--color-muted)]">
        El checkout se mantiene intacto. Esta capa solo reduce ruido y deja la decision de compra
        mas clara.
      </p>

      <div className="mt-6">
        <ButtonLink className="w-full" href={`/checkout/${course.slug}`} variant="accent">
          {isLiveMode
            ? "Continuar con la compra"
            : isDemoMode
              ? "Revisar acceso demo"
              : "Ver disponibilidad del checkout"}
        </ButtonLink>
      </div>

      <dl className="mt-7 divide-y divide-[rgba(12,113,195,0.12)] border-t border-[rgba(12,113,195,0.12)] text-sm">
        <div className="flex items-start gap-3 py-4">
          <MonitorPlay className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-primary)]" />
          <div>
            <dt className="font-semibold text-[var(--color-ink)]">Formato</dt>
            <dd className="mt-1 leading-6 text-[var(--color-muted)]">{course.format}</dd>
          </div>
        </div>
        <div className="flex items-start gap-3 py-4">
          <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-primary)]" />
          <div>
            <dt className="font-semibold text-[var(--color-ink)]">Duracion</dt>
            <dd className="mt-1 leading-6 text-[var(--color-muted)]">{course.duration}</dd>
          </div>
        </div>
        <div className="py-4">
          <dt className="font-semibold text-[var(--color-ink)]">Acceso</dt>
          <dd className="mt-1 leading-6 text-[var(--color-muted)]">
            {editionLabel
              ? `La matricula se vincula a ${editionLabel} y mantiene la ventana de consulta configurada para esa edicion.`
              : "El acceso queda asociado a tu cuenta y se activa segun la edicion vigente del curso."}
          </dd>
        </div>
        {leadTeacher ? (
          <div className="py-4">
            <dt className="font-semibold text-[var(--color-ink)]">Equipo docente</dt>
            <dd className="mt-1 leading-6 text-[var(--color-muted)]">
              {leadTeacher.name}
              {leadTeacher.role ? ` · ${leadTeacher.role}` : ""}
            </dd>
          </div>
        ) : null}
      </dl>

      <p className="mt-5 text-sm leading-7 text-[var(--color-muted)]">
        {isLiveMode
          ? "El cobro se realiza fuera de esta pagina, en la pasarela segura de Stripe."
          : isDemoMode
            ? "Este entorno activa acceso local de prueba y no procesa ningun cobro real."
            : "Este entorno no tiene una pasarela de pago configurada y no permite activar acceso automatico."}
      </p>
    </div>
  );
}

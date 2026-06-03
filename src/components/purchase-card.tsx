import {
  Award,
  Download,
  Infinity,
  MonitorPlay,
  ShoppingCart,
  Headphones,
} from "lucide-react";
import Link from "next/link";
import type { CatalogCourse } from "@/lib/course-catalog";
import type { PurchaseRuntimeMode } from "@/lib/purchase-runtime";
import { formatPrice } from "@/lib/utils";

type PurchaseCardProps = {
  course: CatalogCourse;
  purchaseMode: PurchaseRuntimeMode;
};

function getBuyLabel(mode: PurchaseRuntimeMode) {
  if (mode === "live") return "Comprar Curso";
  if (mode === "demo") return "Acceso demo";
  return "Ver disponibilidad";
}

export function PurchaseCard({ course, purchaseMode }: PurchaseCardProps) {
  const buyLabel = getBuyLabel(purchaseMode);

  const features = [
    { icon: Infinity, text: "Acceso de por vida" },
    { icon: Award, text: "Certificado institucional incluido" },
    { icon: MonitorPlay, text: `${course.duration} de video bajo demanda` },
    { icon: Download, text: `${course.modules.length * 2} Recursos descargables` },
  ];

  return (
    <>
      {/* Main purchase card */}
      <div className="rounded-xl border border-[var(--color-border)] bg-white p-6 shadow-sm">
        {/* Price */}
        <div className="text-center">
          <p className="text-[3rem] font-bold leading-none tracking-tight text-[var(--color-ink)]">
            {formatPrice(course.priceInCents)}
          </p>
          <p className="mt-1.5 text-sm text-[var(--color-muted)]">Pago único</p>
        </div>

        {/* CTA */}
        <div className="mt-5">
          <Link
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-ink)] py-3.5 text-sm font-bold text-white transition hover:opacity-90"
            href={`/checkout/${course.slug}`}
          >
            <ShoppingCart className="h-4 w-4" />
            {buyLabel}
          </Link>
          <p className="mt-2.5 text-center text-xs text-[var(--color-muted)]">
            Garantía de devolución de 7 días
          </p>
        </div>

        {/* Features */}
        <div className="mt-5 space-y-3 border-t border-[var(--color-border)] pt-5">
          {features.map(({ icon: Icon, text }) => (
            <div className="flex items-center gap-3 text-sm text-[var(--color-ink)]" key={text}>
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--color-surface)]">
                <Icon className="h-3.5 w-3.5 text-[var(--color-primary)]" />
              </div>
              {text}
            </div>
          ))}
        </div>
      </div>

      {/* Help card */}
      <div className="rounded-xl border border-[var(--color-border)] bg-white p-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[rgba(12,113,195,0.08)]">
          <Headphones className="h-5 w-5 text-[var(--color-primary)]" />
        </div>
        <h3 className="mt-3 text-sm font-bold text-[var(--color-ink)]">
          ¿Necesitas ayuda?
        </h3>
        <p className="mt-1.5 text-sm leading-relaxed text-[var(--color-muted)]">
          Nuestro equipo académico está disponible para responder tus consultas
          antes de inscribirte.
        </p>
        <Link
          className="mt-4 inline-block text-sm font-semibold text-[var(--color-primary)] transition hover:underline"
          href="/soporte"
        >
          Contactar Asesor
        </Link>
      </div>
    </>
  );
}

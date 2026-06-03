"use client";

import { useState, useTransition, useActionState } from "react";
import Link from "next/link";
import {
  BadgeCheck,
  Building2,
  CreditCard,
  Lock,
  ShieldCheck,
  Tag,
  User,
  Wallet,
  Zap,
} from "lucide-react";
import { CourseArtwork } from "@/components/course-artwork";
import { startPurchaseAction, type PurchaseFormState } from "@/actions/purchase";
import { previewPromotionAction, type PromoPreviewResult } from "@/actions/checkout-preview";
import type { CatalogCourse } from "@/lib/course-catalog";
import { cn, formatPrice } from "@/lib/utils";
import { siteConfig } from "@/lib/site";

// ─── Types ────────────────────────────────────────────────────────────────────

type PaymentTab = "tarjeta" | "paypal" | "transferencia";

export type CheckoutPageProps = {
  course: CatalogCourse;
  user: { name: string; email: string } | null;
  isStripeReady: boolean;
  isDemoMode: boolean;
};

// ─── Shared input class ────────────────────────────────────────────────────────

const inputCls =
  "h-11 w-full rounded-lg border border-[#dbe3ec] bg-white px-3.5 text-sm text-[#163c58] placeholder:text-[#9fb0c2] focus-visible:border-[#163c58] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#163c58] focus-visible:ring-offset-1";

// ─── Header ───────────────────────────────────────────────────────────────────

function CheckoutHeader() {
  return (
    <header className="border-b border-[#dbe3ec] bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4 sm:px-8">
        <Link
          className="flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#163c58]"
          href="/"
        >
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-[#163c58]">
            <span className="text-xs font-bold text-white">CA</span>
          </div>
          <span className="text-[0.95rem] font-bold tracking-[-0.02em] text-[#163c58]">
            Campus Autismo Córdoba
          </span>
        </Link>
        <div className="flex items-center gap-1.5 text-[0.75rem] font-semibold uppercase tracking-[0.12em] text-[#163c58]">
          <Lock className="h-3.5 w-3.5" strokeWidth={2} />
          Pago Seguro
        </div>
      </div>
    </header>
  );
}

// ─── Country list ─────────────────────────────────────────────────────────────

const COUNTRIES = [
  "Argentina", "Bolivia", "Chile", "Colombia", "Costa Rica", "Cuba",
  "Ecuador", "El Salvador", "España", "Guatemala", "Honduras", "México",
  "Nicaragua", "Panamá", "Paraguay", "Perú", "Puerto Rico",
  "República Dominicana", "Uruguay", "Venezuela", "Otro",
];

// ─── Customer data card ───────────────────────────────────────────────────────

function CheckoutCustomerData({ user }: { user: CheckoutPageProps["user"] }) {
  return (
    <div className="rounded-xl border border-[#dbe3ec] bg-white p-6 shadow-[0_1px_4px_rgba(22,60,88,0.06)]">
      <div className="mb-5 flex items-center gap-2.5">
        <User className="h-4 w-4 text-[#163c58]" strokeWidth={2} />
        <h2 className="text-[1rem] font-bold text-[#163c58]">Tus Datos</h2>
      </div>

      <div className="grid gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className="text-[0.78rem] font-semibold text-[#4a6780]">
              Nombre Completo
            </span>
            <input
              className={inputCls}
              defaultValue={user?.name ?? ""}
              name="customer-name"
              placeholder="Ej. Ana García"
              type="text"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[0.78rem] font-semibold text-[#4a6780]">
              Correo Electrónico
            </span>
            <input
              className={inputCls}
              defaultValue={user?.email ?? ""}
              name="customer-email"
              placeholder="ana@ejemplo.com"
              type="email"
            />
          </label>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-[0.78rem] font-semibold text-[#4a6780]">
            País de Residencia
          </span>
          <div className="relative">
            <select
              className="h-11 w-full cursor-pointer appearance-none rounded-lg border border-[#dbe3ec] bg-white px-3.5 pr-9 text-sm text-[#163c58] focus-visible:border-[#163c58] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#163c58]"
              defaultValue="Argentina"
              name="country"
            >
              {COUNTRIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#9fb0c2]">
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </div>
        </label>
      </div>

      {!user && (
        <p className="mt-4 text-[0.8rem] text-[#9fb0c2]">
          ¿Ya tienes cuenta?{" "}
          <Link className="text-[#163c58] underline hover:opacity-75" href="/acceder">
            Inicia sesión
          </Link>{" "}
          para pre-rellenar tus datos.
        </p>
      )}
    </div>
  );
}

// ─── Payment method card ──────────────────────────────────────────────────────

function CheckoutPaymentMethod({
  isStripeReady,
  isDemoMode,
}: {
  isStripeReady: boolean;
  isDemoMode: boolean;
}) {
  const [activeTab, setActiveTab] = useState<PaymentTab>("tarjeta");

  const TABS: { id: PaymentTab; label: string; Icon: typeof CreditCard }[] = [
    { id: "tarjeta", label: "Tarjeta", Icon: CreditCard },
    { id: "paypal", label: "PayPal", Icon: Wallet },
    { id: "transferencia", label: "Transferencia", Icon: Building2 },
  ];

  return (
    <div className="rounded-xl border border-[#dbe3ec] bg-white p-6 shadow-[0_1px_4px_rgba(22,60,88,0.06)]">
      <div className="mb-5 flex items-center gap-2.5">
        <CreditCard className="h-4 w-4 text-[#163c58]" strokeWidth={2} />
        <h2 className="text-[1rem] font-bold text-[#163c58]">Método de Pago</h2>
      </div>

      {/* Tabs */}
      <div className="mb-5 grid grid-cols-3 gap-1.5 rounded-xl border border-[#dbe3ec] p-1">
        {TABS.map(({ id, label, Icon }) => (
          <button
            className={cn(
              "flex items-center justify-center gap-1.5 rounded-lg px-3 py-2.5 text-sm font-semibold transition",
              activeTab === id
                ? "bg-[#163c58] text-white shadow-sm"
                : "text-[#4a6780] hover:bg-[rgba(22,60,88,0.05)]",
            )}
            key={id}
            onClick={() => setActiveTab(id)}
            type="button"
          >
            <Icon className="h-3.5 w-3.5" strokeWidth={2} />
            <span className="hidden sm:inline">{label}</span>
            <span className="sm:hidden text-[0.7rem]">{label}</span>
          </button>
        ))}
      </div>

      {activeTab === "tarjeta" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[0.8rem] font-semibold text-[#4a6780]">Detalles de la Tarjeta</p>
            <div className="flex items-center gap-1.5 text-[#9fb0c2]">
              <CreditCard className="h-4 w-4" strokeWidth={1.5} />
              <CreditCard className="h-4 w-4" strokeWidth={1.5} />
            </div>
          </div>

          {isStripeReady || isDemoMode ? (
            <div className="space-y-3">
              <div className="relative">
                <CreditCard className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9fb0c2]" strokeWidth={2} />
                <input className={cn(inputCls, "pl-9")} placeholder="Número de Tarjeta" readOnly type="text" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input className={inputCls} placeholder="MM/AA" readOnly type="text" />
                <div className="relative">
                  <input className={inputCls} placeholder="CVC" readOnly type="text" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9fb0c2]">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 16v-4M12 8h.01" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </div>
              </div>
              <input className={inputCls} placeholder="Nombre en la tarjeta" readOnly type="text" />
              <div className="flex items-start gap-2 rounded-lg border border-[#dbeafe] bg-[#eff6ff] p-3">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#2563eb]" strokeWidth={2} />
                <p className="text-[0.74rem] leading-relaxed text-[#1e40af]">
                  Los datos de tu tarjeta son gestionados por <strong>Stripe</strong>. Al pulsar
                  &ldquo;Finalizar y Pagar&rdquo; serás redirigido a la pasarela segura.
                </p>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-[#fee2e2] bg-[#fef2f2] p-4">
              <p className="text-sm text-[#991b1b]">
                El pago con tarjeta no está disponible en este entorno.
              </p>
            </div>
          )}
        </div>
      )}

      {activeTab === "paypal" && (
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <Wallet className="h-8 w-8 text-[#9fb0c2]" strokeWidth={1.5} />
          <p className="text-sm font-medium text-[#4a6780]">PayPal no está disponible actualmente.</p>
          <p className="text-[0.78rem] text-[#9fb0c2]">
            Usa el pago con tarjeta para completar tu inscripción.
          </p>
        </div>
      )}

      {activeTab === "transferencia" && (
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <Building2 className="h-8 w-8 text-[#9fb0c2]" strokeWidth={1.5} />
          <p className="text-sm font-medium text-[#4a6780]">Transferencia bancaria — Próximamente</p>
          <p className="text-[0.78rem] text-[#9fb0c2]">
            Contacta en{" "}
            <a className="text-[#163c58] underline" href={`mailto:${siteConfig.supportEmail}`}>
              {siteConfig.supportEmail}
            </a>{" "}
            para gestionar una transferencia manual.
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Order summary ─────────────────────────────────────────────────────────────

const purchaseInitialState: PurchaseFormState = {};

function CheckoutOrderSummary({
  course,
  user,
  isStripeReady,
  isDemoMode,
}: {
  course: CatalogCourse;
  user: CheckoutPageProps["user"];
  isStripeReady: boolean;
  isDemoMode: boolean;
}) {
  const [promoCode, setPromoCode] = useState("");
  const [promoResult, setPromoResult] = useState<PromoPreviewResult | null>(null);
  const [isPending, startTransition] = useTransition();
  const [formState, formAction] = useActionState(startPurchaseAction, purchaseInitialState);

  const appliedDiscount = promoResult?.ok === true ? promoResult.discountInCents : 0;
  const appliedCode = promoResult?.ok === true ? promoResult.code : "";
  const subtotal = course.priceInCents;
  const total = promoResult?.ok === true ? promoResult.totalInCents : subtotal;

  function handleApplyPromo() {
    startTransition(async () => {
      const result = await previewPromotionAction(course.slug, promoCode);
      setPromoResult(result);
    });
  }

  const buttonLabel = isStripeReady
    ? "Finalizar y Pagar"
    : isDemoMode
      ? "Activar Acceso Demo"
      : "Intentar Compra";

  return (
    <div className="rounded-xl border border-[#dbe3ec] bg-white p-6 shadow-[0_1px_4px_rgba(22,60,88,0.06)] lg:sticky lg:top-6">
      <h2 className="mb-5 text-[1rem] font-bold text-[#163c58]">Resumen del Pedido</h2>

      {/* Course */}
      <div className="mb-5 flex items-start gap-3">
        <CourseArtwork className="h-16 w-20 shrink-0 rounded-lg" course={course} variant="thumb" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold leading-snug text-[#163c58]">{course.title}</p>
          <p className="mt-1 text-[0.75rem] text-[#9fb0c2]">Acceso de por vida</p>
          <p className="mt-2 text-sm font-bold text-[#163c58]">{formatPrice(course.priceInCents)}</p>
        </div>
      </div>

      <div className="my-4 h-px bg-[#dbe3ec]" />

      {/* Promo code */}
      <div className="mb-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Tag className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#9fb0c2]" strokeWidth={2} />
            <input
              className="h-10 w-full rounded-lg border border-[#dbe3ec] bg-white pl-9 pr-3 text-[0.82rem] uppercase tracking-wider placeholder:normal-case placeholder:tracking-normal placeholder:text-[#9fb0c2] focus-visible:border-[#163c58] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#163c58]"
              onChange={(e) => { setPromoCode(e.target.value); if (promoResult) setPromoResult(null); }}
              placeholder="CÓDIGO DE DESCUENTO"
              type="text"
              value={promoCode}
            />
          </div>
          <button
            className="h-10 rounded-lg border border-[#dbe3ec] bg-white px-4 text-[0.82rem] font-semibold text-[#163c58] transition hover:border-[#163c58] hover:bg-[rgba(22,60,88,0.04)] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#163c58]"
            disabled={isPending || !promoCode.trim()}
            onClick={handleApplyPromo}
            type="button"
          >
            {isPending ? "..." : "Aplicar"}
          </button>
        </div>
        {promoResult && !promoResult.ok && (
          <p className="mt-1.5 text-[0.75rem] text-[#dc2626]">{promoResult.error}</p>
        )}
        {promoResult?.ok && (
          <p className="mt-1.5 text-[0.75rem] text-[#00b86b]">✓ Código aplicado correctamente</p>
        )}
      </div>

      <div className="my-4 h-px bg-[#dbe3ec]" />

      {/* Pricing */}
      <div className="space-y-2.5 text-sm">
        <div className="flex items-center justify-between text-[#4a6780]">
          <span>Subtotal</span>
          <span>{formatPrice(subtotal)}</span>
        </div>
        {appliedDiscount > 0 && (
          <div className="flex items-center justify-between text-[#00b86b]">
            <span>Descuento ({appliedCode})</span>
            <span>-{formatPrice(appliedDiscount)}</span>
          </div>
        )}
        <div className="flex items-center justify-between border-t border-[#dbe3ec] pt-3 text-base font-bold text-[#163c58]">
          <span>Total</span>
          <span>{formatPrice(total)}</span>
        </div>
      </div>

      {/* Purchase button */}
      <div className="mt-5">
        {user ? (
          <form action={formAction}>
            <input name="courseSlug" type="hidden" value={course.slug} />
            <input name="courseEditionId" type="hidden" value={course.activeEdition?.id ?? ""} />
            <input name="promotionCode" type="hidden" value={appliedCode} />

            {formState.error && (
              <p className="mb-3 rounded-lg border border-[#fee2e2] bg-[#fef2f2] px-3 py-2 text-[0.78rem] text-[#dc2626]">
                {formState.error}
              </p>
            )}

            <button
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#002b55] px-6 py-3.5 text-[0.95rem] font-bold text-white shadow-[0_4px_12px_rgba(0,43,85,0.3)] transition hover:bg-[#163c58] hover:shadow-[0_4px_16px_rgba(0,43,85,0.4)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#163c58] active:scale-[0.99]"
              type="submit"
            >
              <Lock className="h-4 w-4" strokeWidth={2} />
              {buttonLabel}
            </button>
          </form>
        ) : (
          <div className="space-y-3">
            <Link
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#002b55] px-6 py-3.5 text-[0.95rem] font-bold text-white transition hover:bg-[#163c58] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#163c58]"
              href={`/registro?next=/checkout/${course.slug}`}
            >
              <Lock className="h-4 w-4" strokeWidth={2} />
              Crear cuenta y pagar
            </Link>
            <p className="text-center text-[0.78rem] text-[#9fb0c2]">
              ¿Ya tienes cuenta?{" "}
              <Link className="text-[#163c58] underline" href={`/acceder?next=/checkout/${course.slug}`}>
                Inicia sesión
              </Link>
            </p>
          </div>
        )}

        {/* Trust badges */}
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-center gap-1.5">
            <BadgeCheck className="h-4 w-4 text-[#00b86b]" strokeWidth={2} />
            <p className="text-center text-[0.75rem] font-semibold text-[#00b86b]">
              Pago 100% Seguro y Encriptado
            </p>
          </div>
          <div className="flex items-center justify-center gap-1.5">
            <Zap className="h-3.5 w-3.5 text-[#4a6780]" strokeWidth={2} />
            <p className="text-center text-[0.75rem] text-[#4a6780]">
              Acceso Inmediato al Curso
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function CheckoutFooter() {
  return (
    <footer className="border-t border-[#dbe3ec] bg-white">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 px-5 py-5 text-[0.75rem] text-[#9fb0c2] sm:flex-row sm:px-8">
        <p>© 2024 Campus Autismo Córdoba. Innovación y Empatía.</p>
        <nav className="flex items-center gap-4">
          <Link className="hover:text-[#163c58]" href="/legal/terminos">Términos</Link>
          <Link className="hover:text-[#163c58]" href="/legal/privacidad">Privacidad</Link>
          <Link className="hover:text-[#163c58]" href="/soporte">Contacto</Link>
        </nav>
      </div>
    </footer>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function CheckoutPage({ course, user, isStripeReady, isDemoMode }: CheckoutPageProps) {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#f7f8fc]">
      <CheckoutHeader />
      <main className="flex-1 py-8 sm:py-10 lg:py-12">
        <div className="mx-auto max-w-5xl px-4 sm:px-8">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start xl:grid-cols-[minmax(0,1fr)_24rem]">
            <div className="space-y-5">
              <CheckoutCustomerData user={user} />
              <CheckoutPaymentMethod isDemoMode={isDemoMode} isStripeReady={isStripeReady} />
            </div>
            <CheckoutOrderSummary
              course={course}
              isDemoMode={isDemoMode}
              isStripeReady={isStripeReady}
              user={user}
            />
          </div>
        </div>
      </main>
      <CheckoutFooter />
    </div>
  );
}

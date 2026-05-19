import type { Metadata } from "next";
import { CheckCircle2, Lock, Shield } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { CourseArtwork } from "@/components/course-artwork";
import { PurchaseForm } from "@/components/purchase-form";
import { ButtonLink } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth";
import { getCatalogCourseBySlug } from "@/lib/course-catalog";
import { getPurchaseRuntimeMode } from "@/lib/purchase-runtime";
import { userOwnsCourse } from "@/lib/purchases";
import { formatPrice } from "@/lib/utils";

type CheckoutPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params
}: CheckoutPageProps): Promise<Metadata> {
  const { slug } = await params;
  const course = await getCatalogCourseBySlug(slug);

  return {
    title: course ? `Inscripcion | ${course.title}` : "Inscripcion",
    robots: {
      index: false,
      follow: false
    }
  };
}

export default async function CheckoutPage({ params }: CheckoutPageProps) {
  const { slug } = await params;
  const course = await getCatalogCourseBySlug(slug);

  if (!course) {
    notFound();
  }

  const user = await getCurrentUser();
  const purchaseMode = getPurchaseRuntimeMode();
  const isStripeReady = purchaseMode === "live";
  const isDemoMode = purchaseMode === "demo";

  if (user && (await userOwnsCourse(user.id, course.slug))) {
    redirect(`/mis-cursos/${course.slug}`);
  }

  const taxAmount = Math.round(course.priceInCents * 0.21);
  const totalAmount = course.priceInCents + taxAmount;

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      <header className="border-b border-[rgba(12,113,195,0.14)] bg-white">
        <div className="site-container flex items-center justify-between py-4">
          <p className="text-2xl font-bold tracking-[-0.04em] text-[var(--color-primary)]">
            Autismo Cordoba
          </p>
          <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.14em] text-[var(--color-muted)]">
            <Lock className="h-4 w-4" />
            {isStripeReady
              ? "Pago real con Stripe"
              : isDemoMode
                ? "Modo demo local"
                : "Checkout desactivado"}
          </div>
        </div>
      </header>

      <div className="site-container pb-16 pt-14">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_430px]">
          <section>
            <h1 className="text-[4.2rem] font-semibold leading-[0.95] tracking-[-0.08em] text-[var(--color-ink)]">
              Finalizar inscripcion
            </h1>
            <p className="mt-4 max-w-3xl text-[1.16rem] leading-9 text-[var(--color-ink)]/84">
              {isStripeReady
                ? "Vas a pasar a una pasarela segura para completar el pago y activar el curso en tu cuenta."
                : isDemoMode
                  ? "Estas en un flujo de validacion. El boton final no cobra: activa acceso local de prueba para revisar el producto end to end."
                  : "La pasarela de pago no esta disponible en este entorno, por lo que no se puede completar la inscripcion automatica."}
            </p>

            <div
              className={`mt-6 rounded-2xl px-5 py-4 text-sm leading-7 ${
                isStripeReady
                  ? "border border-[rgba(12,113,195,0.16)] bg-white text-[var(--color-ink)]"
                  : "border border-[rgba(255,182,6,0.4)] bg-[var(--color-accent-soft)] text-[var(--color-ink)]"
              }`}
            >
              {isStripeReady
                ? "El pago se procesa fuera de la app mediante Stripe. El acceso se concede automaticamente cuando la compra queda confirmada por webhook."
                : isDemoMode
                  ? "Stripe no esta configurado en este entorno. La app dejara constancia de una activacion demo y te llevara al campus sin cobro real."
                  : "Stripe no esta configurado en este entorno y la inscripcion automatica queda bloqueada hasta habilitar una pasarela real."}
            </div>

            {course.activeEdition ? (
              <div className="mt-6 rounded-2xl border border-[rgba(12,113,195,0.16)] bg-white px-5 py-4 text-sm leading-7 text-[var(--color-ink)]">
                La matricula se asociara a <strong>{course.activeEdition.label}</strong>. Si la
                edicion termina, el acceso se mantendra hasta la fecha configurada para consulta.
              </div>
            ) : null}

            <div className="mt-10 grid gap-5 md:grid-cols-3">
              <div className="rounded-2xl border border-[var(--color-border)] bg-white p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">
                  Paso 1
                </p>
                <p className="mt-3 text-lg font-semibold text-[var(--color-ink)]">Cuenta</p>
                <p className="mt-2 text-sm leading-7 text-[var(--color-muted)]">
                  El curso se vincula a tu usuario para mantener acceso, notificaciones y auditoria.
                </p>
              </div>
              <div className="rounded-2xl border border-[var(--color-border)] bg-white p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">
                  Paso 2
                </p>
                <p className="mt-3 text-lg font-semibold text-[var(--color-ink)]">
                  {isStripeReady
                    ? "Pago seguro"
                    : isDemoMode
                      ? "Activacion demo"
                      : "Pago no disponible"}
                </p>
                <p className="mt-2 text-sm leading-7 text-[var(--color-muted)]">
                  {isStripeReady
                    ? "Puedes introducir un cupon y el importe final se genera en servidor."
                    : isDemoMode
                      ? "No se solicitan datos de pago porque no existe cobro real en este entorno."
                      : "No se inicia ningun cobro ni activacion automatica mientras no haya pasarela configurada."}
                </p>
              </div>
              <div className="rounded-2xl border border-[var(--color-border)] bg-white p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">
                  Paso 3
                </p>
                <p className="mt-3 text-lg font-semibold text-[var(--color-ink)]">Campus</p>
                <p className="mt-2 text-sm leading-7 text-[var(--color-muted)]">
                  Acceso al curso, materiales y foro privado segun la edicion asociada.
                </p>
              </div>
            </div>

            {!user ? (
              <div className="mt-10 rounded-2xl border border-[var(--color-border)] bg-white p-8">
                <h2 className="text-[2rem] font-semibold tracking-[-0.05em] text-[var(--color-ink)]">
                  Antes de continuar, identifica tu cuenta
                </h2>
                <p className="mt-4 text-[1.04rem] leading-8 text-[var(--color-ink)]/84">
                  Necesitamos un usuario para vincular la compra, gestionar tu acceso y dejar
                  trazabilidad de la matricula en el campus.
                </p>
                <div className="mt-8 space-y-3">
                  <ButtonLink className="w-full" href={`/registro?next=/checkout/${course.slug}`}>
                    Crear cuenta y continuar
                  </ButtonLink>
                  <ButtonLink
                    className="w-full"
                    href={`/acceder?next=/checkout/${course.slug}`}
                    variant="secondary"
                  >
                    Ya tengo cuenta
                  </ButtonLink>
                </div>
              </div>
            ) : (
              <div className="mt-10 rounded-2xl border border-[var(--color-border)] bg-white p-8">
                <div className="flex items-start gap-4">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[var(--color-surface)] text-[var(--color-primary)]">
                    <Shield className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-[2rem] font-semibold tracking-[-0.05em] text-[var(--color-ink)]">
                      Confirmacion del proceso
                    </h2>
                    <p className="mt-3 text-[1.04rem] leading-8 text-[var(--color-ink)]/84">
                      {isStripeReady
                        ? "Al pulsar el boton final saldras de esta pantalla y Stripe gestionara el pago."
                        : isDemoMode
                          ? "Al pulsar el boton final la app registrara una activacion local y te enviara al flujo de exito demo."
                          : "El boton final mostrara un bloqueo controlado hasta que este entorno disponga de una pasarela de pago real."}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </section>

          <aside className="lg:pt-12">
            <div className="rounded-2xl border border-[var(--color-border)] bg-white p-8 shadow-[0_18px_40px_rgba(34,34,33,0.06)]">
              <h2 className="text-[2.4rem] font-semibold tracking-[-0.05em] text-[var(--color-ink)]">
                Resumen del pedido
              </h2>

              <div className="mt-8 flex items-start gap-5">
                <CourseArtwork
                  className="h-20 w-20 shrink-0 rounded-xl"
                  course={course}
                  variant="thumb"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="text-[1.2rem] font-medium leading-6 text-[var(--color-ink)]">
                        {course.title}
                      </p>
                      <p className="mt-2 text-sm text-[var(--color-muted)]">{course.level}</p>
                    </div>
                    <p className="text-[1.2rem] font-medium text-[var(--color-ink)]">
                      {formatPrice(course.priceInCents)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 rounded-2xl bg-[var(--color-surface)] p-4 text-sm leading-7 text-[var(--color-muted)]">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-[var(--color-teal)]" />
                  <p>
                    {isStripeReady
                      ? "Compra real con confirmacion automatica y acceso privado por cuenta."
                      : isDemoMode
                        ? "Activacion demo local sin procesamiento de pago ni solicitud de tarjeta."
                        : "Compra bloqueada hasta disponer de un proveedor de pago configurado."}
                  </p>
                </div>
              </div>

              <div className="thin-divider mt-8 pt-8 text-[1.1rem] text-[var(--color-ink)]">
                <div className="flex items-center justify-between">
                  <span>Subtotal</span>
                  <span>{formatPrice(course.priceInCents)}</span>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <span>Impuestos (IVA 21%)</span>
                  <span>{formatPrice(taxAmount)}</span>
                </div>
              </div>

              <div className="thin-divider mt-8 flex items-end justify-between pt-8">
                <span className="text-[1.8rem] font-semibold tracking-[-0.05em] text-[var(--color-primary)]">
                  Total base
                </span>
                <span className="text-[3rem] font-semibold tracking-[-0.06em] text-[var(--color-primary)]">
                  {formatPrice(totalAmount)}
                </span>
              </div>

              <p className="mt-3 text-sm leading-7 text-[var(--color-muted)]">
                Si introduces un codigo promocional, el precio final se recalculara en servidor
                antes de iniciar el pago.
              </p>

              <div className="mt-8">
                {user ? (
                  <PurchaseForm
                    buttonLabel={
                      isStripeReady
                        ? "Ir a Stripe"
                        : isDemoMode
                          ? "Activar acceso demo"
                          : "Intentar compra"
                    }
                    courseSlug={course.slug}
                    courseEditionId={course.activeEdition?.id ?? null}
                    pendingLabel={
                      isStripeReady
                        ? "Redirigiendo a Stripe..."
                        : isDemoMode
                          ? "Activando acceso local..."
                          : "Verificando pasarela..."
                    }
                  />
                ) : (
                  <ButtonLink className="w-full" href={`/registro?next=/checkout/${course.slug}`}>
                    Iniciar proceso
                  </ButtonLink>
                )}
              </div>

              <p className="mt-6 text-center text-sm leading-6 text-[var(--color-muted)]">
                {isStripeReady
                  ? "El cobro se realiza fuera de esta pagina, en la pasarela segura de Stripe."
                  : isDemoMode
                    ? "Este entorno esta configurado para validar el flujo sin cobro real."
                    : "Este entorno no permite cobro ni activacion automatica hasta configurar Stripe."}
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

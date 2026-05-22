import type { Metadata } from "next";
import { CheckCircle2, Lock, Shield, UserRoundCheck } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { CourseArtwork } from "@/components/course-artwork";
import { PurchaseForm } from "@/components/purchase-form";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { SectionHeader } from "@/components/ui/section-header";
import { StateBanner } from "@/components/ui/state-banner";
import { SurfaceCard } from "@/components/ui/surface-card";
import { getCurrentUser } from "@/lib/auth";
import { getCatalogCourseBySlug } from "@/lib/course-catalog";
import { getPurchaseRuntimeMode } from "@/lib/purchase-runtime";
import { userOwnsCourse } from "@/lib/purchases";
import { formatPrice } from "@/lib/utils";

type CheckoutPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: CheckoutPageProps): Promise<Metadata> {
  const { slug } = await params;
  const course = await getCatalogCourseBySlug(slug);

  return {
    title: course ? `Inscripcion | ${course.title}` : "Inscripcion",
    robots: {
      index: false,
      follow: false,
    },
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
    <main className="campus-calm-bg min-h-[100dvh]">
      <header className="border-b border-[var(--color-border-subtle)] bg-[color:var(--color-surface-elevated)]">
        <div className="site-container flex min-h-[var(--topbar-height)] items-center justify-between gap-4">
          <div>
            <p className="font-premium text-heading-lg font-semibold text-[var(--color-text)]">
              Autismo Cordoba
            </p>
            <p className="text-label-sm text-[var(--color-text-muted)]">
              Pago seguro institucional
            </p>
          </div>
          <Badge
            tone={isStripeReady ? "brand" : isDemoMode ? "warning" : "danger"}
          >
            {isStripeReady
              ? "Pago real con Stripe"
              : isDemoMode
                ? "Modo demo local"
                : "Checkout desactivado"}
          </Badge>
        </div>
      </header>

      <div className="site-container py-8 sm:py-10 lg:py-12">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_24rem] xl:grid-cols-[minmax(0,1fr)_26rem]">
          <section className="flex flex-col gap-6">
            <h1 className="sr-only">Finalizar inscripcion</h1>
            <SectionHeader
              description={
                isStripeReady
                  ? "Vas a pasar a una pasarela segura para completar el pago y activar el curso en tu cuenta."
                  : isDemoMode
                    ? "Estas en un flujo de validacion. El boton final no cobra: activa acceso local de prueba para revisar el producto end to end."
                    : "La pasarela de pago no esta disponible en este entorno, por lo que no se puede completar la inscripcion automatica."
              }
              eyebrow="Checkout institucional"
              title="Finalizar inscripcion"
            />

            <StateBanner
              description={
                isStripeReady
                  ? "El pago se procesa fuera de la app mediante Stripe. El acceso se concede automaticamente cuando la compra queda confirmada por webhook."
                  : isDemoMode
                    ? "Stripe no esta configurado en este entorno. La app registrara una activacion demo y te llevara al flujo de exito sin cobro real."
                    : "Stripe no esta configurado en este entorno y la inscripcion automatica queda bloqueada hasta habilitar una pasarela real."
              }
              icon={<Lock className="size-4" strokeWidth={2} />}
              title={
                isStripeReady
                  ? "Procesamiento seguro"
                  : isDemoMode
                    ? "Validacion local"
                    : "Entorno no operativo"
              }
              tone={isStripeReady ? "info" : isDemoMode ? "warning" : "danger"}
            />

            {course.activeEdition ? (
              <SurfaceCard padding="md" variant="muted">
                <p className="text-sm leading-7 text-[var(--color-text)]">
                  La matricula se asociara a{" "}
                  <strong>{course.activeEdition.label}</strong>. Si la edicion
                  termina, el acceso se mantendra hasta la fecha configurada
                  para consulta.
                </p>
              </SurfaceCard>
            ) : null}

            <div className="grid gap-4 md:grid-cols-3">
              <SurfaceCard padding="md">
                <p className="text-meta-xs font-semibold text-[var(--color-primary)]">
                  Paso 1
                </p>
                <div className="mt-4 flex items-start gap-3">
                  <UserRoundCheck
                    className="mt-0.5 size-4 shrink-0 text-[var(--color-primary)]"
                    strokeWidth={2}
                  />
                  <div>
                    <p className="font-premium text-heading-md font-semibold text-[var(--color-text)]">
                      Cuenta
                    </p>
                    <p className="mt-2 text-sm leading-7 text-[var(--color-text-muted)]">
                      La compra se vincula a tu usuario para mantener acceso,
                      progreso y trazabilidad.
                    </p>
                  </div>
                </div>
              </SurfaceCard>

              <SurfaceCard padding="md">
                <p className="text-meta-xs font-semibold text-[var(--color-primary)]">
                  Paso 2
                </p>
                <div className="mt-4 flex items-start gap-3">
                  <Shield
                    className="mt-0.5 size-4 shrink-0 text-[var(--color-primary)]"
                    strokeWidth={2}
                  />
                  <div>
                    <p className="font-premium text-heading-md font-semibold text-[var(--color-text)]">
                      {isStripeReady
                        ? "Pago seguro"
                        : isDemoMode
                          ? "Activacion demo"
                          : "Pago no disponible"}
                    </p>
                    <p className="mt-2 text-sm leading-7 text-[var(--color-text-muted)]">
                      {isStripeReady
                        ? "Puedes introducir un codigo promocional y el importe final se calculara en servidor."
                        : isDemoMode
                          ? "No se solicitan datos de pago porque no existe cobro real en este entorno."
                          : "No se inicia ningun cobro ni activacion automatica mientras no haya pasarela configurada."}
                    </p>
                  </div>
                </div>
              </SurfaceCard>

              <SurfaceCard padding="md">
                <p className="text-meta-xs font-semibold text-[var(--color-primary)]">
                  Paso 3
                </p>
                <div className="mt-4 flex items-start gap-3">
                  <CheckCircle2
                    className="mt-0.5 size-4 shrink-0 text-[var(--color-primary)]"
                    strokeWidth={2}
                  />
                  <div>
                    <p className="font-premium text-heading-md font-semibold text-[var(--color-text)]">
                      Campus
                    </p>
                    <p className="mt-2 text-sm leading-7 text-[var(--color-text-muted)]">
                      Acceso al curso, materiales y foro privado segun la
                      edicion asociada.
                    </p>
                  </div>
                </div>
              </SurfaceCard>
            </div>

            {!user ? (
              <SurfaceCard
                actions={
                  <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                    <ButtonLink
                      href={`/registro?next=/checkout/${course.slug}`}
                    >
                      Crear cuenta y continuar
                    </ButtonLink>
                    <ButtonLink
                      href={`/acceder?next=/checkout/${course.slug}`}
                      variant="neutral"
                    >
                      Ya tengo cuenta
                    </ButtonLink>
                  </div>
                }
                description="Necesitamos un usuario para vincular la compra, gestionar tu acceso y dejar trazabilidad de la matricula en el campus."
                title="Antes de continuar, identifica tu cuenta"
              >
                <div />
              </SurfaceCard>
            ) : (
              <SurfaceCard
                description={
                  isStripeReady
                    ? "Al pulsar el boton final saldras de esta pantalla y Stripe gestionara el pago."
                    : isDemoMode
                      ? "Al pulsar el boton final la app registrara una activacion local y te llevara al flujo de exito demo."
                      : "El boton final mostrara un bloqueo controlado hasta que este entorno disponga de una pasarela de pago real."
                }
                title="Confirmacion del proceso"
              >
                <div className="flex items-start gap-4">
                  <div className="grid size-12 shrink-0 place-items-center rounded-[var(--radius-pill)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
                    <Shield className="size-5" strokeWidth={2} />
                  </div>
                  <p className="text-sm leading-7 text-[var(--color-text-muted)]">
                    El checkout mantiene la logica actual. Esta capa solo
                    reorganiza la experiencia para que el proceso sea mas
                    legible y mas calmado.
                  </p>
                </div>
              </SurfaceCard>
            )}
          </section>

          <aside className="lg:sticky lg:top-6 lg:self-start">
            <SurfaceCard
              description="Resumen economico y activacion vinculada a tu cuenta."
              padding="lg"
              title="Resumen del pedido"
            >
              <div className="flex items-start gap-4">
                <CourseArtwork
                  className="size-20 shrink-0 rounded-[var(--radius-md)]"
                  course={course}
                  variant="thumb"
                />
                <div className="min-w-0 flex-1">
                  <p className="font-premium text-heading-md font-semibold text-[var(--color-text)]">
                    {course.title}
                  </p>
                  <p className="mt-2 text-sm text-[var(--color-text-muted)]">
                    {course.level}
                  </p>
                </div>
              </div>

              <div className="mt-5">
                <CourseArtwork
                  className="hidden h-44 w-full rounded-[var(--radius-lg)] lg:block"
                  course={course}
                  variant="hero"
                />
              </div>

              <StateBanner
                className="mt-5"
                description={
                  isStripeReady
                    ? "Compra real con confirmacion automatica y acceso privado por cuenta."
                    : isDemoMode
                      ? "Activacion demo local sin procesamiento de pago ni solicitud de tarjeta."
                      : "Compra bloqueada hasta disponer de un proveedor de pago configurado."
                }
                title="Estado del entorno"
                tone={
                  isStripeReady ? "info" : isDemoMode ? "warning" : "danger"
                }
              />

              <div className="mt-6 border-t border-[var(--color-border-subtle)] pt-6 text-sm text-[var(--color-text)]">
                <div className="flex items-center justify-between">
                  <span>Subtotal</span>
                  <span>{formatPrice(course.priceInCents)}</span>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <span>Impuestos (IVA 21%)</span>
                  <span>{formatPrice(taxAmount)}</span>
                </div>
              </div>

              <div className="mt-6 border-t border-[var(--color-border-subtle)] pt-6">
                <div className="flex items-end justify-between gap-4">
                  <span className="font-premium text-heading-lg font-semibold text-[var(--color-text)]">
                    Total
                  </span>
                  <span className="font-premium text-display-md font-semibold text-[var(--color-primary)]">
                    {formatPrice(totalAmount)}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-7 text-[var(--color-text-muted)]">
                  Si introduces un codigo promocional, el precio final se
                  recalculara en servidor antes de iniciar el pago.
                </p>
              </div>

              <div className="mt-6">
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
                  <ButtonLink
                    className="w-full"
                    href={`/registro?next=/checkout/${course.slug}`}
                  >
                    Iniciar proceso
                  </ButtonLink>
                )}
              </div>
            </SurfaceCard>
          </aside>
        </div>
      </div>
    </main>
  );
}

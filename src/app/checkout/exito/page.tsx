import type { Metadata } from "next";
import { CheckCircle2 } from "lucide-react";
import { notFound } from "next/navigation";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getCatalogCourseBySlug } from "@/lib/course-catalog";
import { firstValue } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Compra completada",
  robots: {
    index: false,
    follow: false
  }
};

type SuccessPageProps = {
  searchParams: Promise<{ course?: string | string[]; demo?: string | string[] }>;
};

export default async function CheckoutSuccessPage({ searchParams }: SuccessPageProps) {
  const params = await searchParams;
  const courseSlug = firstValue(params.course);
  const demo = firstValue(params.demo);

  if (!courseSlug) {
    notFound();
  }

  const course = await getCatalogCourseBySlug(courseSlug);

  if (!course) {
    notFound();
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-220px)] w-full max-w-4xl items-center px-6 py-14 lg:px-8">
      <Card className="w-full p-8 text-center lg:p-12">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[rgba(13,99,86,0.12)]">
          <CheckCircle2 className="h-8 w-8 text-[var(--color-teal)]" />
        </div>
        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.24em] text-[var(--color-muted)]">
          Compra completada
        </p>
        <h1 className="mt-4 font-display text-4xl text-[var(--color-ink)]">
          Ya puedes acceder a &quot;{course.title}&quot;
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-[var(--color-muted)]">
          Hemos registrado el acceso en tu cuenta. A partir de ahora lo veras en tu campus
          mientras la matricula y la ventana de acceso sigan vigentes.
        </p>
        {demo ? (
          <p className="mx-auto mt-4 max-w-xl rounded-2xl bg-[var(--color-surface)] px-4 py-3 text-xs leading-6 text-[var(--color-muted)]">
            Estas viendo el flujo demo local. Cuando Stripe este configurado, esta pantalla
            se mostrara despues del pago real y del webhook de confirmacion.
          </p>
        ) : null}
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <ButtonLink href={`/mis-cursos/${course.slug}`}>Ir al curso</ButtonLink>
          <ButtonLink href="/mi-cuenta" variant="secondary">
            Ver mi cuenta
          </ButtonLink>
        </div>
      </Card>
    </div>
  );
}

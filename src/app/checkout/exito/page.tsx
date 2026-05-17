import type { Metadata } from "next";
import { CheckCircle2 } from "lucide-react";
import { notFound } from "next/navigation";
import { CheckoutAccessPoller } from "@/components/checkout/checkout-access-poller";
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

  const isDemo = demo === "1";

  return (
    <div className="mx-auto flex min-h-[calc(100vh-220px)] w-full max-w-4xl flex-col items-center px-6 py-14 lg:px-8">
      <div className="mb-6 grid h-14 w-14 place-items-center rounded-full bg-[var(--color-primary-soft)]">
        <CheckCircle2 aria-hidden className="h-7 w-7 text-[var(--color-primary)]" />
      </div>
      <CheckoutAccessPoller
        courseSlug={course.slug}
        courseTitle={course.title}
        isDemo={isDemo}
      />
    </div>
  );
}

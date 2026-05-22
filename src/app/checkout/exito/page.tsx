import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CheckoutAccessPoller } from "@/components/checkout/checkout-access-poller";
import { getCatalogCourseBySlug } from "@/lib/course-catalog";
import { firstValue } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Compra completada",
  robots: {
    index: false,
    follow: false,
  },
};

type SuccessPageProps = {
  searchParams: Promise<{
    course?: string | string[];
    demo?: string | string[];
  }>;
};

export default async function CheckoutSuccessPage({
  searchParams,
}: SuccessPageProps) {
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
    <main className="campus-calm-bg min-h-[100dvh] px-5 py-8 sm:px-6 sm:py-10 lg:px-8">
      <div className="mx-auto flex w-full max-w-4xl flex-col items-center">
        <CheckoutAccessPoller
          courseSlug={course.slug}
          courseTitle={course.title}
          isDemo={isDemo}
        />
      </div>
    </main>
  );
}

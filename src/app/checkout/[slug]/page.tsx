import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { CheckoutPage } from "@/components/checkout/checkout-page";
import { getCurrentUser } from "@/lib/auth";
import { getCatalogCourseBySlug } from "@/lib/course-catalog";
import { getPurchaseRuntimeMode } from "@/lib/purchase-runtime";
import { userOwnsCourse } from "@/lib/purchases";

type CheckoutPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: CheckoutPageProps): Promise<Metadata> {
  const { slug } = await params;
  const course = await getCatalogCourseBySlug(slug);

  return {
    title: course ? `Inscripción | ${course.title}` : "Inscripción",
    robots: { index: false, follow: false },
  };
}

export default async function CheckoutRoute({ params }: CheckoutPageProps) {
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

  return (
    <CheckoutPage
      course={course}
      isDemoMode={isDemoMode}
      isStripeReady={isStripeReady}
      user={user ? { name: user.name, email: user.email } : null}
    />
  );
}

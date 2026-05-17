import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getCatalogCourseBySlug } from "@/lib/course-catalog";
import { userOwnsCourse } from "@/lib/purchases";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { slug } = await context.params;
  const course = await getCatalogCourseBySlug(slug);

  if (!course) {
    return NextResponse.json({ enrolled: false, reason: "not_found" }, { status: 404 });
  }

  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ enrolled: false, reason: "unauthenticated" }, { status: 401 });
  }

  const enrolled = await userOwnsCourse(user.id, course.slug);

  return NextResponse.json({
    enrolled,
    courseSlug: course.slug
  });
}

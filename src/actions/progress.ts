"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { getCatalogCourseBySlug } from "@/lib/course-catalog";
import { setCourseModuleProgress } from "@/lib/course-progress";
import { canAccessCourseCommunityForCourse } from "@/lib/course-community";
import { getSafeRedirect } from "@/lib/redirect";

const updateCourseModuleProgressSchema = z.object({
  courseSlug: z.string().min(1),
  moduleId: z.string().min(1),
  completed: z.union([z.literal("true"), z.literal("false")]),
  nextPath: z.string().optional()
});

export async function updateCourseModuleProgressAction(formData: FormData) {
  const parsed = updateCourseModuleProgressSchema.safeParse({
    courseSlug: formData.get("courseSlug"),
    moduleId: formData.get("moduleId"),
    completed: formData.get("completed"),
    nextPath: formData.get("nextPath")
  });

  if (!parsed.success) {
    redirect("/mi-cuenta");
  }

  const user = await getCurrentUser();

  if (!user) {
    redirect(`/acceder?next=${encodeURIComponent(`/mis-cursos/${parsed.data.courseSlug}`)}`);
  }

  const course = await getCatalogCourseBySlug(parsed.data.courseSlug);

  if (!course) {
    redirect("/cursos");
  }

  const access = await canAccessCourseCommunityForCourse({
    userId: user.id,
    email: user.email,
    course
  });

  if (!access.allowed) {
    redirect(`/checkout/${course.slug}`);
  }

  await setCourseModuleProgress({
    userId: user.id,
    course,
    moduleId: parsed.data.moduleId,
    isCompleted: parsed.data.completed === "true"
  });

  const nextPath = getSafeRedirect(parsed.data.nextPath, `/mis-cursos/${course.slug}`);

  revalidatePath("/mi-cuenta");
  revalidatePath(`/mis-cursos/${course.slug}`);
  redirect(nextPath);
}

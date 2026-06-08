"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { canAccessCourseCommunityForCourse, canModerateCourse } from "@/lib/course-community";
import { getCatalogCourseBySlug } from "@/lib/course-catalog";
import { getDb } from "@/lib/prisma";
import { upsertRubricScores } from "@/lib/submission-review";

export type ReviewSubmissionState = {
  error?: string;
  success?: string;
};

const schema = z.object({
  submissionId: z.string().min(1),
  courseSlug: z.string().min(1),
  status: z.enum(["REVIEWED", "CHANGES_REQUESTED"]),
  score: z.string().optional(),
  feedback: z
    .string()
    .min(8, "Escribe un feedback más útil para el alumno.")
    .max(4000),
});

const draftSchema = z.object({
  submissionId: z.string().min(1),
  courseSlug: z.string().min(1),
  score: z.string().optional(),
  feedback: z.string().max(4000).optional(),
});

export async function reviewSubmissionAction(
  _prev: ReviewSubmissionState,
  formData: FormData,
): Promise<ReviewSubmissionState> {
  const parsed = schema.safeParse({
    submissionId: formData.get("submissionId"),
    courseSlug: formData.get("courseSlug"),
    status: formData.get("status"),
    score: formData.get("score") ?? undefined,
    feedback: formData.get("feedback"),
  });

  if (!parsed.success) {
    const first = parsed.error.errors[0];
    return { error: first?.message ?? "Datos inválidos." };
  }

  const user = await getCurrentUser();
  if (!user) return { error: "Sesión requerida." };

  const course = await getCatalogCourseBySlug(parsed.data.courseSlug);
  if (!course) return { error: "Curso no encontrado." };

  const access = await canAccessCourseCommunityForCourse({
    userId: user.id,
    email: user.email,
    course,
    userGlobalRole: user.globalRole,
    userIsActive: user.isActive,
  });

  if (!access.allowed || !canModerateCourse(access.role)) {
    return { error: "No tienes permisos para revisar esta entrega." };
  }

  const submission = await getDb().courseResourceSubmission.findUnique({
    where: { id: parsed.data.submissionId },
    select: { id: true, resourceId: true, resource: { select: { course: { select: { slug: true } } } } },
  });

  if (!submission || submission.resource.course.slug !== parsed.data.courseSlug) {
    return { error: "Entrega no encontrada." };
  }

  let score: number | null = null;
  if (parsed.data.status === "REVIEWED") {
    const raw = parsed.data.score?.trim().replace(",", ".");
    const num = raw ? Number(raw) : Number.NaN;
    if (Number.isNaN(num) || num < 0 || num > 10) {
      return { error: "La calificación debe estar entre 0 y 10." };
    }
    score = num;
  }

  // Persist rubric scores if provided (criterionId:points pairs encoded as JSON)
  const rubricRaw = formData.get("rubricScores");
  if (typeof rubricRaw === "string" && rubricRaw) {
    try {
      const rubricData = JSON.parse(rubricRaw) as Array<{ criterionId: string; points: number; comment?: string }>;
      if (Array.isArray(rubricData) && rubricData.length > 0) {
        await upsertRubricScores({ submissionId: parsed.data.submissionId, scores: rubricData });
      }
    } catch {
      // Ignore rubric parsing errors — don't block the review.
    }
  }

  await getDb().courseResourceSubmission.update({
    where: { id: parsed.data.submissionId },
    data: {
      status: parsed.data.status,
      score,
      feedback: parsed.data.feedback,
      reviewerId: user.id,
      reviewedAt: new Date(),
    },
  });

  revalidatePath(`/mis-cursos/${parsed.data.courseSlug}/seguimiento`);
  revalidatePath(`/docente/tareas/revision/${parsed.data.submissionId}`);

  return {
    success:
      parsed.data.status === "REVIEWED"
        ? "Nota publicada correctamente."
        : "Se solicitaron cambios al alumno.",
  };
}

// ─── Save draft (no status change) ───────────────────────────────────────────

export async function saveReviewDraftAction(
  _prev: ReviewSubmissionState,
  formData: FormData,
): Promise<ReviewSubmissionState> {
  const parsed = draftSchema.safeParse({
    submissionId: formData.get("submissionId"),
    courseSlug: formData.get("courseSlug"),
    score: formData.get("score") ?? undefined,
    feedback: formData.get("feedback") ?? undefined,
  });

  if (!parsed.success) {
    return { error: "Datos inválidos." };
  }

  const user = await getCurrentUser();
  if (!user) return { error: "Sesión requerida." };

  const course = await getCatalogCourseBySlug(parsed.data.courseSlug);
  if (!course) return { error: "Curso no encontrado." };

  const access = await canAccessCourseCommunityForCourse({
    userId: user.id,
    email: user.email,
    course,
    userGlobalRole: user.globalRole,
    userIsActive: user.isActive,
  });

  if (!access.allowed || !canModerateCourse(access.role)) {
    return { error: "Sin permisos." };
  }

  // Persist rubric scores
  const rubricRaw = formData.get("rubricScores");
  if (typeof rubricRaw === "string" && rubricRaw) {
    try {
      const rubricData = JSON.parse(rubricRaw) as Array<{ criterionId: string; points: number; comment?: string }>;
      if (Array.isArray(rubricData) && rubricData.length > 0) {
        await upsertRubricScores({ submissionId: parsed.data.submissionId, scores: rubricData });
      }
    } catch {
      // Ignore rubric parsing errors.
    }
  }

  // Update score + feedback without changing status
  const raw = parsed.data.score?.trim().replace(",", ".");
  const score = raw ? Number(raw) : null;

  if (score !== null && !isNaN(score) && (score < 0 || score > 10)) {
    return { error: "La calificación debe estar entre 0 y 10." };
  }

  await getDb().courseResourceSubmission.update({
    where: { id: parsed.data.submissionId },
    data: {
      ...(score !== null && !isNaN(score) ? { score } : {}),
      ...(parsed.data.feedback ? { feedback: parsed.data.feedback } : {}),
      reviewerId: user.id,
    },
  });

  revalidatePath(`/docente/tareas/revision/${parsed.data.submissionId}`);
  return { success: "Borrador guardado." };
}

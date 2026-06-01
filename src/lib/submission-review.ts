import type { CourseResourceSubmissionStatus } from "@prisma/client";
import { getDb } from "@/lib/prisma";

export type RubricCriterionWithScore = {
  id: string;
  title: string;
  description: string | null;
  maxPoints: number;
  order: number;
  /** Existing score for this criterion in this submission (null if not yet scored) */
  scoredPoints: number | null;
  scoreId: string | null;
  scoreComment: string | null;
};

export type SubmissionForReview = {
  id: string;
  status: CourseResourceSubmissionStatus;
  body: string | null;
  linkUrl: string | null;
  attachmentLabel: string | null;
  mimeType: string | null;
  sizeInBytes: number | null;
  score: number | null;
  feedback: string | null;
  submittedAt: Date;
  reviewedAt: Date | null;
  // Student
  studentId: string;
  studentName: string;
  studentEmail: string;
  studentInitials: string;
  // Reviewer
  reviewerName: string | null;
  // Resource
  resourceId: string;
  resourceTitle: string;
  resourceDescription: string;
  passingScore: number | null;
  moduleTitle: string | null;
  // Course
  courseSlug: string;
  courseTitle: string;
  // Rubric (empty array if no rubric defined)
  rubricCriteria: RubricCriterionWithScore[];
};

function buildInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => (part[0] ?? "").toUpperCase())
    .join("");
}

export async function getSubmissionForReview(
  submissionId: string,
): Promise<SubmissionForReview | null> {
  try {
    const record = await getDb().courseResourceSubmission.findUnique({
      where: { id: submissionId },
      include: {
        student: { select: { id: true, name: true, email: true } },
        reviewer: { select: { id: true, name: true } },
        resource: {
          select: {
            id: true,
            title: true,
            description: true,
            passingScore: true,
            module: { select: { title: true } },
            course: { select: { slug: true, title: true } },
            rubricCriteria: {
              orderBy: { order: "asc" },
              select: { id: true, title: true, description: true, maxPoints: true, order: true },
            },
          },
        },
        rubricScores: {
          select: { id: true, criterionId: true, points: true, comment: true },
        },
      },
    });

    if (!record) return null;

    const displayName = record.student.name ?? record.student.email;

    // Merge criteria with their scores
    const scoresByCriterionId = new Map(record.rubricScores.map((s) => [s.criterionId, s]));

    const rubricCriteria: RubricCriterionWithScore[] = record.resource.rubricCriteria.map((c) => {
      const score = scoresByCriterionId.get(c.id) ?? null;
      return {
        id: c.id,
        title: c.title,
        description: c.description,
        maxPoints: c.maxPoints,
        order: c.order,
        scoredPoints: score?.points ?? null,
        scoreId: score?.id ?? null,
        scoreComment: score?.comment ?? null,
      };
    });

    return {
      id: record.id,
      status: record.status,
      body: record.body,
      linkUrl: record.linkUrl,
      attachmentLabel: record.attachmentLabel,
      mimeType: record.mimeType,
      sizeInBytes: record.sizeInBytes,
      score: record.score,
      feedback: record.feedback,
      submittedAt: record.submittedAt,
      reviewedAt: record.reviewedAt,
      studentId: record.student.id,
      studentName: displayName,
      studentEmail: record.student.email,
      studentInitials: buildInitials(displayName),
      reviewerName: record.reviewer?.name ?? null,
      resourceId: record.resourceId,
      resourceTitle: record.resource.title,
      resourceDescription: record.resource.description ?? "",
      passingScore: record.resource.passingScore,
      moduleTitle: record.resource.module?.title ?? null,
      courseSlug: record.resource.course.slug,
      courseTitle: record.resource.course.title,
      rubricCriteria,
    };
  } catch {
    return null;
  }
}

// ─── Rubric management ────────────────────────────────────────────────────────

export async function upsertRubricCriteria(input: {
  resourceId: string;
  criteria: Array<{ id?: string; title: string; description?: string; maxPoints: number; order: number }>;
}) {
  const db = getDb();

  for (const c of input.criteria) {
    if (c.id) {
      await db.rubricCriterion.update({
        where: { id: c.id },
        data: { title: c.title.trim(), description: c.description?.trim() || null, maxPoints: c.maxPoints, order: c.order },
      });
    } else {
      await db.rubricCriterion.create({
        data: { resourceId: input.resourceId, title: c.title.trim(), description: c.description?.trim() || null, maxPoints: c.maxPoints, order: c.order },
      });
    }
  }
}

export async function upsertRubricScores(input: {
  submissionId: string;
  scores: Array<{ criterionId: string; points: number; comment?: string }>;
}) {
  const db = getDb();

  for (const s of input.scores) {
    await db.rubricScore.upsert({
      where: { submissionId_criterionId: { submissionId: input.submissionId, criterionId: s.criterionId } },
      create: { submissionId: input.submissionId, criterionId: s.criterionId, points: s.points, comment: s.comment?.trim() || null },
      update: { points: s.points, comment: s.comment?.trim() || null },
    });
  }
}

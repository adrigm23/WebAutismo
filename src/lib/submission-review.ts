import type { CourseResourceSubmissionStatus } from "@prisma/client";
import { getDb } from "@/lib/prisma";

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
  // Course
  courseSlug: string;
  courseTitle: string;
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
            course: { select: { slug: true, title: true } },
          },
        },
      },
    });

    if (!record) return null;

    const displayName = record.student.name ?? record.student.email;

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
      courseSlug: record.resource.course.slug,
      courseTitle: record.resource.course.title,
    };
  } catch {
    return null;
  }
}

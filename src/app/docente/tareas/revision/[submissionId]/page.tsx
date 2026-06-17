import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { canAccessCourseCommunityForCourse, canModerateCourse } from "@/lib/course-community";
import { getCatalogCourseBySlug } from "@/lib/course-catalog";
import { getSubmissionForReview } from "@/lib/submission-review";
import { TeacherShell } from "@/components/docente/teacher-shell";
import { SubmissionReviewPage } from "@/components/docente/submission-review-page";

type Props = {
  params: Promise<{ submissionId: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { submissionId } = await params;
  const submission = await getSubmissionForReview(submissionId);
  return {
    title: submission
      ? `Revisión: ${submission.resourceTitle} — ${submission.studentName}`
      : "Revisión de entrega",
    robots: { index: false, follow: false },
  };
}

function buildInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => (p[0] ?? "").toUpperCase())
    .join("");
}

export default async function SubmissionReviewRoute({ params }: Props) {
  const { submissionId } = await params;

  const user = await requireUser(`/docente/tareas/revision/${submissionId}`);

  const submission = await getSubmissionForReview(submissionId);
  if (!submission) notFound();

  // Verify reviewer has moderation rights on the course
  const course = await getCatalogCourseBySlug(submission.courseSlug);
  if (!course) notFound();

  const access = await canAccessCourseCommunityForCourse({
    userId: user.id,
    email: user.email,
    course,
    userGlobalRole: user.globalRole,
    userIsActive: user.isActive,
  });

  if (!access.allowed || !canModerateCourse(access.role)) {
    redirect(`/mis-cursos/${submission.courseSlug}`);
  }

  const viewerName = user.name ?? user.email;

  return (
    <TeacherShell
      viewerInitials={buildInitials(viewerName)}
      viewerName={viewerName}
      roleLabel="Docente"
      isAdmin={user.globalRole === "ADMIN"}
    >
      <SubmissionReviewPage
        reviewerName={viewerName}
        submission={submission}
      />
    </TeacherShell>
  );
}

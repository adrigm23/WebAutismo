import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { canAccessCourseCommunity, canModerateCourse } from "@/lib/course-community";
import { readStoredCourseResourceSubmissionContent } from "@/lib/course-resource-submission-storage";
import { getDb } from "@/lib/prisma";

export async function GET(
  _: Request,
  { params }: { params: Promise<{ submissionId: string }> }
) {
  const { submissionId } = await params;
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const submission = await getDb().courseResourceSubmission.findUnique({
    where: {
      id: submissionId
    },
    include: {
      resource: {
        select: {
          course: {
            select: {
              slug: true
            }
          }
        }
      }
    }
  });

  if (!submission || !submission.storageKey) {
    return NextResponse.json({ error: "Submission attachment not found." }, { status: 404 });
  }

  const accessResult = await canAccessCourseCommunity({
    userId: user.id,
    email: user.email,
    courseSlug: submission.resource.course.slug
  });

  if (!accessResult.allowed) {
    return NextResponse.json({ error: "Submission attachment access denied." }, { status: 403 });
  }

  const canDownloadOwn = submission.studentId === user.id;
  const canDownloadAsStaff = canModerateCourse(accessResult.role);

  if (!canDownloadOwn && !canDownloadAsStaff) {
    return NextResponse.json({ error: "Submission attachment access denied." }, { status: 403 });
  }

  try {
    const fileBuffer = await readStoredCourseResourceSubmissionContent(submission.storageKey);
    const headers = new Headers();

    headers.set("Content-Type", submission.mimeType || "application/octet-stream");
    headers.set(
      "Content-Disposition",
      `attachment; filename="${submission.attachmentLabel ?? "entrega"}"`
    );
    headers.set("Cache-Control", "private, no-store");

    return new NextResponse(fileBuffer, {
      status: 200,
      headers
    });
  } catch {
    return NextResponse.json({ error: "Stored submission attachment file not found." }, { status: 404 });
  }
}

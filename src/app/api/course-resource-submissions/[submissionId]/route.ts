import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { canAccessCourseCommunity, canModerateCourse } from "@/lib/course-community";
import { readStoredCourseResourceSubmissionContent } from "@/lib/course-resource-submission-storage";
import { buildPrivateFileHeaders } from "@/lib/download-response";
import { getDb } from "@/lib/prisma";
import { buildRequestFingerprint } from "@/lib/request-client";
import { consumeRateLimit } from "@/lib/rate-limit";

export async function GET(
  request: Request,
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

  const downloadRateLimit = consumeRateLimit({
    bucket: "course-submission-download",
    key: buildRequestFingerprint(request.headers, [user.id, submissionId]),
    limit: 30,
    windowMs: 5 * 60 * 1_000
  });

  if (!downloadRateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many download requests." },
      {
        status: 429,
        headers: {
          "Retry-After": `${downloadRateLimit.retryAfterSeconds}`
        }
      }
    );
  }

  try {
    const fileBuffer = await readStoredCourseResourceSubmissionContent(submission.storageKey);
    const headers = buildPrivateFileHeaders({
      fileName: submission.attachmentLabel ?? "entrega",
      mimeType: submission.mimeType
    });

    return new NextResponse(fileBuffer, {
      status: 200,
      headers
    });
  } catch {
    return NextResponse.json({ error: "Stored submission attachment file not found." }, { status: 404 });
  }
}

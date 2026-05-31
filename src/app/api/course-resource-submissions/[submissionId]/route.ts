import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { canAccessCourseCommunity, canModerateCourse } from "@/lib/course-community";
import { readStoredCourseResourceSubmissionContent } from "@/lib/course-resource-submission-storage";
import { buildPrivateFileHeaders } from "@/lib/download-response";
import { createRequestLogger, getRequestIdFromHeaders } from "@/lib/logger";
import { getDb } from "@/lib/prisma";
import { buildRequestFingerprint } from "@/lib/request-client";
import { consumeRateLimit } from "@/lib/rate-limit";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ submissionId: string }> }
) {
  const { submissionId } = await params;
  const downloadLogger = createRequestLogger({
    requestId: getRequestIdFromHeaders(request.headers),
    route: "/api/course-resource-submissions/[submissionId]",
    action: "downloadCourseResourceSubmission"
  });
  const startedAt = Date.now();
  const user = await getCurrentUser();

  if (!user) {
    downloadLogger.warn("Submission attachment download rejected because user is not authenticated.", {
      submissionId,
      result: "unauthenticated",
      durationMs: Date.now() - startedAt
    });
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
    downloadLogger.warn("Submission attachment download failed because the submission was not found.", {
      userId: user.id,
      submissionId,
      result: "missing-submission",
      durationMs: Date.now() - startedAt
    });
    return NextResponse.json({ error: "Submission attachment not found." }, { status: 404 });
  }

  const accessResult = await canAccessCourseCommunity({
    userId: user.id,
    email: user.email,
    courseSlug: submission.resource.course.slug
  });

  if (!accessResult.allowed) {
    downloadLogger.warn("Submission attachment download denied by course access policy.", {
      userId: user.id,
      submissionId,
      courseSlug: submission.resource.course.slug,
      result: "forbidden",
      durationMs: Date.now() - startedAt
    });
    return NextResponse.json({ error: "Submission attachment access denied." }, { status: 403 });
  }

  const canDownloadOwn = submission.studentId === user.id;
  const canDownloadAsStaff = canModerateCourse(accessResult.role);

  if (!canDownloadOwn && !canDownloadAsStaff) {
    downloadLogger.warn("Submission attachment download denied by ownership policy.", {
      userId: user.id,
      submissionId,
      courseSlug: submission.resource.course.slug,
      result: "ownership-denied",
      durationMs: Date.now() - startedAt
    });
    return NextResponse.json({ error: "Submission attachment access denied." }, { status: 403 });
  }

  const downloadRateLimit = await consumeRateLimit({
    bucket: "course-submission-download",
    key: buildRequestFingerprint(request.headers, [user.id, submissionId]),
    limit: 30,
    windowMs: 5 * 60 * 1_000
  });

  if (!downloadRateLimit.allowed) {
    downloadLogger.warn("Submission attachment download rate limited.", {
      userId: user.id,
      submissionId,
      courseSlug: submission.resource.course.slug,
      result: "rate-limited",
      durationMs: Date.now() - startedAt
    });
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
    const requestUrl = new URL(request.url);
    const inline = requestUrl.searchParams.get("inline") === "1";
    const headers = inline
      ? new Headers({
          "Content-Type": submission.mimeType ?? "application/octet-stream",
          "Content-Disposition": "inline",
          "Cache-Control": "private, no-cache",
          "X-Content-Type-Options": "nosniff",
        })
      : buildPrivateFileHeaders({
          fileName: submission.attachmentLabel ?? "entrega",
          mimeType: submission.mimeType,
        });

    downloadLogger.info("Submission attachment downloaded.", {
      userId: user.id,
      submissionId,
      courseSlug: submission.resource.course.slug,
      result: "downloaded",
      durationMs: Date.now() - startedAt
    });

    return new NextResponse(fileBuffer, {
      status: 200,
      headers
    });
  } catch (error) {
    downloadLogger.error("Submission attachment download failed while reading storage.", {
      userId: user.id,
      submissionId,
      courseSlug: submission.resource.course.slug,
      result: "storage-miss",
      durationMs: Date.now() - startedAt,
      error: error instanceof Error ? error : new Error(String(error))
    });
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Stored submission attachment file not found."
      },
      { status: 404 }
    );
  }
}

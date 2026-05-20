import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { canAccessCourseCommunity } from "@/lib/course-community";
import { readStoredCourseResourceContent } from "@/lib/course-resource-storage";
import { buildPrivateFileHeaders } from "@/lib/download-response";
import { createRequestLogger, getRequestIdFromHeaders } from "@/lib/logger";
import { getDb } from "@/lib/prisma";
import { buildRequestFingerprint } from "@/lib/request-client";
import { consumeRateLimit } from "@/lib/rate-limit";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ resourceId: string }> }
) {
  const inline = new URL(request.url).searchParams.get("inline") === "1";
  const { resourceId } = await params;
  const downloadLogger = createRequestLogger({
    requestId: getRequestIdFromHeaders(request.headers),
    route: "/api/course-resources/[resourceId]",
    action: "downloadCourseResource"
  });
  const startedAt = Date.now();
  const user = await getCurrentUser();

  if (!user) {
    downloadLogger.warn("Course resource download rejected because user is not authenticated.", {
      resourceId,
      result: "unauthenticated",
      durationMs: Date.now() - startedAt
    });
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const resource = await getDb().courseResource.findUnique({
    where: {
      id: resourceId
    },
    include: {
      course: {
        select: {
          slug: true
        }
      }
    }
  });

  if (!resource || !resource.storageKey) {
    downloadLogger.warn("Course resource download failed because the resource was not found.", {
      userId: user.id,
      resourceId,
      result: "missing-resource",
      durationMs: Date.now() - startedAt
    });
    return NextResponse.json({ error: "Resource not found." }, { status: 404 });
  }

  const accessResult = await canAccessCourseCommunity({
    userId: user.id,
    email: user.email,
    courseSlug: resource.course.slug
  });

  if (!accessResult.allowed) {
    downloadLogger.warn("Course resource download denied by course access policy.", {
      userId: user.id,
      resourceId,
      courseSlug: resource.course.slug,
      result: "forbidden",
      durationMs: Date.now() - startedAt
    });
    return NextResponse.json({ error: "Resource access denied." }, { status: 403 });
  }

  const downloadRateLimit = await consumeRateLimit({
    bucket: "course-resource-download",
    key: buildRequestFingerprint(request.headers, [user.id, resourceId]),
    limit: 30,
    windowMs: 5 * 60 * 1_000
  });

  if (!downloadRateLimit.allowed) {
    downloadLogger.warn("Course resource download rate limited.", {
      userId: user.id,
      resourceId,
      courseSlug: resource.course.slug,
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
    const fileBuffer = await readStoredCourseResourceContent(resource.storageKey);
    const headers = buildPrivateFileHeaders({
      fileName: resource.title,
      inline,
      mimeType: resource.mimeType
    });

    downloadLogger.info("Course resource downloaded.", {
      userId: user.id,
      resourceId,
      courseSlug: resource.course.slug,
      result: "downloaded",
      durationMs: Date.now() - startedAt
    });

    return new NextResponse(fileBuffer, {
      status: 200,
      headers
    });
  } catch (error) {
    downloadLogger.error("Course resource download failed while reading storage.", {
      userId: user.id,
      resourceId,
      courseSlug: resource.course.slug,
      result: "storage-miss",
      durationMs: Date.now() - startedAt,
      error: error instanceof Error ? error : new Error(String(error))
    });
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Stored resource file not found."
      },
      { status: 404 }
    );
  }
}

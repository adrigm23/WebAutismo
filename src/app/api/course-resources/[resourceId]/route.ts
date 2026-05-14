import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { canAccessCourseCommunity } from "@/lib/course-community";
import { readStoredCourseResourceContent } from "@/lib/course-resource-storage";
import { buildPrivateFileHeaders } from "@/lib/download-response";
import { getDb } from "@/lib/prisma";
import { buildRequestFingerprint } from "@/lib/request-client";
import { consumeRateLimit } from "@/lib/rate-limit";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ resourceId: string }> }
) {
  const { resourceId } = await params;
  const user = await getCurrentUser();

  if (!user) {
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
    return NextResponse.json({ error: "Resource not found." }, { status: 404 });
  }

  const accessResult = await canAccessCourseCommunity({
    userId: user.id,
    email: user.email,
    courseSlug: resource.course.slug
  });

  if (!accessResult.allowed) {
    return NextResponse.json({ error: "Resource access denied." }, { status: 403 });
  }

  const downloadRateLimit = consumeRateLimit({
    bucket: "course-resource-download",
    key: buildRequestFingerprint(request.headers, [user.id, resourceId]),
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
    const fileBuffer = await readStoredCourseResourceContent(resource.storageKey);
    const headers = buildPrivateFileHeaders({
      fileName: resource.title,
      mimeType: resource.mimeType
    });

    return new NextResponse(fileBuffer, {
      status: 200,
      headers
    });
  } catch {
    return NextResponse.json({ error: "Stored resource file not found." }, { status: 404 });
  }
}

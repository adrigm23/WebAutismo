import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { buildPrivateFileHeaders } from "@/lib/download-response";
import { getLibraryResourceById } from "@/lib/library";
import { readStoredObjectContent } from "@/lib/object-storage";
import { getDb } from "@/lib/prisma";
import { consumeRateLimit } from "@/lib/rate-limit";
import { buildRequestFingerprint } from "@/lib/request-client";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const inline = new URL(request.url).searchParams.get("inline") === "1";

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const resource = await getLibraryResourceById(id);
  if (!resource) {
    return NextResponse.json({ error: "Resource not found." }, { status: 404 });
  }

  // External link resources — redirect directly
  if (resource.type === "LINK") {
    const canAccess = await checkLibraryAccess(user, resource);
    if (!canAccess) {
      return NextResponse.json({ error: "Access denied." }, { status: 403 });
    }
    const target = resource.externalUrl || resource.fileUrl;
    return NextResponse.redirect(target);
  }

  if (!resource.fileKey) {
    return NextResponse.json({ error: "Resource not found." }, { status: 404 });
  }

  // Permission check
  const canAccess = await checkLibraryAccess(user, resource);
  if (!canAccess) {
    return NextResponse.json({ error: "Access denied." }, { status: 403 });
  }

  // Rate limit: 30 downloads per 5 minutes per user/resource
  const rateLimit = await consumeRateLimit({
    bucket: "library-resource-download",
    key: buildRequestFingerprint(request.headers, [user.id, id]),
    limit: 30,
    windowMs: 5 * 60 * 1000,
  });

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many download requests." },
      {
        status: 429,
        headers: { "Retry-After": `${rateLimit.retryAfterSeconds}` },
      }
    );
  }

  try {
    const fileBuffer = await readStoredObjectContent(resource.fileKey);
    if (!fileBuffer) {
      return NextResponse.json({ error: "File not found in storage." }, { status: 404 });
    }

    const headers = buildPrivateFileHeaders({
      fileName: resource.fileName,
      inline,
      mimeType: resource.mimeType,
    });

    return new NextResponse(fileBuffer, { status: 200, headers });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Storage error." },
      { status: 404 }
    );
  }
}

async function checkLibraryAccess(
  user: { id: string; globalRole: string },
  resource: {
    visibility: string;
    courseId: string | null;
    uploadedById: string;
  }
): Promise<boolean> {
  if (user.globalRole === "ADMIN") return true;

  switch (resource.visibility) {
    case "PUBLIC":
      return true;

    case "TEACHERS_ONLY":
      return user.globalRole === "TEACHER";

    case "PRIVATE":
      return resource.uploadedById === user.id;

    case "ENROLLED_STUDENTS":
    case "COURSE_ONLY": {
      if (user.globalRole === "TEACHER") return true;
      if (!resource.courseId) return false;
      const enrollment = await getDb().courseEnrollment.findFirst({
        where: {
          userId: user.id,
          courseId: resource.courseId,
          status: "ACTIVE",
        },
        select: { id: true },
      });
      return Boolean(enrollment);
    }

    default:
      return false;
  }
}

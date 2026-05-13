import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { canAccessCourseCommunity } from "@/lib/course-community";
import { readStoredCourseResourceContent } from "@/lib/course-resource-storage";
import { getDb } from "@/lib/prisma";

export async function GET(
  _: Request,
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

  try {
    const fileBuffer = await readStoredCourseResourceContent(resource.storageKey);
    const headers = new Headers();

    headers.set("Content-Type", resource.mimeType || "application/octet-stream");
    headers.set("Content-Disposition", `attachment; filename="${resource.title}"`);
    headers.set("Cache-Control", "private, no-store");

    return new NextResponse(fileBuffer, {
      status: 200,
      headers
    });
  } catch {
    return NextResponse.json({ error: "Stored resource file not found." }, { status: 404 });
  }
}

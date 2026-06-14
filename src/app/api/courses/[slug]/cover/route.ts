import { NextResponse } from "next/server";
import { getDb } from "@/lib/prisma";
import { readStoredObjectContent } from "@/lib/object-storage";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const course = await getDb().course.findUnique({
    where: { slug },
    select: { coverImageStorageKey: true, coverImageMimeType: true },
  });

  if (!course?.coverImageStorageKey) {
    return new NextResponse(null, { status: 404 });
  }

  const content = await readStoredObjectContent(course.coverImageStorageKey);
  if (!content) {
    return new NextResponse(null, { status: 404 });
  }

  return new NextResponse(content, {
    headers: {
      "Content-Type": course.coverImageMimeType ?? "application/octet-stream",
      "Cache-Control": "public, max-age=3600",
    },
  });
}

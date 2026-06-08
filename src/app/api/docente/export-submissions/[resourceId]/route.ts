import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { canAccessCourseCommunityForCourse, canModerateCourse } from "@/lib/course-community";
import { getCatalogCourseBySlug } from "@/lib/course-catalog";
import { getDb } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ resourceId: string }> }
) {
  const { resourceId } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const resource = await getDb().courseResource.findUnique({
    where: { id: resourceId },
    include: {
      course: { select: { slug: true } },
      submissions: {
        include: {
          student: { select: { name: true, email: true } },
        },
        orderBy: { submittedAt: "desc" },
      },
    },
  });

  if (!resource) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const course = await getCatalogCourseBySlug(resource.course.slug);
  if (!course) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const access = await canAccessCourseCommunityForCourse({
    userId: user.id,
    email: user.email,
    course,
    userGlobalRole: user.globalRole,
    userIsActive: user.isActive,
  });
  if (!access.allowed || !canModerateCourse(access.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const statusLabel: Record<string, string> = {
    SUBMITTED: "Pendiente",
    REVIEWED: "Revisada",
    CHANGES_REQUESTED: "Cambios solicitados",
  };

  const csvRows = [
    ["Alumno", "Email", "Estado", "Nota", "Fecha entrega", "Fecha revisión", "Texto respuesta"],
    ...resource.submissions.map((s) => [
      s.student.name ?? "",
      s.student.email,
      statusLabel[s.status] ?? s.status,
      s.score != null ? String(s.score) : "",
      s.submittedAt.toISOString().split("T")[0],
      s.reviewedAt ? s.reviewedAt.toISOString().split("T")[0] : "",
      s.body ?? "",
    ]),
  ];

  // Prefix cells that start with formula trigger chars to prevent CSV injection
  // in spreadsheet apps (Excel/Sheets) when staff open the export.
  function csvSafeCell(value: string): string {
    const s = String(value);
    return /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
  }

  const csv = csvRows
    .map((row) => row.map((c) => `"${csvSafeCell(c).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  const filename = `entregas-${resourceId}-${new Date().toISOString().split("T")[0]}.csv`;

  return new NextResponse("﻿" + csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getCatalogCourseBySlug } from "@/lib/course-catalog";
import { canAccessCourseCommunityForCourse, canModerateCourse } from "@/lib/course-community";
import { getLearnerProgressRowsForCatalogCourse } from "@/lib/course-progress";
import { getDb } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const course = await getCatalogCourseBySlug(slug);
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

  const enrollments = await getDb().courseEnrollment.findMany({
    where: { course: { slug } },
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: "desc" },
  });

  const progressRows = await getLearnerProgressRowsForCatalogCourse(course, { enrollments });

  const csvRows = [
    ["Nombre", "Email", "Módulos completados", "Total módulos", "Progreso (%)", "Última actividad"],
    ...progressRows.map((r) => [
      r.learnerName,
      r.learnerEmail,
      String(r.completedModules),
      String(r.totalModules),
      String(Math.round(r.completionRate)),
      r.lastCompletedAt ? r.lastCompletedAt.toISOString().split("T")[0] : "Sin actividad",
    ]),
  ];

  const csv = csvRows
    .map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  const filename = `alumnos-${slug}-${new Date().toISOString().split("T")[0]}.csv`;

  return new NextResponse("﻿" + csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}

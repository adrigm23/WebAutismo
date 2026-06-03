import type { Metadata } from "next";
import { requireAdminConsoleUser } from "@/lib/admin-console-server";
import { getDb } from "@/lib/prisma";
import { CreateCoursePage } from "@/components/admin/courses/create-course-page";

export const metadata: Metadata = {
  title: "Crear curso — Admin",
  robots: { index: false, follow: false },
};

export default async function AdminNuevoCursoPage() {
  await requireAdminConsoleUser("/admin/courses/nuevo");

  const teachers = await getDb().user.findMany({
    where: { globalRole: "TEACHER", isActive: true },
    select: { id: true, name: true, email: true },
    orderBy: { name: "asc" },
  });

  return <CreateCoursePage teachers={teachers} />;
}

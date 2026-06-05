import type { Metadata } from "next";
import { requireAdminConsoleUser } from "@/lib/admin-console-server";
import { getDb } from "@/lib/prisma";
import { CreateCoursePage } from "@/components/admin/courses/create-course-page";

export const metadata: Metadata = {
  title: "Crear Curso — Admin",
  robots: { index: false, follow: false },
};

export default async function AdminNewCoursePage() {
  await requireAdminConsoleUser("/admin/courses/nuevo");

  const teachers = await getDb().user.findMany({
    where: { globalRole: { in: ["TEACHER", "ADMIN"] } },
    orderBy: { name: "asc" },
    select: { id: true, name: true, email: true },
  });

  return (
    <CreateCoursePage
      teachers={teachers.map((t) => ({
        id: t.id,
        name: t.name,
        email: t.email,
      }))}
    />
  );
}

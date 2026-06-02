import type { Metadata } from "next";
import { requireAdminConsoleUser } from "@/lib/admin-console-server";
import { getDb } from "@/lib/prisma";
import { PublishResourcePage } from "@/components/platform/library/publish-resource-page";

export const metadata: Metadata = {
  title: "Publicar Nuevo Recurso — Admin",
  robots: { index: false, follow: false },
};

export default async function AdminNuevoRecursoPage() {
  await requireAdminConsoleUser("/admin/biblioteca/nuevo");

  const allCourses = await getDb().course.findMany({
    where: { status: "ACTIVE" },
    select: { id: true, title: true },
    orderBy: { title: "asc" },
  });

  return (
    <PublishResourcePage
      backHref="/admin/biblioteca"
      courses={allCourses}
    />
  );
}

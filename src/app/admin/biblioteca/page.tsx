import type { Metadata } from "next";
import { requireAdminConsoleUser } from "@/lib/admin-console-server";
import { getDb } from "@/lib/prisma";
import {
  getLibraryResources,
  getLibraryFolders,
  getViewerContext,
} from "@/lib/library";
import { LibraryPage } from "@/components/platform/library/library-page";

export const metadata: Metadata = {
  title: "Biblioteca Central — Admin",
  robots: { index: false, follow: false },
};

export default async function AdminBibliotecaPage() {
  const user = await requireAdminConsoleUser("/admin/biblioteca");

  const viewerCtx = await getViewerContext({ userId: user.id, globalRole: user.globalRole });

  const [resources, folders, allCourses] = await Promise.all([
    getLibraryResources({}, viewerCtx),
    getLibraryFolders(viewerCtx),
    getDb().course.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, title: true, slug: true },
      orderBy: { title: "asc" },
    }),
  ]);

  const courses = allCourses.map((c) => ({
    id: c.id,
    title: c.title,
    slug: c.slug,
  }));

  return (
    <LibraryPage
      resources={resources}
      folders={folders}
      courses={courses}
      canManage={true}
      role="admin"
      newResourceHref="/admin/biblioteca/nuevo"
    />
  );
}

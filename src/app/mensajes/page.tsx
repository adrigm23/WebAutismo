import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { getUserCourseSpaces } from "@/lib/course-community";
import { getInitials } from "@/lib/utils";
import { MessagingPage } from "@/components/mensajes/messaging-page";

export const metadata: Metadata = {
  title: "Mensajes | Campus Autismo",
  robots: { index: false, follow: false },
};

export default async function MensajesPage() {
  const user = await requireUser("/mensajes");

  const courseSpaces = await getUserCourseSpaces({
    userId: user.id,
    userGlobalRole: user.globalRole,
    userIsActive: user.isActive,
  }).catch(() => []);

  // Derive channels from enrolled courses (skip duplicates of seed channels)
  const extraChannels = courseSpaces
    .filter((s) => s.accessState === "active")
    .map((s) => ({ id: s.course.slug, name: s.course.title }))
    .slice(0, 6);

  // Derive contacts from course teachers
  const seenNames = new Set<string>(["Dra. Elena Ramos", "Martín Castro"]);
  const extraContacts = courseSpaces
    .flatMap((s) => s.course.teachers ?? [])
    .filter((t) => {
      if (seenNames.has(t.name)) return false;
      seenNames.add(t.name);
      return true;
    })
    .map((t, i) => ({
      id: `teacher-${i}`,
      name: t.name,
      initials: getInitials(t.name),
      role: t.role ?? "Docente",
      department: "Campus Autismo",
    }))
    .slice(0, 4);

  const viewerName = user.name ?? user.email;

  return (
    <MessagingPage
      extraChannels={extraChannels}
      extraContacts={extraContacts}
      viewerInitials={getInitials(viewerName)}
      viewerName={viewerName}
    />
  );
}

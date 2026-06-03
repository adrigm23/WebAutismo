import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { getDb } from "@/lib/prisma";
import { getInitials } from "@/lib/utils";
import { MessagingPage } from "@/components/mensajes/messaging-page";

export const metadata: Metadata = {
  title: "Mensajes | Campus Autismo",
  robots: { index: false, follow: false },
};

export default async function MensajesPage() {
  const user = await requireUser("/mensajes");

  // Channels: courses the user is active in
  const enrollments = await getDb().courseEnrollment.findMany({
    where: { userId: user.id, status: "ACTIVE" },
    include: { course: { select: { slug: true, title: true } } },
    orderBy: { createdAt: "desc" },
    take: 6,
  });

  const channels = enrollments.map((e) => ({
    id: e.course.slug,
    name: e.course.title,
  }));

  // Contacts: teachers of user's courses (if student), or enrolled students (if teacher)
  let contacts: Array<{ id: string; name: string; initials: string; role: string }> = [];

  if (user.globalRole === "STUDENT") {
    // Get teachers assigned to courses where user is enrolled
    const assignments = await getDb().courseTeacherAssignment.findMany({
      where: {
        course: {
          enrollments: { some: { userId: user.id, status: "ACTIVE" } },
        },
      },
      include: { user: { select: { id: true, name: true } } },
      distinct: ["userId"],
    });
    contacts = assignments
      .filter((a) => a.user.id !== user.id)
      .map((a) => ({
        id: a.user.id,
        name: a.user.name,
        initials: getInitials(a.user.name),
        role: "Docente",
      }));
  } else {
    // Teacher/admin: get enrolled students
    const studentEnrollments = await getDb().courseEnrollment.findMany({
      where: {
        course: {
          teacherAssignments: { some: { userId: user.id } },
        },
        status: "ACTIVE",
      },
      include: { user: { select: { id: true, name: true } } },
      distinct: ["userId"],
      take: 20,
    });
    contacts = studentEnrollments
      .filter((e) => e.user.id !== user.id)
      .map((e) => ({
        id: e.user.id,
        name: e.user.name,
        initials: getInitials(e.user.name),
        role: "Alumno",
      }));
  }

  const viewerName = user.name ?? user.email;

  return (
    <MessagingPage
      channels={channels}
      contacts={contacts}
      viewerId={user.id}
      viewerInitials={getInitials(viewerName)}
      viewerName={viewerName}
    />
  );
}

"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { writeAuditLog } from "@/lib/audit";
import { hashPassword } from "@/lib/auth";
import { getDb } from "@/lib/prisma";
import { revokeUserSessions } from "@/lib/user-sessions";
import {
  enforceAdminMutationRateLimit,
  ensureNotLastAdmin,
  requireAdminUser,
  revalidateAdminViews
} from "./shared";

const createTeacherSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8)
});

export async function createTeacherAction(formData: FormData) {
  const admin = await requireAdminUser();
  const returnTo = String(formData.get("returnTo") ?? "").trim() || "/admin";
  await enforceAdminMutationRateLimit({
    action: "create-teacher",
    actorId: admin.id,
    redirectTo: returnTo
  });
  const withError = (code: string) =>
    `${returnTo}${returnTo.includes("?") ? "&" : "?"}error=${encodeURIComponent(code)}`;
  const parsed = createTeacherSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password")
  });

  if (!parsed.success) {
    redirect(withError("teacher"));
  }

  const db = getDb();
  const normalizedEmail = parsed.data.email.toLowerCase();
  const existing = await db.user.findUnique({
    where: {
      email: normalizedEmail
    }
  });

  if (existing) {
    redirect(withError("teacher-exists"));
  }

  const passwordHash = await hashPassword(parsed.data.password);
  const teacher = await db.user.create({
    data: {
      name: parsed.data.name.trim(),
      email: normalizedEmail,
      passwordHash,
      emailVerifiedAt: new Date(),
      globalRole: "TEACHER",
      notificationPreference: {
        create: {}
      }
    }
  });

  await writeAuditLog({
    actorId: admin.id,
    action: "USER_TEACHER_GRANTED",
    entityType: "USER",
    entityId: teacher.id,
    entityLabel: teacher.email,
    metadata: {
      createdUser: true
    }
  });

  revalidateAdminViews();
  redirect(returnTo);
}

export async function updateUserRoleAction(formData: FormData) {
  const admin = await requireAdminUser();
  await enforceAdminMutationRateLimit({
    action: "update-user-role",
    actorId: admin.id
  });
  const userId = String(formData.get("userId") ?? "");
  const nextRole = String(formData.get("globalRole") ?? "");

  if (!userId || !["STUDENT", "TEACHER", "ADMIN"].includes(nextRole)) {
    redirect("/admin?error=user-role");
  }

  await ensureNotLastAdmin({
    targetUserId: userId,
    nextRole: nextRole as "STUDENT" | "TEACHER" | "ADMIN"
  });

  const currentUser = await getDb().user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, globalRole: true }
  });

  const updatedUser = await getDb().user.update({
    where: {
      id: userId
    },
    data: {
      globalRole: nextRole as "STUDENT" | "TEACHER" | "ADMIN"
    }
  });

  // When demoting from TEACHER/ADMIN to STUDENT, clean up course assignments
  if (nextRole === "STUDENT" && currentUser?.globalRole !== "STUDENT") {
    await getDb().courseTeacherAssignment.deleteMany({ where: { userId } });
    await getDb().courseEditionTeacherAssignment.deleteMany({ where: { userId } });
  }

  const prevRole = currentUser?.globalRole ?? "STUDENT";
  const auditAction =
    nextRole === "ADMIN"
      ? "USER_ADMIN_GRANTED"
      : nextRole === "TEACHER"
        ? "USER_TEACHER_GRANTED"
        : prevRole === "ADMIN"
          ? "USER_ADMIN_REVOKED"
          : "USER_TEACHER_REVOKED";

  await writeAuditLog({
    actorId: admin.id,
    action: auditAction,
    entityType: "USER",
    entityId: updatedUser.id,
    entityLabel: updatedUser.email,
    metadata: {
      nextRole,
      prevRole
    }
  });

  revalidateAdminViews();
  redirect("/admin");
}

export async function toggleUserActiveAction(formData: FormData) {
  const admin = await requireAdminUser();
  await enforceAdminMutationRateLimit({
    action: "toggle-user-active",
    actorId: admin.id
  });
  const userId = String(formData.get("userId") ?? "");
  const active = String(formData.get("active") ?? "") === "true";

  if (!userId) {
    redirect("/admin?error=user-active");
  }

  await ensureNotLastAdmin({
    targetUserId: userId,
    nextActive: active
  });

  const updatedUser = await getDb().user.update({
    where: {
      id: userId
    },
    data: {
      isActive: active,
      deactivatedAt: active ? null : new Date(),
      deactivatedById: active ? null : admin.id
    }
  });

  if (!active) {
    await revokeUserSessions({
      userId: updatedUser.id
    });
  }

  await writeAuditLog({
    actorId: admin.id,
    action: active ? "USER_REACTIVATED" : "USER_DEACTIVATED",
    entityType: "USER",
    entityId: updatedUser.id,
    entityLabel: updatedUser.email
  });

  revalidateAdminViews();
  redirect("/admin");
}

export async function assignTeacherToCourseAction(formData: FormData) {
  const admin = await requireAdminUser();
  await enforceAdminMutationRateLimit({
    action: "assign-teacher-course",
    actorId: admin.id
  });
  const courseId = String(formData.get("courseId") ?? "");
  const teacherUserId = String(formData.get("teacherUserId") ?? "");

  if (!courseId || !teacherUserId) {
    redirect("/admin?error=assign-teacher");
  }

  const [teacher, course] = await Promise.all([
    getDb().user.findUnique({
      where: {
        id: teacherUserId
      }
    }),
    getDb().course.findUnique({
      where: {
        id: courseId
      }
    })
  ]);

  if (!teacher || !course) {
    redirect("/admin?error=assign-teacher-missing");
  }

  await getDb().courseTeacherAssignment.upsert({
    where: {
      courseId_userId: {
        courseId,
        userId: teacherUserId
      }
    },
    update: {},
    create: {
      courseId,
      userId: teacherUserId
    }
  });

  if (teacher.globalRole === "STUDENT") {
    await getDb().user.update({
      where: {
        id: teacher.id
      },
      data: {
        globalRole: "TEACHER"
      }
    });
  }

  await writeAuditLog({
    actorId: admin.id,
    action: "COURSE_TEACHER_ASSIGNED",
    entityType: "COURSE",
    entityId: course.id,
    entityLabel: course.title,
    metadata: {
      teacherUserId: teacher.id,
      teacherEmail: teacher.email
    }
  });

  revalidateAdminViews();
  redirect("/admin");
}

export async function unassignTeacherFromCourseAction(formData: FormData) {
  const admin = await requireAdminUser();
  await enforceAdminMutationRateLimit({
    action: "unassign-teacher-course",
    actorId: admin.id
  });
  const courseId = String(formData.get("courseId") ?? "");
  const teacherUserId = String(formData.get("teacherUserId") ?? "");

  if (!courseId || !teacherUserId) {
    redirect("/admin?error=unassign-teacher");
  }

  await getDb().courseTeacherAssignment.deleteMany({
    where: {
      courseId,
      userId: teacherUserId
    }
  });

  await writeAuditLog({
    actorId: admin.id,
    action: "COURSE_TEACHER_UNASSIGNED",
    entityType: "COURSE",
    entityId: courseId,
    metadata: {
      teacherUserId
    }
  });

  revalidateAdminViews();
  redirect("/admin");
}

export async function syncTeacherCourseAssignmentsAction(formData: FormData) {
  const admin = await requireAdminUser();
  await enforceAdminMutationRateLimit({
    action: "sync-teacher-course-assignments",
    actorId: admin.id,
    redirectTo: "/admin/teachers"
  });
  const teacherUserId = String(formData.get("teacherUserId") ?? "");
  const selectedCourseIds = formData
    .getAll("courseIds")
    .map((value) => String(value))
    .filter(Boolean);

  if (!teacherUserId) {
    redirect("/admin/teachers?error=teacher-sync");
  }

  const db = getDb();
  const teacher = await db.user.findUnique({
    where: {
      id: teacherUserId
    },
    select: {
      id: true,
      email: true,
      globalRole: true
    }
  });

  if (!teacher) {
    redirect("/admin/teachers?error=teacher-sync-missing");
  }

  const currentAssignments = await db.courseTeacherAssignment.findMany({
    where: {
      userId: teacherUserId
    },
    select: {
      courseId: true
    }
  });

  const currentCourseIds = new Set(currentAssignments.map((assignment) => assignment.courseId));
  const nextCourseIds = new Set(selectedCourseIds);
  const courseIdsToRemove = Array.from(currentCourseIds).filter((courseId) => !nextCourseIds.has(courseId));
  const courseIdsToAdd = Array.from(nextCourseIds).filter((courseId) => !currentCourseIds.has(courseId));

  if (courseIdsToRemove.length > 0) {
    await db.courseTeacherAssignment.deleteMany({
      where: {
        userId: teacherUserId,
        courseId: {
          in: courseIdsToRemove
        }
      }
    });
  }

  if (courseIdsToAdd.length > 0) {
    await db.courseTeacherAssignment.createMany({
      data: courseIdsToAdd.map((courseId) => ({
        courseId,
        userId: teacherUserId
      })),
      skipDuplicates: true
    });
  }

  if (teacher.globalRole === "STUDENT" && nextCourseIds.size > 0) {
    await db.user.update({
      where: {
        id: teacher.id
      },
      data: {
        globalRole: "TEACHER"
      }
    });
  }

  await writeAuditLog({
    actorId: admin.id,
    action: "COURSE_TEACHER_ASSIGNED",
    entityType: "USER",
    entityId: teacher.id,
    entityLabel: teacher.email,
    metadata: {
      selectedCourseIds,
      removedCourseIds: courseIdsToRemove
    }
  });

  revalidateAdminViews();
  redirect(`/admin/teachers?teacherId=${teacherUserId}`);
}

export async function syncTeacherEditionAssignmentsAction(formData: FormData) {
  const admin = await requireAdminUser();
  await enforceAdminMutationRateLimit({
    action: "sync-teacher-edition-assignments",
    actorId: admin.id,
    redirectTo: "/admin/teachers"
  });
  const teacherUserId = String(formData.get("teacherUserId") ?? "");
  const requestedEditionIds = formData
    .getAll("editionIds")
    .map((value) => String(value))
    .filter(Boolean);

  if (!teacherUserId) {
    redirect("/admin/teachers?error=teacher-edition-sync");
  }

  const db = getDb();
  const teacher = await db.user.findUnique({
    where: {
      id: teacherUserId
    },
    select: {
      id: true,
      email: true,
      globalRole: true
    }
  });

  if (!teacher) {
    redirect("/admin/teachers?error=teacher-edition-sync-missing");
  }

  const currentAssignments = await db.courseEditionTeacherAssignment.findMany({
    where: {
      userId: teacherUserId
    },
    select: {
      courseEditionId: true
    }
  });
  const existingEditionRows = await db.courseEdition.findMany({
    where: {
      id: {
        in: requestedEditionIds
      }
    },
    select: {
      id: true,
      label: true,
      course: {
        select: {
          title: true
        }
      }
    }
  });

  const validEditionIds = new Set(existingEditionRows.map((edition) => edition.id));
  const currentEditionIds = new Set(
    currentAssignments.map((assignment) => assignment.courseEditionId)
  );
  const nextEditionIds = new Set(requestedEditionIds.filter((editionId) => validEditionIds.has(editionId)));
  const editionIdsToRemove = Array.from(currentEditionIds).filter((editionId) => !nextEditionIds.has(editionId));
  const editionIdsToAdd = Array.from(nextEditionIds).filter((editionId) => !currentEditionIds.has(editionId));

  if (editionIdsToRemove.length > 0) {
    await db.courseEditionTeacherAssignment.deleteMany({
      where: {
        userId: teacherUserId,
        courseEditionId: {
          in: editionIdsToRemove
        }
      }
    });
  }

  if (editionIdsToAdd.length > 0) {
    await db.courseEditionTeacherAssignment.createMany({
      data: editionIdsToAdd.map((courseEditionId) => ({
        courseEditionId,
        userId: teacherUserId
      })),
      skipDuplicates: true
    });
  }

  if (teacher.globalRole === "STUDENT" && nextEditionIds.size > 0) {
    await db.user.update({
      where: {
        id: teacher.id
      },
      data: {
        globalRole: "TEACHER"
      }
    });
  }

  if (editionIdsToAdd.length > 0 || editionIdsToRemove.length > 0) {
    const affectedEditionIds = [...editionIdsToAdd, ...editionIdsToRemove];
    const affectedEditions = await db.courseEdition.findMany({
      where: {
        id: {
          in: affectedEditionIds
        }
      },
      select: {
        id: true,
        label: true,
        course: {
          select: {
            title: true
          }
        }
      }
    });
    const editionById = new Map(affectedEditions.map((edition) => [edition.id, edition]));

    await Promise.all([
      ...editionIdsToAdd.map((editionId) => {
        const edition = editionById.get(editionId);
        return writeAuditLog({
          actorId: admin.id,
          action: "COURSE_EDITION_TEACHER_ASSIGNED",
          entityType: "COURSE_EDITION",
          entityId: editionId,
          entityLabel: edition
            ? `${edition.course.title} | ${edition.label}`
            : editionId,
          metadata: {
            teacherUserId: teacher.id,
            teacherEmail: teacher.email
          }
        });
      }),
      ...editionIdsToRemove.map((editionId) => {
        const edition = editionById.get(editionId);
        return writeAuditLog({
          actorId: admin.id,
          action: "COURSE_EDITION_TEACHER_UNASSIGNED",
          entityType: "COURSE_EDITION",
          entityId: editionId,
          entityLabel: edition
            ? `${edition.course.title} | ${edition.label}`
            : editionId,
          metadata: {
            teacherUserId: teacher.id,
            teacherEmail: teacher.email
          }
        });
      })
    ]);
  }

  revalidateAdminViews();
  redirect(`/admin/teachers?teacherId=${teacherUserId}`);
}

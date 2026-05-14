import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { canManageUsers } from "@/lib/course-permissions";
import { getDb } from "@/lib/prisma";

export function parseOptionalDate(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || !value.trim()) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function requireAdminUser() {
  const user = await requireUser("/admin");

  if (!canManageUsers(user.globalRole)) {
    redirect("/mi-cuenta");
  }

  return user;
}

export async function ensureNotLastAdmin(input: {
  targetUserId: string;
  nextRole?: "STUDENT" | "TEACHER" | "ADMIN";
  nextActive?: boolean;
}) {
  const db = getDb();
  const targetUser = await db.user.findUnique({
    where: {
      id: input.targetUserId
    },
    select: {
      id: true,
      globalRole: true,
      isActive: true
    }
  });

  if (!targetUser || targetUser.globalRole !== "ADMIN") {
    return;
  }

  const keepsAdminRole = input.nextRole ? input.nextRole === "ADMIN" : true;
  const keepsActiveState =
    typeof input.nextActive === "boolean" ? input.nextActive : targetUser.isActive;

  if (keepsAdminRole && keepsActiveState) {
    return;
  }

  const activeAdmins = await db.user.count({
    where: {
      globalRole: "ADMIN",
      isActive: true
    }
  });

  if (activeAdmins <= 1) {
    redirect("/admin/users?error=last-admin");
  }
}

export function revalidateAdminViews() {
  revalidatePath("/admin");
  revalidatePath("/admin/users");
  revalidatePath("/admin/teachers");
  revalidatePath("/admin/courses");
  revalidatePath("/admin/editions");
  revalidatePath("/admin/promotions");
  revalidatePath("/admin/supervision");
  revalidatePath("/admin/audit");
  revalidatePath("/cursos");
  revalidatePath("/mi-cuenta");
}

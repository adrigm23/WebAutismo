"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { markAllForumNotificationsRead } from "@/lib/forum-user-notifications";
import { markAllUserNotificationsRead } from "@/lib/notifications";

export async function markAllNotificationsReadAction() {
  const user = await requireUser("/notificaciones");

  await Promise.all([
    markAllUserNotificationsRead(user.id),
    markAllForumNotificationsRead(user.id),
  ]);

  revalidatePath("/notificaciones");
}

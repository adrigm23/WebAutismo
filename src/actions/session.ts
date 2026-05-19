"use server";

import { clearSession, requireUser } from "@/lib/auth";
import { getCurrentSessionId, revokeUserSessions } from "@/lib/user-sessions";
import { redirect } from "next/navigation";

export async function logoutAction() {
  await clearSession();
  redirect("/");
}

export async function logoutEverywhereAction() {
  const user = await requireUser("/mi-cuenta");
  const currentSessionId = await getCurrentSessionId();

  await revokeUserSessions({
    userId: user.id,
    excludeSessionId: currentSessionId
  });

  await clearSession();
  redirect("/acceder?logged_out_everywhere=1");
}

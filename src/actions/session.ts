"use server";

import { headers } from "next/headers";
import { clearSession, requireUser } from "@/lib/auth";
import { createRequestLogger, getRequestIdFromHeaders } from "@/lib/logger";
import { getCurrentSessionId, revokeUserSessions } from "@/lib/user-sessions";
import { redirect } from "next/navigation";

export async function logoutAction() {
  const requestHeaders = await headers();
  const sessionLogger = createRequestLogger({
    requestId: getRequestIdFromHeaders(requestHeaders),
    route: "session",
    action: "logout"
  });
  const startedAt = Date.now();

  await clearSession();
  sessionLogger.info("User logged out.", {
    result: "logged-out",
    durationMs: Date.now() - startedAt
  });
  redirect("/");
}

export async function logoutEverywhereAction() {
  const requestHeaders = await headers();
  const user = await requireUser("/mi-cuenta");
  const sessionLogger = createRequestLogger({
    requestId: getRequestIdFromHeaders(requestHeaders),
    route: "session",
    action: "logoutEverywhere",
    userId: user.id
  });
  const startedAt = Date.now();
  const currentSessionId = await getCurrentSessionId();

  await revokeUserSessions({
    userId: user.id,
    excludeSessionId: currentSessionId
  });

  await clearSession();
  sessionLogger.info("User logged out from all sessions.", {
    currentSessionId: currentSessionId ?? null,
    result: "logged-out-everywhere",
    durationMs: Date.now() - startedAt
  });
  redirect("/acceder?logged_out_everywhere=1");
}

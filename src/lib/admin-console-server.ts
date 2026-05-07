import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { canManageUsers } from "@/lib/course-permissions";

export async function requireAdminConsoleUser(returnTo = "/admin") {
  const user = await requireUser(returnTo);

  if (!canManageUsers(user.globalRole)) {
    redirect("/mi-cuenta");
  }

  return user;
}

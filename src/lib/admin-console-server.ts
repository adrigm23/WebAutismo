import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { isDemoUserId } from "@/lib/demo-auth";
import { canManageUsers } from "@/lib/course-permissions";

const demoAdminEnabledRoutes = new Set(["/admin", "/admin/users"]);

export async function requireAdminConsoleUser(returnTo = "/admin") {
  const user = await requireUser(returnTo);

  if (!canManageUsers(user.globalRole)) {
    redirect("/mi-cuenta");
  }

  if (isDemoUserId(user.id) && !demoAdminEnabledRoutes.has(returnTo)) {
    redirect("/admin");
  }

  return user;
}

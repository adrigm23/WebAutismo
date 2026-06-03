import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";

export default async function DocenteLayout({ children }: { children: ReactNode }) {
  const user = await requireUser("/docente");
  if (user.globalRole !== "TEACHER" && user.globalRole !== "ADMIN") {
    redirect("/mis-cursos");
  }
  return <>{children}</>;
}

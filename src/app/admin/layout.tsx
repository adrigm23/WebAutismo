import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdminConsoleUser } from "@/lib/admin-console-server";

export const metadata: Metadata = {
  title: "Administracion",
  robots: {
    index: false,
    follow: false
  }
};

export default async function AdminLayout({
  children
}: Readonly<{ children: ReactNode }>) {
  const user = await requireAdminConsoleUser("/admin");

  return <AdminShell user={user}>{children}</AdminShell>;
}

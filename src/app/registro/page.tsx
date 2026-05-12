import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SplitAuthPanel } from "@/components/auth/split-auth-panel";
import { getCurrentUser } from "@/lib/auth";
import { isDemoAuthEnabled } from "@/lib/env";
import { getSafeRedirect } from "@/lib/redirect";
import { firstValue } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Crear cuenta",
  robots: {
    index: false,
    follow: false
  }
};

type RegisterPageProps = {
  searchParams: Promise<{ next?: string | string[] }>;
};

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const user = await getCurrentUser();
  const { next } = await searchParams;
  const safeNext = getSafeRedirect(firstValue(next), "/mi-cuenta");

  if (user) {
    redirect(safeNext);
  }

  return (
    <SplitAuthPanel emphasis="register" next={safeNext} showDemoNotice={isDemoAuthEnabled()} />
  );
}

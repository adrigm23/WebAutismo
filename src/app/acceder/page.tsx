import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SplitAuthPanel } from "@/components/auth/split-auth-panel";
import { getCurrentUser } from "@/lib/auth";
import { getSafeRedirect } from "@/lib/redirect";
import { firstValue } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Acceder",
  robots: {
    index: false,
    follow: false
  }
};

type LoginPageProps = {
  searchParams: Promise<{ next?: string | string[] }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const user = await getCurrentUser();
  const { next } = await searchParams;
  const safeNext = getSafeRedirect(firstValue(next), "/mi-cuenta");

  if (user) {
    redirect(safeNext);
  }

  return <SplitAuthPanel emphasis="login" next={safeNext} />;
}

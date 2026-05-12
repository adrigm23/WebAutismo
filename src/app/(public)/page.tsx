import type { Metadata } from "next";
import { PlatformLanding } from "@/components/platform/platform-landing";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Formacion especializada en autismo",
  description:
    "Plataforma de formacion digital con catalogo, compra online, campus privado y foro por curso.",
  alternates: {
    canonical: absoluteUrl("/")
  },
  openGraph: {
    title: "Formacion especializada en autismo",
    description:
      "Plataforma de formacion digital con catalogo, compra online, campus privado y foro por curso.",
    url: absoluteUrl("/"),
    type: "website"
  }
};

export const revalidate = 3600;

export default async function HomePage() {
  return <PlatformLanding />;
}

import type { Metadata } from "next";
import { PlatformLanding } from "@/components/platform/platform-landing";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Plataforma",
  description:
    "Resumen de la plataforma, el flujo de compra y el campus privado de formacion.",
  alternates: {
    canonical: absoluteUrl("/plataforma")
  },
  openGraph: {
    title: "Plataforma",
    description:
      "Resumen de la plataforma, el flujo de compra y el campus privado de formacion.",
    url: absoluteUrl("/plataforma"),
    type: "website"
  }
};

export const revalidate = 3600;

export default function PlatformPage() {
  return <PlatformLanding />;
}

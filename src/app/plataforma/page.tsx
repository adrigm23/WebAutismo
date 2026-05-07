import type { Metadata } from "next";
import { PlatformLanding } from "@/components/platform/platform-landing";

export const metadata: Metadata = {
  title: "Plataforma",
  description:
    "Resumen de la plataforma, el flujo de compra y el campus privado de formacion."
};

export default function PlatformPage() {
  return <PlatformLanding />;
}

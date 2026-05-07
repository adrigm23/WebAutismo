import type { Metadata } from "next";
import { PlatformLanding } from "@/components/platform/platform-landing";

export const metadata: Metadata = {
  title: "Formacion especializada en autismo",
  description:
    "Plataforma de formacion digital con catalogo, compra online, campus privado y foro por curso."
};

export default async function HomePage() {
  return <PlatformLanding />;
}

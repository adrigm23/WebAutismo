import type { Metadata } from "next";
import { HomeLanding } from "@/components/platform/home/home-landing";
import { absoluteUrl } from "@/lib/site";

const title = "Formación especializada en autismo";
const description =
  "Plataforma de formación digital con catálogo, compra online, campus privado y foro por curso para familias, profesionales y entidades.";

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: absoluteUrl("/")
  },
  openGraph: {
    title,
    description,
    url: absoluteUrl("/"),
    type: "website"
  }
};

export const revalidate = 3600;

export default async function HomePage() {
  return <HomeLanding />;
}

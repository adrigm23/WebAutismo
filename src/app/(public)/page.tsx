import type { Metadata } from "next";
import { HomeLanding } from "@/components/platform/home/home-landing";
import { absoluteUrl } from "@/lib/site";

const title = "Autismo Córdoba | Formación especializada en autismo";
const description =
  "Plataforma educativa con cursos, recursos y comunidad para profesionales, docentes y familias que trabajan con personas autistas.";

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "formación en autismo",
    "cursos sobre autismo",
    "formación para profesionales del autismo",
    "recursos para docentes y familias",
    "plataforma educativa sobre autismo"
  ],
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

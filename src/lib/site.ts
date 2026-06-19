import { getSiteUrl } from "@/lib/env";

export const siteConfig = {
  name: "Campus Autismo Cordoba",
  shortName: "Autismo Cordoba",
  description:
    "Plataforma de formacion digital especializada en autismo para familias, profesionales y entidades.",
  supportEmail: "formacion@autismocordoba.org",
  donateUrl: "https://autismocordoba.org/",
  nav: [] as { href: string; label: string }[]
};

export function absoluteUrl(path = "/") {
  return `${getSiteUrl()}${path}`;
}

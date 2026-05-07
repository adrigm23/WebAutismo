export const siteConfig = {
  name: "Campus Autismo Cordoba",
  shortName: "Autismo Cordoba",
  description:
    "Plataforma de formacion digital especializada en autismo para familias, profesionales y entidades.",
  domain:
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "http://localhost:3000",
  supportEmail: "formacion@autismocordoba.org",
  donateUrl: "https://autismocordoba.org/",
  nav: [
    { href: "/", label: "Inicio" },
    { href: "/cursos", label: "Cursos" },
    { href: "/mi-cuenta", label: "Mi cuenta" }
  ]
};

export function absoluteUrl(path = "/") {
  return `${siteConfig.domain}${path}`;
}

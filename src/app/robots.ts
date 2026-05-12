import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api", "/acceder", "/registro", "/mi-cuenta", "/mis-cursos", "/checkout"]
    },
    sitemap: absoluteUrl("/sitemap.xml")
  };
}

import type { ReactNode } from "react";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export default function PublicLayout({
  children
}: Readonly<{ children: ReactNode }>) {
  return (
    <>
      <a className="skip-link" href="#contenido-principal">
        Saltar al contenido
      </a>
      <SiteHeader />
      <main id="contenido-principal">{children}</main>
      <SiteFooter />
    </>
  );
}

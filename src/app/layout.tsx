import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Public_Sans } from "next/font/google";
import "./globals.css";
import { getCurrentUser } from "@/lib/auth";
import { absoluteUrl, siteConfig } from "@/lib/site";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

const publicSans = Public_Sans({
  subsets: ["latin"],
  variable: "--font-sans"
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.domain),
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`
  },
  description: siteConfig.description,
  alternates: {
    canonical: absoluteUrl("/")
  },
  openGraph: {
    title: siteConfig.name,
    description: siteConfig.description,
    url: absoluteUrl("/"),
    siteName: siteConfig.name,
    locale: "es_ES",
    type: "website"
  }
};

export default async function RootLayout({
  children
}: Readonly<{ children: ReactNode }>) {
  const user = await getCurrentUser();

  return (
    <html className={publicSans.variable} lang="es">
      <body className="antialiased" suppressHydrationWarning>
        <SiteHeader user={user} />
        <main>{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}

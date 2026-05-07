"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/actions/session";
import { Button, ButtonLink } from "@/components/ui/button";
import { siteConfig } from "@/lib/site";
import { cn } from "@/lib/utils";

type SiteHeaderProps = {
  user: {
    id: string;
    name: string;
    email: string;
    globalRole?: "STUDENT" | "TEACHER" | "ADMIN";
  } | null;
};

export function SiteHeader({ user }: SiteHeaderProps) {
  const pathname = usePathname();
  const isAccountActive = pathname === "/mi-cuenta";

  if (
    pathname === "/acceder" ||
    pathname === "/registro" ||
    pathname === "/admin" ||
    pathname.startsWith("/admin/") ||
    pathname.startsWith("/checkout/") ||
    pathname.startsWith("/mis-cursos/")
  ) {
    return null;
  }

  return (
    <header className="sticky top-0 z-40 border-b border-[rgba(12,113,195,0.14)] bg-[rgba(248,246,243,0.96)] backdrop-blur-md">
      <div className="site-container py-4">
        <div className="hidden items-center gap-8 md:grid md:grid-cols-[auto_1fr_auto]">
          <Link
            className="text-[2rem] font-bold leading-none tracking-[-0.05em] text-[var(--color-primary)] md:text-2xl"
            href="/"
          >
            {siteConfig.shortName}
          </Link>

          <nav className="flex items-center justify-center gap-10">
            {siteConfig.nav.map((item) => {
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : item.href === "/cursos"
                    ? pathname === "/cursos" || pathname.startsWith("/cursos/")
                    : isAccountActive;

              return (
                <Link
                  className={cn(
                    "border-b-2 border-transparent pb-1 text-base font-medium text-[var(--color-ink)] transition hover:text-[var(--color-primary)]",
                    isActive && "border-[var(--color-accent)] text-[var(--color-primary)]"
                  )}
                  href={item.href}
                  key={item.href}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center justify-end gap-3">
            {user ? (
              <>
                <ButtonLink href="/mi-cuenta" variant="ghost">
                  Mi cuenta
                </ButtonLink>
                {user.globalRole === "ADMIN" ? (
                  <ButtonLink href="/admin" variant="ghost">
                    Admin
                  </ButtonLink>
                ) : null}
                <div className="grid h-11 w-11 place-items-center rounded-full border border-[var(--color-border)] bg-white text-sm font-semibold text-[var(--color-primary)]">
                  {user.name
                    .split(" ")
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((chunk) => chunk[0]?.toUpperCase())
                    .join("")}
                </div>
                <form action={logoutAction}>
                  <Button type="submit" variant="secondary">
                    Salir
                  </Button>
                </form>
              </>
            ) : (
              <>
                <ButtonLink href="/acceder" variant="ghost">
                  Acceder
                </ButtonLink>
                <ButtonLink href="/registro" variant="primary">
                  Inscribirse
                </ButtonLink>
                <ButtonLink href={siteConfig.donateUrl} target="_blank" variant="accent">
                  Dona
                </ButtonLink>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between gap-6 md:hidden">
          <Link
            className="text-[2rem] font-bold leading-none tracking-[-0.05em] text-[var(--color-primary)]"
            href="/"
          >
            {siteConfig.shortName}
          </Link>

          <div className="flex items-center gap-2">
            {!user ? (
              <>
                <ButtonLink href="/acceder" variant="ghost">
                  Acceder
                </ButtonLink>
                <ButtonLink href="/registro" variant="primary">
                  Inscribirse
                </ButtonLink>
              </>
            ) : (
              <>
                <div className="grid h-10 w-10 place-items-center rounded-full border border-[var(--color-border)] bg-white text-sm font-semibold text-[var(--color-primary)]">
                  {user.name
                    .split(" ")
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((chunk) => chunk[0]?.toUpperCase())
                    .join("")}
                </div>
                <form action={logoutAction}>
                  <Button type="submit" variant="secondary">
                    Salir
                  </Button>
                </form>
              </>
            )}
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-4 md:hidden">
          {user ? (
            <>
              <div className="flex items-center gap-3">
                <ButtonLink href="/mi-cuenta" variant="ghost">
                  Mi cuenta
                </ButtonLink>
                {user.globalRole === "ADMIN" ? (
                  <ButtonLink href="/admin" variant="ghost">
                    Admin
                  </ButtonLink>
                ) : null}
              </div>
              <form action={logoutAction}>
                <Button type="submit" variant="secondary">
                  Salir
                </Button>
              </form>
            </>
          ) : (
            <div className="text-sm text-[var(--color-muted)]">
              Formacion digital especializada
            </div>
          )}
        </div>

        <nav className="mt-4 flex items-center gap-8 overflow-x-auto border-t border-[rgba(12,113,195,0.12)] pt-3 md:hidden">
          {siteConfig.nav.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : item.href === "/cursos"
                  ? pathname === "/cursos" || pathname.startsWith("/cursos/")
                  : isAccountActive;

            return (
              <Link
                className={cn(
                  "whitespace-nowrap border-b-2 border-transparent pb-1 text-base font-medium text-[var(--color-ink)] transition hover:text-[var(--color-primary)]",
                  isActive && "border-[var(--color-accent)] text-[var(--color-primary)]"
                )}
                href={item.href}
                key={`mobile-${item.href}`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}

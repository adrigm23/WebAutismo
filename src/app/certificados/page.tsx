import type { Metadata } from "next";
import Link from "next/link";
import { Award, BookOpen, CheckCircle2 } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getUserCourseSpaces } from "@/lib/course-community";
import { StudentShell, type StudentShellNavItem } from "@/components/campus/student-shell";
import { getInitials } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Certificados | Campus Autismo",
  robots: { index: false, follow: false },
};

function buildNavItems(): StudentShellNavItem[] {
  return [
    { label: "Mi campus", href: "/mis-cursos", icon: "home" },
    { label: "Mensajes", href: "/mensajes", icon: "messages" },
    { label: "Comunidad", href: "/comunidad", icon: "community" },
    { label: "Calendario", href: "/calendario", icon: "calendar" },
    { label: "Biblioteca", href: "/biblioteca", icon: "library" },
    { label: "Certificados", href: "/certificados", icon: "certificates" },
    { label: "Configuración", href: "/mi-cuenta", icon: "settings" },
    { label: "Soporte", href: "/soporte", icon: "support" },
  ];
}

export default async function CertificadosPage() {
  const user = await requireUser("/certificados");

  const courseSpaces = await getUserCourseSpaces({
    userId: user.id,
    userGlobalRole: user.globalRole,
    userIsActive: user.isActive,
  }).catch(() => []);

  const completedCourses = courseSpaces.filter(
    (s) => s.role === "STUDENT" && s.accessState === "active"
  );

  const viewerName = user.name ?? user.email;

  return (
    <StudentShell
      fullName={viewerName}
      initials={getInitials(viewerName)}
      navItems={buildNavItems()}
      notificationsCount={0}
      roleLabel="Alumno"
    >
      <div className="site-container py-10 sm:py-14">
        <div className="mx-auto max-w-xl text-center">
          {/* Icon */}
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-xl bg-[var(--color-brand-soft)]">
            <Award className="h-10 w-10 text-[var(--color-primary)]" strokeWidth={1.5} />
          </div>

          {/* Heading */}
          <h1 className="mt-6 font-premium text-display-md font-semibold text-[var(--color-ink)]">
            Certificados
          </h1>
          <p className="mt-3 text-body-md text-[var(--color-ink-soft)]">
            Estamos trabajando en el sistema de certificados. Podrás descargar y
            compartir tu acreditación profesional al completar cada formación.
          </p>

          {/* Coming soon badge */}
          <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-[var(--color-border-subtle)] bg-white px-4 py-2 text-sm font-medium text-[var(--color-ink-soft)] shadow-sm">
            <span className="h-2 w-2 rounded-full bg-amber-400" />
            Próximamente disponible
          </div>

          {/* What to expect */}
          <div className="mt-10 rounded-xl border border-[var(--color-border-subtle)] bg-white p-6 text-left shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-wide text-[var(--color-muted)]">
              Qué incluirá
            </p>
            <ul className="mt-4 space-y-3">
              {[
                "Certificado descargable en PDF con tu nombre y curso completado",
                "Código de verificación para validar la acreditación",
                "Compartible en LinkedIn y otros perfiles profesionales",
                "Historial de todas tus formaciones completadas",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-[var(--color-ink-soft)]">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-success)]" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* CTA — go complete courses */}
          {completedCourses.length === 0 ? (
            <div className="mt-8">
              <Link
                href="/cursos"
                className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[var(--color-primary-strong)]"
              >
                <BookOpen className="h-4 w-4" />
                Explorar cursos disponibles
              </Link>
            </div>
          ) : (
            <div className="mt-8">
              <p className="text-sm text-[var(--color-ink-soft)]">
                Tienes <strong>{completedCourses.length} curso{completedCourses.length !== 1 ? "s" : ""}</strong> activo{completedCourses.length !== 1 ? "s" : ""}. Cuando completes una formación, tu certificado aparecerá aquí.
              </p>
              <Link
                href="/mis-cursos"
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[var(--color-primary-strong)]"
              >
                Continuar mis cursos
              </Link>
            </div>
          )}
        </div>
      </div>
    </StudentShell>
  );
}

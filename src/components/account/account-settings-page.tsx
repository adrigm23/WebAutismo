import type { ReactNode } from "react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import type { UserGlobalRole } from "@prisma/client";
import {
  ArrowRight,
  Award,
  Bell,
  BookCopy,
  BookOpen,
  CircleHelp,
  GraduationCap,
  Languages,
  LayoutGrid,
  LifeBuoy,
  Mail,
  MessageSquareText,
  Monitor,
  Settings2,
  Shield,
  UserRound,
} from "lucide-react";
import { logoutEverywhereAction } from "@/actions/session";
import { updateNotificationPreferencesAction } from "@/actions/account";
import { StudentShell } from "@/components/campus/student-shell";
import { Button, ButtonLink } from "@/components/ui/button";
import { StateBanner } from "@/components/ui/state-banner";
import type { DashboardNotificationSnapshot } from "@/lib/account-dashboard";
import { getGlobalRoleLabel } from "@/lib/course-permissions";
import { cn, formatDateTime, formatRelativeTime, getInitials } from "@/lib/utils";

type QuickLinkItem = {
  href?: string;
  title: string;
  description: string;
  icon: LucideIcon;
  badge?: string;
  disabled?: boolean;
};

type ActiveSessionItem = {
  id: string;
  createdAt: Date;
  expiresAt: Date;
  lastSeenAt: Date | null;
  userAgent: string | null;
  ipAddress: string | null;
  isCurrent: boolean;
};

export type AccountOverviewPanel = {
  title: string;
  value: string;
  detail: string;
  progressPercent: number | null;
  sectionLabel: string;
  items: string[];
  actionHref?: string;
  actionLabel?: string;
};

type AccountSettingsPageProps = {
  email: string;
  emailVerifiedAt: Date | null;
  firstName: string;
  fullName: string;
  globalRole: UserGlobalRole;
  isDemoUser: boolean;
  notificationSnapshot: DashboardNotificationSnapshot;
  overviewPanel: AccountOverviewPanel;
  primaryCta: {
    href: string;
    label: string;
  };
  quickLinks: QuickLinkItem[];
  sessions: ActiveSessionItem[];
};

const desktopSidebarPrimaryItems = [
  {
    label: "Panel",
    href: "/mis-cursos",
    icon: LayoutGrid,
  },
  {
    label: "Perfil",
    href: "#perfil-cuenta",
    icon: UserRound,
    active: true,
  },
  {
    label: "Seguridad",
    href: "#seguridad",
    icon: Shield,
  },
  {
    label: "Notificaciones",
    href: "#preferencias",
    icon: Bell,
  },
] as const;

const desktopSidebarSecondaryItems = [
  {
    label: "Ajustes",
    href: "#preferencias",
    icon: Settings2,
  },
  {
    label: "Ayuda",
    href: "/soporte",
    icon: CircleHelp,
  },
] as const;

function getHeroEyebrow(role: UserGlobalRole) {
  if (role === "ADMIN") {
    return "ADMINISTRACION";
  }

  return role === "TEACHER" ? "DOCENTE SENIOR" : "ESTUDIANTE SENIOR";
}

function getHeroDescription(role: UserGlobalRole) {
  if (role === "ADMIN") {
    return "Gestiona tus preferencias, seguridad e informacion personal.";
  }

  return role === "TEACHER"
    ? "Gestiona tus preferencias, seguridad e informacion personal."
    : "Gestiona tus preferencias, seguridad e informacion personal.";
}

function getSessionDeviceLabel(userAgent: string | null) {
  if (!userAgent) {
    return "Dispositivo sin identificar";
  }

  const browser =
    userAgent.includes("Edg/")
      ? "Microsoft Edge"
      : userAgent.includes("Chrome/")
        ? "Google Chrome"
        : userAgent.includes("Firefox/")
          ? "Mozilla Firefox"
          : userAgent.includes("Safari/")
            ? "Safari"
            : "Navegador web";

  const platform =
    userAgent.includes("Windows")
      ? "Windows"
      : userAgent.includes("Mac OS X")
        ? "macOS"
        : userAgent.includes("Android")
          ? "Android"
          : userAgent.includes("iPhone") || userAgent.includes("iPad")
            ? "iOS"
            : userAgent.includes("Linux")
              ? "Linux"
              : "equipo actual";

  return `${browser} en ${platform}`;
}

function getSessionDescription(session: ActiveSessionItem) {
  const segments = [
    session.lastSeenAt
      ? `Ultima actividad ${formatRelativeTime(session.lastSeenAt)}`
      : "Sesion iniciada hace poco",
    `Caduca ${formatDateTime(session.expiresAt)}`,
  ];

  if (session.ipAddress) {
    segments.push(`IP ${session.ipAddress}`);
  }

  return segments.join(" - ");
}

function getNotificationPreferenceTitle(snapshot: DashboardNotificationSnapshot) {
  if (snapshot.preference.emailEnabled && snapshot.preference.webEnabled) {
    return "Correo y area privada";
  }

  if (snapshot.preference.emailEnabled) {
    return "Solo correo";
  }

  if (snapshot.preference.webEnabled) {
    return "Solo area privada";
  }

  return "Avisos minimizados";
}

function DesktopSidebarLink(input: {
  href: string;
  label: string;
  icon: LucideIcon;
  active?: boolean;
}) {
  const Icon = input.icon;

  return (
    <Link
      aria-current={input.active ? "page" : undefined}
      className={cn(
        "flex items-center gap-3 rounded-[1rem] px-4 py-3 text-[1.02rem] font-medium transition",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f4f1ff]",
        input.active
          ? "bg-[#173c56] text-white shadow-[0_14px_32px_-24px_rgba(23,60,86,0.72)]"
          : "text-[var(--color-ink)] hover:bg-white hover:text-[#173c56]",
      )}
      href={input.href}
    >
      <Icon className="h-5 w-5 shrink-0" />
      <span>{input.label}</span>
    </Link>
  );
}

function ProfileField(input: {
  label: string;
  value: ReactNode;
  meta?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <p className="text-[0.78rem] font-medium uppercase tracking-[0.14em] text-[var(--color-muted)]">
        {input.label}
      </p>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[1.18rem] font-medium leading-8 text-[var(--color-ink)]">
            {input.value}
          </p>
          {input.meta ? (
            <p className="mt-1 text-sm leading-6 text-[var(--color-muted)]">{input.meta}</p>
          ) : null}
        </div>
        {input.action ? <div className="shrink-0">{input.action}</div> : null}
      </div>
    </div>
  );
}

function PreferenceSwitchRow(input: {
  title: string;
  description: string;
  enabled: boolean;
  emailEnabled: boolean;
  webEnabled: boolean;
}) {
  return (
    <form action={updateNotificationPreferencesAction}>
      <input name="emailEnabled" type="hidden" value={input.emailEnabled ? "true" : "false"} />
      <input name="webEnabled" type="hidden" value={input.webEnabled ? "true" : "false"} />
      <button
        className="flex w-full items-center justify-between gap-4 rounded-[1rem] py-1 text-left transition hover:opacity-85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"
        type="submit"
      >
        <div className="min-w-0">
          <p className="text-[1rem] font-medium text-[var(--color-ink)]">{input.title}</p>
          <p className="mt-1 text-sm leading-6 text-[var(--color-muted)]">{input.description}</p>
        </div>
        <span
          aria-hidden="true"
          className={cn(
            "flex h-8 w-14 shrink-0 items-center rounded-full p-1 transition",
            input.enabled ? "bg-[#173c56]" : "bg-[rgba(90,108,126,0.25)]",
          )}
        >
          <span
            className={cn(
              "h-6 w-6 rounded-full bg-white transition",
              input.enabled ? "translate-x-6" : "translate-x-0",
            )}
          />
        </span>
      </button>
    </form>
  );
}

function StaticSwitchRow(input: {
  title: string;
  description: string;
  meta: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-[1rem] py-1">
      <div className="min-w-0">
        <p className="text-[1rem] font-medium text-[var(--color-ink)]">{input.title}</p>
        <p className="mt-1 text-sm leading-6 text-[var(--color-muted)]">{input.description}</p>
      </div>
      <div className="flex items-center gap-3">
        <span className="hidden text-xs font-medium uppercase tracking-[0.12em] text-[var(--color-muted)] sm:inline">
          {input.meta}
        </span>
        <span
          aria-hidden="true"
          className="flex h-8 w-14 shrink-0 items-center rounded-full bg-[rgba(90,108,126,0.16)] p-1"
        >
          <span className="h-6 w-6 rounded-full bg-white" />
        </span>
      </div>
    </div>
  );
}

function ProgressItem(input: { text: string }) {
  return (
    <li className="flex items-start gap-3 text-sm leading-6 text-white/84">
      <span className="mt-1.5 h-3.5 w-3.5 shrink-0 rounded-full border border-[rgba(109,244,235,0.94)]" />
      <span>{input.text}</span>
    </li>
  );
}

function QuickAccessTile(input: QuickLinkItem) {
  const Icon = input.icon;
  const sharedClassName =
    "rounded-[1.1rem] border border-[rgba(21,39,58,0.1)] bg-white p-4 transition";

  const content = (
    <>
      <div className="grid h-12 w-12 place-items-center rounded-[0.95rem] bg-[#f3f0ff] text-[#173c56]">
        <Icon className="h-5 w-5" />
      </div>
      <p className="mt-4 text-[1rem] font-medium text-[var(--color-ink)]">{input.title}</p>
      <p className="mt-1 text-sm leading-6 text-[var(--color-muted)]">{input.description}</p>
      {input.badge ? (
        <p className="mt-3 text-xs font-medium uppercase tracking-[0.12em] text-[var(--color-muted)]">
          {input.badge}
        </p>
      ) : null}
    </>
  );

  if (!input.href || input.disabled) {
    return <div className={`${sharedClassName} opacity-90`}>{content}</div>;
  }

  return (
    <Link
      className={`${sharedClassName} hover:border-[rgba(23,60,86,0.18)] hover:bg-[#fcfbff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2`}
      href={input.href}
    >
      {content}
    </Link>
  );
}

export function AccountSettingsPage({
  email,
  emailVerifiedAt,
  firstName,
  fullName,
  globalRole,
  isDemoUser,
  notificationSnapshot,
  overviewPanel,
  primaryCta,
  quickLinks,
  sessions,
}: AccountSettingsPageProps) {
  const initials = getInitials(fullName);
  const roleLabel = getGlobalRoleLabel(globalRole);
  const currentSession = sessions.find((session) => session.isCurrent) ?? sessions[0] ?? null;
  const hasOtherSessions = sessions.some((session) => !session.isCurrent);
  const currentPreferenceTitle = getNotificationPreferenceTitle(notificationSnapshot);
  const forumQuickLink = quickLinks.find((item) => item.title === "Foro");
  const quickAccessItems = quickLinks.slice(0, 4);
  const progressValue =
    overviewPanel.progressPercent !== null
      ? `${Math.max(0, Math.min(100, overviewPanel.progressPercent))}`
      : null;

  return (
    <StudentShell
      fullName={fullName}
      initials={initials}
      navItems={[
        { label: "Mi campus", href: "/mis-cursos", icon: "home" },
        ...(forumQuickLink?.href
          ? [{ label: "Comunidad", href: forumQuickLink.href, icon: "community" as const }]
          : []),
        { label: "Biblioteca", href: "/app/recursos", icon: "library", disabled: true },
        { label: "Certificados", href: "/app/certificados", icon: "certificates", disabled: true },
        { label: "Configuración", href: "/mi-cuenta", icon: "settings" },
        { label: "Soporte", href: "/soporte", icon: "support" },
      ]}
      notificationsCount={notificationSnapshot.unreadCount}
      roleLabel={roleLabel}
    >
      <div className="mx-auto max-w-[1480px] lg:grid lg:grid-cols-[16.25rem_minmax(0,1fr)]">
        <aside className="hidden border-r border-[var(--color-border-subtle)] bg-[var(--color-brand-soft)] lg:block">
          <div className="sticky top-[5rem] flex min-h-[calc(100dvh-5rem)] flex-col justify-between px-5 py-8">
            <nav aria-label="Secciones de cuenta" className="space-y-2.5">
              {desktopSidebarPrimaryItems.map((item) => (
                <DesktopSidebarLink
                  active={"active" in item ? item.active : undefined}
                  href={item.href}
                  icon={item.icon}
                  key={item.label}
                  label={item.label}
                />
              ))}
            </nav>

            <div className="space-y-4">
              <div className="border-t border-[rgba(21,39,58,0.08)]" />
              <nav aria-label="Ayuda y ajustes" className="space-y-2.5">
                {desktopSidebarSecondaryItems.map((item) => (
                  <DesktopSidebarLink
                    href={item.href}
                    icon={item.icon}
                    key={item.label}
                    label={item.label}
                  />
                ))}
              </nav>
            </div>
          </div>
        </aside>

        <main className="min-w-0 px-4 py-6 sm:px-6 lg:px-8 lg:py-8 xl:px-10">
          {isDemoUser ? (
            <StateBanner
              className="mb-6"
              description="Estas navegando con una cuenta de prueba. La composicion refleja el estado actual, pero los cambios no se guardan."
              title="Modo demo activo"
              tone="warning"
            />
          ) : null}

          <section className="grid gap-6 border-b border-[rgba(21,39,58,0.08)] pb-8 xl:grid-cols-[minmax(0,1fr)_22rem] xl:items-start">
            <div className="min-w-0">
              <p className="text-[0.84rem] font-medium uppercase tracking-[0.18em] text-[var(--color-ink-soft)]">
                {getHeroEyebrow(globalRole)}
              </p>
              <h1 className="mt-4 text-[clamp(3rem,5vw,4.6rem)] font-semibold leading-[0.92] tracking-[-0.07em] text-[var(--color-ink)] text-balance">
                Hola, {firstName}
              </h1>
              <p className="mt-4 max-w-[44rem] text-[1.08rem] leading-8 text-[var(--color-muted)]">
                {getHeroDescription(globalRole)}
              </p>
            </div>

            <div className="xl:pt-8">
              <Link
                className="group flex min-h-[4.9rem] w-full items-center justify-between gap-4 rounded-[1.15rem] bg-[#091f31] px-5 py-4 text-white shadow-[0_22px_40px_-32px_rgba(9,31,49,0.92)] transition hover:translate-y-[-1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"
                href={primaryCta.href}
              >
                <div className="min-w-0">
                  <p className="truncate text-[1.02rem] font-semibold text-white/92">
                    {`Continuar: ${primaryCta.label}`}
                  </p>
                </div>
                <ArrowRight className="h-5 w-5 shrink-0 transition group-hover:translate-x-0.5" />
              </Link>
            </div>
          </section>

          <div className="mt-8 xl:grid xl:grid-cols-[minmax(0,1fr)_21rem] xl:gap-8">
            <div className="min-w-0 space-y-6">
              <section
                className="rounded-[1.6rem] border border-[rgba(21,39,58,0.1)] bg-white px-5 py-6 shadow-[0_14px_34px_-30px_rgba(18,35,55,0.26)] sm:px-7 sm:py-7"
                id="perfil-cuenta"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="grid h-14 w-14 place-items-center rounded-[1rem] bg-[#f3f0ff] text-[#173c56]">
                      <UserRound className="h-6 w-6" />
                    </div>
                    <div>
                      <h2 className="text-[2rem] font-semibold tracking-[-0.05em] text-[var(--color-ink)]">
                        Perfil y cuenta
                      </h2>
                      <p className="mt-1 text-[1rem] text-[var(--color-muted)]">
                        Informacion personal y acceso
                      </p>
                    </div>
                  </div>

                  <Link
                    className="text-[1rem] font-medium text-[var(--color-ink)] transition hover:text-[#173c56] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"
                    href="#preferencias"
                  >
                    Editar
                  </Link>
                </div>

                <div className="mt-8 grid gap-x-12 gap-y-8 md:grid-cols-2">
                  <ProfileField
                    label="Nombre completo"
                    meta={`Rol activo: ${roleLabel}`}
                    value={fullName}
                  />
                  <ProfileField
                    label="Correo electronico"
                    meta={
                      emailVerifiedAt
                        ? `Verificado ${formatRelativeTime(emailVerifiedAt)}.`
                        : "Direccion principal para acceso y avisos."
                    }
                    value={<span className="break-all">{email}</span>}
                  />
                  <ProfileField
                    action={
                      <ButtonLink href="/recuperar-contrasena" size="sm" variant="neutral">
                        Restablecer
                      </ButtonLink>
                    }
                    label="Contrasena"
                    meta="El acceso se mantiene protegido por recuperacion con correo."
                    value="••••••••••••"
                  />
                  <ProfileField
                    label="Idioma principal"
                    meta={`Avisos actuales: ${currentPreferenceTitle}.`}
                    value="Espanol (ES)"
                  />
                </div>
              </section>

              <div className="grid gap-6 lg:grid-cols-2">
                <section
                  className="rounded-[1.5rem] border border-[rgba(21,39,58,0.1)] bg-white px-5 py-6 shadow-[0_14px_34px_-30px_rgba(18,35,55,0.24)] sm:px-6"
                  id="preferencias"
                >
                  <div className="flex items-start gap-4">
                    <div className="grid h-14 w-14 place-items-center rounded-[1rem] bg-[#f3f0ff] text-[#173c56]">
                      <Settings2 className="h-6 w-6" />
                    </div>
                    <div>
                      <h2 className="text-[1.9rem] font-semibold tracking-[-0.05em] text-[var(--color-ink)]">
                        Preferencias
                      </h2>
                      <p className="mt-1 text-[1rem] text-[var(--color-muted)]">
                        Idioma, avisos y legibilidad
                      </p>
                    </div>
                  </div>

                  <div className="mt-7 space-y-4">
                    <PreferenceSwitchRow
                      description="Muestra avisos del campus dentro de tu cuenta."
                      emailEnabled={notificationSnapshot.preference.emailEnabled}
                      enabled={notificationSnapshot.preference.webEnabled}
                      title="Notificaciones push"
                      webEnabled={!notificationSnapshot.preference.webEnabled}
                    />
                    <PreferenceSwitchRow
                      description="Recibe recordatorios y actividad relevante por correo."
                      emailEnabled={!notificationSnapshot.preference.emailEnabled}
                      enabled={notificationSnapshot.preference.emailEnabled}
                      title="Correos semanales"
                      webEnabled={notificationSnapshot.preference.webEnabled}
                    />
                    <StaticSwitchRow
                      description="Disponible cuando exista un modo de lectura adaptado para toda la plataforma."
                      meta="Proximo"
                      title="Alto contraste"
                    />
                  </div>

                  <div className="mt-7 rounded-[1rem] bg-[#f8f6ff] px-4 py-4">
                    <p className="text-[0.78rem] font-medium uppercase tracking-[0.12em] text-[var(--color-muted)]">
                      Idioma
                    </p>
                    <p className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-[var(--color-ink)]">
                      <Languages className="h-4 w-4 text-[#173c56]" />
                      Espanol (ES)
                    </p>
                  </div>
                </section>

                <section
                  className="rounded-[1.5rem] border border-[rgba(21,39,58,0.1)] bg-white px-5 py-6 shadow-[0_14px_34px_-30px_rgba(18,35,55,0.24)] sm:px-6"
                  id="seguridad"
                >
                  <div className="flex items-start gap-4">
                    <div className="grid h-14 w-14 place-items-center rounded-[1rem] bg-[#f3f0ff] text-[#173c56]">
                      <Shield className="h-6 w-6" />
                    </div>
                    <div>
                      <h2 className="text-[1.9rem] font-semibold tracking-[-0.05em] text-[var(--color-ink)]">
                        Seguridad
                      </h2>
                      <p className="mt-1 text-[1rem] text-[var(--color-muted)]">
                        Proteccion de acceso y sesion actual
                      </p>
                    </div>
                  </div>

                  <div className="mt-7 space-y-4">
                    <div className="rounded-[1rem] bg-[#f4f1ff] px-4 py-4">
                      <p className="inline-flex items-center gap-2 text-[1rem] font-semibold text-[var(--color-ink)]">
                        <Mail className="h-4 w-4 text-[#173c56]" />
                        2FA y verificacion
                      </p>
                      <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
                        {emailVerifiedAt
                          ? "Tu cuenta usa correo verificado y recuperacion segura. La autenticacion en dos pasos aun no esta disponible."
                          : "Tu correo principal sigue siendo la capa de recuperacion activa. La autenticacion en dos pasos aun no esta disponible."}
                      </p>
                    </div>

                    <div className="rounded-[1rem] border border-[rgba(21,39,58,0.1)] px-4 py-4">
                      <p className="inline-flex items-center gap-2 text-[1rem] font-semibold text-[var(--color-ink)]">
                        <Monitor className="h-4 w-4 text-[#173c56]" />
                        Sesion actual
                      </p>
                      <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
                        {currentSession
                          ? getSessionDeviceLabel(currentSession.userAgent)
                          : "Navegador actual"}
                      </p>
                      <p className="mt-1 text-sm leading-6 text-[var(--color-muted)]">
                        {currentSession
                          ? getSessionDescription(currentSession)
                          : "La trazabilidad de esta sesion aparecera aqui cuando este disponible."}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 flex flex-wrap gap-3">
                    <ButtonLink href="/recuperar-contrasena" variant="neutral">
                      Restablecer contrasena
                    </ButtonLink>
                    {hasOtherSessions ? (
                      <form action={logoutEverywhereAction}>
                        <Button type="submit" variant="subtle">
                          Cerrar otras sesiones
                        </Button>
                      </form>
                    ) : null}
                  </div>
                </section>
              </div>
            </div>

            <aside className="mt-6 flex min-w-0 flex-col gap-6 xl:mt-0">
              <section className="order-2 rounded-[1.5rem] bg-[linear-gradient(180deg,#123d58_0%,#0b2b40_100%)] px-5 py-6 text-white shadow-[0_28px_52px_-34px_rgba(11,43,64,0.78)] xl:order-1">
                <p className="text-[2.05rem] font-semibold tracking-[-0.05em] text-white">
                  {overviewPanel.title}
                </p>
                {progressValue ? (
                  <div className="mt-5 flex items-end gap-2">
                    <span className="text-[3.2rem] font-semibold leading-none tracking-[-0.07em] text-white">
                      {progressValue}
                    </span>
                    <span className="pb-2 text-[1.1rem] text-white/64">% completado</span>
                  </div>
                ) : (
                  <p className="mt-5 text-[2.15rem] font-semibold leading-[1.05] tracking-[-0.05em] text-white">
                    {overviewPanel.value}
                  </p>
                )}
                <p className="mt-2 text-sm leading-6 text-white/72">{overviewPanel.detail}</p>

                <div className="mt-6 h-2 overflow-hidden rounded-full bg-white/14">
                  <div
                    aria-hidden="true"
                    className="h-full rounded-full bg-[rgba(103,241,232,0.98)]"
                    style={{
                      width: `${Math.max(0, Math.min(100, overviewPanel.progressPercent ?? 0))}%`,
                    }}
                  />
                </div>

                <div className="mt-6">
                  <p className="text-[0.78rem] font-medium uppercase tracking-[0.14em] text-white/58">
                    {overviewPanel.sectionLabel}
                  </p>
                  <ul className="mt-4 space-y-4">
                    {overviewPanel.items.length ? (
                      overviewPanel.items.slice(0, 3).map((item) => <ProgressItem key={item} text={item} />)
                    ) : (
                      <ProgressItem text="No hay bloqueos inmediatos en este momento." />
                    )}
                  </ul>
                </div>

                {overviewPanel.actionHref && overviewPanel.actionLabel ? (
                  <ButtonLink
                    className="mt-6 w-full justify-between border-transparent bg-white text-[#173c56] hover:bg-white hover:text-[#173c56] focus-visible:ring-white/50 focus-visible:ring-offset-[#0b2b40]"
                    href={overviewPanel.actionHref}
                    variant="neutral"
                  >
                    <span>{overviewPanel.actionLabel}</span>
                    <ArrowRight className="h-4 w-4" />
                  </ButtonLink>
                ) : null}
              </section>

              <section
                className="order-1 rounded-[1.5rem] border border-[rgba(21,39,58,0.1)] bg-white px-5 py-5 shadow-[0_14px_34px_-30px_rgba(18,35,55,0.24)] xl:order-2"
                id="accesos-rapidos"
              >
                <p className="text-[0.82rem] font-medium uppercase tracking-[0.16em] text-[var(--color-muted)]">
                  Accesos rapidos
                </p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {quickAccessItems.map((item) => (
                    <QuickAccessTile
                      badge={item.badge}
                      description={item.description}
                      disabled={item.disabled}
                      href={item.href}
                      icon={item.icon}
                      key={item.title}
                      title={item.title}
                    />
                  ))}
                </div>
              </section>
            </aside>
          </div>
        </main>
      </div>
    </StudentShell>
  );
}

export const accountQuickLinkIcons = {
  admin: Shield,
  courses: BookOpen,
  teaching: GraduationCap,
  forum: MessageSquareText,
  support: LifeBuoy,
  notifications: Bell,
  library: BookCopy,
  certificates: Award,
};

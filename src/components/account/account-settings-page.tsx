import type { ReactNode } from "react";
import Link from "next/link";
import type { UserGlobalRole } from "@prisma/client";
import {
  ArrowRight,
  Bell,
  BookOpen,
  CircleHelp,
  GraduationCap,
  Languages,
  LayoutGrid,
  LifeBuoy,
  Mail,
  MessageSquareText,
  Monitor,
  Palette,
  Settings2,
  Shield,
  UserCircle2,
} from "lucide-react";
import { logoutEverywhereAction } from "@/actions/session";
import { updateNotificationPreferencesAction } from "@/actions/account";
import { AccountAuthHeader } from "@/components/account/account-auth-header";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { StateBanner } from "@/components/ui/state-banner";
import type { DashboardNotificationSnapshot } from "@/lib/account-dashboard";
import { resolvePlatformNotificationHref } from "@/lib/course-navigation";
import { getGlobalRoleLabel } from "@/lib/course-permissions";
import { getPrivateNavItems } from "@/lib/private-navigation";
import { cn, formatDateTime, formatRelativeTime } from "@/lib/utils";

type QuickLinkItem = {
  href: string;
  title: string;
  description: string;
  icon: typeof BookOpen;
  badge?: string;
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

type PreferenceOption = {
  title: string;
  description: string;
  emailEnabled: boolean;
  webEnabled: boolean;
};

type RecentItem = {
  id: string;
  href: string;
  title: string;
  description: string;
  createdAt: Date;
  sourceLabel: string;
  sourceTone: "info" | "brand";
};

const notificationPreferenceOptions: PreferenceOption[] = [
  {
    title: "Solo email",
    description: "Recibe avisos en tu correo y reduce ruido dentro de la cuenta.",
    emailEnabled: true,
    webEnabled: false,
  },
  {
    title: "Solo web",
    description: "Centraliza avisos del campus y del foro dentro de esta cuenta.",
    emailEnabled: false,
    webEnabled: true,
  },
  {
    title: "Email y web",
    description: "Mantiene correo y zona privada sincronizados para no perder contexto.",
    emailEnabled: true,
    webEnabled: true,
  },
];

const railPrimaryItems = [
  {
    label: "Panel",
    href: "/mis-cursos",
    icon: LayoutGrid,
  },
  {
    label: "Perfil",
    href: "/mi-cuenta",
    icon: UserCircle2,
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
];

const railSecondaryItems = [
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
];

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean).slice(0, 2);

  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("") || "U";
}

function getRoleTone(role: UserGlobalRole) {
  if (role === "ADMIN") {
    return "info";
  }

  return role === "TEACHER" ? "brand" : "warning";
}

function getRoleEyebrow(role: UserGlobalRole) {
  if (role === "ADMIN") {
    return "Campus privado";
  }

  return role === "TEACHER" ? "Docente senior" : "Estudiante senior";
}

function getRoleDescription(role: UserGlobalRole) {
  if (role === "ADMIN") {
    return "Gestiona seguridad, acceso e informacion personal sin convertir esta zona en un panel operativo.";
  }

  return role === "TEACHER"
    ? "Gestiona perfil, seguridad y avisos del campus privado con una composicion compacta y util."
    : "Gestiona tus preferencias, seguridad e informacion personal desde una sola vista clara.";
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
      : "Sesion recien creada",
    `Caduca ${formatDateTime(session.expiresAt)}`,
  ];

  if (session.ipAddress) {
    segments.push(`IP ${session.ipAddress}`);
  }

  return segments.join(" - ");
}

function buildRecentItems(snapshot: DashboardNotificationSnapshot) {
  const items: RecentItem[] = [];
  const platformItems = snapshot.platformNotifications.notifications.map((notification) => ({
    id: `platform-${notification.id}`,
    href: resolvePlatformNotificationHref({
      category: notification.category,
      linkPath: notification.linkPath,
      metadataJson: notification.metadataJson,
    }),
    title: notification.title,
    description: notification.body,
    createdAt: notification.createdAt,
    sourceLabel: "Plataforma",
    sourceTone: "info" as const,
  }));

  const forumItems = snapshot.forumNotifications.notifications.map((notification) => ({
    id: `forum-${notification.id}`,
    href: notification.linkPath,
    title: notification.title,
    description: notification.body,
    createdAt: notification.createdAt,
    sourceLabel: "Foro",
    sourceTone: "brand" as const,
  }));

  items.push(...platformItems, ...forumItems);

  return items
    .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())
    .slice(0, 3);
}

function getNotificationPreferenceTitle(snapshot: DashboardNotificationSnapshot) {
  const currentOption = notificationPreferenceOptions.find(
    (option) =>
      option.emailEnabled === snapshot.preference.emailEnabled &&
      option.webEnabled === snapshot.preference.webEnabled,
  );

  return currentOption?.title ?? "Email y web";
}

function RailLink(input: {
  href: string;
  label: string;
  icon: typeof LayoutGrid;
  active?: boolean;
}) {
  return (
    <Link
      aria-current={input.active ? "page" : undefined}
      className={cn(
        "flex items-center gap-3 rounded-[1rem] px-3.5 py-3 text-[0.98rem] font-medium transition",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2",
        input.active
          ? "bg-[rgba(22,60,88,0.82)] text-white shadow-[0_14px_28px_-20px_rgba(13,38,56,0.8)]"
          : "text-[var(--color-ink)] hover:bg-white hover:text-[var(--color-primary)]",
      )}
      href={input.href}
    >
      <input.icon className="h-5 w-5 shrink-0" />
      <span>{input.label}</span>
    </Link>
  );
}

function InfoField(input: {
  label: string;
  value: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-[1.15rem] border border-[var(--color-border-subtle)] bg-white px-4 py-4 shadow-[0_6px_18px_rgba(15,34,52,0.04)]">
      <p className="text-[0.72rem] font-medium tracking-[0.12em] text-[var(--color-muted)] uppercase">
        {input.label}
      </p>
      <div className="mt-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[1.06rem] font-semibold leading-7 text-[var(--color-ink)]">
            {input.value}
          </p>
          {input.description ? (
            <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
              {input.description}
            </p>
          ) : null}
        </div>
        {input.action ? <div className="shrink-0">{input.action}</div> : null}
      </div>
    </div>
  );
}

function PreferenceRow(input: {
  option: PreferenceOption;
  isSelected: boolean;
}) {
  return (
    <form action={updateNotificationPreferencesAction}>
      <input
        name="emailEnabled"
        type="hidden"
        value={input.option.emailEnabled ? "true" : "false"}
      />
      <input
        name="webEnabled"
        type="hidden"
        value={input.option.webEnabled ? "true" : "false"}
      />
      <button
        className={cn(
          "flex w-full items-center justify-between gap-4 rounded-[1rem] border px-4 py-3 text-left transition",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2",
          input.isSelected
            ? "border-[rgba(22,60,88,0.18)] bg-[rgba(243,242,252,0.92)]"
            : "border-[var(--color-border-subtle)] bg-white hover:border-[rgba(22,60,88,0.16)]",
        )}
        type="submit"
      >
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[var(--color-ink)]">{input.option.title}</p>
          <p className="mt-1 text-sm leading-6 text-[var(--color-muted)]">
            {input.option.description}
          </p>
        </div>
        <div
          aria-hidden="true"
          className={cn(
            "flex h-7 w-12 shrink-0 items-center rounded-full p-1 transition",
            input.isSelected ? "bg-[var(--color-primary)]" : "bg-[rgba(91,108,126,0.28)]",
          )}
        >
          <div
            className={cn(
              "h-5 w-5 rounded-full bg-white transition",
              input.isSelected ? "translate-x-5" : "translate-x-0",
            )}
          />
        </div>
      </button>
    </form>
  );
}

function QuickAccessTile(input: QuickLinkItem) {
  return (
    <Link
      className="group rounded-[1rem] border border-[var(--color-border-subtle)] bg-white px-4 py-4 transition hover:border-[rgba(22,60,88,0.16)] hover:bg-[rgba(248,247,243,0.86)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"
      href={input.href}
    >
      <div className="grid h-11 w-11 place-items-center rounded-[0.95rem] bg-[rgba(243,242,252,0.92)] text-[var(--color-primary)]">
        <input.icon className="h-5 w-5" />
      </div>
      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-[var(--color-ink)]">{input.title}</p>
        <ArrowRight className="h-4 w-4 text-[var(--color-primary)] transition group-hover:translate-x-0.5" />
      </div>
      {input.badge ? (
        <Badge className="mt-3" size="sm" tone="outline">
          {input.badge}
        </Badge>
      ) : null}
    </Link>
  );
}

function OverviewItem(input: { text: string }) {
  return (
    <li className="flex items-start gap-3 text-sm leading-6 text-white/82">
      <span className="mt-1.5 h-3.5 w-3.5 shrink-0 rounded-full border border-[rgba(95,247,239,0.82)]" />
      <span>{input.text}</span>
    </li>
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
  const roleLabel = getGlobalRoleLabel(globalRole);
  const initials = getInitials(fullName);
  const recentItems = buildRecentItems(notificationSnapshot);
  const currentSession = sessions.find((session) => session.isCurrent) ?? sessions[0] ?? null;
  const hasOtherSessions = sessions.some((session) => !session.isCurrent);
  const currentPreferenceTitle = getNotificationPreferenceTitle(notificationSnapshot);

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#fbfaf7_0%,#f7f5ef_100%)] pb-10">
      <AccountAuthHeader
        fullName={fullName}
        initials={initials}
        navItems={getPrivateNavItems("account")}
        roleLabel={roleLabel}
      />

      <main className="site-container pt-6 lg:pt-8">
        {isDemoUser ? (
          <StateBanner
            className="mb-6"
            description="Estas navegando con una cuenta de prueba. La composicion refleja el rol actual, pero los cambios no se guardan."
            title="Modo demo activo"
            tone="warning"
          />
        ) : null}

        <div className="overflow-hidden rounded-[2rem] border border-[rgba(22,60,88,0.1)] bg-white shadow-[0_24px_70px_-42px_rgba(18,42,61,0.22)]">
          <div className="xl:grid xl:grid-cols-[15.5rem_minmax(0,1fr)_21rem]">
            <aside className="hidden border-r border-[rgba(22,60,88,0.08)] bg-[linear-gradient(180deg,#f6f4fb_0%,#f3f1fb_100%)] xl:flex xl:min-h-[calc(100vh-13rem)] xl:flex-col xl:justify-between xl:px-4 xl:py-7">
              <nav aria-label="Secciones de cuenta" className="space-y-2">
                {railPrimaryItems.map((item) => (
                  <RailLink
                    active={item.active}
                    href={item.href}
                    icon={item.icon}
                    key={item.label}
                    label={item.label}
                  />
                ))}
              </nav>

              <div className="border-t border-[rgba(22,60,88,0.08)] pt-5">
                <nav aria-label="Ayuda y ajustes" className="space-y-2">
                  {railSecondaryItems.map((item) => (
                    <RailLink href={item.href} icon={item.icon} key={item.label} label={item.label} />
                  ))}
                </nav>
              </div>
            </aside>

            <div className="min-w-0 p-5 sm:p-6 lg:p-7 xl:p-8">
              <nav
                aria-label="Secciones de cuenta en movil"
                className="mb-5 flex gap-2 overflow-x-auto pb-1 xl:hidden"
              >
                {[...railPrimaryItems, ...railSecondaryItems].map((item) => (
                  <Link
                    aria-current={("active" in item && item.active) ? "page" : undefined}
                    className={cn(
                      "inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition",
                      ("active" in item && item.active)
                        ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-white"
                        : "border-[rgba(22,60,88,0.08)] bg-[rgba(247,245,239,0.9)] text-[var(--color-ink)]",
                    )}
                    href={item.href}
                    key={`mobile-${item.label}`}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                ))}
              </nav>

              <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_19rem] lg:items-center">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={getRoleTone(globalRole)}>{roleLabel}</Badge>
                    <Badge tone="success">Cuenta activa</Badge>
                  </div>

                  <p className="mt-5 text-[0.82rem] font-medium tracking-[0.14em] text-[var(--color-ink-soft)] uppercase">
                    {getRoleEyebrow(globalRole)}
                  </p>
                  <h1 className="font-premium mt-3 text-[clamp(2.6rem,5vw,4rem)] leading-[0.96] font-semibold tracking-[-0.06em] text-[var(--color-ink)] text-balance">
                    Hola, {firstName}
                  </h1>
                  <p className="mt-4 max-w-[42rem] text-[1.05rem] leading-8 text-[var(--color-muted)]">
                    {getRoleDescription(globalRole)}
                  </p>
                </div>

                <div className="lg:justify-self-end">
                  <Link
                    className="group flex min-h-[5.25rem] items-center justify-between gap-4 rounded-[1.15rem] bg-[linear-gradient(180deg,#09283a_0%,#072334_100%)] px-5 py-4 text-white shadow-[0_18px_36px_-24px_rgba(7,35,52,0.82)] transition hover:translate-y-[-1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"
                    href={primaryCta.href}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white/92">Continuar</p>
                      <p className="mt-1 truncate text-base text-white/80">{primaryCta.label}</p>
                    </div>
                    <ArrowRight className="h-5 w-5 shrink-0 transition group-hover:translate-x-0.5" />
                  </Link>
                </div>
              </section>

              <div className="mt-7 border-t border-[rgba(22,60,88,0.08)] pt-7">
                <section className="rounded-[1.6rem] border border-[var(--color-border-subtle)] bg-white p-5 shadow-[0_10px_24px_-22px_rgba(18,42,61,0.24)] sm:p-6">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="grid h-14 w-14 place-items-center rounded-[1rem] bg-[rgba(243,242,252,0.92)] text-[var(--color-primary)]">
                        <UserCircle2 className="h-6 w-6" />
                      </div>
                      <div className="min-w-0">
                        <h2 className="font-premium text-[1.9rem] font-semibold tracking-[-0.04em] text-[var(--color-ink)]">
                          Perfil y cuenta
                        </h2>
                        <p className="mt-1 text-[1.02rem] text-[var(--color-muted)]">
                          Informacion personal y acceso
                        </p>
                      </div>
                    </div>

                    <Link
                      className="text-base font-medium text-[var(--color-ink)] transition hover:text-[var(--color-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"
                      href="#preferencias"
                    >
                      Editar
                    </Link>
                  </div>

                  <div className="mt-6 grid gap-4 md:grid-cols-2">
                    <InfoField
                      description="Nombre visible dentro del campus privado."
                      label="Nombre completo"
                      value={fullName}
                    />
                    <InfoField
                      description={
                        emailVerifiedAt
                          ? `Direccion verificada ${formatRelativeTime(emailVerifiedAt)}.`
                          : "Direccion principal para acceso y avisos."
                      }
                      label="Correo electronico"
                      value={<span className="break-all">{email}</span>}
                    />
                    <InfoField
                      action={
                        <ButtonLink href="/recuperar-contrasena" size="sm" variant="neutral">
                          Restablecer
                        </ButtonLink>
                      }
                      description="El acceso se mantiene protegido desde recuperacion por correo."
                      label="Acceso protegido"
                      value="Contrasena gestionada"
                    />
                    <InfoField
                      description="Canal principal activo para avisos del campus."
                      label="Avisos"
                      value={currentPreferenceTitle}
                    />
                  </div>
                </section>

                <div className="mt-5 grid gap-5 lg:grid-cols-2">
                  <section
                    className="rounded-[1.5rem] border border-[var(--color-border-subtle)] bg-white p-5 shadow-[0_10px_24px_-22px_rgba(18,42,61,0.22)] sm:p-6"
                    id="preferencias"
                  >
                    <div className="flex items-start gap-4">
                      <div className="grid h-14 w-14 place-items-center rounded-[1rem] bg-[rgba(243,242,252,0.92)] text-[var(--color-primary)]">
                        <Settings2 className="h-6 w-6" />
                      </div>
                      <div>
                        <h2 className="font-premium text-[1.65rem] font-semibold tracking-[-0.04em] text-[var(--color-ink)]">
                          Preferencias
                        </h2>
                        <p className="mt-1 text-base text-[var(--color-muted)]">
                          Notificaciones e idioma principal
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 space-y-3">
                      {notificationPreferenceOptions.map((option) => {
                        const isSelected =
                          notificationSnapshot.preference.emailEnabled === option.emailEnabled &&
                          notificationSnapshot.preference.webEnabled === option.webEnabled;

                        return (
                          <PreferenceRow isSelected={isSelected} key={option.title} option={option} />
                        );
                      })}
                    </div>

                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-[1rem] bg-[rgba(248,246,241,0.94)] px-4 py-3">
                        <p className="text-[0.72rem] font-medium tracking-[0.12em] text-[var(--color-muted)] uppercase">
                          Idioma
                        </p>
                        <p className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-ink)]">
                          <Languages className="h-4 w-4 text-[var(--color-primary)]" />
                          Espanol
                        </p>
                      </div>
                      <div className="rounded-[1rem] bg-[rgba(248,246,241,0.94)] px-4 py-3">
                        <p className="text-[0.72rem] font-medium tracking-[0.12em] text-[var(--color-muted)] uppercase">
                          Experiencia
                        </p>
                        <p className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-ink)]">
                          <Palette className="h-4 w-4 text-[var(--color-primary)]" />
                          Tema claro del campus
                        </p>
                      </div>
                    </div>
                  </section>

                  <section
                    className="rounded-[1.5rem] border border-[var(--color-border-subtle)] bg-white p-5 shadow-[0_10px_24px_-22px_rgba(18,42,61,0.22)] sm:p-6"
                    id="seguridad"
                  >
                    <div className="flex items-start gap-4">
                      <div className="grid h-14 w-14 place-items-center rounded-[1rem] bg-[rgba(243,242,252,0.92)] text-[var(--color-primary)]">
                        <Shield className="h-6 w-6" />
                      </div>
                      <div>
                        <h2 className="font-premium text-[1.65rem] font-semibold tracking-[-0.04em] text-[var(--color-ink)]">
                          Seguridad
                        </h2>
                        <p className="mt-1 text-base text-[var(--color-muted)]">
                          Correo, sesion actual y acceso
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 space-y-4">
                      <div className="rounded-[1rem] bg-[rgba(243,242,252,0.94)] px-4 py-4">
                        <p className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-ink)]">
                          <Mail className="h-4 w-4 text-[var(--color-primary)]" />
                          {emailVerifiedAt ? "Correo verificado" : "Correo principal activo"}
                        </p>
                        <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
                          {emailVerifiedAt
                            ? `Verificado ${formatRelativeTime(emailVerifiedAt)} para acceso y avisos.`
                            : "Disponible como direccion principal del campus privado."}
                        </p>
                      </div>

                      <div className="rounded-[1rem] border border-[var(--color-border-subtle)] bg-white px-4 py-4">
                        <p className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-ink)]">
                          <Monitor className="h-4 w-4 text-[var(--color-primary)]" />
                          {currentSession
                            ? getSessionDeviceLabel(currentSession.userAgent)
                            : "Sesion actual"}
                        </p>
                        <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
                          {currentSession
                            ? getSessionDescription(currentSession)
                            : "La navegacion actual aparecera aqui cuando exista trazabilidad adicional."}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-3">
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
                    </div>
                  </section>
                </div>
              </div>
            </div>

            <aside className="border-t border-[rgba(22,60,88,0.08)] bg-[linear-gradient(180deg,#fcfbf8_0%,#f8f6f1_100%)] p-5 sm:p-6 xl:border-t-0 xl:border-l xl:p-6">
              <section className="overflow-hidden rounded-[1.5rem] bg-[linear-gradient(180deg,#123d58_0%,#0b2b40_100%)] p-5 text-white shadow-[0_24px_50px_-28px_rgba(11,43,64,0.8)]">
                <p className="font-premium text-[2.15rem] leading-[1] font-semibold tracking-[-0.05em] text-white">
                  {overviewPanel.title}
                </p>
                <p className="mt-4 text-[2rem] leading-[1.02] font-semibold tracking-[-0.05em] text-white">
                  {overviewPanel.value}
                </p>
                <p className="mt-2 text-sm leading-6 text-white/72">{overviewPanel.detail}</p>

                {overviewPanel.progressPercent !== null ? (
                  <div className="mt-5">
                    <div className="h-2 overflow-hidden rounded-full bg-white/16">
                      <div
                        aria-hidden="true"
                        className="h-full rounded-full bg-[rgba(91,247,239,0.96)]"
                        style={{
                          width: `${Math.max(0, Math.min(100, overviewPanel.progressPercent))}%`,
                        }}
                      />
                    </div>
                  </div>
                ) : null}

                <div className="mt-5">
                  <p className="text-[0.74rem] font-medium tracking-[0.12em] text-white/58 uppercase">
                    {overviewPanel.sectionLabel}
                  </p>
                  <ul className="mt-3 space-y-3">
                    {overviewPanel.items.map((item) => (
                      <OverviewItem key={item} text={item} />
                    ))}
                  </ul>
                </div>

                {overviewPanel.actionHref && overviewPanel.actionLabel ? (
                  <ButtonLink
                    className="mt-5 w-full justify-between bg-white text-[var(--color-primary)] hover:bg-white hover:text-[var(--color-primary)] focus-visible:ring-white/55 focus-visible:ring-offset-[rgba(12,38,56,0.9)]"
                    href={overviewPanel.actionHref}
                    variant="neutral"
                  >
                    <span>{overviewPanel.actionLabel}</span>
                    <ArrowRight className="h-4 w-4" />
                  </ButtonLink>
                ) : null}
              </section>

              <section className="mt-5 rounded-[1.5rem] border border-[var(--color-border-subtle)] bg-white p-5 shadow-[0_10px_24px_-22px_rgba(18,42,61,0.22)]">
                <p className="text-[0.74rem] font-medium tracking-[0.12em] text-[var(--color-muted)] uppercase">
                  Accesos rapidos
                </p>

                <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-2">
                  {quickLinks.map((item) => (
                    <QuickAccessTile
                      badge={item.badge}
                      description={item.description}
                      href={item.href}
                      icon={item.icon}
                      key={item.title}
                      title={item.title}
                    />
                  ))}
                </div>

                <div className="mt-5 border-t border-[rgba(22,60,88,0.08)] pt-5">
                  <div className="rounded-[1rem] bg-[rgba(248,246,241,0.94)] px-4 py-3">
                    <p className="text-[0.72rem] font-medium tracking-[0.12em] text-[var(--color-muted)] uppercase">
                      Sesion actual
                    </p>
                    <p className="mt-2 text-sm font-semibold text-[var(--color-ink)]">
                      {currentSession
                        ? getSessionDeviceLabel(currentSession.userAgent)
                        : "Navegador actual"}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-[var(--color-muted)]">
                      {currentSession
                        ? currentSession.lastSeenAt
                          ? `Ultima actividad ${formatRelativeTime(currentSession.lastSeenAt)}`
                          : "Sesion iniciada hace poco."
                        : "La trazabilidad aparecera aqui cuando este disponible."}
                    </p>
                  </div>

                  <Link
                    className="mt-3 flex items-center justify-between rounded-[1rem] border border-[var(--color-border-subtle)] bg-[rgba(248,246,241,0.86)] px-4 py-3 text-sm font-semibold text-[var(--color-ink)] transition hover:border-[rgba(22,60,88,0.16)] hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"
                    href="/soporte"
                  >
                    <span>Soporte contextual</span>
                    <LifeBuoy className="h-4 w-4 text-[var(--color-primary)]" />
                  </Link>

                  {recentItems[0] ? (
                    <Link
                      className="mt-3 block rounded-[1rem] border border-[var(--color-border-subtle)] bg-white px-4 py-3 transition hover:border-[rgba(22,60,88,0.16)] hover:bg-[rgba(248,246,241,0.86)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"
                      href={recentItems[0].href}
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone={recentItems[0].sourceTone}>{recentItems[0].sourceLabel}</Badge>
                        <span className="text-[0.74rem] text-[var(--color-muted)]">
                          {formatRelativeTime(recentItems[0].createdAt)}
                        </span>
                      </div>
                      <p className="mt-3 text-sm font-semibold text-[var(--color-ink)]">
                        {recentItems[0].title}
                      </p>
                      <p className="mt-1 text-sm leading-6 text-[var(--color-muted)]">
                        {recentItems[0].description}
                      </p>
                    </Link>
                  ) : null}
                </div>
              </section>
            </aside>
          </div>
        </div>

        <footer className="mt-5 flex flex-col gap-3 border-t border-[rgba(22,60,88,0.08)] px-1 pt-4 text-sm text-[var(--color-muted)] sm:flex-row sm:items-center sm:justify-between">
          <p className="font-medium text-[var(--color-ink)]">Autismo Cordoba</p>
          <div className="flex flex-wrap items-center gap-4">
            <Link className="transition hover:text-[var(--color-primary)]" href="/legal">
              Legal y privacidad
            </Link>
            <Link className="transition hover:text-[var(--color-primary)]" href="/soporte">
              Soporte
            </Link>
          </div>
        </footer>
      </main>
    </div>
  );
}

export const accountQuickLinkIcons = {
  admin: Shield,
  courses: BookOpen,
  teaching: GraduationCap,
  forum: MessageSquareText,
  support: LifeBuoy,
  notifications: Bell,
};

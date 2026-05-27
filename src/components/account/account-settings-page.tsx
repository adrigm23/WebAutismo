import type { ReactNode } from "react";
import Link from "next/link";
import type { UserGlobalRole } from "@prisma/client";
import {
  ArrowUpRight,
  Bell,
  BookOpen,
  Eye,
  GraduationCap,
  Languages,
  LifeBuoy,
  Mail,
  MessageSquareText,
  Monitor,
  Palette,
  Shield,
  UserCircle2,
} from "lucide-react";
import { logoutEverywhereAction } from "@/actions/session";
import { updateNotificationPreferencesAction } from "@/actions/account";
import { AccountAuthHeader } from "@/components/account/account-auth-header";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionHeader } from "@/components/ui/section-header";
import { StateBanner } from "@/components/ui/state-banner";
import { SurfaceCard } from "@/components/ui/surface-card";
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

type AccountSettingsPageProps = {
  email: string;
  emailVerifiedAt: Date | null;
  firstName: string;
  fullName: string;
  globalRole: UserGlobalRole;
  isDemoUser: boolean;
  notificationSnapshot: DashboardNotificationSnapshot;
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

function getRoleDescription(role: UserGlobalRole) {
  if (role === "ADMIN") {
    return "Gestiona tus ajustes personales y entra en administracion solo cuando necesites operativa global.";
  }

  return role === "TEACHER"
    ? "Configura perfil, seguridad y avisos sin convertir esta zona en un segundo panel docente."
    : "Consulta perfil, seguridad y preferencias sin salir del recorrido privado.";
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

  return segments.join(" · ");
}

function buildRecentItems(snapshot: DashboardNotificationSnapshot) {
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

  return [...platformItems, ...forumItems]
    .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())
    .slice(0, 4);
}

function getNotificationPreferenceTitle(snapshot: DashboardNotificationSnapshot) {
  const currentOption = notificationPreferenceOptions.find(
    (option) =>
      option.emailEnabled === snapshot.preference.emailEnabled &&
      option.webEnabled === snapshot.preference.webEnabled,
  );

  return currentOption?.title ?? "Email y web";
}

function AccountValueTile(input: {
  label: string;
  value: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-[1.25rem] border border-[var(--color-border-subtle)] bg-white/82 px-4 py-4 shadow-[var(--shadow-xs)]",
        input.className,
      )}
    >
      <p className="text-meta-xs text-[var(--color-muted)]">{input.label}</p>
      <div className="mt-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-base font-semibold leading-6 text-[var(--color-ink)]">
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

function ContextStrip(input: {
  icon: typeof Languages;
  label: string;
  value: ReactNode;
  description: ReactNode;
}) {
  return (
    <div className="rounded-[1.2rem] border border-[var(--color-border-subtle)] bg-white/76 px-4 py-4 shadow-[var(--shadow-xs)]">
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-[0.95rem] bg-[var(--color-brand-soft)] text-[var(--color-primary)]">
          <input.icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-meta-xs text-[var(--color-muted)]">{input.label}</p>
          <p className="mt-2 text-sm font-semibold text-[var(--color-ink)]">{input.value}</p>
          <p className="mt-1.5 text-sm leading-6 text-[var(--color-muted)]">
            {input.description}
          </p>
        </div>
      </div>
    </div>
  );
}

function QuickLinkTile(input: QuickLinkItem) {
  return (
    <Link
      className="group rounded-[1.25rem] border border-[var(--color-border-subtle)] bg-[linear-gradient(180deg,rgba(255,255,255,0.96)_0%,rgba(248,246,241,0.96)_100%)] px-4 py-4 shadow-[var(--shadow-xs)] transition duration-[var(--motion-duration-base)] hover:-translate-y-[1px] hover:border-[var(--color-border-strong)] hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"
      href={input.href}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-[1rem] bg-[var(--color-brand-soft)] text-[var(--color-primary)] transition group-hover:scale-[1.02]">
          <input.icon className="h-5 w-5" />
        </div>
        <ArrowUpRight className="mt-1 h-4 w-4 shrink-0 text-[var(--color-primary)] transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      </div>
      <div className="mt-5">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold text-[var(--color-ink)]">{input.title}</p>
          {input.badge ? (
            <Badge shape="rounded" size="sm" tone="outline">
              {input.badge}
            </Badge>
          ) : null}
        </div>
        <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">{input.description}</p>
      </div>
    </Link>
  );
}

function SecurityStatusRow(input: {
  icon: typeof Shield;
  label: string;
  value: ReactNode;
  description: ReactNode;
}) {
  return (
    <div className="rounded-[1.15rem] border border-white/12 bg-white/8 px-4 py-4 backdrop-blur-sm">
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-[0.95rem] bg-white/10 text-white">
          <input.icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-[0.68rem] font-semibold tracking-[0.12em] text-white/58 uppercase">
            {input.label}
          </p>
          <p className="mt-2 text-sm font-semibold text-white">{input.value}</p>
          <p className="mt-1.5 text-sm leading-6 text-white/70">{input.description}</p>
        </div>
      </div>
    </div>
  );
}

function NotificationPreferenceCard(input: {
  isSelected: boolean;
  option: PreferenceOption;
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
          "w-full rounded-[1.25rem] border px-4 py-4 text-left transition duration-[var(--motion-duration-base)]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2",
          input.isSelected
            ? "border-[rgba(22,60,88,0.18)] bg-[linear-gradient(180deg,rgba(223,234,243,0.84)_0%,rgba(255,255,255,0.94)_100%)] shadow-[0_10px_22px_rgba(22,60,88,0.08)]"
            : "border-[var(--color-border-subtle)] bg-white/78 hover:border-[var(--color-border-strong)] hover:bg-white",
        )}
        type="submit"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[var(--color-ink)]">{input.option.title}</p>
            <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
              {input.option.description}
            </p>
          </div>
          <div
            aria-hidden="true"
            className={cn(
              "mt-1 grid h-5 w-5 shrink-0 place-items-center rounded-full border transition",
              input.isSelected
                ? "border-[var(--color-primary)] bg-[var(--color-primary)]"
                : "border-[rgba(22,60,88,0.2)] bg-white",
            )}
          >
            <div
              className={cn(
                "h-2 w-2 rounded-full transition",
                input.isSelected ? "bg-white" : "bg-transparent",
              )}
            />
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Badge tone={input.option.emailEnabled ? "brand" : "outline"}>Email</Badge>
          <Badge tone={input.option.webEnabled ? "brand" : "outline"}>Web</Badge>
          <Badge tone={input.isSelected ? "brand" : "outline"}>
            {input.isSelected ? "Activa" : "Disponible"}
          </Badge>
        </div>
      </button>
    </form>
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
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(223,234,243,0.72),transparent_32%),linear-gradient(180deg,#faf7f2_0%,#f5f4f8_54%,#fbf9f5_100%)] pb-16">
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
            description="Estas navegando con una cuenta de prueba. La vista refleja el rol actual, pero los cambios no se guardan."
            title="Modo demo activo"
            tone="warning"
          />
        ) : null}

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_19.5rem] xl:items-start">
          <div className="space-y-6">
            <section className="relative overflow-hidden rounded-[2rem] border border-[rgba(22,60,88,0.1)] bg-[linear-gradient(135deg,rgba(255,255,255,0.98)_0%,rgba(247,244,239,0.94)_56%,rgba(239,245,249,0.9)_100%)] px-5 py-5 shadow-[var(--shadow-medium)] sm:px-6 sm:py-6 lg:px-7">
              <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(22,60,88,0.18),transparent)]" />
              <div className="absolute -left-10 top-0 h-32 w-32 rounded-full bg-[rgba(223,234,243,0.7)] blur-3xl" />
              <div className="absolute right-0 top-6 h-40 w-40 rounded-full bg-[rgba(211,154,31,0.12)] blur-3xl" />

              <div className="relative grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(15.5rem,18rem)] lg:items-center">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={getRoleTone(globalRole)}>{roleLabel}</Badge>
                    <Badge tone="success">Cuenta activa</Badge>
                    {notificationSnapshot.unreadCount ? (
                      <Badge tone="outline">
                        {notificationSnapshot.unreadCount} avisos pendientes
                      </Badge>
                    ) : null}
                  </div>

                  <div className="mt-5 flex items-start gap-4">
                    <div className="grid h-16 w-16 shrink-0 place-items-center rounded-[1.35rem] border border-white/70 bg-white/78 text-lg font-semibold text-[var(--color-primary)] shadow-[0_14px_30px_rgba(22,60,88,0.08)]">
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <p className="text-meta-xs text-[var(--color-ink-soft)]">Hub de cuenta</p>
                      <h1 className="font-premium mt-2 text-display-xl font-semibold text-[var(--color-ink)] text-balance">
                        Hola, {firstName}
                      </h1>
                      <p className="mt-3 max-w-[60ch] text-body-sm text-[var(--color-muted)] sm:text-body-md">
                        {getRoleDescription(globalRole)}{" "}
                        {notificationSnapshot.unreadCount
                          ? `Hay ${notificationSnapshot.unreadCount} avisos por revisar cuando vuelvas al campus.`
                          : "Ahora mismo no tienes avisos pendientes."}
                      </p>
                      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm text-[var(--color-ink-soft)]">
                        <span className="inline-flex items-center gap-2">
                          <UserCircle2 className="h-4 w-4 text-[var(--color-primary)]" />
                          {roleLabel}
                        </span>
                        <span className="inline-flex items-center gap-2 break-all">
                          <Mail className="h-4 w-4 text-[var(--color-primary)]" />
                          {email}
                        </span>
                        <span className="inline-flex items-center gap-2">
                          <Shield className="h-4 w-4 text-[var(--color-primary)]" />
                          {emailVerifiedAt ? "Correo verificado" : "Correo principal activo"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="lg:pl-2">
                  <div className="rounded-[1.55rem] border border-[rgba(255,255,255,0.12)] bg-[linear-gradient(180deg,#163c58_0%,#0d2638_100%)] p-4 text-white shadow-[0_24px_54px_-28px_rgba(13,38,56,0.72)]">
                    <p className="text-[0.68rem] font-semibold tracking-[0.12em] text-white/60 uppercase">
                      Continuar
                    </p>
                    <p className="mt-2 text-lg font-semibold">{primaryCta.label}</p>
                    <p className="mt-2 text-sm leading-6 text-white/72">
                      Vuelve al recorrido privado sin convertir esta vista en un panel operativo.
                    </p>
                    <ButtonLink
                      className="mt-4 justify-between bg-white text-[var(--color-primary)] hover:bg-white hover:text-[var(--color-primary)] focus-visible:ring-white/60 focus-visible:ring-offset-[rgba(12,38,56,0.9)]"
                      href={primaryCta.href}
                      variant="neutral"
                    >
                      <span>{primaryCta.label}</span>
                      <ArrowUpRight className="h-4 w-4" />
                    </ButtonLink>
                    <Link
                      className="mt-3 inline-flex items-center gap-2 text-sm text-white/76 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[rgba(12,38,56,0.9)]"
                      href="/soporte"
                    >
                      Soporte contextual
                      <ArrowUpRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </div>
            </section>

            <SurfaceCard className="overflow-hidden p-0 lg:p-0" padding="md">
              <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_19rem]">
                <div className="p-5 lg:p-6">
                  <SectionHeader
                    description="Informacion principal de perfil y acceso organizada como una sola composicion, sin fragmentar la cuenta en tarjetas de relleno."
                    eyebrow="Cuenta"
                    size="md"
                    title="Perfil y acceso"
                  />

                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    <AccountValueTile
                      description="Nombre visible en el campus privado."
                      label="Nombre completo"
                      value={fullName}
                    />
                    <AccountValueTile
                      description={
                        emailVerifiedAt
                          ? `Direccion verificada ${formatRelativeTime(emailVerifiedAt)}.`
                          : "Direccion principal para acceso y avisos."
                      }
                      label="Correo de acceso"
                      value={<span className="break-all">{email}</span>}
                    />
                    <AccountValueTile
                      description="Rol actual asociado a esta cuenta dentro del campus."
                      label="Rol en el campus"
                      value={roleLabel}
                    />
                    <AccountValueTile
                      action={
                        <ButtonLink href="/recuperar-contrasena" size="sm" variant="neutral">
                          Restablecer
                        </ButtonLink>
                      }
                      description="El cambio de contrasena se resuelve por correo para mantener el flujo seguro y simple."
                      label="Acceso protegido"
                      value="Contrasena gestionada por recuperacion"
                    />
                  </div>
                </div>

                <div className="border-t border-[rgba(22,60,88,0.08)] bg-[linear-gradient(180deg,rgba(245,243,238,0.96)_0%,rgba(255,255,255,0.88)_100%)] p-5 lg:border-t-0 lg:border-l lg:p-6">
                  <p className="text-meta-xs text-[var(--color-primary)]">Resumen operativo</p>
                  <div className="mt-4 space-y-3">
                    <AccountValueTile
                      className="bg-white/88"
                      description="La cuenta esta disponible para uso privado."
                      label="Estado"
                      value="Cuenta activa"
                    />
                    <AccountValueTile
                      className="bg-white/88"
                      description="Canal principal seleccionado para avisos reales del campus."
                      label="Notificaciones"
                      value={currentPreferenceTitle}
                    />
                    <AccountValueTile
                      className="bg-white/88"
                      description={
                        currentSession
                          ? `Sesion actual en ${getSessionDeviceLabel(currentSession.userAgent)}.`
                          : "La navegacion actual seguira apareciendo aqui."
                      }
                      label="Sesion actual"
                      value={currentSession ? "Acceso en curso" : "Sin detalle adicional"}
                    />
                  </div>
                </div>
              </div>
            </SurfaceCard>

            <SurfaceCard padding="md">
              <SectionHeader
                description="Preferencias reales disponibles hoy, con mas densidad util y menos bloques aislados."
                eyebrow="Preferencias"
                size="md"
                title="Notificaciones y experiencia"
              />

              <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1.02fr)_minmax(0,0.98fr)]">
                <div className="space-y-3">
                  <p className="text-meta-xs font-semibold text-[var(--color-muted)]">Canal de avisos</p>
                  {notificationPreferenceOptions.map((option) => {
                    const isSelected =
                      notificationSnapshot.preference.emailEnabled === option.emailEnabled &&
                      notificationSnapshot.preference.webEnabled === option.webEnabled;

                    return (
                      <NotificationPreferenceCard
                        isSelected={isSelected}
                        key={option.title}
                        option={option}
                      />
                    );
                  })}
                </div>

                <div className="rounded-[1.6rem] border border-[var(--color-border-subtle)] bg-[linear-gradient(180deg,rgba(255,255,255,0.94)_0%,rgba(247,244,239,0.92)_100%)] p-4 lg:p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-meta-xs text-[var(--color-primary)]">Contexto del campus</p>
                      <h3 className="mt-2 text-heading-md font-semibold text-[var(--color-ink)]">
                        Preferencias del entorno privado
                      </h3>
                    </div>
                    <Badge tone="outline">Sin duplicar ajustes</Badge>
                  </div>

                  <div className="mt-4 space-y-3">
                    <ContextStrip
                      description="La interfaz privada se sirve en espanol para esta cuenta."
                      icon={Languages}
                      label="Idioma"
                      value="Espanol (Espana)"
                    />
                    <ContextStrip
                      description="Todavia no hay ajustes personales guardados para contraste, zoom o reduccion de movimiento."
                      icon={Eye}
                      label="Accesibilidad"
                      value="Preferencias globales del campus"
                    />
                    <ContextStrip
                      description="La zona privada mantiene un unico tema visual para no fragmentar la experiencia."
                      icon={Palette}
                      label="Visual"
                      value="Tema claro del campus"
                    />
                  </div>
                </div>
              </div>
            </SurfaceCard>

            <SurfaceCard padding="md">
              <SectionHeader
                actions={
                  hasOtherSessions ? (
                    <form action={logoutEverywhereAction}>
                      <Button size="sm" type="submit" variant="neutral">
                        Cerrar todas las sesiones
                      </Button>
                    </form>
                  ) : null
                }
                description="Visibilidad del acceso actual sin convertir esta pantalla en tu home operativa."
                eyebrow="Sesiones"
                size="md"
                title="Dispositivos activos"
              />

              <div className="mt-5">
                {sessions.length ? (
                  <div className="divide-y divide-[rgba(22,60,88,0.08)] rounded-[1.4rem] border border-[var(--color-border-subtle)] bg-white/82 px-4">
                    {sessions.map((session) => (
                      <div
                        className="flex flex-col gap-3 py-4 sm:flex-row sm:items-start sm:justify-between"
                        key={session.id}
                      >
                        <div className="flex min-w-0 items-start gap-3">
                          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-[0.95rem] bg-[var(--color-brand-soft)] text-[var(--color-primary)]">
                            <Monitor className="h-5 w-5" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-[var(--color-ink)]">
                              {getSessionDeviceLabel(session.userAgent)}
                            </p>
                            <p className="mt-1 text-sm leading-6 text-[var(--color-muted)]">
                              {getSessionDescription(session)}
                            </p>
                          </div>
                        </div>
                        <Badge
                          className="self-start"
                          tone={session.isCurrent ? "brand" : "outline"}
                        >
                          {session.isCurrent ? "Actual" : "Activa"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    className="px-5 py-6"
                    description="La sesion actual seguira visible aqui cuando exista trazabilidad adicional de acceso."
                    title="Sin sesiones adicionales"
                    tone="subtle"
                  />
                )}
              </div>
            </SurfaceCard>
          </div>

          <aside className="space-y-4 xl:sticky xl:top-28 xl:self-start">
            <section className="overflow-hidden rounded-[1.75rem] bg-[linear-gradient(180deg,#163c58_0%,#0c2638_100%)] p-5 text-white shadow-[0_28px_60px_-28px_rgba(12,38,56,0.76)]">
              <p className="text-[0.68rem] font-semibold tracking-[0.12em] text-white/58 uppercase">
                Estado de acceso
              </p>
              <h2 className="font-premium mt-3 text-display-md font-semibold text-white">
                Seguridad y sesion actual
              </h2>
              <p className="mt-2 text-sm leading-6 text-white/70">
                Panel compacto con el estado real de la cuenta, sin widgets de relleno.
              </p>

              <div className="mt-5 space-y-3">
                <SecurityStatusRow
                  description={
                    emailVerifiedAt
                      ? `Correo verificado ${formatRelativeTime(emailVerifiedAt)}.`
                      : "Correo principal listo para acceso y avisos."
                  }
                  icon={Mail}
                  label="Correo"
                  value={emailVerifiedAt ? "Verificado" : "Principal"}
                />
                <SecurityStatusRow
                  description={
                    currentSession
                      ? getSessionDescription(currentSession)
                      : "La navegacion actual seguira apareciendo aqui."
                  }
                  icon={Monitor}
                  label="Sesion actual"
                  value={
                    currentSession
                      ? getSessionDeviceLabel(currentSession.userAgent)
                      : "Navegador actual"
                  }
                />
                <SecurityStatusRow
                  description={
                    hasOtherSessions
                      ? "Hay otras sesiones activas y puedes cerrarlas desde aqui."
                      : "Solo detectamos esta sesion activa en este momento."
                  }
                  icon={Shield}
                  label="Sesiones"
                  value={`${sessions.length || 1} activas`}
                />
              </div>

              <div className="mt-5 grid gap-2">
                <ButtonLink
                  className="border-white/14 bg-white/10 text-white hover:bg-white/16 hover:text-white"
                  href="/recuperar-contrasena"
                  variant="neutral"
                >
                  Restablecer contrasena
                </ButtonLink>
                {hasOtherSessions ? (
                  <form action={logoutEverywhereAction}>
                    <Button
                      className="w-full border-white/14 bg-white/10 text-white hover:bg-white/16 hover:text-white"
                      type="submit"
                      variant="neutral"
                    >
                      Cerrar otras sesiones
                    </Button>
                  </form>
                ) : null}
              </div>
            </section>

            <SurfaceCard padding="md">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-meta-xs text-[var(--color-primary)]">Rutas utiles</p>
                  <h2 className="mt-2 text-heading-md font-semibold text-[var(--color-ink)]">
                    Accesos rapidos
                  </h2>
                </div>
                <Badge tone="outline">Directos</Badge>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-2">
                {quickLinks.map((item) => (
                  <QuickLinkTile
                    badge={item.badge}
                    description={item.description}
                    href={item.href}
                    icon={item.icon}
                    key={item.title}
                    title={item.title}
                  />
                ))}
              </div>
            </SurfaceCard>

            <SurfaceCard padding="md" variant="muted">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-meta-xs text-[var(--color-primary)]">Soporte</p>
                  <h2 className="mt-2 text-heading-md font-semibold text-[var(--color-ink)]">
                    Ayuda y avisos
                  </h2>
                </div>
                {notificationSnapshot.unreadCount ? (
                  <Badge tone="brand">{notificationSnapshot.unreadCount} sin leer</Badge>
                ) : null}
              </div>

              <Link
                className="mt-4 flex items-center justify-between rounded-[1.15rem] border border-[var(--color-border-subtle)] bg-white/82 px-4 py-3 text-sm font-semibold text-[var(--color-ink)] transition hover:-translate-y-[1px] hover:border-[var(--color-border-strong)] hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"
                href="/soporte"
              >
                <span>Abrir soporte del campus</span>
                <ArrowUpRight className="h-4 w-4 text-[var(--color-primary)]" />
              </Link>

              <div className="mt-4 space-y-3">
                {recentItems.length ? (
                  recentItems.slice(0, 2).map((item) => (
                    <Link
                      className="block rounded-[1.15rem] border border-[var(--color-border-subtle)] bg-white/76 px-4 py-3 transition hover:-translate-y-[1px] hover:border-[var(--color-border-strong)] hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"
                      href={item.href}
                      key={item.id}
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone={item.sourceTone}>{item.sourceLabel}</Badge>
                        <span className="text-meta-xs text-[var(--color-muted)]">
                          {formatRelativeTime(item.createdAt)}
                        </span>
                      </div>
                      <p className="mt-3 text-sm font-semibold text-[var(--color-ink)]">
                        {item.title}
                      </p>
                      <p className="mt-1.5 text-sm leading-6 text-[var(--color-muted)]">
                        {item.description}
                      </p>
                    </Link>
                  ))
                ) : (
                  <div className="rounded-[1.15rem] border border-[var(--color-border-subtle)] bg-white/76 px-4 py-4">
                    <p className="text-sm font-semibold text-[var(--color-ink)]">
                      Sin avisos recientes
                    </p>
                    <p className="mt-1.5 text-sm leading-6 text-[var(--color-muted)]">
                      Cuando haya movimiento en la plataforma o el foro, aparecera aqui en formato compacto.
                    </p>
                  </div>
                )}
              </div>
            </SurfaceCard>
          </aside>
        </div>
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

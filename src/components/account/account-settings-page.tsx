import type { ReactNode } from "react";
import Link from "next/link";
import type { UserGlobalRole } from "@prisma/client";
import {
  ArrowUpRight,
  Bell,
  BookOpen,
  Eye,
  GraduationCap,
  KeyRound,
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
import { ListRow } from "@/components/ui/list-row";
import { SectionHeader } from "@/components/ui/section-header";
import { StateBanner } from "@/components/ui/state-banner";
import { SurfaceCard } from "@/components/ui/surface-card";
import type { DashboardNotificationSnapshot } from "@/lib/account-dashboard";
import { resolvePlatformNotificationHref } from "@/lib/course-navigation";
import { getGlobalRoleLabel } from "@/lib/course-permissions";
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
    return "Gestiona seguridad, preferencias y accesos internos del campus.";
  }

  return role === "TEACHER"
    ? "Revisa tus ajustes, sesiones activas y accesos docentes sin duplicar la operativa del campus."
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

function LinkListRow(input: {
  href: string;
  title: string;
  description: string;
  leading: ReactNode;
  badge?: string;
}) {
  return (
    <Link
      className="block rounded-[var(--radius-md)] transition hover:-translate-y-[1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"
      href={input.href}
    >
      <ListRow
        description={input.description}
        leading={input.leading}
        title={input.title}
        trailing={
          <div className="flex items-center gap-3">
            {input.badge ? <Badge tone="outline">{input.badge}</Badge> : null}
            <ArrowUpRight className="h-4 w-4 text-[var(--color-primary)]" />
          </div>
        }
      />
    </Link>
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
          "w-full rounded-[var(--radius-md)] border px-4 py-4 text-left transition duration-[var(--motion-duration-base)]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2",
          input.isSelected
            ? "border-[var(--color-primary)] bg-[var(--color-brand-soft)]"
            : "border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] hover:border-[var(--color-border-strong)] hover:bg-white",
        )}
        type="submit"
      >
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-[var(--color-ink)]">{input.option.title}</p>
          <Badge tone={input.isSelected ? "brand" : "outline"}>
            {input.isSelected ? "Activa" : "Disponible"}
          </Badge>
        </div>
        <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
          {input.option.description}
        </p>
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
  const navItems = [
    { label: "Mis cursos", href: "/mis-cursos" },
    { label: "Mi cuenta", href: "/mi-cuenta", active: true },
  ];
  const currentSession = sessions.find((session) => session.isCurrent) ?? sessions[0] ?? null;
  const hasOtherSessions = sessions.some((session) => !session.isCurrent);

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#faf7f2_0%,#f6f7fa_50%,#fbf9f5_100%)] pb-24">
      <AccountAuthHeader
        fullName={fullName}
        initials={initials}
        navItems={navItems}
        roleLabel={roleLabel}
      />

      <main className="site-container pt-8">
        {isDemoUser ? (
          <StateBanner
            className="mb-6"
            description="Estas navegando con una cuenta de prueba. La vista refleja el rol actual, pero los cambios no se guardan."
            title="Modo demo activo"
            tone="warning"
          />
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="space-y-6">
            <SurfaceCard padding="md">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={getRoleTone(globalRole)}>{roleLabel}</Badge>
                    <Badge tone="success">Cuenta activa</Badge>
                    {notificationSnapshot.unreadCount ? (
                      <Badge tone="brand">
                        {notificationSnapshot.unreadCount} avisos sin leer
                      </Badge>
                    ) : null}
                  </div>

                  <h1 className="font-premium mt-4 text-display-md font-semibold text-[var(--color-ink)]">
                    Hola, {firstName}
                  </h1>
                  <p className="mt-3 max-w-[68ch] text-body-sm text-[var(--color-muted)]">
                    {getRoleDescription(globalRole)}
                  </p>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <ListRow
                      className="h-full"
                      description="Nombre principal de la cuenta."
                      eyebrow="Perfil"
                      title={fullName}
                    />
                    <ListRow
                      className="h-full"
                      description="Correo principal para acceso y avisos."
                      eyebrow="Correo"
                      title={email}
                    />
                    <ListRow
                      className="h-full"
                      description="Rol actual dentro del campus."
                      eyebrow="Rol"
                      title={roleLabel}
                    />
                    <ListRow
                      className="h-full"
                      description={
                        emailVerifiedAt
                          ? `Correo verificado ${formatRelativeTime(emailVerifiedAt)}`
                          : "Cuenta lista para usar en la zona privada."
                      }
                      eyebrow="Estado"
                      title="Acceso operativo"
                    />
                  </div>
                </div>

                <div className="flex shrink-0 flex-wrap gap-3">
                  <ButtonLink href={primaryCta.href}>{primaryCta.label}</ButtonLink>
                  <ButtonLink href="/soporte" variant="subtle">
                    Soporte
                  </ButtonLink>
                </div>
              </div>
            </SurfaceCard>

            <SurfaceCard padding="md">
              <SectionHeader
                description="Datos de cuenta, acceso y seguridad resueltos con acciones reales del producto."
                eyebrow="Cuenta"
                size="md"
                title="Perfil y acceso"
              />

              <div className="mt-5 space-y-3">
                <ListRow
                  description="Los datos personales visibles en esta fase son informativos y no duplican un editor separado."
                  eyebrow="Perfil"
                  leading={
                    <div className="grid h-10 w-10 place-items-center rounded-[var(--radius-md)] bg-[var(--color-brand-soft)] text-[var(--color-primary)]">
                      <UserCircle2 className="h-5 w-5" />
                    </div>
                  }
                  title={fullName}
                  trailing={<Badge tone="outline">Informativo</Badge>}
                />
                <ListRow
                  description={
                    emailVerifiedAt
                      ? "Direccion principal verificada para acceso y comunicaciones."
                      : "Direccion principal usada para acceso y avisos."
                  }
                  eyebrow="Correo"
                  leading={
                    <div className="grid h-10 w-10 place-items-center rounded-[var(--radius-md)] bg-[var(--color-brand-soft)] text-[var(--color-primary)]">
                      <Mail className="h-5 w-5" />
                    </div>
                  }
                  title={email}
                  trailing={
                    <Badge tone={emailVerifiedAt ? "success" : "outline"}>
                      {emailVerifiedAt ? "Verificado" : "Principal"}
                    </Badge>
                  }
                />
                <ListRow
                  description="Si necesitas actualizarla, el flujo seguro disponible usa restablecimiento por correo."
                  eyebrow="Contrasena"
                  leading={
                    <div className="grid h-10 w-10 place-items-center rounded-[var(--radius-md)] bg-[var(--color-brand-soft)] text-[var(--color-primary)]">
                      <KeyRound className="h-5 w-5" />
                    </div>
                  }
                  title="Acceso protegido"
                  trailing={
                    <ButtonLink href="/recuperar-contrasena" size="sm" variant="neutral">
                      Restablecer
                    </ButtonLink>
                  }
                />
                <ListRow
                  description={
                    currentSession
                      ? `Sesion actual en ${getSessionDeviceLabel(currentSession.userAgent)}.`
                      : "No hay detalle adicional de seguridad para mostrar en esta cuenta."
                  }
                  eyebrow="Seguridad"
                  leading={
                    <div className="grid h-10 w-10 place-items-center rounded-[var(--radius-md)] bg-[var(--color-brand-soft)] text-[var(--color-primary)]">
                      <Shield className="h-5 w-5" />
                    </div>
                  }
                  title={`${sessions.length || 1} sesiones activas`}
                  trailing={<Badge tone="brand">Sesiones</Badge>}
                />
                <ListRow
                  description={
                    hasOtherSessions
                      ? "Puedes cerrar todas las sesiones abiertas y volver a entrar con un unico estado limpio."
                      : "Solo detectamos la sesion actual abierta en este momento."
                  }
                  eyebrow="Sesiones activas"
                  leading={
                    <div className="grid h-10 w-10 place-items-center rounded-[var(--radius-md)] bg-[var(--color-brand-soft)] text-[var(--color-primary)]">
                      <Monitor className="h-5 w-5" />
                    </div>
                  }
                  title={currentSession ? getSessionDeviceLabel(currentSession.userAgent) : "Sesion actual"}
                  trailing={
                    hasOtherSessions ? (
                      <form action={logoutEverywhereAction}>
                        <Button size="sm" type="submit" variant="subtle">
                          Cerrar todas
                        </Button>
                      </form>
                    ) : (
                      <Badge tone="outline">Actual</Badge>
                    )
                  }
                />
              </div>
            </SurfaceCard>

            <SurfaceCard padding="md">
              <SectionHeader
                description="Preferencias reales disponibles hoy y ajustes del sistema visibles sin crear controles falsos."
                eyebrow="Preferencias"
                size="md"
                title="Notificaciones e interfaz"
              />

              <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
                <div className="space-y-3">
                  <p className="text-meta-xs font-semibold text-[var(--color-muted)]">
                    Notificaciones
                  </p>
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

                <div className="space-y-3">
                  <ListRow
                    description="La interfaz privada se sirve en espanol para esta cuenta."
                    eyebrow="Idioma"
                    leading={
                      <div className="grid h-10 w-10 place-items-center rounded-[var(--radius-md)] bg-[var(--color-brand-soft)] text-[var(--color-primary)]">
                        <Languages className="h-5 w-5" />
                      </div>
                    }
                    title="Espanol (Espana)"
                    trailing={<Badge tone="outline">Sistema</Badge>}
                  />
                  <ListRow
                    description="No hay ajustes personales guardados todavia para contraste, zoom o reduccion de movimiento."
                    eyebrow="Accesibilidad"
                    leading={
                      <div className="grid h-10 w-10 place-items-center rounded-[var(--radius-md)] bg-[var(--color-brand-soft)] text-[var(--color-primary)]">
                        <Eye className="h-5 w-5" />
                      </div>
                    }
                    title="Preferencias globales del campus"
                    trailing={<Badge tone="outline">Informativo</Badge>}
                  />
                  <ListRow
                    description="La zona privada mantiene un unico tema visual para evitar configuraciones paralelas."
                    eyebrow="Preferencias visuales"
                    leading={
                      <div className="grid h-10 w-10 place-items-center rounded-[var(--radius-md)] bg-[var(--color-brand-soft)] text-[var(--color-primary)]">
                        <Palette className="h-5 w-5" />
                      </div>
                    }
                    title="Tema claro del campus"
                    trailing={<Badge tone="outline">Actual</Badge>}
                  />
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
                description="Visibilidad del acceso actual sin convertir esta pagina en un panel operativo."
                eyebrow="Sesiones"
                size="md"
                title="Dispositivos activos"
              />

              <div className="mt-5 space-y-3">
                {sessions.length ? (
                  sessions.map((session) => (
                    <ListRow
                      description={getSessionDescription(session)}
                      key={session.id}
                      leading={
                        <div className="grid h-10 w-10 place-items-center rounded-[var(--radius-md)] bg-[var(--color-brand-soft)] text-[var(--color-primary)]">
                          <Monitor className="h-5 w-5" />
                        </div>
                      }
                      title={getSessionDeviceLabel(session.userAgent)}
                      trailing={
                        <Badge tone={session.isCurrent ? "brand" : "outline"}>
                          {session.isCurrent ? "Actual" : "Activa"}
                        </Badge>
                      }
                    />
                  ))
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

          <aside className="space-y-6 xl:sticky xl:top-28 xl:self-start">
            <SurfaceCard padding="md">
              <SectionHeader
                description="Rutas secundarias para volver al campus, al foro o al soporte sin cargar un dashboard paralelo."
                eyebrow="Accesos rapidos"
                size="md"
                title="Ir a"
              />

              <div className="mt-5 space-y-3">
                {quickLinks.map((item) => (
                  <LinkListRow
                    badge={item.badge}
                    description={item.description}
                    href={item.href}
                    key={item.title}
                    leading={
                      <div className="grid h-10 w-10 place-items-center rounded-[var(--radius-md)] bg-[var(--color-brand-soft)] text-[var(--color-primary)]">
                        <item.icon className="h-5 w-5" />
                      </div>
                    }
                    title={item.title}
                  />
                ))}
              </div>
            </SurfaceCard>

            <SurfaceCard padding="md">
              <SectionHeader
                actions={
                  notificationSnapshot.unreadCount ? (
                    <Badge tone="brand">{notificationSnapshot.unreadCount} sin leer</Badge>
                  ) : null
                }
                description="Actividad reciente del campus y del foro mostrada en formato compacto."
                eyebrow="Notificaciones"
                size="md"
                title="Avisos recientes"
              />

              <div className="mt-5 space-y-3">
                {recentItems.length ? (
                  recentItems.map((item) => (
                    <Link
                      className="block rounded-[var(--radius-md)] transition hover:-translate-y-[1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"
                      href={item.href}
                      key={item.id}
                    >
                      <ListRow
                        description={item.description}
                        eyebrow={
                          <span className="inline-flex flex-wrap items-center gap-2">
                            <Badge tone={item.sourceTone}>{item.sourceLabel}</Badge>
                            <span className="text-meta-xs text-[var(--color-muted)]">
                              {formatRelativeTime(item.createdAt)}
                            </span>
                          </span>
                        }
                        title={item.title}
                      />
                    </Link>
                  ))
                ) : (
                  <EmptyState
                    className="px-5 py-6"
                    description="Cuando haya avisos de plataforma o movimiento del foro, apareceran aqui."
                    title="Sin actividad reciente"
                    tone="subtle"
                  />
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

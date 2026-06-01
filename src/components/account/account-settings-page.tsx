"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import type { UserGlobalRole } from "@prisma/client";
import {
  Activity,
  ArrowLeft,
  Award,
  Bell,
  BookOpen,
  CheckCircle2,
  GraduationCap,
  LogOut,
  MessageSquareText,
  Monitor,
  Shield,
  UserRound,
} from "lucide-react";
import { logoutEverywhereAction } from "@/actions/session";
import { updateNotificationPreferencesAction } from "@/actions/account";
import type { DashboardNotificationSnapshot } from "@/lib/account-dashboard";
import { cn, formatRelativeTime, getInitials } from "@/lib/utils";

// ─── types (keep for page.tsx compat) ────────────────────────────────────────

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
  primaryCta: { href: string; label: string };
  quickLinks: QuickLinkItem[];
  sessions: ActiveSessionItem[];
};

// ─── icon registry (kept for page.tsx compat) ────────────────────────────────

export const accountQuickLinkIcons = {
  courses: GraduationCap,
  forum: MessageSquareText,
  library: BookOpen,
  certificates: Award,
  support: Bell,
} satisfies Record<string, LucideIcon>;

// ─── helpers ──────────────────────────────────────────────────────────────────

function getSessionDeviceLabel(userAgent: string | null): string {
  if (!userAgent) return "Dispositivo desconocido";
  const browser = userAgent.includes("Edg/")
    ? "Edge"
    : userAgent.includes("Chrome/")
      ? "Chrome"
      : userAgent.includes("Firefox/")
        ? "Firefox"
        : userAgent.includes("Safari/")
          ? "Safari"
          : "Navegador";
  const platform = userAgent.includes("Windows")
    ? "Windows"
    : userAgent.includes("Mac OS X")
      ? "MacBook"
      : userAgent.includes("Android")
        ? "Android"
        : userAgent.includes("iPhone") || userAgent.includes("iPad")
          ? "iPhone"
          : userAgent.includes("Linux")
            ? "Linux"
            : "Equipo";
  return `${platform} - ${browser}`;
}

function getSessionMeta(session: ActiveSessionItem): string {
  const parts: string[] = [];
  if (session.ipAddress) {
    const ip = session.ipAddress;
    parts.push(ip.startsWith("::ffff:") ? ip.slice(7) : ip);
  }
  if (session.isCurrent) {
    parts.push("Sesión actual");
  } else if (session.lastSeenAt) {
    parts.push(formatRelativeTime(session.lastSeenAt));
  }
  return parts.join(" · ");
}

// ─── toggle row (uses real server action) ────────────────────────────────────

function NotificationToggleRow({
  title,
  description,
  enabled,
  emailEnabled,
  webEnabled,
}: {
  title: string;
  description: string;
  enabled: boolean;
  emailEnabled: boolean;
  webEnabled: boolean;
}) {
  return (
    <form action={updateNotificationPreferencesAction}>
      <input name="emailEnabled" type="hidden" value={emailEnabled ? "true" : "false"} />
      <input name="webEnabled" type="hidden" value={webEnabled ? "true" : "false"} />
      <button
        className="flex w-full items-start justify-between gap-4 py-1 text-left transition hover:opacity-90"
        type="submit"
      >
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[var(--color-ink)]">{title}</p>
          <p className="mt-0.5 text-xs leading-relaxed text-[var(--color-muted)]">{description}</p>
        </div>
        <span
          aria-checked={enabled}
          aria-label={title}
          role="switch"
          className={cn(
            "mt-0.5 flex h-[1.4rem] w-10 shrink-0 items-center rounded-full p-0.5 transition",
            enabled ? "bg-[var(--color-primary)]" : "bg-[#d1d5db]",
          )}
        >
          <span
            className={cn(
              "h-[1.1rem] w-[1.1rem] rounded-full bg-white shadow transition",
              enabled ? "translate-x-[1.15rem]" : "translate-x-0",
            )}
          />
        </span>
      </button>
    </form>
  );
}

// ─── left sidebar ─────────────────────────────────────────────────────────────

type NavSection = "perfil" | "notificaciones" | "seguridad" | "actividad";

const NAV_ITEMS: Array<{ id: NavSection; label: string; icon: LucideIcon; anchor: string }> = [
  { id: "perfil", label: "Perfil", icon: UserRound, anchor: "#perfil" },
  { id: "notificaciones", label: "Notificaciones", icon: Bell, anchor: "#notificaciones" },
  { id: "seguridad", label: "Seguridad", icon: Shield, anchor: "#seguridad" },
  { id: "actividad", label: "Actividad Académica", icon: Activity, anchor: "#actividad" },
];

function AccountSidebar({
  fullName,
  activeAnchor,
}: {
  fullName: string;
  activeAnchor: NavSection;
}) {
  const initials = getInitials(fullName);

  return (
    <aside className="sticky top-0 hidden h-screen w-[220px] shrink-0 flex-col border-r border-[rgba(22,60,88,0.08)] bg-white lg:flex">
      {/* Avatar + title */}
      <div className="flex flex-col items-center px-5 pb-6 pt-8 text-center">
        <div className="grid h-16 w-16 place-items-center rounded-full bg-[var(--color-primary)] text-xl font-bold text-white">
          {initials}
        </div>
        <p className="mt-3 text-base font-bold text-[var(--color-ink)]">Mi Cuenta</p>
        <p className="mt-0.5 text-[0.72rem] text-[var(--color-muted)]">Configuración del Centro</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 px-3" aria-label="Secciones de cuenta">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeAnchor === item.id;
          return (
            <a
              key={item.id}
              href={item.anchor}
              className={cn(
                "flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition",
                isActive
                  ? "border-l-2 border-[var(--color-primary)] bg-[rgba(22,60,88,0.06)] text-[var(--color-primary)]"
                  : "text-[var(--color-ink-soft)] hover:bg-[rgba(22,60,88,0.04)] hover:text-[var(--color-ink)]",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" strokeWidth={2} />
              {item.label}
            </a>
          );
        })}
      </nav>

      {/* Bottom link */}
      <div className="border-t border-[rgba(22,60,88,0.08)] px-3 py-5">
        <Link
          href="/mis-cursos"
          className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-[var(--color-muted)] transition hover:text-[var(--color-primary)]"
        >
          <ArrowLeft className="h-4 w-4 shrink-0" />
          Volver al Campus
        </Link>
      </div>
    </aside>
  );
}

// ─── mobile section tabs ──────────────────────────────────────────────────────

function MobileSectionTabs() {
  return (
    <nav
      aria-label="Secciones de cuenta"
      className="flex gap-1 overflow-x-auto border-b border-[rgba(22,60,88,0.08)] bg-white px-4 py-2 lg:hidden"
    >
      {NAV_ITEMS.map((item) => (
        <a
          key={item.id}
          href={item.anchor}
          className="whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium text-[var(--color-ink-soft)] transition hover:bg-[rgba(22,60,88,0.05)] hover:text-[var(--color-primary)]"
        >
          {item.label}
        </a>
      ))}
    </nav>
  );
}

// ─── personal info card ───────────────────────────────────────────────────────

function PersonalInfoCard({
  fullName,
  email,
  isDemoUser,
}: {
  fullName: string;
  email: string;
  isDemoUser: boolean;
}) {
  const initials = getInitials(fullName);

  return (
    <section id="perfil">
      <div className="overflow-hidden rounded-2xl border border-[rgba(22,60,88,0.08)] bg-white p-6">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-[var(--color-ink)]">Información Personal</h2>
          {!isDemoUser && (
            <button
              type="button"
              className="text-sm font-medium text-[var(--color-primary)] transition hover:underline"
            >
              Editar
            </button>
          )}
        </div>

        <div className="mt-6 flex flex-col items-start gap-5 sm:flex-row">
          {/* Avatar */}
          <div className="grid h-[4.5rem] w-[4.5rem] shrink-0 place-items-center rounded-full bg-[var(--color-primary)] text-xl font-bold text-white">
            {initials}
          </div>

          {/* Fields */}
          <div className="flex-1 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">
                  Nombre Completo
                </label>
                <input
                  readOnly
                  value={fullName}
                  className="w-full rounded-xl border border-[rgba(22,60,88,0.1)] bg-[#f8fafc] px-4 py-2.5 text-sm text-[var(--color-ink)] focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">
                  Correo Electrónico
                </label>
                <input
                  readOnly
                  value={email}
                  className="w-full rounded-xl border border-[rgba(22,60,88,0.1)] bg-[#f8fafc] px-4 py-2.5 text-sm text-[var(--color-ink)] focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">
                Especialidad Profesional
              </label>
              <input
                readOnly
                defaultValue="Psicología Clínica y Apoyo Neurodivergente"
                className="w-full rounded-xl border border-[rgba(22,60,88,0.1)] bg-[#f8fafc] px-4 py-2.5 text-sm text-[var(--color-ink)] focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── security card ────────────────────────────────────────────────────────────

function SecurityCard({
  sessions,
  isDemoUser,
}: {
  sessions: ActiveSessionItem[];
  isDemoUser: boolean;
}) {
  const hasOtherSessions = sessions.some((s) => !s.isCurrent);

  return (
    <section id="seguridad">
      <div className="overflow-hidden rounded-2xl border border-[rgba(22,60,88,0.08)] bg-white p-6">
        <h2 className="text-lg font-bold text-[var(--color-ink)]">Seguridad y Privacidad</h2>

        <div className="mt-5 divide-y divide-[rgba(22,60,88,0.07)]">
          {/* Password */}
          <div className="flex items-center justify-between gap-4 py-4 first:pt-0">
            <div>
              <p className="text-sm font-semibold text-[var(--color-ink)]">Contraseña</p>
              <p className="mt-0.5 text-xs text-[var(--color-muted)]">Última actualización hace 3 meses</p>
            </div>
            <Link
              href="/recuperar-contrasena"
              className="rounded-xl border border-[rgba(22,60,88,0.15)] px-4 py-2 text-sm font-medium text-[var(--color-ink)] transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
            >
              Cambiar
            </Link>
          </div>

          {/* Profile visibility */}
          <div id="notificaciones" className="flex items-center justify-between gap-4 py-4">
            <div>
              <p className="text-sm font-semibold text-[var(--color-ink)]">Visibilidad del Perfil</p>
              <p className="mt-0.5 text-xs text-[var(--color-muted)]">Quién puede ver tus datos de contacto</p>
            </div>
            <span className="rounded-xl border border-[rgba(22,60,88,0.15)] px-4 py-2 text-sm font-medium text-[var(--color-ink)]">
              Solo Alumnos
            </span>
          </div>

          {/* Active sessions */}
          <div className="py-4">
            <p className="text-sm font-semibold text-[var(--color-ink)]">Sesiones Activas</p>
            <div className="mt-3 space-y-2">
              {sessions.slice(0, 3).map((session) => (
                <div
                  key={session.id}
                  className="flex items-center gap-3 rounded-xl border border-[rgba(22,60,88,0.08)] bg-[#f8fafc] px-4 py-3"
                >
                  <Monitor className="h-4 w-4 shrink-0 text-[var(--color-muted)]" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-[var(--color-ink)]">
                      {getSessionDeviceLabel(session.userAgent)}
                    </p>
                    <p className="text-xs text-[var(--color-muted)]">
                      {getSessionMeta(session)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Logout everywhere */}
          {(hasOtherSessions || isDemoUser) && (
            <div className="pt-4">
              <form action={logoutEverywhereAction}>
                <button
                  type="submit"
                  disabled={isDemoUser}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-50 px-4 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-100 disabled:opacity-50"
                >
                  <LogOut className="h-4 w-4" />
                  Cerrar sesión en todos los dispositivos
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

// ─── notifications sidebar card ───────────────────────────────────────────────

function NotificationsCard({
  emailEnabled,
  webEnabled,
}: {
  emailEnabled: boolean;
  webEnabled: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[rgba(22,60,88,0.08)] bg-white p-5">
      <h2 className="text-base font-bold text-[var(--color-ink)]">Notificaciones</h2>
      <div className="mt-4 space-y-4">
        <NotificationToggleRow
          title="Correos de Plataforma"
          description="Resúmenes semanales y actualizaciones de cursos."
          enabled={emailEnabled}
          emailEnabled={!emailEnabled}
          webEnabled={webEnabled}
        />
        <div className="h-px bg-[rgba(22,60,88,0.06)]" />
        <NotificationToggleRow
          title="Alertas de Comunidad"
          description="Menciones en foros y mensajes directos."
          enabled={webEnabled}
          emailEnabled={emailEnabled}
          webEnabled={!webEnabled}
        />
      </div>
    </div>
  );
}

// ─── academic activity sidebar card ──────────────────────────────────────────

function AcademicActivityCard({ overviewPanel }: { overviewPanel: AccountOverviewPanel }) {
  const hasProgress =
    overviewPanel.progressPercent !== null && overviewPanel.detail !== "Seguridad, sesiones y soporte de tu cuenta.";

  return (
    <div id="actividad" className="overflow-hidden rounded-2xl border border-[rgba(22,60,88,0.08)] bg-white p-5">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-base font-bold text-[var(--color-ink)]">Actividad Académica</h2>
        <GraduationCap className="h-4 w-4 text-[var(--color-muted)]" />
      </div>

      {hasProgress ? (
        <div className="mt-4 space-y-2">
          {/* Primary course — completed or in-progress */}
          <div
            className={cn(
              "flex items-center gap-3 rounded-xl p-3",
              (overviewPanel.progressPercent ?? 0) >= 100
                ? "bg-emerald-50"
                : "bg-blue-50",
            )}
          >
            <div
              className={cn(
                "grid h-8 w-8 shrink-0 place-items-center rounded-full",
                (overviewPanel.progressPercent ?? 0) >= 100
                  ? "bg-emerald-500 text-white"
                  : "bg-blue-100 text-blue-600",
              )}
            >
              {(overviewPanel.progressPercent ?? 0) >= 100 ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <GraduationCap className="h-4 w-4" />
              )}
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-[var(--color-ink)] line-clamp-1">
                {overviewPanel.detail}
              </p>
              <p
                className={cn(
                  "mt-0.5 text-[0.68rem] font-medium",
                  (overviewPanel.progressPercent ?? 0) >= 100
                    ? "text-emerald-600"
                    : "text-blue-600",
                )}
              >
                {(overviewPanel.progressPercent ?? 0) >= 100
                  ? "Completado"
                  : `En progreso (${overviewPanel.progressPercent}%)`}
              </p>
            </div>
          </div>

          {/* Extra activity item (from overviewPanel.items[0] if available) */}
          {overviewPanel.items[0] && (
            <div className="flex items-center gap-3 rounded-xl bg-[#f0f4ff] p-3">
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#c7d7f5] text-[#3b5bdb]">
                <Activity className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-[var(--color-ink)] line-clamp-1">
                  {overviewPanel.items[0]}
                </p>
                <p className="mt-0.5 text-[0.68rem] font-medium text-[#3b5bdb]">
                  {overviewPanel.sectionLabel}
                </p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <p className="mt-3 text-xs text-[var(--color-muted)]">
          Activa tu primer curso para ver tu actividad académica aquí.
        </p>
      )}

      {overviewPanel.actionHref && (
        <Link
          href={overviewPanel.actionHref}
          className="mt-4 block w-full rounded-xl border border-[rgba(22,60,88,0.1)] bg-[#f8fafc] py-2 text-center text-xs font-semibold text-[var(--color-primary)] transition hover:border-[var(--color-primary)]"
        >
          Ver todo el historial
        </Link>
      )}
    </div>
  );
}

// ─── main component ───────────────────────────────────────────────────────────

export function AccountSettingsPage({
  email,
  fullName,
  isDemoUser,
  notificationSnapshot,
  overviewPanel,
  sessions,
}: AccountSettingsPageProps) {
  const emailEnabled = notificationSnapshot.preference.emailEnabled;
  const webEnabled = notificationSnapshot.preference.webEnabled;

  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      {/* Left sidebar */}
      <AccountSidebar fullName={fullName} activeAnchor="perfil" />

      {/* Main area */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile tabs */}
        <MobileSectionTabs />

        {/* Page header */}
        <div className="px-6 pb-2 pt-8 sm:px-8">
          <h1 className="text-2xl font-bold text-[var(--color-ink)] sm:text-3xl">Mi Cuenta</h1>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            Gestiona tu información y preferencias
          </p>
        </div>

        {/* Content grid */}
        <div className="px-6 pb-12 pt-6 sm:px-8">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px] xl:grid-cols-[minmax(0,1fr)_320px]">

            {/* Main column */}
            <div className="space-y-5">
              <PersonalInfoCard
                fullName={fullName}
                email={email}
                isDemoUser={isDemoUser}
              />
              <SecurityCard
                sessions={sessions}
                isDemoUser={isDemoUser}
              />
            </div>

            {/* Right sidebar */}
            <aside className="space-y-4">
              <NotificationsCard
                emailEnabled={emailEnabled}
                webEnabled={webEnabled}
              />
              <AcademicActivityCard overviewPanel={overviewPanel} />
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}

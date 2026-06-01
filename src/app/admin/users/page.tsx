import type { Metadata } from "next";
import type { UserGlobalRole } from "@prisma/client";
import Link from "next/link";
import { ChevronLeft, ChevronRight, UserPlus } from "lucide-react";
import { UserFiltersBar } from "@/components/admin/users/user-filters-bar";
import { UserTable } from "@/components/admin/users/user-table";
import type { UserRoleFilter, UserStatusFilter } from "@/components/admin/users/types";
import { getSearchParamValue } from "@/lib/admin-console";
import { requireAdminConsoleUser } from "@/lib/admin-console-server";
import { getDb } from "@/lib/prisma";
import { formatCompactNumber } from "@/lib/utils";

export const metadata: Metadata = { title: "Gestión de Usuarios — Admin" };

const PAGE_SIZE = 10;

type UsersPageProps = {
  searchParams: Promise<{
    q?: string | string[];
    role?: string | string[];
    status?: string | string[];
    page?: string | string[];
  }>;
};

export default async function AdminUsersPage({ searchParams }: UsersPageProps) {
  await requireAdminConsoleUser("/admin/users");

  const params = await searchParams;
  const q = getSearchParamValue(params.q);
  const role = getSearchParamValue(params.role, "ALL") as UserRoleFilter;
  const status = getSearchParamValue(params.status, "ALL") as UserStatusFilter;
  const pageParam = getSearchParamValue(params.page, "1");
  const currentPage = Math.max(1, parseInt(pageParam, 10) || 1);

  const db = getDb();

  const where = {
    ...(q
      ? { OR: [{ name: { contains: q } }, { email: { contains: q } }] }
      : {}),
    ...(role !== "ALL" ? { globalRole: role as UserGlobalRole } : {}),
    ...(status === "ACTIVE"
      ? { isActive: true }
      : status === "INACTIVE"
        ? { isActive: false }
        : {}),
  };

  const [users, filteredCount, totalCount] = await Promise.all([
    db.user.findMany({
      where,
      include: {
        notificationPreference: true,
        _count: {
          select: { enrollments: true, purchases: true, courseAssignments: true },
        },
      },
      orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
      take: PAGE_SIZE,
      skip: (currentPage - 1) * PAGE_SIZE,
    }),
    db.user.count({ where }),
    db.user.count(),
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredCount / PAGE_SIZE));
  const showingFrom = filteredCount === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const showingTo = Math.min(currentPage * PAGE_SIZE, filteredCount);

  function buildPageHref(p: number) {
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    if (role !== "ALL") sp.set("role", role);
    if (status !== "ALL") sp.set("status", status);
    sp.set("page", String(p));
    return `/admin/users?${sp.toString()}`;
  }

  return (
    <div className="space-y-6">
      {/* ── Page header ────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-[1.9rem] font-bold tracking-[-0.04em] text-[var(--color-ink)]">
              Gestión de Usuarios
            </h1>
            <span className="rounded-full border border-[rgba(22,60,88,0.15)] bg-[rgba(22,60,88,0.06)] px-3 py-0.5 text-sm font-semibold text-[var(--color-ink-soft)]">
              {formatCompactNumber(totalCount)}
            </span>
          </div>
          <p className="mt-1.5 text-sm text-[var(--color-muted)]">
            Administra accesos, roles y actividad de la plataforma.
          </p>
        </div>

        <Link
          className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-white shadow-[var(--shadow-soft)] transition hover:bg-[var(--color-primary-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"
          href="/admin/users#create-teacher"
        >
          <UserPlus className="h-4 w-4" strokeWidth={2} />
          Añadir Usuario
        </Link>
      </div>

      {/* ── Filters ────────────────────────────────────────────────── */}
      <UserFiltersBar q={q} role={role} status={status} />

      {/* ── Table ──────────────────────────────────────────────────── */}
      <UserTable users={users} />

      {/* ── Pagination ─────────────────────────────────────────────── */}
      <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-[var(--color-muted)]">
          {filteredCount === 0
            ? "Sin resultados"
            : `Mostrando ${showingFrom} a ${showingTo} de ${filteredCount.toLocaleString("es")} usuarios`}
        </p>

        <div className="flex items-center gap-2">
          <Link
            aria-disabled={currentPage <= 1}
            aria-label="Página anterior"
            className={`grid h-9 w-9 place-items-center rounded-lg border border-[var(--color-border-subtle)] bg-white text-[var(--color-ink-soft)] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] ${
              currentPage <= 1
                ? "pointer-events-none opacity-40"
                : "hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
            }`}
            href={buildPageHref(currentPage - 1)}
          >
            <ChevronLeft className="h-4 w-4" strokeWidth={2} />
          </Link>

          <span className="min-w-[5rem] rounded-lg border border-[var(--color-border-subtle)] bg-white px-4 py-2 text-center text-sm font-semibold text-[var(--color-ink)]">
            {currentPage} / {totalPages}
          </span>

          <Link
            aria-disabled={currentPage >= totalPages}
            aria-label="Página siguiente"
            className={`grid h-9 w-9 place-items-center rounded-lg border border-[var(--color-border-subtle)] bg-white text-[var(--color-ink-soft)] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] ${
              currentPage >= totalPages
                ? "pointer-events-none opacity-40"
                : "hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
            }`}
            href={buildPageHref(currentPage + 1)}
          >
            <ChevronRight className="h-4 w-4" strokeWidth={2} />
          </Link>
        </div>
      </div>
    </div>
  );
}

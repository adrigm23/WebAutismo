"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { MoreHorizontal, UserCheck, UserX } from "lucide-react";
import { toggleUserActiveAction } from "@/actions/admin";
import { cn } from "@/lib/utils";
import type { UserDirectoryItem } from "./types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getUserInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

function formatActivityTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMs / 3_600_000);
  const diffDays = Math.floor(diffMs / 86_400_000);

  if (diffMin < 60) {
    const h = date.getHours().toString().padStart(2, "0");
    const m = date.getMinutes().toString().padStart(2, "0");
    return `Hoy, ${h}:${m}`;
  }
  if (diffHours < 24) {
    const h = date.getHours().toString().padStart(2, "0");
    const m = date.getMinutes().toString().padStart(2, "0");
    return `Hoy, ${h}:${m}`;
  }
  if (diffDays === 1) {
    const h = date.getHours().toString().padStart(2, "0");
    const m = date.getMinutes().toString().padStart(2, "0");
    return `Ayer, ${h}:${m}`;
  }
  if (diffDays < 30) {
    return `Hace ${diffDays} día${diffDays !== 1 ? "s" : ""}`;
  }
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

function getRoleLabel(role: string) {
  switch (role) {
    case "ADMIN": return "Admin";
    case "TEACHER": return "Docente";
    default: return "Alumno";
  }
}

// ─── Row dropdown menu ─────────────────────────────────────────────────────────

function RowActions({ user }: { user: UserDirectoryItem }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        aria-label="Acciones del usuario"
        className="grid h-8 w-8 place-items-center rounded-full text-[var(--color-muted)] transition hover:bg-[rgba(22,60,88,0.08)] hover:text-[var(--color-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
        onClick={() => setOpen((v) => !v)}
        type="button"
      >
        <MoreHorizontal className="h-4 w-4" strokeWidth={2} />
      </button>

      {open && (
        <div className="absolute right-0 top-9 z-30 min-w-[160px] overflow-hidden rounded-xl border border-[var(--color-border-subtle)] bg-white py-1 shadow-[0_8px_24px_rgba(22,60,88,0.12)]">
          <form
            action={async (formData) => {
              startTransition(async () => {
                await toggleUserActiveAction(formData);
                setOpen(false);
              });
            }}
          >
            <input name="userId" type="hidden" value={user.id} />
            <input name="active" type="hidden" value={user.isActive ? "false" : "true"} />
            <button
              className={cn(
                "flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm font-medium transition hover:bg-[rgba(22,60,88,0.05)]",
                user.isActive
                  ? "text-[var(--color-danger)]"
                  : "text-[var(--color-success)]",
              )}
              disabled={isPending}
              type="submit"
            >
              {user.isActive ? (
                <>
                  <UserX className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
                  Dar de baja
                </>
              ) : (
                <>
                  <UserCheck className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
                  Reactivar
                </>
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

// ─── Role badge ────────────────────────────────────────────────────────────────

function RoleBadge({ role }: { role: string }) {
  return (
    <span className="inline-flex items-center rounded-md border border-[rgba(22,60,88,0.15)] bg-white px-2.5 py-0.5 text-xs font-medium text-[var(--color-ink-soft)]">
      {getRoleLabel(role)}
    </span>
  );
}

// ─── Status badge ──────────────────────────────────────────────────────────────

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
        active
          ? "bg-[var(--color-success-soft)] text-[var(--color-success)]"
          : "bg-[var(--color-danger-soft)] text-[var(--color-danger)]",
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          active ? "bg-[var(--color-success)]" : "bg-[var(--color-danger)]",
        )}
      />
      {active ? "Activo" : "Bloqueado"}
    </span>
  );
}

// ─── Avatar ────────────────────────────────────────────────────────────────────

function UserAvatar({ name }: { name: string }) {
  const initials = getUserInitials(name);
  return (
    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[var(--color-primary)] text-[0.72rem] font-semibold text-white">
      {initials}
    </div>
  );
}

// ─── Main table ────────────────────────────────────────────────────────────────

export function UserTable({ users }: { users: UserDirectoryItem[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const allSelected = users.length > 0 && selected.size === users.length;
  const someSelected = selected.size > 0 && selected.size < users.length;

  function toggleAll() {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(users.map((u) => u.id)));
    }
  }

  function toggleRow(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });
  }

  if (users.length === 0) {
    return (
      <div className="rounded-xl border border-[var(--color-border-subtle)] bg-white px-6 py-16 text-center">
        <p className="text-sm font-medium text-[var(--color-ink-soft)]">
          No se encontraron usuarios con los filtros aplicados.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-[var(--color-border-subtle)] bg-white">
      {/* Overflow wrapper for horizontal scroll on tablet */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse">
          <thead>
            <tr className="border-b border-[var(--color-border-subtle)]">
              <th className="w-10 px-4 py-3 text-left">
                <input
                  aria-label="Seleccionar todos"
                  checked={allSelected}
                  className="h-4 w-4 cursor-pointer rounded border-[var(--color-border)] accent-[var(--color-primary)]"
                  onChange={toggleAll}
                  ref={(el) => {
                    if (el) el.indeterminate = someSelected;
                  }}
                  type="checkbox"
                />
              </th>
              <th className="px-4 py-3 text-left text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-[var(--color-muted)]">
                Usuario
              </th>
              <th className="px-4 py-3 text-left text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-[var(--color-muted)]">
                Rol
              </th>
              <th className="px-4 py-3 text-left text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-[var(--color-muted)]">
                Estado
              </th>
              <th className="hidden px-4 py-3 text-left text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-[var(--color-muted)] sm:table-cell">
                Última actividad
              </th>
              <th className="px-4 py-3 text-right text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-[var(--color-muted)]">
                Acciones
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[var(--color-border-subtle)]">
            {users.map((user) => {
              const isChecked = selected.has(user.id);
              return (
                <tr
                  className={cn(
                    "transition hover:bg-[rgba(22,60,88,0.018)]",
                    isChecked && "bg-[rgba(22,60,88,0.03)]",
                  )}
                  key={user.id}
                >
                  {/* Checkbox */}
                  <td className="w-10 px-4 py-3.5">
                    <input
                      aria-label={`Seleccionar ${user.name}`}
                      checked={isChecked}
                      className="h-4 w-4 cursor-pointer rounded border-[var(--color-border)] accent-[var(--color-primary)]"
                      onChange={() => toggleRow(user.id)}
                      type="checkbox"
                    />
                  </td>

                  {/* Usuario */}
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <UserAvatar name={user.name} />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[var(--color-ink)]">
                          {user.name}
                        </p>
                        <p className="truncate text-[0.75rem] text-[var(--color-muted)]">
                          {user.email}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Rol */}
                  <td className="px-4 py-3.5">
                    <RoleBadge role={user.globalRole} />
                  </td>

                  {/* Estado */}
                  <td className="px-4 py-3.5">
                    <StatusBadge active={user.isActive} />
                  </td>

                  {/* Última actividad */}
                  <td className="hidden px-4 py-3.5 sm:table-cell">
                    <span className="text-sm text-[var(--color-ink-soft)]">
                      {formatActivityTime(user.updatedAt)}
                    </span>
                  </td>

                  {/* Acciones */}
                  <td className="px-4 py-3.5 text-right">
                    <RowActions user={user} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

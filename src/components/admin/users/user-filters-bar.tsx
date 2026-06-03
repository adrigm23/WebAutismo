"use client";

import { useRef } from "react";
import { Download, Mail, Search } from "lucide-react";
import type { UserRoleFilter, UserStatusFilter } from "./types";

type Props = {
  q: string;
  role: UserRoleFilter;
  status: UserStatusFilter;
};

export function UserFiltersBar({ q, role, status }: Props) {
  const formRef = useRef<HTMLFormElement>(null);

  function submitForm() {
    formRef.current?.requestSubmit();
  }

  return (
    <div className="rounded-xl border border-[var(--color-border-subtle)] bg-white px-4 py-3.5 shadow-sm sm:px-5">
      <form
        className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center"
        method="get"
        ref={formRef}
      >
        {/* Search */}
        <label className="relative flex min-w-0 flex-1 items-center sm:max-w-[280px]">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3 h-3.5 w-3.5 text-[var(--color-muted)]"
            strokeWidth={2}
          />
          <input
            className="h-9 w-full min-w-0 rounded-lg border border-[var(--color-border-subtle)] bg-[rgba(22,60,88,0.03)] pl-8 pr-3 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-muted)] focus-visible:border-[var(--color-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-1"
            defaultValue={q}
            name="q"
            placeholder="Filtrar por nombre o email..."
            type="search"
          />
        </label>

        {/* Role select */}
        <div className="relative flex items-center">
          <select
            className="h-9 cursor-pointer appearance-none rounded-lg border border-[var(--color-border-subtle)] bg-white py-0 pl-3 pr-8 text-sm font-medium text-[var(--color-ink-soft)] focus-visible:border-[var(--color-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-1"
            defaultValue={role}
            name="role"
            onChange={submitForm}
          >
            <option value="ALL">Todos los Roles</option>
            <option value="STUDENT">Alumno</option>
            <option value="TEACHER">Docente</option>
            <option value="ADMIN">Administrador</option>
          </select>
          <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--color-muted)]">
            <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </div>

        {/* Status select */}
        <div className="relative flex items-center">
          <select
            className="h-9 cursor-pointer appearance-none rounded-lg border border-[var(--color-border-subtle)] bg-white py-0 pl-3 pr-8 text-sm font-medium text-[var(--color-ink-soft)] focus-visible:border-[var(--color-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-1"
            defaultValue={status}
            name="status"
            onChange={submitForm}
          >
            <option value="ALL">Estado</option>
            <option value="ACTIVE">Activo</option>
            <option value="INACTIVE">Bloqueado</option>
          </select>
          <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--color-muted)]">
            <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </div>

        {/* Bulk actions */}
        <div className="flex items-center gap-2 sm:ml-auto">
          <span className="hidden text-sm text-[var(--color-muted)] lg:inline">
            Acciones masivas:
          </span>
          <button
            aria-label="Exportar usuarios"
            className="grid h-8 w-8 place-items-center rounded-lg border border-[var(--color-border-subtle)] bg-white text-[var(--color-muted)] transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
            title="Exportar CSV"
            type="button"
          >
            <Download className="h-3.5 w-3.5" strokeWidth={2} />
          </button>
          <button
            aria-label="Enviar email masivo"
            className="grid h-8 w-8 place-items-center rounded-lg border border-[var(--color-border-subtle)] bg-white text-[var(--color-muted)] transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
            title="Enviar email"
            type="button"
          >
            <Mail className="h-3.5 w-3.5" strokeWidth={2} />
          </button>
        </div>
      </form>
    </div>
  );
}

import Link from "next/link";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { getRoleFilterLabel, getRoleTone, getUserInitials } from "@/lib/admin-console";
import { cn } from "@/lib/utils";
import type { TeacherSummary } from "./types";

export function TeacherCard({
  teacher,
  teacherHref,
  isSelected
}: {
  teacher: TeacherSummary;
  teacherHref: string;
  isSelected: boolean;
}) {
  return (
    <Link
      className={cn(
        "ui-card-base ui-card-interactive block min-w-0 rounded-[var(--radius-lg)] p-5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface-canvas)] lg:p-6",
        isSelected &&
          "border-[var(--color-primary)] bg-[color:color-mix(in_srgb,var(--color-primary-soft)_18%,white)] shadow-[var(--shadow-medium)]"
      )}
      href={teacherHref}
    >
      <div className="flex min-w-0 items-start justify-between gap-4">
        <div className="flex min-w-0 flex-1 items-start gap-4">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[color:color-mix(in_srgb,var(--color-primary-soft)_72%,white)] text-base font-semibold text-[var(--color-primary)]">
            {getUserInitials(teacher.name)}
          </div>
          <div className="min-w-0">
            <p className="truncate text-[1.18rem] font-semibold tracking-[-0.04em] text-[var(--color-ink)]">
              {teacher.name}
            </p>
            <p className="mt-1.5 truncate text-sm text-[var(--color-muted)]">{teacher.email}</p>
          </div>
        </div>

        {teacher.activeStudents >= 75 ? (
          <span className="mt-1 h-3 w-3 shrink-0 rounded-full bg-[var(--color-danger)]" />
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <AdminStatusBadge tone={getRoleTone(teacher.globalRole)}>
          {getRoleFilterLabel(teacher.globalRole)}
        </AdminStatusBadge>
        <AdminStatusBadge tone={teacher.activeStudents >= 75 ? "danger" : "neutral"}>
          {teacher.activeStudents} alumnos
        </AdminStatusBadge>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3 border-t border-[var(--color-border-subtle)] pt-4">
        <TeacherStat label="Alumnos" value={teacher.activeStudents} />
        <TeacherStat label="Ediciones" value={teacher.activeEditions} />
        <TeacherStat label="Cursos" value={teacher.courseAssignments.length} />
      </div>
    </Link>
  );
}

function TeacherStat({
  label,
  value
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div>
      <p className="text-[1.3rem] font-semibold tracking-[-0.04em] text-[var(--color-ink)] [font-variant-numeric:tabular-nums]">
        {value}
      </p>
      <p className="mt-1 text-meta-xs font-semibold text-[var(--color-ink-soft)]">
        {label}
      </p>
    </div>
  );
}

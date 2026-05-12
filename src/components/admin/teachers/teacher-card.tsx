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
        "block rounded-[2rem] border border-[#d4dde6] bg-white p-6 text-left shadow-[0_16px_36px_rgba(15,44,76,0.05)] transition hover:border-[var(--color-primary)] hover:shadow-[0_22px_42px_rgba(15,44,76,0.08)]",
        isSelected && "border-[var(--color-primary)] ring-2 ring-[rgba(12,113,195,0.08)]"
      )}
      href={teacherHref}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="grid h-12 w-12 place-items-center rounded-full bg-[#eef2f6] text-base font-semibold text-[#2d3d4c]">
            {getUserInitials(teacher.name)}
          </div>
          <div className="min-w-0">
            <p className="truncate text-[1.3rem] font-semibold leading-none text-[var(--color-ink)]">
              {teacher.name}
            </p>
            <p className="mt-2 truncate text-sm text-[#5b6d80]">{teacher.email}</p>
          </div>
        </div>

        {teacher.activeStudents >= 75 ? <span className="mt-1 h-3 w-3 rounded-full bg-[#cf3328]" /> : null}
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <AdminStatusBadge tone={getRoleTone(teacher.globalRole)}>
          {getRoleFilterLabel(teacher.globalRole)}
        </AdminStatusBadge>
        <AdminStatusBadge tone={teacher.activeStudents >= 75 ? "danger" : "neutral"}>
          {teacher.activeStudents} alumnos
        </AdminStatusBadge>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-3 border-t border-[#e3e9f0] pt-5">
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
      <p className="text-[1.45rem] font-semibold tracking-[-0.04em] text-[var(--color-ink)]">
        {value}
      </p>
      <p className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#627487]">
        {label}
      </p>
    </div>
  );
}

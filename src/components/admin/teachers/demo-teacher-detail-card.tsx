import { AlertTriangle } from "lucide-react";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { Card } from "@/components/ui/card";
import { getUserInitials } from "@/lib/admin-console";
import { cn, formatDate } from "@/lib/utils";
import type { TeacherSummary } from "./types";

export function DemoTeacherDetailCard({
  selectedTeacher,
}: {
  selectedTeacher: TeacherSummary;
}) {
  return (
    <Card className="overflow-hidden rounded-xl">
      <div className="border-b border-[#dde4ec] px-7 py-7">
        <div className="flex items-start gap-4">
          <div className="grid h-14 w-14 place-items-center rounded-full bg-[rgba(12,113,195,0.12)] text-base font-semibold text-[var(--color-primary)]">
            {getUserInitials(selectedTeacher.name)}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-[2rem] font-semibold leading-none tracking-[-0.06em] text-[var(--color-ink)]">
              {selectedTeacher.name}
            </h2>
            <p className="mt-2 truncate text-sm text-[#5b6d80]">
              {selectedTeacher.email}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <AdminStatusBadge tone="warning">
                Docente titular
              </AdminStatusBadge>
              <AdminStatusBadge
                tone={
                  selectedTeacher.activeStudents >= 75 ? "danger" : "primary"
                }
              >
                {selectedTeacher.activeStudents >= 75
                  ? "Carga alta"
                  : "Carga estable"}
              </AdminStatusBadge>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <StatBox label="Alta" value={formatDate(selectedTeacher.createdAt)} />
          <StatBox
            label="Cursos"
            value={`${selectedTeacher.courseAssignments.length} asignados`}
          />
          <StatBox
            label="Revision"
            value={formatDate(selectedTeacher.updatedAt)}
          />
        </div>
      </div>

      <div className="px-7 py-7">
        <div
          className={cn(
            "rounded-xl border px-5 py-4 text-sm leading-7",
            selectedTeacher.activeStudents >= 75
              ? "border-[#f3b3ac] bg-[#fff2f0] text-[#a03329]"
              : "border-[#dbe6ef] bg-[#f7fafc] text-[#44586d]",
          )}
        >
          <div className="flex items-center gap-3 font-semibold">
            <AlertTriangle className="h-4 w-4" strokeWidth={1.8} />
            {selectedTeacher.activeStudents >= 75
              ? "Alerta de carga alta"
              : "Seguimiento operativo estable"}
          </div>
          <p className="mt-2">
            Esta cuenta se muestra en modo demostración. Los cambios reales en
            asignaciones siguen deshabilitados hasta conectar la base de datos.
          </p>
        </div>

        <div className="mt-6">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#314255]">
            Asignacion de cursos
          </p>
          <div className="mt-4 space-y-3">
            {selectedTeacher.courseAssignments.map((assignment) => (
              <div
                className="rounded-xl border border-[#d9e1e8] bg-[#fbfcfd] px-4 py-4 text-sm text-[#33475b]"
                key={assignment.courseId}
              >
                <div className="font-medium text-[var(--color-ink)]">
                  {assignment.course.title}
                </div>
                <div className="mt-1 text-xs uppercase tracking-[0.14em] text-[#6a7b8d]">
                  /cursos/{assignment.course.slug}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-[#f6fafc] px-4 py-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#5a6c80]">
        {label}
      </p>
      <p className="mt-2 text-base font-semibold text-[var(--color-ink)]">
        {value}
      </p>
    </div>
  );
}

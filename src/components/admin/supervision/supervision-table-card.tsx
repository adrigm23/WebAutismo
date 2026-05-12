import Link from "next/link";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { Card } from "@/components/ui/card";
import {
  getAccessStateLabel,
  getAccessStateTone
} from "@/lib/admin-console";
import { formatDateTime } from "@/lib/utils";
import type { SupervisionTableRow } from "./types";

export function SupervisionTableCard({
  rows,
  countLabel
}: {
  rows: SupervisionTableRow[];
  countLabel?: string;
}) {
  return (
    <Card className="overflow-hidden rounded-[2rem]">
      <div className="border-b border-[#dde4ec] px-7 py-6">
        <h2 className="text-[2rem] font-semibold tracking-[-0.06em] text-[var(--color-ink)]">
          Seguimiento de matriculas
        </h2>
        {countLabel ? <p className="mt-2 text-sm text-[#52667b]">{countLabel}</p> : null}
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left">
          <thead>
            <tr className="border-b border-[#dde4ec] text-sm uppercase tracking-[0.16em] text-[#3b4f64]">
              <th className="px-7 py-4">Alumno</th>
              <th className="px-4 py-4">Curso y edicion</th>
              <th className="px-4 py-4">Progreso</th>
              <th className="px-4 py-4">Ultima actividad</th>
              <th className="px-7 py-4">Acceso</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e0e7ee]">
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="px-7 py-5">
                  <Link href={row.href}>
                    <span className="block text-[1.1rem] font-semibold text-[var(--color-ink)]">
                      {row.studentName}
                    </span>
                    <span className="mt-1 block text-sm text-[#647487]">{row.studentEmail}</span>
                  </Link>
                </td>
                <td className="px-4 py-5 text-[#34485c]">
                  <div>{row.courseTitle}</div>
                  <div className="mt-1 text-sm text-[#617386]">{row.editionLabel}</div>
                </td>
                <td className="px-4 py-5 text-[#34485c]">
                  {row.completionRate}% - {row.completedModules}/{row.totalModules} modulos
                </td>
                <td className="px-4 py-5 text-[#34485c]">
                  {row.lastCompletedAt ? formatDateTime(row.lastCompletedAt) : "Sin actividad"}
                </td>
                <td className="px-7 py-5">
                  <AdminStatusBadge tone={getAccessStateTone(row.accessState)}>
                    {getAccessStateLabel(row.accessState)}
                  </AdminStatusBadge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

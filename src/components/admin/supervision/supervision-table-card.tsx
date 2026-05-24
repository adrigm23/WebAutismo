import Link from "next/link";
import { Clock3 } from "lucide-react";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Progress } from "@/components/ui/progress";
import { SectionHeader } from "@/components/ui/section-header";
import {
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableEmpty,
  DataTableHead,
  DataTableHeader,
  DataTableRow
} from "@/components/ui/data-table";
import { SurfaceCard } from "@/components/ui/surface-card";
import { getAccessStateLabel, getAccessStateTone } from "@/lib/admin-console";
import { formatDateTime } from "@/lib/utils";
import type { SupervisionTableRow } from "./types";

export function SupervisionTableCard({
  rows,
  countLabel,
}: {
  rows: SupervisionTableRow[];
  countLabel?: string;
}) {
  return (
    <div className="min-w-0 space-y-4">
      {rows.length ? (
        <div className="grid gap-4 xl:hidden">
          {rows.map((row) => (
            <SurfaceCard
              className="scroll-mt-28 w-full min-w-0"
              key={row.id}
              padding="md"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <Link
                    className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface-elevated)]"
                    href={row.href}
                  >
                    <h2 className="text-[1.18rem] font-semibold tracking-[-0.04em] text-[var(--color-ink)]">
                      {row.studentName}
                    </h2>
                    <p className="mt-1 break-all text-sm text-[var(--color-muted)]">
                      {row.studentEmail}
                    </p>
                  </Link>
                </div>
                <AdminStatusBadge tone={getAccessStateTone(row.accessState)}>
                  {getAccessStateLabel(row.accessState)}
                </AdminStatusBadge>
              </div>

              <div className="mt-4 rounded-[var(--radius-md)] bg-[color:color-mix(in_srgb,var(--color-primary-soft)_34%,white)] px-4 py-3">
                <p className="text-meta-xs font-semibold text-[var(--color-ink-soft)]">
                  Curso y edicion
                </p>
                <p className="mt-2 text-sm leading-7 text-[var(--color-ink)]">
                  {row.courseTitle}
                  <br />
                  {row.editionLabel}
                </p>
              </div>

              <div className="mt-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-meta-xs font-semibold text-[var(--color-ink-soft)]">
                    Progreso
                  </p>
                  <p className="text-sm font-medium text-[var(--color-ink)]">
                    {row.completionRate}% - {row.completedModules}/{row.totalModules} modulos
                  </p>
                </div>
                <Progress className="mt-3" value={row.completionRate} />
              </div>

              <div className="mt-4 border-t border-[var(--color-border-subtle)] pt-4 text-sm text-[var(--color-muted)]">
                <p className="inline-flex items-center gap-2">
                  <Clock3 className="size-4 text-[var(--color-ink-soft)]" strokeWidth={1.9} />
                  <span>
                    Ultima actividad:{" "}
                    {row.lastCompletedAt
                      ? formatDateTime(row.lastCompletedAt)
                      : "Sin actividad"}
                  </span>
                </p>
              </div>
            </SurfaceCard>
          ))}
        </div>
      ) : (
        <EmptyState
          align="center"
          className="xl:hidden"
          description="Prueba con otro curso, profesorado o estado de acceso para localizar matriculas."
          title="No hay matriculas visibles"
          tone="subtle"
        />
      )}

      <SurfaceCard className="hidden w-full min-w-0 overflow-hidden xl:block" padding="md">
        <SectionHeader
          description={countLabel}
          size="md"
          title="Seguimiento de matriculas"
        />

        <div className="mt-5 min-w-0">
          <DataTable className="table-fixed">
            <DataTableHeader>
              <tr>
                <DataTableHead className="w-[30%] pl-7">Alumno</DataTableHead>
                <DataTableHead className="w-[26%]">Curso y edicion</DataTableHead>
                <DataTableHead className="w-[20%]">Progreso</DataTableHead>
                <DataTableHead className="w-[14%]">Ultima actividad</DataTableHead>
                <DataTableHead className="w-[10%] pr-7">Acceso</DataTableHead>
              </tr>
            </DataTableHeader>
            <DataTableBody>
              {rows.length ? (
                rows.map((row) => (
                  <DataTableRow key={row.id}>
                    <DataTableCell className="pl-7">
                      <Link
                        className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface-elevated)]"
                        href={row.href}
                      >
                        <span className="block text-[1.1rem] font-semibold tracking-[-0.04em] text-[var(--color-ink)]">
                          {row.studentName}
                        </span>
                        <span className="mt-1 block break-all text-sm text-[var(--color-muted)]">
                          {row.studentEmail}
                        </span>
                      </Link>
                    </DataTableCell>
                    <DataTableCell className="text-[var(--color-ink)]">
                      <div className="break-words">{row.courseTitle}</div>
                      <div className="mt-1 text-sm text-[var(--color-muted)]">
                        {row.editionLabel}
                      </div>
                    </DataTableCell>
                    <DataTableCell>
                      <div className="max-w-[12rem]">
                        <p className="text-sm font-medium text-[var(--color-ink)]">
                          {row.completionRate}% - {row.completedModules}/{row.totalModules} modulos
                        </p>
                        <Progress className="mt-3" value={row.completionRate} />
                      </div>
                    </DataTableCell>
                    <DataTableCell className="text-[var(--color-ink)]">
                      {row.lastCompletedAt
                        ? formatDateTime(row.lastCompletedAt)
                        : "Sin actividad"}
                    </DataTableCell>
                    <DataTableCell className="pr-7">
                      <AdminStatusBadge tone={getAccessStateTone(row.accessState)}>
                        {getAccessStateLabel(row.accessState)}
                      </AdminStatusBadge>
                    </DataTableCell>
                  </DataTableRow>
                ))
              ) : (
                <DataTableEmpty
                  colSpan={5}
                  description="Prueba con otro curso, profesorado o estado de acceso para localizar matriculas."
                  title="No hay matriculas visibles"
                />
              )}
            </DataTableBody>
          </DataTable>
        </div>
      </SurfaceCard>
    </div>
  );
}

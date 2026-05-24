import Link from "next/link";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { ButtonLink } from "@/components/ui/button";
import {
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableEmpty,
  DataTableHead,
  DataTableHeader,
  DataTableRow
} from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { SurfaceCard } from "@/components/ui/surface-card";
import { getCourseStatusLabel, getCourseStatusTone } from "@/lib/admin-console";
import { cn, formatPrice } from "@/lib/utils";
import type { CourseTableRow } from "./types";

export function CourseTableCard({ rows }: { rows: CourseTableRow[] }) {
  return (
    <div className="space-y-4">
      {rows.length ? (
        <div className="grid gap-4 md:hidden">
          {rows.map((course) => (
            <SurfaceCard
              className={cn(
                "scroll-mt-28",
                course.isSelected &&
                  "border-[var(--color-primary)] bg-[color:color-mix(in_srgb,var(--color-primary-soft)_30%,white)]"
              )}
              key={course.id}
              padding="md"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <Link
                    className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface-elevated)]"
                    href={course.href}
                  >
                    <h2 className="text-[1.15rem] font-semibold tracking-[-0.04em] text-[var(--color-ink)]">
                      {course.title}
                    </h2>
                    <p className="mt-2 break-all text-sm text-[var(--color-muted)]">
                      /cursos/{course.slug}
                    </p>
                  </Link>
                </div>
                <AdminStatusBadge tone={getCourseStatusTone(course.status)}>
                  {getCourseStatusLabel(course.status)}
                </AdminStatusBadge>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-4 border-y border-[var(--color-border-subtle)] py-4">
                <div>
                  <p className="text-meta-xs font-semibold text-[var(--color-ink-soft)]">
                    Precio
                  </p>
                  <p className="mt-2 text-[1.12rem] font-semibold text-[var(--color-ink)]">
                    {formatPrice(course.priceInCents)}
                  </p>
                </div>
                <div>
                  <p className="text-meta-xs font-semibold text-[var(--color-ink-soft)]">
                    Detalle
                  </p>
                  <div className="mt-2 space-y-1 text-sm leading-6 text-[var(--color-muted)]">
                    <div>{course.modulesCount} módulos</div>
                    <div>{course.editionsCount} ediciones</div>
                    <div>
                      {course.teachersCount > 0
                        ? `${course.teachersCount} docentes`
                        : "Sin docentes"}
                    </div>
                  </div>
                </div>
              </div>

              <ButtonLink
                className="mt-5 w-full justify-center"
                href={course.href}
                variant="secondary"
              >
                Gestionar curso
              </ButtonLink>
            </SurfaceCard>
          ))}
        </div>
      ) : (
        <EmptyState
          align="center"
          className="md:hidden"
          description="Ajusta la búsqueda o el estado para encontrar el curso que necesitas gestionar."
          title="No hay cursos visibles"
          tone="subtle"
        />
      )}

      <SurfaceCard className="hidden min-w-0 overflow-hidden md:block" padding="md">
        <DataTable>
          <DataTableHeader>
            <tr>
              <DataTableHead className="pl-7">Curso</DataTableHead>
              <DataTableHead>Estado</DataTableHead>
              <DataTableHead>Precio</DataTableHead>
              <DataTableHead>Detalle</DataTableHead>
              <DataTableHead className="pr-7 text-right">Acciones</DataTableHead>
            </tr>
          </DataTableHeader>
          <DataTableBody>
            {rows.length ? (
              rows.map((course) => (
                <DataTableRow
                  className={cn(
                    course.isSelected &&
                      "bg-[color:color-mix(in_srgb,var(--color-primary-soft)_30%,white)]"
                  )}
                  key={course.id}
                >
                  <DataTableCell
                    className={cn(
                      "pl-7",
                      course.isSelected &&
                        "border-l-4 border-[var(--color-primary)] pl-5"
                    )}
                  >
                    <Link
                      className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface-elevated)]"
                      href={course.href}
                    >
                      <span className="block text-[1.14rem] font-semibold tracking-[-0.04em] text-[var(--color-ink)]">
                        {course.title}
                      </span>
                      <span className="mt-1 block text-sm text-[var(--color-muted)]">
                        /cursos/{course.slug}
                      </span>
                    </Link>
                  </DataTableCell>
                  <DataTableCell>
                    <AdminStatusBadge tone={getCourseStatusTone(course.status)}>
                      {getCourseStatusLabel(course.status)}
                    </AdminStatusBadge>
                  </DataTableCell>
                  <DataTableCell className="text-[1.08rem] font-medium text-[var(--color-ink)]">
                    {formatPrice(course.priceInCents)}
                  </DataTableCell>
                  <DataTableCell className="text-sm leading-7 text-[var(--color-muted)]">
                    <div>{course.modulesCount} módulos</div>
                    <div>{course.editionsCount} ediciones</div>
                    <div>
                      {course.teachersCount > 0
                        ? `${course.teachersCount} docentes`
                        : "Sin docentes"}
                    </div>
                  </DataTableCell>
                  <DataTableCell className="pr-7 text-right">
                    <ButtonLink href={course.href} variant="secondary">
                      Gestionar curso
                    </ButtonLink>
                  </DataTableCell>
                </DataTableRow>
              ))
            ) : (
              <DataTableEmpty
                colSpan={5}
                description="Ajusta la búsqueda o el estado para encontrar el curso que necesitas gestionar."
                title="No hay cursos visibles"
              />
            )}
          </DataTableBody>
        </DataTable>
      </SurfaceCard>
    </div>
  );
}

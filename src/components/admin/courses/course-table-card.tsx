import Link from "next/link";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  getCourseStatusLabel,
  getCourseStatusTone
} from "@/lib/admin-console";
import { formatPrice } from "@/lib/utils";
import type { CourseTableRow } from "./types";

export function CourseTableCard({
  rows
}: {
  rows: CourseTableRow[];
}) {
  return (
    <Card className="overflow-hidden rounded-[2rem]">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left">
          <thead>
            <tr className="border-b border-[#dde4ec] text-sm uppercase tracking-[0.16em] text-[#3b4f64]">
              <th className="px-7 py-4">Curso</th>
              <th className="px-4 py-4">Estado</th>
              <th className="px-4 py-4">Precio</th>
              <th className="px-4 py-4">Detalle</th>
              <th className="px-7 py-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e0e7ee]">
            {rows.map((course) => (
              <tr className="align-top" key={course.id}>
                <td className="px-7 py-6">
                  <Link href={course.href}>
                    <span className="block text-[1.16rem] font-semibold text-[var(--color-ink)]">
                      {course.title}
                    </span>
                    <span className="mt-1 block text-sm text-[#647487]">/cursos/{course.slug}</span>
                  </Link>
                </td>
                <td className="px-4 py-6">
                  <AdminStatusBadge tone={getCourseStatusTone(course.status)}>
                    {getCourseStatusLabel(course.status)}
                  </AdminStatusBadge>
                </td>
                <td className="px-4 py-6 text-[1.08rem] font-medium text-[var(--color-ink)]">
                  {formatPrice(course.priceInCents)}
                </td>
                <td className="px-4 py-6 text-sm leading-7 text-[#405365]">
                  <div>{course.modulesCount} modulos</div>
                  <div>{course.editionsCount} ediciones</div>
                  <div>{course.teachersCount > 0 ? `${course.teachersCount} docentes` : "Sin docentes"}</div>
                </td>
                <td className="px-7 py-6 text-right">
                  <ButtonLink href={course.href} variant="secondary">
                    Gestionar
                  </ButtonLink>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

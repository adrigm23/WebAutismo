import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { Card } from "@/components/ui/card";
import {
  getCourseStatusLabel,
  getCourseStatusTone
} from "@/lib/admin-console";
import type { DemoCourseDetail } from "./types";

export function DemoCourseDetailCard({
  course
}: {
  course: DemoCourseDetail;
}) {
  return (
    <Card className="scroll-mt-28 rounded-[2rem] p-7" id="course-detail">
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div>
          <h2 className="text-[2rem] font-semibold tracking-[-0.06em] text-[var(--color-ink)]">
            {course.title}
          </h2>
          <p className="mt-2 text-sm text-[#5f7083]">Slug: {course.slug}</p>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-[#5f7083]">{course.shortDescription}</p>
        </div>
        <AdminStatusBadge tone={getCourseStatusTone(course.status)}>
          {getCourseStatusLabel(course.status)}
        </AdminStatusBadge>
      </div>
      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#314255]">
            Docentes asignados
          </p>
          <div className="mt-4 space-y-3">
            {course.teachers.length > 0 ? (
              course.teachers.map((teacher) => (
                <div
                  className="rounded-[1.3rem] border border-[#d9e1e8] bg-[#fbfcfd] px-4 py-3"
                  key={teacher}
                >
                  <p className="font-medium text-[var(--color-ink)]">{teacher}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-[#607285]">Sin docentes asignados.</p>
            )}
          </div>
        </div>
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#314255]">
            Resumen operativo
          </p>
          <div className="mt-4 rounded-[1.4rem] border border-[#d9e1e8] bg-[#fbfcfd] p-5 text-sm leading-7 text-[#44586d]">
            Esta seccion esta en modo demo. Puedes revisar la composicion y la jerarquia visual,
            pero los cambios no se guardan hasta conectar la base de datos.
          </div>
        </div>
      </div>
    </Card>
  );
}

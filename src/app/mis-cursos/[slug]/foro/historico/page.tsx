import type { Metadata } from "next";
import Link from "next/link";
import { Archive, ChevronRight, RotateCcw } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import {
  archiveForumSpaceAction,
  deleteForumSpaceAction,
  restoreForumSpaceAction
} from "@/actions/forum";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import { EmptyState } from "@/components/ui/empty-state";
import { ListRow } from "@/components/ui/list-row";
import { SectionHeader } from "@/components/ui/section-header";
import { StateBanner } from "@/components/ui/state-banner";
import { SurfaceCard } from "@/components/ui/surface-card";
import { requireUser } from "@/lib/auth";
import { getCatalogCourseBySlug } from "@/lib/course-catalog";
import {
  canAccessCourseCommunity,
  canModerateCourse,
  getRoleLabel
} from "@/lib/course-community";
import { getForumSpaceHistory } from "@/lib/forum";
import { formatCompactNumber, formatDate } from "@/lib/utils";

type ForumHistoryPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: ForumHistoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const course = await getCatalogCourseBySlug(slug);

  return {
    title: course ? `Historico del foro | ${course.title}` : "Historico del foro",
    robots: {
      index: false,
      follow: false
    }
  };
}

export default async function ForumHistoryPage({ params }: ForumHistoryPageProps) {
  const { slug } = await params;
  const [course, user] = await Promise.all([
    getCatalogCourseBySlug(slug),
    requireUser(`/mis-cursos/${slug}/foro/historico`),
  ]);

  if (!course) {
    notFound();
  }
  const access = await canAccessCourseCommunity({
    userId: user.id,
    email: user.email,
    courseSlug: course.slug,
    userGlobalRole: user.globalRole,
    userIsActive: user.isActive
  });

  if (!access.allowed) {
    redirect(`/checkout/${course.slug}`);
  }

  if (!canModerateCourse(access.role)) {
    redirect(`/mis-cursos/${course.slug}/foro`);
  }

  const history = await getForumSpaceHistory(course.slug);

  return (
    <div className="space-y-6 lg:space-y-8">
      <div className="flex flex-wrap items-center gap-2 text-sm text-[var(--color-muted)]">
        <Link className="hover:text-[var(--color-primary)]" href={`/mis-cursos/${course.slug}/foro`}>
          Comunidad
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-[var(--color-ink)]">Historico</span>
      </div>

      <SurfaceCard
        actions={
          <ButtonLink href={`/mis-cursos/${course.slug}/foro`} variant="neutral">
            Volver al foro
          </ButtonLink>
        }
        className="border-[rgba(22,60,88,0.1)] bg-white/90"
        padding="md"
      >
        <SectionHeader
          description="Gestiona la edicion activa del foro, consulta cohortes archivadas y decide cuando una edicion ya no debe seguir visible para el equipo."
          eyebrow={
            <span className="inline-flex flex-wrap items-center gap-2">
              <Badge tone="info">{getRoleLabel(access.role)}</Badge>
              <Badge tone="outline">{history.archivedSpaces.length} archivadas</Badge>
            </span>
          }
          title="Historico y archivo"
        />

        <div className="mt-5 grid gap-3 border-t border-[rgba(22,60,88,0.08)] pt-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: "Edicion activa",
              value: history.activeSpace.editionLabel
            },
            {
              label: "Hilos activos",
              value: formatCompactNumber(history.activeSpace.threadCount)
            },
            {
              label: "Archivadas",
              value: String(history.archivedSpaces.length)
            },
            {
              label: "Eliminadas",
              value: String(history.deletedSpaces.length)
            }
          ].map((metric) => (
            <div
              className="rounded-[var(--radius-md)] bg-[rgba(248,245,239,0.72)] px-4 py-3"
              key={metric.label}
            >
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-[var(--color-muted)]">
                {metric.label}
              </p>
              <p className="mt-1.5 font-premium text-[1.15rem] font-semibold tracking-[-0.04em] text-[var(--color-ink)] sm:text-[1.35rem]">
                {metric.value}
              </p>
            </div>
          ))}
        </div>
      </SurfaceCard>

      <SurfaceCard className="border-[rgba(22,60,88,0.08)] bg-white/90" padding="md">
        <SectionHeader
          actions={
            <form action={archiveForumSpaceAction}>
              <input name="courseSlug" type="hidden" value={course.slug} />
              <input
                name="nextPath"
                type="hidden"
                value={`/mis-cursos/${course.slug}/foro/historico`}
              />
              <ConfirmSubmitButton
                message="Se archivara la edicion actual y se abrira una nueva. Quieres continuar?"
                pendingLabel="Archivando..."
                variant="neutral"
              >
                Gestionar foro
              </ConfirmSubmitButton>
            </form>
          }
          description={`Foro principal de la edicion en curso. Creado el ${formatDate(history.activeSpace.createdAt)}.`}
          eyebrow={<Badge tone="info">Activo</Badge>}
          size="md"
          title={history.activeSpace.editionLabel}
        />

        <div className="mt-5 grid gap-3 border-t border-[rgba(22,60,88,0.08)] pt-4 sm:grid-cols-2">
          <div className="rounded-[var(--radius-md)] bg-[rgba(248,245,239,0.72)] px-4 py-3">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-[var(--color-muted)]">
              Hilos
            </p>
            <p className="mt-1.5 font-premium text-[1.6rem] font-semibold tracking-[-0.04em] text-[var(--color-ink)]">
              {formatCompactNumber(history.activeSpace.threadCount)}
            </p>
          </div>
          <div className="rounded-[var(--radius-md)] bg-[rgba(248,245,239,0.72)] px-4 py-3">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-[var(--color-muted)]">
              Categorias
            </p>
            <p className="mt-1.5 font-premium text-[1.6rem] font-semibold tracking-[-0.04em] text-[var(--color-ink)]">
              {history.activeSpace.categoryCount}
            </p>
          </div>
        </div>
      </SurfaceCard>

      <SurfaceCard className="border-[rgba(22,60,88,0.08)] bg-white/90 p-0">
        <div className="px-5 py-5 sm:px-6">
          <SectionHeader
            description="Cada restauracion convierte esa edicion en la activa. La actual pasa automaticamente al historico."
            eyebrow={<Badge tone="outline">Archivo operativo</Badge>}
            size="md"
            title="Ediciones archivadas"
          />
          {history.archivedSpaces.length ? (
            <StateBanner
              className="mt-4"
              description="Restaurar una edicion archivada mantiene intacta la logica del foro, pero cambia cual es el espacio principal visible para moderacion y comunidad."
              tone="info"
            />
          ) : null}
        </div>

        {history.archivedSpaces.length ? (
          <div className="divide-y divide-[rgba(22,60,88,0.08)]">
            {history.archivedSpaces.map((space) => (
              <article className="px-5 py-5 sm:px-6" key={space.id}>
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone="outline">Archivada</Badge>
                      <span className="text-sm text-[var(--color-muted)]">
                        Cerrado el {space.archivedAt ? formatDate(space.archivedAt) : "sin fecha"}
                      </span>
                    </div>
                    <h3 className="mt-3 font-premium text-heading-md font-semibold text-[var(--color-ink)]">
                      {space.editionLabel}
                    </h3>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="inline-flex items-center rounded-[var(--radius-pill)] bg-[rgba(248,245,239,0.8)] px-3 py-1.5 text-sm font-medium text-[var(--color-ink-soft)]">
                        {formatCompactNumber(space.threadCount)} hilos
                      </span>
                      <span className="inline-flex items-center rounded-[var(--radius-pill)] bg-[rgba(248,245,239,0.8)] px-3 py-1.5 text-sm font-medium text-[var(--color-ink-soft)]">
                        {space.categoryCount} categorias
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3 lg:justify-end">
                    <form action={restoreForumSpaceAction}>
                      <input name="courseSlug" type="hidden" value={course.slug} />
                      <input name="forumSpaceId" type="hidden" value={space.id} />
                      <input
                        name="nextPath"
                        type="hidden"
                        value={`/mis-cursos/${course.slug}/foro/historico`}
                      />
                      <ConfirmSubmitButton
                        message="La edicion seleccionada pasara a ser la activa. Quieres continuar?"
                        pendingLabel="Restaurando..."
                        variant="subtle"
                      >
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Restaurar
                      </ConfirmSubmitButton>
                    </form>

                    <form action={deleteForumSpaceAction}>
                      <input name="courseSlug" type="hidden" value={course.slug} />
                      <input name="forumSpaceId" type="hidden" value={space.id} />
                      <input
                        name="nextPath"
                        type="hidden"
                        value={`/mis-cursos/${course.slug}/foro/historico`}
                      />
                      <ConfirmSubmitButton
                        message="La edicion archivada se retirara del historico. Quieres continuar?"
                        pendingLabel="Eliminando..."
                        variant="neutral"
                      >
                        Eliminar
                      </ConfirmSubmitButton>
                    </form>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState
            align="center"
            className="m-5 sm:m-6"
            description="Cuando cierres una edicion del foro aparecera aqui para restaurarla o retirarla mas adelante."
            title="Todavia no hay ediciones archivadas"
            tone="subtle"
          />
        )}
      </SurfaceCard>

      <SurfaceCard className="border-[rgba(22,60,88,0.08)] bg-white/90" padding="md">
        <SectionHeader
          description="Rastro de espacios que ya no forman parte del historico operativo."
          eyebrow={<Badge tone="outline">Solo consulta</Badge>}
          size="md"
          title="Ediciones eliminadas"
        />

        {history.deletedSpaces.length ? (
          <div className="mt-4 space-y-3">
            {history.deletedSpaces.map((space) => (
              <ListRow
                description={`Eliminada el ${space.deletedAt ? formatDate(space.deletedAt) : "sin fecha"}.`}
                emphasis="muted"
                key={space.id}
                leading={
                  <div className="grid h-10 w-10 place-items-center rounded-[var(--radius-md)] bg-[rgba(248,245,239,0.82)] text-[var(--color-muted)]">
                    <Archive className="h-4 w-4" />
                  </div>
                }
                title={space.editionLabel}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            className="mt-4 px-5 py-6"
            description="No hay ediciones retiradas del historico en este momento."
            title="No hay ediciones eliminadas"
            tone="subtle"
          />
        )}
      </SurfaceCard>
    </div>
  );
}

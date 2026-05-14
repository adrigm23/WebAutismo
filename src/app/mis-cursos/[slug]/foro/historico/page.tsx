import type { Metadata } from "next";
import Link from "next/link";
import { Archive, ChevronRight, Layers3, RotateCcw } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import {
  archiveForumSpaceAction,
  deleteForumSpaceAction,
  restoreForumSpaceAction
} from "@/actions/forum";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
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
    title: course ? `Histórico del foro | ${course.title}` : "Histórico del foro",
    robots: {
      index: false,
      follow: false
    }
  };
}

export default async function ForumHistoryPage({ params }: ForumHistoryPageProps) {
  const { slug } = await params;
  const course = await getCatalogCourseBySlug(slug);

  if (!course) {
    notFound();
  }

  const user = await requireUser(`/mis-cursos/${course.slug}/foro/historico`);
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
    <div className="space-y-8">
      <div className="flex flex-wrap items-center gap-2 text-sm text-[var(--color-muted)]">
        <Link className="hover:text-[var(--color-primary)]" href={`/mis-cursos/${course.slug}/foro`}>
          Foro
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-[var(--color-ink)]">Histórico</span>
      </div>

      <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <Badge tone="teacher">{getRoleLabel(access.role)}</Badge>
          <h1 className="mt-4 text-5xl font-semibold tracking-[-0.05em] text-[var(--color-ink)] sm:text-[4rem]">
            Histórico y Archivo
          </h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-[var(--color-muted)]">
            Gestiona la edición activa del foro, restaura cohortes anteriores y retira ediciones del histórico cuando ya no deban permanecer accesibles al staff.
          </p>
        </div>

        <ButtonLink href={`/mis-cursos/${course.slug}/foro`} variant="secondary">
          Volver al foro
        </ButtonLink>
      </div>

      <section className="space-y-5">
        <div className="flex items-center gap-3">
          <Layers3 className="h-5 w-5 text-[var(--color-primary)]" />
          <h2 className="text-4xl font-semibold tracking-[-0.04em] text-[var(--color-ink)]">
            Edición actual
          </h2>
        </div>

        <div className="rounded-[30px] border border-[rgba(12,113,195,0.14)] bg-white px-6 py-6 shadow-[0_18px_40px_rgba(34,34,33,0.05)]">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
            <div className="min-w-0 flex-1">
              <Badge tone="teacher">Activo</Badge>
              <h3 className="mt-4 text-[2.6rem] font-semibold tracking-[-0.05em] text-[var(--color-ink)]">
                {history.activeSpace.editionLabel}
              </h3>
              <p className="mt-3 max-w-3xl text-lg leading-8 text-[var(--color-muted)]">
                Foro principal de la edición en curso. Creado el {formatDate(history.activeSpace.createdAt)}.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-[24px] border border-[rgba(12,113,195,0.12)] bg-[#faf8f4] px-5 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">
                  Hilos
                </p>
                <p className="mt-2 text-4xl font-semibold tracking-[-0.05em] text-[var(--color-ink)]">
                  {formatCompactNumber(history.activeSpace.threadCount)}
                </p>
              </div>
              <div className="rounded-[24px] border border-[rgba(12,113,195,0.12)] bg-[#faf8f4] px-5 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">
                  Categorías
                </p>
                <p className="mt-2 text-4xl font-semibold tracking-[-0.05em] text-[var(--color-ink)]">
                  {history.activeSpace.categoryCount}
                </p>
              </div>
              <form action={archiveForumSpaceAction} className="flex">
                <input name="courseSlug" type="hidden" value={course.slug} />
                <input
                  name="nextPath"
                  type="hidden"
                  value={`/mis-cursos/${course.slug}/foro/historico`}
                />
                <ConfirmSubmitButton
                  className="w-full rounded-[24px]"
                  message="Se archivará la edición actual y se abrirá una nueva. ¿Quieres continuar?"
                  pendingLabel="Archivando..."
                  variant="secondary"
                >
                  Gestionar foro
                </ConfirmSubmitButton>
              </form>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-5">
        <div className="flex items-center gap-3">
          <Archive className="h-5 w-5 text-[var(--color-primary)]" />
          <h2 className="text-4xl font-semibold tracking-[-0.04em] text-[var(--color-ink)]">
            Ediciones archivadas
          </h2>
        </div>

        <div className="space-y-4">
          {history.archivedSpaces.length ? (
            history.archivedSpaces.map((space) => (
              <div
                className="rounded-[30px] border border-[rgba(12,113,195,0.14)] bg-white px-6 py-6 shadow-[0_18px_40px_rgba(34,34,33,0.05)]"
                key={space.id}
              >
                <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-4">
                      <div className="grid h-14 w-14 place-items-center rounded-full bg-[#f3f1ee] text-[var(--color-muted)]">
                        <Archive className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-[2rem] font-semibold tracking-[-0.04em] text-[var(--color-ink)]">
                          {space.editionLabel}
                        </h3>
                        <p className="mt-1 text-lg text-[var(--color-muted)]">
                          Cerrado el {space.archivedAt ? formatDate(space.archivedAt) : "sin fecha"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-[9rem_9rem_auto] xl:items-center">
                    <div className="text-right">
                      <p className="text-3xl font-semibold tracking-[-0.04em] text-[var(--color-ink)]">
                        {formatCompactNumber(space.threadCount)}
                      </p>
                      <p className="text-sm uppercase tracking-[0.14em] text-[var(--color-muted)]">
                        Hilos
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-semibold tracking-[-0.04em] text-[var(--color-ink)]">
                        {space.categoryCount}
                      </p>
                      <p className="text-sm uppercase tracking-[0.14em] text-[var(--color-muted)]">
                        Categorías
                      </p>
                    </div>
                    <div className="flex flex-wrap justify-end gap-3">
                      <form action={restoreForumSpaceAction}>
                        <input name="courseSlug" type="hidden" value={course.slug} />
                        <input name="forumSpaceId" type="hidden" value={space.id} />
                        <input
                          name="nextPath"
                          type="hidden"
                          value={`/mis-cursos/${course.slug}/foro/historico`}
                        />
                        <ConfirmSubmitButton
                          message="La edición seleccionada pasará a ser la activa. ¿Quieres continuar?"
                          pendingLabel="Restaurando..."
                          variant="ghost"
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
                          message="La edición archivada se retirará del histórico. ¿Quieres continuar?"
                          pendingLabel="Eliminando..."
                          variant="secondary"
                        >
                          Eliminar
                        </ConfirmSubmitButton>
                      </form>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-[28px] border border-dashed border-[rgba(12,113,195,0.18)] bg-white px-6 py-8 text-[var(--color-muted)]">
              Todavía no hay ediciones archivadas.
            </div>
          )}
        </div>
      </section>

      <section className="space-y-5">
        <div className="flex items-center gap-3">
          <Archive className="h-5 w-5 text-[var(--color-primary)]" />
          <h2 className="text-4xl font-semibold tracking-[-0.04em] text-[var(--color-ink)]">
            Ediciones eliminadas
          </h2>
        </div>

        <div className="space-y-4">
          {history.deletedSpaces.length ? (
            history.deletedSpaces.map((space) => (
              <div
                className="rounded-[28px] border border-dashed border-[rgba(12,113,195,0.18)] bg-white px-6 py-5"
                key={space.id}
              >
                <h3 className="text-2xl font-semibold tracking-[-0.04em] text-[var(--color-ink)]">
                  {space.editionLabel}
                </h3>
                <p className="mt-2 text-[var(--color-muted)]">
                  Eliminada el {space.deletedAt ? formatDate(space.deletedAt) : "sin fecha"}
                </p>
              </div>
            ))
          ) : (
            <div className="rounded-[28px] border border-dashed border-[rgba(12,113,195,0.18)] bg-white px-6 py-8 text-[var(--color-muted)]">
              No hay ediciones eliminadas.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

"use client";

import { useActionState, useState } from "react";
import { createForumThreadAction, type ForumFormState } from "@/actions/forum";
import { ButtonLink } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";

const initialState: ForumFormState = {};

type ForumThreadComposerProps = {
  courseSlug: string;
  categories: Array<{
    slug: string;
    title: string;
  }>;
  selectedCategorySlug?: string;
  lockCategory?: boolean;
  allowAnnouncement: boolean;
  cancelHref: string;
};

export function ForumThreadComposer({
  courseSlug,
  categories,
  selectedCategorySlug,
  lockCategory = false,
  allowAnnouncement,
  cancelHref
}: ForumThreadComposerProps) {
  const [state, action] = useActionState(createForumThreadAction, initialState);
  const [threadType, setThreadType] = useState<"DISCUSSION" | "ANNOUNCEMENT">("DISCUSSION");

  return (
    <form action={action} className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
      <input name="courseSlug" type="hidden" value={courseSlug} />

      <div className="space-y-6">
        <section className="overflow-hidden rounded-[28px] border border-[rgba(12,113,195,0.14)] bg-white shadow-[0_18px_40px_rgba(34,34,33,0.05)]">
          <div className="border-b border-[rgba(12,113,195,0.1)] px-6 py-5">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-muted)]">
              Contenido principal
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[var(--color-ink)]">
              Redacta el hilo
            </h2>
          </div>

          <div className="space-y-5 px-6 py-6">
            <label className="block space-y-2">
              <span className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--color-muted)]">
                Título del hilo
              </span>
              <Input
                className="h-16 rounded-2xl px-5 text-lg"
                name="title"
                placeholder="Escribe un título claro y específico..."
                required
              />
            </label>

            {lockCategory && selectedCategorySlug ? (
              <>
                <input name="categorySlug" type="hidden" value={selectedCategorySlug} />
                <div className="space-y-2">
                  <span className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--color-muted)]">
                    Categoría
                  </span>
                  <div className="flex min-h-16 items-center rounded-2xl border border-[var(--color-border)] bg-[#f8f6f3] px-5 text-base text-[var(--color-ink)]">
                    {categories.find((category) => category.slug === selectedCategorySlug)?.title ??
                      "Categoría seleccionada"}
                  </div>
                </div>
              </>
            ) : (
              <label className="block space-y-2">
                <span className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--color-muted)]">
                  Categoría
                </span>
                <select
                  className="h-16 w-full rounded-2xl border border-[var(--color-border)] bg-white px-5 text-base text-[var(--color-ink)] outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[rgba(12,113,195,0.18)]"
                  defaultValue={selectedCategorySlug ?? categories[0]?.slug}
                  name="categorySlug"
                >
                  {categories.map((category) => (
                    <option key={category.slug} value={category.slug}>
                      {category.title}
                    </option>
                  ))}
                </select>
              </label>
            )}

            <label className="block space-y-2">
              <span className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--color-muted)]">
                Mensaje inicial
              </span>
              <Textarea
                className="min-h-[20rem] rounded-2xl px-5 py-4 text-base leading-8"
                name="body"
                placeholder="Explica el contexto, la duda o la aportación que quieres compartir con el grupo."
                required
                rows={12}
              />
            </label>
          </div>
        </section>

        <section className="overflow-hidden rounded-[28px] border border-dashed border-[rgba(12,113,195,0.22)] bg-white shadow-[0_18px_40px_rgba(34,34,33,0.04)]">
          <div className="border-b border-[rgba(12,113,195,0.1)] px-6 py-5">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-muted)]">
              Adjuntos
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[var(--color-ink)]">
              Recursos de apoyo
            </h2>
          </div>

          <div className="space-y-5 px-6 py-6">
            <label className="block space-y-2">
              <span className="text-sm font-medium text-[var(--color-ink)]">
                Archivos o imágenes
              </span>
              <Input
                className="h-auto rounded-2xl px-4 py-4 file:mr-3 file:rounded-xl file:border-0 file:bg-[var(--color-primary-soft)] file:px-3 file:py-2 file:text-sm file:font-semibold file:text-[var(--color-primary)]"
                multiple
                name="attachments"
                type="file"
              />
              <p className="text-sm leading-7 text-[var(--color-muted)]">
                Hasta 6 adjuntos por mensaje y 8 MB por archivo.
              </p>
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-[var(--color-ink)]">
                Enlaces o recursos externos
              </span>
              <Textarea
                className="rounded-2xl px-5 py-4"
                name="attachmentLinks"
                placeholder="Pega un enlace por línea. Los vídeos de YouTube o Vimeo se guardarán como recurso de vídeo."
                rows={4}
              />
            </label>
          </div>
        </section>
      </div>

      <aside className="space-y-6 xl:sticky xl:top-28 xl:self-start">
        <section className="overflow-hidden rounded-[28px] border border-[rgba(255,182,6,0.35)] bg-white shadow-[0_18px_40px_rgba(34,34,33,0.05)]">
          <div className="border-b border-[rgba(12,113,195,0.1)] px-6 py-5">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-muted)]">
              Publicación
            </p>
            <h2 className="mt-2 text-[2rem] font-semibold tracking-[-0.03em] text-[var(--color-ink)]">
              Ajustes
            </h2>
          </div>

          <div className="space-y-5 px-6 py-6">
            {allowAnnouncement ? (
              <>
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-[var(--color-ink)]">Tipo de publicación</span>
                  <select
                    className="h-14 w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 text-sm text-[var(--color-ink)] outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[rgba(12,113,195,0.18)]"
                    name="threadType"
                    onChange={(event) =>
                      setThreadType(event.target.value as "DISCUSSION" | "ANNOUNCEMENT")
                    }
                    value={threadType}
                  >
                    <option value="DISCUSSION">Hilo de discusión</option>
                    <option value="ANNOUNCEMENT">Anuncio</option>
                  </select>
                </label>

                <label className="flex items-start gap-3 rounded-2xl border border-[var(--color-border)] bg-[#faf8f4] px-4 py-4">
                  <input className="mt-1 h-4 w-4 accent-[var(--color-primary)]" name="isReadOnly" type="checkbox" />
                  <div>
                    <p className="text-sm font-semibold text-[var(--color-ink)]">Solo lectura</p>
                    <p className="mt-1 text-sm leading-6 text-[var(--color-muted)]">
                      Convierte el hilo en un anuncio que no admite respuestas.
                    </p>
                  </div>
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-medium text-[var(--color-ink)]">
                    Programar publicación
                  </span>
                  <Input disabled={threadType !== "ANNOUNCEMENT"} name="scheduledFor" type="datetime-local" />
                  <p className="text-sm leading-6 text-[var(--color-muted)]">
                    Disponible para anuncios. Si queda vacío, se publica de inmediato.
                  </p>
                </label>
              </>
            ) : (
              <input name="threadType" type="hidden" value="DISCUSSION" />
            )}

            {allowAnnouncement ? (
              <label className="flex items-start gap-3 rounded-2xl border border-[var(--color-border)] bg-[#faf8f4] px-4 py-4">
                <input className="mt-1 h-4 w-4 accent-[var(--color-primary)]" name="isPinned" type="checkbox" />
                <div>
                  <p className="text-sm font-semibold text-[var(--color-ink)]">Fijar hilo</p>
                  <p className="mt-1 text-sm leading-6 text-[var(--color-muted)]">
                    Mantenerlo visible en la parte superior de la categoría.
                  </p>
                </div>
              </label>
            ) : null}

            <div className="rounded-2xl border border-dashed border-[rgba(12,113,195,0.16)] px-4 py-4 text-sm leading-7 text-[var(--color-muted)]">
              Usa un título concreto y describe contexto, módulo o actividad para que la conversación se pueda recuperar después.
            </div>
          </div>
        </section>

        <section className="rounded-[28px] border border-[rgba(12,113,195,0.14)] bg-white p-6 shadow-[0_18px_40px_rgba(34,34,33,0.04)]">
          <div className="space-y-4">
            {state.error ? (
              <p className="rounded-2xl border border-[#efb3a6] bg-[#fff1ec] px-4 py-3 text-sm text-[#9b4128]">
                {state.error}
              </p>
            ) : null}

            <SubmitButton className="w-full justify-center rounded-2xl py-4 text-base" pendingLabel="Publicando...">
              Publicar contenido
            </SubmitButton>
            <ButtonLink className="w-full justify-center rounded-2xl py-4" href={cancelHref} variant="ghost">
              Cancelar
            </ButtonLink>
          </div>
        </section>
      </aside>
    </form>
  );
}

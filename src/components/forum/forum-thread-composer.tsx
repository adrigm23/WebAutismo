"use client";

import { useActionState, useId, useState } from "react";
import { createForumThreadAction, type ForumFormState } from "@/actions/forum";
import { ButtonLink } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { SectionHeader } from "@/components/ui/section-header";
import { StateBanner } from "@/components/ui/state-banner";
import { SubmitButton } from "@/components/ui/submit-button";
import { SurfaceCard } from "@/components/ui/surface-card";
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

const selectClassName = "ui-control-base min-h-14 px-4 text-sm sm:text-base";

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
  const titleId = useId();
  const bodyId = useId();
  const linksId = useId();

  return (
    <form action={action} className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_19.5rem]">
      <input name="courseSlug" type="hidden" value={courseSlug} />

      <div className="space-y-6">
        <SurfaceCard className="border-[rgba(22,60,88,0.09)] bg-white/92" padding="md">
          <SectionHeader
            description="Escribe un hilo fácil de recuperar: buen título, contexto suficiente y una pregunta o idea clara."
            eyebrow="Composición"
            size="md"
            title="Redacta la conversación"
          />

          <div className="mt-5 space-y-5">
            <FormField
              description="Piensa en el título como la línea que ayudará a encontrar esta conversación dentro del curso."
              htmlFor={titleId}
              label="Título del hilo"
              required
            >
              <Input
                className="min-h-14 px-5 text-base sm:text-lg"
                id={titleId}
                name="title"
                placeholder="Escribe un título claro y específico..."
                required
              />
            </FormField>

            {lockCategory && selectedCategorySlug ? (
              <>
                <input name="categorySlug" type="hidden" value={selectedCategorySlug} />
                <FormField label="Categoría">
                  <div className="flex min-h-14 items-center rounded-[var(--radius-md)] border border-[rgba(22,60,88,0.1)] bg-[rgba(248,245,239,0.82)] px-5 text-sm text-[var(--color-ink)] shadow-[var(--shadow-inset-soft)] sm:text-base">
                    {categories.find((category) => category.slug === selectedCategorySlug)?.title ??
                      "Categoría seleccionada"}
                  </div>
                </FormField>
              </>
            ) : (
              <FormField label="Categoría">
                <select
                  className={selectClassName}
                  defaultValue={selectedCategorySlug ?? categories[0]?.slug}
                  name="categorySlug"
                >
                  {categories.map((category) => (
                    <option key={category.slug} value={category.slug}>
                      {category.title}
                    </option>
                  ))}
                </select>
              </FormField>
            )}

            <FormField
              description="Describe el contexto, cita el módulo o actividad y deja clara la pregunta o aportación."
              htmlFor={bodyId}
              label="Mensaje inicial"
              required
            >
              <Textarea
                className="min-h-[18rem] px-5 py-4 text-base leading-8"
                id={bodyId}
                name="body"
                placeholder="Explica el contexto, la duda o la aportación que quieres compartir con el grupo."
                required
                rows={12}
              />
            </FormField>
          </div>
          <div className="mt-6 border-t border-[rgba(22,60,88,0.08)] pt-5">
            <SectionHeader
              description="Los adjuntos se mantienen como apoyo visual o documental; no deberían cargar más la lectura de lo necesario."
              eyebrow="Adjuntos"
              size="md"
              title="Recursos de apoyo"
            />

            <div className="mt-5 space-y-5">
            <FormField
              description="Hasta 6 adjuntos por mensaje y 8 MB por archivo."
              label="Archivos o imágenes"
            >
              <Input
                className="h-auto px-4 py-4 file:mr-3 file:rounded-[var(--radius-sm)] file:border-0 file:bg-[var(--color-brand-soft)] file:px-3 file:py-2 file:text-sm file:font-semibold file:text-[var(--color-primary)]"
                multiple
                name="attachments"
                type="file"
              />
            </FormField>

            <FormField
              description="Pega un enlace por línea. Los vídeos de YouTube o Vimeo se guardarán como recurso de vídeo."
              htmlFor={linksId}
              label="Enlaces o recursos externos"
            >
              <Textarea
                id={linksId}
                name="attachmentLinks"
                placeholder="https://..."
                rows={4}
              />
            </FormField>
          </div>
          </div>
        </SurfaceCard>
      </div>

      <aside className="space-y-6 xl:sticky xl:top-28 xl:self-start">
        <SurfaceCard className="border-[rgba(22,60,88,0.08)] bg-white/90" padding="md">
          <SectionHeader eyebrow="Publicación" size="md" title="Ajustes" />

          <div className="mt-4 space-y-4">
            {allowAnnouncement ? (
              <>
                <FormField label="Tipo de publicación">
                  <select
                    className={selectClassName}
                    name="threadType"
                    onChange={(event) =>
                      setThreadType(event.target.value as "DISCUSSION" | "ANNOUNCEMENT")
                    }
                    value={threadType}
                  >
                    <option value="DISCUSSION">Hilo de discusión</option>
                    <option value="ANNOUNCEMENT">Anuncio</option>
                  </select>
                </FormField>

                <label className="flex items-start gap-3 rounded-[var(--radius-md)] border border-[rgba(22,60,88,0.1)] bg-[rgba(248,245,239,0.82)] px-4 py-4">
                  <input
                    className="mt-1 h-4 w-4 accent-[var(--color-primary)]"
                    name="isReadOnly"
                    type="checkbox"
                  />
                  <div>
                    <p className="text-sm font-semibold text-[var(--color-ink)]">Solo lectura</p>
                    <p className="mt-1 text-sm leading-6 text-[var(--color-muted)]">
                      Convierte el hilo en un anuncio que no admite respuestas.
                    </p>
                  </div>
                </label>

                <FormField
                  description="Disponible para anuncios. Si queda vacío, se publica de inmediato."
                  label="Programar publicación"
                >
                  <Input
                    disabled={threadType !== "ANNOUNCEMENT"}
                    name="scheduledFor"
                    type="datetime-local"
                  />
                </FormField>
              </>
            ) : (
              <input name="threadType" type="hidden" value="DISCUSSION" />
            )}

            {allowAnnouncement ? (
              <label className="flex items-start gap-3 rounded-[var(--radius-md)] border border-[rgba(22,60,88,0.1)] bg-[rgba(248,245,239,0.82)] px-4 py-4">
                <input
                  className="mt-1 h-4 w-4 accent-[var(--color-primary)]"
                  name="isPinned"
                  type="checkbox"
                />
                <div>
                  <p className="text-sm font-semibold text-[var(--color-ink)]">Fijar hilo</p>
                  <p className="mt-1 text-sm leading-6 text-[var(--color-muted)]">
                    Mantenerlo visible en la parte superior de la categoría.
                  </p>
                </div>
              </label>
            ) : null}

            <StateBanner description="Prioriza claridad y contexto para que el hilo se pueda recuperar y seguir sin esfuerzo." tone="info" />
          </div>
        </SurfaceCard>

        <SurfaceCard className="border-[rgba(22,60,88,0.08)] bg-white/90" padding="md">
          <div className="space-y-4">
            {state.error ? <StateBanner description={state.error} tone="danger" /> : null}

            <SubmitButton className="w-full justify-center py-4 text-base" pendingLabel="Publicando...">
              Publicar contenido
            </SubmitButton>
            <ButtonLink className="w-full justify-center py-4" href={cancelHref} variant="subtle">
              Cancelar
            </ButtonLink>
          </div>
        </SurfaceCard>
      </aside>
    </form>
  );
}

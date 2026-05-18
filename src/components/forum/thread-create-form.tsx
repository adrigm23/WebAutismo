"use client";

import { useActionState } from "react";
import { createForumThreadAction, type ForumFormState } from "@/actions/forum";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";

const initialState: ForumFormState = {};

type ThreadCreateFormProps = {
  courseSlug: string;
  categorySlug: string;
  compact?: boolean;
  allowAnnouncement?: boolean;
};

const selectClassName =
  "ui-control-base min-h-[var(--control-height-md)] px-4 text-sm";

export function ThreadCreateForm({
  courseSlug,
  categorySlug,
  compact = false,
  allowAnnouncement = false
}: ThreadCreateFormProps) {
  const [state, action] = useActionState(createForumThreadAction, initialState);

  return (
    <form action={action} className="space-y-5">
      <input name="courseSlug" type="hidden" value={courseSlug} />
      <input name="categorySlug" type="hidden" value={categorySlug} />

      {allowAnnouncement ? (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-2">
              <span className="text-sm font-semibold text-[var(--color-ink)]">Tipo</span>
              <select className={selectClassName} defaultValue="DISCUSSION" name="threadType">
                <option value="DISCUSSION">Hilo</option>
                <option value="ANNOUNCEMENT">Anuncio</option>
              </select>
            </label>

            <label className="flex items-center gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white px-4 py-3 shadow-[var(--shadow-inset-soft)]">
              <input
                className="h-4 w-4 accent-[var(--color-primary)]"
                name="isReadOnly"
                type="checkbox"
              />
              <span className="text-sm text-[var(--color-ink)]">Solo lectura</span>
            </label>
          </div>

          <label className="block space-y-2">
            <span className="text-sm font-semibold text-[var(--color-ink)]">
              Programar anuncio (opcional)
            </span>
            <Input name="scheduledFor" type="datetime-local" />
            <p className="text-xs leading-6 text-[var(--color-muted)]">
              Si completas esta fecha, el contenido queda oculto para el alumnado hasta ese
              momento. Solo se aplica a anuncios.
            </p>
          </label>
        </div>
      ) : (
        <input name="threadType" type="hidden" value="DISCUSSION" />
      )}

      <label className="block space-y-2">
        <span className="text-sm font-semibold text-[var(--color-ink)]">Título del hilo</span>
        <Input name="title" placeholder="Ej.: Duda sobre la unidad 1" required />
      </label>

      <label className="block space-y-2">
        <span className="text-sm font-semibold text-[var(--color-ink)]">Mensaje inicial</span>
        <Textarea
          name="body"
          placeholder="Describe tu duda, reflexión o aportación para el grupo."
          required
          rows={compact ? 5 : 7}
        />
      </label>

      <div className="grid gap-4">
        <label className="block space-y-2">
          <span className="text-sm font-semibold text-[var(--color-ink)]">
            Adjuntar archivos o imágenes
          </span>
          <Input
            className="h-auto px-3 py-3 file:mr-3 file:rounded-[var(--radius-sm)] file:border-0 file:bg-[var(--color-primary-soft)] file:px-3 file:py-2 file:text-sm file:font-semibold file:text-[var(--color-primary)]"
            multiple
            name="attachments"
            type="file"
          />
          <p className="text-xs leading-6 text-[var(--color-muted)]">
            Hasta 6 adjuntos por mensaje y 8 MB por archivo.
          </p>
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-semibold text-[var(--color-ink)]">
            Enlaces o recursos externos
          </span>
          <Textarea
            name="attachmentLinks"
            placeholder="Pega un enlace por línea. Los vídeos de YouTube o Vimeo se guardarán como recurso de vídeo."
            rows={3}
          />
        </label>
      </div>

      {state.error ? (
        <p className="rounded-[var(--radius-md)] border border-[#efb3a6] bg-[#fff1ec] px-4 py-3 text-sm text-[#9b4128]">
          {state.error}
        </p>
      ) : null}

      <SubmitButton className={compact ? "" : "w-full sm:w-auto"} pendingLabel="Publicando...">
        {allowAnnouncement ? "Publicar o programar" : "Crear hilo"}
      </SubmitButton>
    </form>
  );
}

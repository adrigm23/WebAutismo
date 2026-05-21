"use client";

import { useId, useActionState } from "react";
import { createForumThreadAction, type ForumFormState } from "@/actions/forum";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { StateBanner } from "@/components/ui/state-banner";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";

const initialState: ForumFormState = {};

type ThreadCreateFormProps = {
  courseSlug: string;
  categorySlug: string;
  compact?: boolean;
  allowAnnouncement?: boolean;
};

const selectClassName = "ui-control-base min-h-[var(--control-height-md)] px-4 text-sm";

export function ThreadCreateForm({
  courseSlug,
  categorySlug,
  compact = false,
  allowAnnouncement = false
}: ThreadCreateFormProps) {
  const [state, action] = useActionState(createForumThreadAction, initialState);
  const titleId = useId();
  const bodyId = useId();
  const linksId = useId();

  return (
    <form action={action} className="space-y-5">
      <input name="courseSlug" type="hidden" value={courseSlug} />
      <input name="categorySlug" type="hidden" value={categorySlug} />

      {allowAnnouncement ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Tipo de publicación">
            <select className={selectClassName} defaultValue="DISCUSSION" name="threadType">
              <option value="DISCUSSION">Hilo</option>
              <option value="ANNOUNCEMENT">Anuncio</option>
            </select>
          </FormField>

          <FormField
            description="Si completas esta fecha, el contenido queda oculto para el alumnado hasta ese momento."
            label="Programar anuncio"
          >
            <Input name="scheduledFor" type="datetime-local" />
          </FormField>

          <label className="flex items-center gap-3 rounded-[var(--radius-md)] border border-[rgba(22,60,88,0.1)] bg-[rgba(248,245,239,0.8)] px-4 py-3 shadow-[var(--shadow-inset-soft)] sm:col-span-2">
            <input
              className="h-4 w-4 accent-[var(--color-primary)]"
              name="isReadOnly"
              type="checkbox"
            />
            <span className="text-sm text-[var(--color-ink)]">Solo lectura</span>
          </label>
        </div>
      ) : (
        <input name="threadType" type="hidden" value="DISCUSSION" />
      )}

      <FormField
        description="Un buen título ayuda a recuperar la conversación más tarde."
        htmlFor={titleId}
        label="Título del hilo"
        required
      >
        <Input id={titleId} name="title" placeholder="Ej.: Duda sobre la unidad 1" required />
      </FormField>

      <FormField
        description="Describe la duda, el contexto o la aportación que quieres dejar al grupo."
        htmlFor={bodyId}
        label="Mensaje inicial"
        required
      >
        <Textarea
          id={bodyId}
          name="body"
          placeholder="Escribe con el contexto suficiente para que el resto pueda seguirte sin esfuerzo."
          required
          rows={compact ? 5 : 7}
        />
      </FormField>

      <div className="grid gap-4 border-t border-[rgba(22,60,88,0.08)] pt-4">
        <FormField
          description="Hasta 6 adjuntos por mensaje y 8 MB por archivo."
          label="Adjuntar archivos o imágenes"
        >
          <Input
            className="h-auto px-3 py-3 file:mr-3 file:rounded-[var(--radius-sm)] file:border-0 file:bg-[var(--color-brand-soft)] file:px-3 file:py-2 file:text-sm file:font-semibold file:text-[var(--color-primary)]"
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
            rows={3}
          />
        </FormField>
      </div>

      {state.error ? (
        <StateBanner description={state.error} tone="danger" />
      ) : null}

      <SubmitButton className={compact ? "" : "w-full sm:w-auto"} pendingLabel="Publicando...">
        {allowAnnouncement ? "Publicar o programar" : "Crear hilo"}
      </SubmitButton>
    </form>
  );
}

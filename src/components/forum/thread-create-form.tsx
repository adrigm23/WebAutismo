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

export function ThreadCreateForm({
  courseSlug,
  categorySlug,
  compact = false,
  allowAnnouncement = false
}: ThreadCreateFormProps) {
  const [state, action] = useActionState(createForumThreadAction, initialState);

  return (
    <form action={action} className="space-y-4">
      <input name="courseSlug" type="hidden" value={courseSlug} />
      <input name="categorySlug" type="hidden" value={categorySlug} />

      {allowAnnouncement ? (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-2">
              <span className="text-sm font-medium text-[var(--color-ink)]">Tipo</span>
              <select
                className="h-12 w-full rounded-xl border border-[var(--color-border)] bg-white px-4 text-sm text-[var(--color-ink)] shadow-sm outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[color:rgba(12,113,195,0.18)]"
                defaultValue="DISCUSSION"
                name="threadType"
              >
                <option value="DISCUSSION">Hilo</option>
                <option value="ANNOUNCEMENT">Anuncio</option>
              </select>
            </label>

            <label className="flex items-center gap-3 rounded-xl border border-[var(--color-border)] bg-white px-4 py-3">
              <input
                className="h-4 w-4 accent-[var(--color-primary)]"
                name="isReadOnly"
                type="checkbox"
              />
              <span className="text-sm text-[var(--color-ink)]">Solo lectura</span>
            </label>
          </div>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-[var(--color-ink)]">
              Programar anuncio (opcional)
            </span>
            <Input name="scheduledFor" type="datetime-local" />
            <p className="text-xs leading-6 text-[var(--color-muted)]">
              Si completas esta fecha, el contenido quedara oculto para el alumnado hasta ese
              momento. Solo se aplica a anuncios.
            </p>
          </label>
        </div>
      ) : (
        <input name="threadType" type="hidden" value="DISCUSSION" />
      )}

      <label className="block space-y-2">
        <span className="text-sm font-medium text-[var(--color-ink)]">Titulo del hilo</span>
        <Input name="title" placeholder="Ej.: Duda sobre la unidad 1" required />
      </label>

      <label className="block space-y-2">
        <span className="text-sm font-medium text-[var(--color-ink)]">Mensaje inicial</span>
        <Textarea
          name="body"
          placeholder="Describe tu duda, reflexion o aportacion para el grupo."
          required
          rows={compact ? 5 : 7}
        />
      </label>

      <div className="grid gap-4">
        <label className="block space-y-2">
          <span className="text-sm font-medium text-[var(--color-ink)]">
            Adjuntar archivos o imagenes
          </span>
          <Input
            className="h-auto px-3 py-3 file:mr-3 file:rounded-lg file:border-0 file:bg-[var(--color-primary-soft)] file:px-3 file:py-2 file:text-sm file:font-semibold file:text-[var(--color-primary)]"
            multiple
            name="attachments"
            type="file"
          />
          <p className="text-xs leading-6 text-[var(--color-muted)]">
            Hasta 6 adjuntos por mensaje y 8 MB por archivo.
          </p>
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-[var(--color-ink)]">
            Enlaces o recursos externos
          </span>
          <Textarea
            name="attachmentLinks"
            placeholder="Pega un enlace por linea. Los videos de YouTube o Vimeo se guardaran como recurso de video."
            rows={3}
          />
        </label>
      </div>

      {state.error ? (
        <p className="rounded-2xl border border-[#efb3a6] bg-[#fff1ec] px-4 py-3 text-sm text-[#9b4128]">
          {state.error}
        </p>
      ) : null}

      <SubmitButton pendingLabel="Publicando..." className={compact ? "" : "w-full sm:w-auto"}>
        {allowAnnouncement ? "Publicar o programar" : "Crear hilo"}
      </SubmitButton>
    </form>
  );
}

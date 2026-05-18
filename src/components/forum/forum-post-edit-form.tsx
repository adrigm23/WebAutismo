"use client";

import { useActionState } from "react";
import {
  deleteForumAttachmentAction,
  editForumPostAction,
  type ForumFormState
} from "@/actions/forum";
import { ButtonLink } from "@/components/ui/button";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";

const initialState: ForumFormState = {};

type ForumPostEditFormProps = {
  courseSlug: string;
  categorySlug: string;
  threadId: string;
  postId: string;
  cancelHref: string;
  initialBody: string;
  existingAttachments: Array<{
    id: string;
    label: string;
  }>;
};

export function ForumPostEditForm({
  courseSlug,
  categorySlug,
  threadId,
  postId,
  cancelHref,
  initialBody,
  existingAttachments
}: ForumPostEditFormProps) {
  const [state, action] = useActionState(editForumPostAction, initialState);
  const nextPath = `/mis-cursos/${courseSlug}/foro/${categorySlug}/${threadId}/respuesta/${postId}/editar`;

  return (
    <form action={action} className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
      <input name="courseSlug" type="hidden" value={courseSlug} />
      <input name="categorySlug" type="hidden" value={categorySlug} />
      <input name="threadId" type="hidden" value={threadId} />
      <input name="postId" type="hidden" value={postId} />
      <input name="nextPath" type="hidden" value={nextPath} />

      <div className="space-y-6">
        <section className="ui-card-base overflow-hidden">
          <div className="border-b border-[rgba(12,113,195,0.1)] px-5 py-5 sm:px-6">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-muted)]">
              Edición de respuesta
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[var(--color-ink)]">
              Ajusta el contenido del mensaje
            </h2>
          </div>

          <div className="space-y-5 px-5 py-5 sm:px-6">
            <label className="block space-y-2">
              <span className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--color-muted)]">
                Respuesta
              </span>
              <Textarea
                className="min-h-[18rem] px-5 py-4 text-base leading-8"
                defaultValue={initialBody}
                name="body"
                required
                rows={10}
              />
            </label>
          </div>
        </section>

        <section className="ui-card-base overflow-hidden border-dashed">
          <div className="border-b border-[rgba(12,113,195,0.1)] px-5 py-5 sm:px-6">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-muted)]">
              Adjuntos
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[var(--color-ink)]">
              Recursos de esta respuesta
            </h2>
          </div>

          <div className="space-y-5 px-5 py-5 sm:px-6">
            {existingAttachments.length ? (
              <div className="rounded-[var(--radius-md)] border border-[rgba(12,113,195,0.12)] bg-[#fcfbf8] px-4 py-4">
                <p className="text-sm font-semibold text-[var(--color-ink)]">Adjuntos actuales</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {existingAttachments.map((attachment) => (
                    <div
                      className="flex items-center gap-2 rounded-[var(--radius-pill)] border border-[var(--color-border)] bg-white px-3 py-1 text-sm text-[var(--color-ink)]"
                      key={attachment.id}
                    >
                      <span>{attachment.label}</span>
                      <ConfirmSubmitButton
                        className="px-0 py-0 text-xs font-semibold text-[#9b4128] shadow-none hover:bg-transparent hover:text-[#7f2f18]"
                        formAction={deleteForumAttachmentAction}
                        formNoValidate
                        message="Se quitará este adjunto del contenido. ¿Quieres continuar?"
                        name="attachmentId"
                        pendingLabel="Quitando..."
                        type="submit"
                        value={attachment.id}
                        variant="ghost"
                      >
                        Quitar
                      </ConfirmSubmitButton>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <label className="block space-y-2">
              <span className="text-sm font-semibold text-[var(--color-ink)]">
                Añadir archivos o imágenes
              </span>
              <Input
                className="h-auto px-4 py-4 file:mr-3 file:rounded-[var(--radius-sm)] file:border-0 file:bg-[var(--color-primary-soft)] file:px-3 file:py-2 file:text-sm file:font-semibold file:text-[var(--color-primary)]"
                multiple
                name="attachments"
                type="file"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-semibold text-[var(--color-ink)]">
                Añadir enlaces externos
              </span>
              <Textarea
                name="attachmentLinks"
                placeholder="Un enlace por línea."
                rows={4}
              />
            </label>
          </div>
        </section>
      </div>

      <aside className="space-y-6 xl:sticky xl:top-28 xl:self-start">
        <section className="ui-card-base p-5 sm:p-6">
          <div className="space-y-4">
            {state.error ? (
              <p className="rounded-[var(--radius-md)] border border-[#efb3a6] bg-[#fff1ec] px-4 py-3 text-sm text-[#9b4128]">
                {state.error}
              </p>
            ) : null}

            <SubmitButton className="w-full justify-center py-4 text-base" pendingLabel="Guardando...">
              Guardar cambios
            </SubmitButton>
            <ButtonLink className="w-full justify-center py-4" href={cancelHref} variant="subtle">
              Cancelar
            </ButtonLink>
          </div>
        </section>
      </aside>
    </form>
  );
}

"use client";

import { useActionState, useId } from "react";
import { createForumReplyAction, type ForumFormState } from "@/actions/forum";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { StateBanner } from "@/components/ui/state-banner";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";

const initialState: ForumFormState = {};

type ThreadReplyFormProps = {
  courseSlug: string;
  categorySlug: string;
  threadId: string;
  disabled?: boolean;
};

export function ThreadReplyForm({
  courseSlug,
  categorySlug,
  threadId,
  disabled = false
}: ThreadReplyFormProps) {
  const [state, action] = useActionState(createForumReplyAction, initialState);
  const bodyId = useId();
  const linksId = useId();

  return (
    <form action={action} className="space-y-5">
      <input name="courseSlug" type="hidden" value={courseSlug} />
      <input name="categorySlug" type="hidden" value={categorySlug} />
      <input name="threadId" type="hidden" value={threadId} />

      {disabled ? (
        <StateBanner
          description="Este hilo no admite nuevas respuestas desde esta vista, pero sigue disponible para lectura y consulta."
          tone="warning"
        />
      ) : null}

      <FormField
        description="Prioriza una respuesta útil, concreta y fácil de seguir."
        htmlFor={bodyId}
        label="Responder al hilo"
        required={!disabled}
      >
        <Textarea
          disabled={disabled}
          id={bodyId}
          name="body"
          placeholder={
            disabled
              ? "El hilo está cerrado por el profesorado."
              : "Escribe una respuesta útil, respetuosa y concreta."
          }
          required={!disabled}
          rows={6}
        />
      </FormField>

      <div className="grid gap-4 border-t border-[rgba(22,60,88,0.08)] pt-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <FormField
          description="Puedes adjuntar material de apoyo si ayuda a contextualizar la respuesta."
          label="Archivos o imágenes"
        >
          <Input
            className="h-auto px-3 py-3 file:mr-3 file:rounded-[var(--radius-sm)] file:border-0 file:bg-[var(--color-brand-soft)] file:px-3 file:py-2 file:text-sm file:font-semibold file:text-[var(--color-primary)]"
            disabled={disabled}
            multiple
            name="attachments"
            type="file"
          />
        </FormField>

        <FormField description="Un enlace por línea." htmlFor={linksId} label="Enlaces externos">
          <Textarea
            disabled={disabled}
            id={linksId}
            name="attachmentLinks"
            placeholder="https://..."
            rows={3}
          />
        </FormField>
      </div>

      {state.error ? <StateBanner description={state.error} tone="danger" /> : null}

      <SubmitButton className="w-full sm:w-auto" pendingLabel="Enviando...">
        Responder
      </SubmitButton>
    </form>
  );
}

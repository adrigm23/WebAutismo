"use client";

import { useActionState } from "react";
import { createForumReplyAction, type ForumFormState } from "@/actions/forum";
import { Input } from "@/components/ui/input";
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

  return (
    <form action={action} className="space-y-4">
      <input name="courseSlug" type="hidden" value={courseSlug} />
      <input name="categorySlug" type="hidden" value={categorySlug} />
      <input name="threadId" type="hidden" value={threadId} />

      <label className="block space-y-2">
        <span className="text-sm font-medium text-[var(--color-ink)]">Responder al hilo</span>
        <Textarea
          disabled={disabled}
          name="body"
          placeholder={
            disabled
              ? "El hilo está cerrado por el profesorado."
              : "Escribe una respuesta útil, respetuosa y concreta."
          }
          required={!disabled}
          rows={6}
        />
      </label>

      <label className="block space-y-2">
        <span className="text-sm font-medium text-[var(--color-ink)]">Archivos o imagenes</span>
        <Input
          className="h-auto px-3 py-3 file:mr-3 file:rounded-lg file:border-0 file:bg-[var(--color-primary-soft)] file:px-3 file:py-2 file:text-sm file:font-semibold file:text-[var(--color-primary)]"
          disabled={disabled}
          multiple
          name="attachments"
          type="file"
        />
      </label>

      <label className="block space-y-2">
        <span className="text-sm font-medium text-[var(--color-ink)]">Enlaces externos</span>
        <Textarea
          disabled={disabled}
          name="attachmentLinks"
          placeholder="Un enlace por linea."
          rows={3}
        />
      </label>

      {state.error ? (
        <p className="rounded-2xl border border-[#efb3a6] bg-[#fff1ec] px-4 py-3 text-sm text-[#9b4128]">
          {state.error}
        </p>
      ) : null}

      <SubmitButton className="w-full sm:w-auto" pendingLabel="Enviando...">
        Responder
      </SubmitButton>
    </form>
  );
}

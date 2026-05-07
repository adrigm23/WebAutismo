"use client";

import { updateCourseModuleProgressAction } from "@/actions/progress";
import { SubmitButton } from "@/components/ui/submit-button";

type CourseProgressToggleFormProps = {
  courseSlug: string;
  moduleId: string;
  isCompleted: boolean;
  nextPath: string;
};

export function CourseProgressToggleForm({
  courseSlug,
  moduleId,
  isCompleted,
  nextPath
}: CourseProgressToggleFormProps) {
  return (
    <form action={updateCourseModuleProgressAction}>
      <input name="courseSlug" type="hidden" value={courseSlug} />
      <input name="moduleId" type="hidden" value={moduleId} />
      <input name="completed" type="hidden" value={isCompleted ? "false" : "true"} />
      <input name="nextPath" type="hidden" value={nextPath} />
      <SubmitButton pendingLabel="Guardando..." variant={isCompleted ? "ghost" : "secondary"}>
        {isCompleted ? "Quitar marca" : "Marcar como revisado"}
      </SubmitButton>
    </form>
  );
}

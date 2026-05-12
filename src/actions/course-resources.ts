"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { getCatalogCourseBySlug } from "@/lib/course-catalog";
import { canAccessCourseCommunity, canModerateCourse } from "@/lib/course-community";
import {
  createCourseResource,
  deleteCourseResource,
  moveCourseResource,
  reviewCourseResourceSubmission,
  setCourseResourcePublication,
  updateCourseResource,
  upsertCourseResourceSubmission
} from "@/lib/course-resources";
import { sendPlatformNotification } from "@/lib/notifications";
import { getDb } from "@/lib/prisma";

export type CourseResourceFormState = {
  error?: string;
  success?: string;
};

export type CourseSubmissionFormState = {
  error?: string;
  success?: string;
};

const createCourseResourceSchema = z.object({
  courseSlug: z.string().min(1),
  moduleId: z.string().optional(),
  type: z.enum(["MATERIAL", "EXERCISE"]),
  source: z.enum(["FILE", "LINK"]),
  title: z.string().min(3, "Introduce un titulo mas descriptivo.").max(120),
  description: z.string().max(2000).optional(),
  linkUrl: z.string().optional(),
  dueAt: z.string().optional(),
  passingScore: z.string().optional()
});

const deleteCourseResourceSchema = z.object({
  resourceId: z.string().min(1),
  courseSlug: z.string().min(1)
});

const updateCourseResourceSchema = z.object({
  courseSlug: z.string().min(1),
  resourceId: z.string().min(1),
  moduleId: z.string().optional(),
  title: z.string().min(3, "Introduce un titulo mas descriptivo.").max(120),
  description: z.string().max(2000).optional(),
  linkUrl: z.string().optional(),
  dueAt: z.string().optional(),
  passingScore: z.string().optional()
});

const toggleCourseResourcePublicationSchema = z.object({
  resourceId: z.string().min(1),
  courseSlug: z.string().min(1),
  publish: z.enum(["true", "false"])
});

const moveCourseResourceSchema = z.object({
  resourceId: z.string().min(1),
  courseSlug: z.string().min(1),
  direction: z.enum(["up", "down"])
});

const createCourseResourceSubmissionSchema = z.object({
  courseSlug: z.string().min(1),
  resourceId: z.string().min(1),
  body: z.string().max(4000).optional(),
  linkUrl: z.string().optional()
});

const reviewCourseResourceSubmissionSchema = z.object({
  courseSlug: z.string().min(1),
  submissionId: z.string().min(1),
  status: z.enum(["REVIEWED", "CHANGES_REQUESTED"]),
  score: z.string().optional(),
  feedback: z.string().min(8, "Escribe un feedback mas util para el alumno.").max(4000)
});

export async function createCourseResourceAction(
  _: CourseResourceFormState,
  formData: FormData
): Promise<CourseResourceFormState> {
  const parsed = createCourseResourceSchema.safeParse({
    courseSlug: formData.get("courseSlug"),
    moduleId: formData.get("moduleId")?.toString() || undefined,
    type: formData.get("type"),
    source: formData.get("source"),
    title: formData.get("title"),
    description: formData.get("description")?.toString() || undefined,
    linkUrl: formData.get("linkUrl")?.toString() || undefined,
    dueAt: formData.get("dueAt")?.toString() || undefined,
    passingScore: formData.get("passingScore")?.toString() || undefined
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Revisa los datos del recurso." };
  }

  const user = await getCurrentUser();

  if (!user) {
    return { error: "Debes iniciar sesion para gestionar recursos." };
  }

  const course = await getCatalogCourseBySlug(parsed.data.courseSlug);

  if (!course) {
    return { error: "El curso indicado no existe." };
  }

  const access = await canAccessCourseCommunity({
    userId: user.id,
    email: user.email,
    courseSlug: course.slug
  });

  if (!access.allowed || !canModerateCourse(access.role)) {
    return { error: "No tienes permisos para gestionar recursos de este curso." };
  }

  const moduleId = parsed.data.moduleId?.trim() || null;

  if (moduleId && !course.modules.some((module) => module.id === moduleId)) {
    return { error: "El modulo seleccionado no pertenece a este curso." };
  }

  const file = formData.get("file");

  if (parsed.data.source === "FILE") {
    if (!(file instanceof File) || file.size <= 0) {
      return { error: "Selecciona un archivo para publicar el recurso." };
    }
  } else {
    const linkUrl = parsed.data.linkUrl?.trim();

    if (!linkUrl) {
      return { error: "Indica la URL del recurso externo." };
    }

    try {
      const url = new URL(linkUrl);

      if (!["http:", "https:"].includes(url.protocol)) {
        return { error: "La URL debe empezar por http o https." };
      }
    } catch {
      return { error: "La URL del recurso no es valida." };
    }
  }

  let dueAt: Date | null = null;
  let passingScore: number | null = null;

  if (parsed.data.type === "EXERCISE" && parsed.data.dueAt?.trim()) {
    const candidate = new Date(parsed.data.dueAt);

    if (Number.isNaN(candidate.getTime())) {
      return { error: "La fecha limite del ejercicio no es valida." };
    }

    dueAt = candidate;
  }

  if (parsed.data.type === "EXERCISE" && parsed.data.passingScore?.trim()) {
    passingScore = Number(parsed.data.passingScore.replace(",", "."));

    if (Number.isNaN(passingScore) || passingScore < 0 || passingScore > 10) {
      return { error: "La nota minima para aprobar debe estar entre 0 y 10." };
    }
  }

  await createCourseResource({
    courseId: course.id,
    moduleId,
    createdById: user.id,
    type: parsed.data.type,
    source: parsed.data.source,
    title: parsed.data.title,
    description: parsed.data.description,
    linkUrl: parsed.data.source === "LINK" ? parsed.data.linkUrl : null,
    dueAt,
    passingScore,
    file: parsed.data.source === "FILE" && file instanceof File ? file : null
  });

  revalidatePath(`/mis-cursos/${course.slug}`);

  return {
    success:
      parsed.data.type === "EXERCISE"
        ? "Ejercicio publicado correctamente."
        : "Recurso publicado correctamente."
  };
}

export async function deleteCourseResourceAction(formData: FormData) {
  const parsed = deleteCourseResourceSchema.safeParse({
    resourceId: formData.get("resourceId"),
    courseSlug: formData.get("courseSlug")
  });

  if (!parsed.success) {
    return;
  }

  const user = await getCurrentUser();

  if (!user) {
    return;
  }

  const access = await canAccessCourseCommunity({
    userId: user.id,
    email: user.email,
    courseSlug: parsed.data.courseSlug
  });

  if (!access.allowed || !canModerateCourse(access.role)) {
    return;
  }

  const resource = await getDb().courseResource.findUnique({
    where: {
      id: parsed.data.resourceId
    },
    select: {
      id: true,
      course: {
        select: {
          slug: true
        }
      }
    }
  });

  if (!resource || resource.course.slug !== parsed.data.courseSlug) {
    return;
  }

  await deleteCourseResource(resource.id);
  revalidatePath(`/mis-cursos/${parsed.data.courseSlug}`);
  revalidatePath(`/mis-cursos/${parsed.data.courseSlug}/seguimiento`);
}

export async function updateCourseResourceAction(
  _: CourseResourceFormState,
  formData: FormData
): Promise<CourseResourceFormState> {
  const parsed = updateCourseResourceSchema.safeParse({
    courseSlug: formData.get("courseSlug"),
    resourceId: formData.get("resourceId"),
    moduleId: formData.get("moduleId")?.toString() || undefined,
    title: formData.get("title"),
    description: formData.get("description")?.toString() || undefined,
    linkUrl: formData.get("linkUrl")?.toString() || undefined,
    dueAt: formData.get("dueAt")?.toString() || undefined,
    passingScore: formData.get("passingScore")?.toString() || undefined
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Revisa los datos del recurso." };
  }

  const user = await getCurrentUser();

  if (!user) {
    return { error: "Debes iniciar sesion para gestionar recursos." };
  }

  const course = await getCatalogCourseBySlug(parsed.data.courseSlug);

  if (!course) {
    return { error: "El curso indicado no existe." };
  }

  const access = await canAccessCourseCommunity({
    userId: user.id,
    email: user.email,
    courseSlug: course.slug
  });

  if (!access.allowed || !canModerateCourse(access.role)) {
    return { error: "No tienes permisos para gestionar recursos de este curso." };
  }

  const resource = await getDb().courseResource.findUnique({
    where: {
      id: parsed.data.resourceId
    },
    select: {
      id: true,
      source: true,
      course: {
        select: {
          slug: true
        }
      }
    }
  });

  if (!resource || resource.course.slug !== parsed.data.courseSlug) {
    return { error: "El recurso indicado no existe o no pertenece a este curso." };
  }

  const moduleId = parsed.data.moduleId?.trim() || null;

  if (moduleId && !course.modules.some((module) => module.id === moduleId)) {
    return { error: "El modulo seleccionado no pertenece a este curso." };
  }

  if (resource.source === "LINK") {
    const linkUrl = parsed.data.linkUrl?.trim();

    if (!linkUrl) {
      return { error: "Indica la URL del recurso externo." };
    }

    try {
      const url = new URL(linkUrl);

      if (!["http:", "https:"].includes(url.protocol)) {
        return { error: "La URL debe empezar por http o https." };
      }
    } catch {
      return { error: "La URL del recurso no es valida." };
    }
  }

  let dueAt: Date | null = null;
  let passingScore: number | null = null;

  if (parsed.data.dueAt?.trim()) {
    const candidate = new Date(parsed.data.dueAt);

    if (Number.isNaN(candidate.getTime())) {
      return { error: "La fecha limite del ejercicio no es valida." };
    }

    dueAt = candidate;
  }

  if (parsed.data.passingScore?.trim()) {
    passingScore = Number(parsed.data.passingScore.replace(",", "."));

    if (Number.isNaN(passingScore) || passingScore < 0 || passingScore > 10) {
      return { error: "La nota minima para aprobar debe estar entre 0 y 10." };
    }
  }

  const file = formData.get("file");

  await updateCourseResource({
    resourceId: resource.id,
    moduleId,
    title: parsed.data.title,
    description: parsed.data.description,
    linkUrl: resource.source === "LINK" ? parsed.data.linkUrl : null,
    dueAt,
    passingScore,
    file: file instanceof File && file.size > 0 ? file : null
  });

  revalidatePath(`/mis-cursos/${course.slug}`);
  revalidatePath(`/mis-cursos/${course.slug}/seguimiento`);

  return {
    success: "Recurso actualizado correctamente."
  };
}

export async function toggleCourseResourcePublicationAction(formData: FormData) {
  const parsed = toggleCourseResourcePublicationSchema.safeParse({
    resourceId: formData.get("resourceId"),
    courseSlug: formData.get("courseSlug"),
    publish: formData.get("publish")
  });

  if (!parsed.success) {
    return;
  }

  const user = await getCurrentUser();

  if (!user) {
    return;
  }

  const access = await canAccessCourseCommunity({
    userId: user.id,
    email: user.email,
    courseSlug: parsed.data.courseSlug
  });

  if (!access.allowed || !canModerateCourse(access.role)) {
    return;
  }

  const resource = await getDb().courseResource.findUnique({
    where: {
      id: parsed.data.resourceId
    },
    select: {
      id: true,
      course: {
        select: {
          slug: true
        }
      }
    }
  });

  if (!resource || resource.course.slug !== parsed.data.courseSlug) {
    return;
  }

  await setCourseResourcePublication({
    resourceId: resource.id,
    isPublished: parsed.data.publish === "true"
  });

  revalidatePath(`/mis-cursos/${parsed.data.courseSlug}`);
  revalidatePath(`/mis-cursos/${parsed.data.courseSlug}/seguimiento`);
}

export async function moveCourseResourceAction(formData: FormData) {
  const parsed = moveCourseResourceSchema.safeParse({
    resourceId: formData.get("resourceId"),
    courseSlug: formData.get("courseSlug"),
    direction: formData.get("direction")
  });

  if (!parsed.success) {
    return;
  }

  const user = await getCurrentUser();

  if (!user) {
    return;
  }

  const access = await canAccessCourseCommunity({
    userId: user.id,
    email: user.email,
    courseSlug: parsed.data.courseSlug
  });

  if (!access.allowed || !canModerateCourse(access.role)) {
    return;
  }

  const resource = await getDb().courseResource.findUnique({
    where: {
      id: parsed.data.resourceId
    },
    select: {
      id: true,
      course: {
        select: {
          slug: true
        }
      }
    }
  });

  if (!resource || resource.course.slug !== parsed.data.courseSlug) {
    return;
  }

  await moveCourseResource({
    resourceId: resource.id,
    direction: parsed.data.direction
  });

  revalidatePath(`/mis-cursos/${parsed.data.courseSlug}`);
  revalidatePath(`/mis-cursos/${parsed.data.courseSlug}/seguimiento`);
}

export async function submitCourseResourceSubmissionAction(
  _: CourseSubmissionFormState,
  formData: FormData
): Promise<CourseSubmissionFormState> {
  const parsed = createCourseResourceSubmissionSchema.safeParse({
    courseSlug: formData.get("courseSlug"),
    resourceId: formData.get("resourceId"),
    body: formData.get("body")?.toString() || undefined,
    linkUrl: formData.get("linkUrl")?.toString() || undefined
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Revisa la entrega antes de enviarla." };
  }

  const user = await getCurrentUser();

  if (!user) {
    return { error: "Debes iniciar sesion para entregar el ejercicio." };
  }

  const course = await getCatalogCourseBySlug(parsed.data.courseSlug);

  if (!course) {
    return { error: "El curso indicado no existe." };
  }

  const access = await canAccessCourseCommunity({
    userId: user.id,
    email: user.email,
    courseSlug: course.slug
  });

  if (!access.allowed) {
    return { error: "No tienes acceso vigente a este curso." };
  }

  if (canModerateCourse(access.role)) {
    return { error: "Solo el alumnado puede registrar entregas en este flujo." };
  }

  const resource = await getDb().courseResource.findUnique({
    where: {
      id: parsed.data.resourceId
    },
    select: {
      id: true,
      title: true,
      type: true,
      dueAt: true,
      course: {
        select: {
          slug: true
        }
      }
    }
  });

  if (!resource || resource.course.slug !== parsed.data.courseSlug || resource.type !== "EXERCISE") {
    return { error: "El ejercicio indicado no existe o ya no esta disponible." };
  }

  if (resource.dueAt && resource.dueAt.getTime() < Date.now()) {
    return { error: "El plazo de entrega de este ejercicio ya ha finalizado." };
  }

  const file = formData.get("file");
  const hasBody = Boolean(parsed.data.body?.trim());
  const hasLink = Boolean(parsed.data.linkUrl?.trim());
  const hasFile = file instanceof File && file.size > 0;

  if (!hasBody && !hasLink && !hasFile) {
    return { error: "Añade una respuesta, un enlace o un archivo para registrar la entrega." };
  }

  if (hasLink) {
    try {
      const url = new URL(parsed.data.linkUrl!.trim());

      if (!["http:", "https:"].includes(url.protocol)) {
        return { error: "La URL de la entrega debe empezar por http o https." };
      }
    } catch {
      return { error: "La URL de la entrega no es valida." };
    }
  }

  await upsertCourseResourceSubmission({
    resourceId: resource.id,
    studentId: user.id,
    body: parsed.data.body,
    linkUrl: parsed.data.linkUrl,
    file: hasFile ? file : null
  });

  revalidatePath(`/mis-cursos/${course.slug}`);
  revalidatePath(`/mis-cursos/${course.slug}/seguimiento`);

  return {
    success: "Entrega guardada correctamente. El docente ya puede revisarla."
  };
}

export async function reviewCourseResourceSubmissionAction(
  _: CourseSubmissionFormState,
  formData: FormData
): Promise<CourseSubmissionFormState> {
  const parsed = reviewCourseResourceSubmissionSchema.safeParse({
    courseSlug: formData.get("courseSlug"),
    submissionId: formData.get("submissionId"),
    status: formData.get("status"),
    score: formData.get("score")?.toString() || undefined,
    feedback: formData.get("feedback")
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Revisa el feedback antes de guardarlo." };
  }

  const user = await getCurrentUser();

  if (!user) {
    return { error: "Debes iniciar sesion para revisar entregas." };
  }

  const access = await canAccessCourseCommunity({
    userId: user.id,
    email: user.email,
    courseSlug: parsed.data.courseSlug
  });

  if (!access.allowed || !canModerateCourse(access.role)) {
    return { error: "No tienes permisos para revisar entregas de este curso." };
  }

  const submission = await getDb().courseResourceSubmission.findUnique({
    where: {
      id: parsed.data.submissionId
    },
    include: {
      resource: {
        select: {
          title: true,
          course: {
            select: {
              slug: true
            }
          }
        }
      },
      student: {
        select: {
          id: true
        }
      }
    }
  });

  if (!submission || submission.resource.course.slug !== parsed.data.courseSlug) {
    return { error: "La entrega indicada no existe o no pertenece a este curso." };
  }

  let score: number | null = null;

  if (parsed.data.status === "REVIEWED") {
    const rawScore = parsed.data.score?.trim();

    if (!rawScore) {
      return { error: "Indica una nota entre 0 y 10 para cerrar la revision." };
    }

    score = Number(rawScore.replace(",", "."));

    if (Number.isNaN(score) || score < 0 || score > 10) {
      return { error: "La nota debe estar entre 0 y 10." };
    }
  }

  await reviewCourseResourceSubmission({
    submissionId: submission.id,
    reviewerId: user.id,
    status: parsed.data.status,
    score,
    feedback: parsed.data.feedback
  });

  await sendPlatformNotification({
    userId: submission.student.id,
    category: "COURSE",
    title:
      parsed.data.status === "REVIEWED"
        ? "Tu entrega ya ha sido revisada"
        : "Hay cambios solicitados en tu entrega",
    body:
      parsed.data.status === "REVIEWED"
        ? `Ya puedes consultar el feedback docente${score !== null ? ` y tu nota (${score}/10)` : ""} de ${submission.resource.title}.`
        : `Revisa el feedback docente y actualiza tu entrega de ${submission.resource.title}.`,
    linkPath: `/mis-cursos/${parsed.data.courseSlug}`
  });

  revalidatePath(`/mis-cursos/${parsed.data.courseSlug}`);
  revalidatePath(`/mis-cursos/${parsed.data.courseSlug}/seguimiento`);

  return {
    success:
      parsed.data.status === "REVIEWED"
        ? "Entrega revisada correctamente."
        : "Se ha solicitado una nueva version al alumno."
  };
}

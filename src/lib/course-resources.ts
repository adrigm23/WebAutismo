import { randomUUID } from "crypto";
import path from "path";
import type {
  CourseResourceSource,
  CourseResourceSubmissionStatus,
  CourseResourceType
} from "@prisma/client";
import type { CatalogCourse } from "@/lib/course-catalog";
import { isDatabaseConnectionError } from "@/lib/db-errors";
import {
  buildProtectedCourseResourceSubmissionUrl,
  removeStoredCourseResourceSubmission
} from "@/lib/course-resource-submission-storage";
import {
  buildProtectedCourseResourceUrl,
  removeStoredCourseResource
} from "@/lib/course-resource-storage";
import {
  assertSafeHttpUrl,
  COURSE_RESOURCE_UPLOAD_POLICY,
  COURSE_SUBMISSION_UPLOAD_POLICY,
  validateFileUpload
} from "@/lib/file-security";
import { createLogger } from "@/lib/logger";
import { assertObjectStorageWriteReady } from "@/lib/object-storage";
import { getDb } from "@/lib/prisma";
import { upsertStoredAsset } from "@/lib/stored-assets";

const courseResourceLogger = createLogger({
  route: "course-resources"
});

export type CampusResourceSubmissionItem = {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  body: string | null;
  linkUrl: string | null;
  attachmentLabel: string | null;
  attachmentHref: string | null;
  status: CourseResourceSubmissionStatus;
  statusLabel: string;
  score: number | null;
  scoreLabel: string | null;
  isPassed: boolean | null;
  passStatusLabel: string | null;
  feedback: string | null;
  submittedAt: Date;
  reviewedAt: Date | null;
  reviewerName: string | null;
};

export type CampusResourceItem = {
  id: string;
  title: string;
  description: string;
  resourceType: CourseResourceType | "INFO";
  source: CourseResourceSource | null;
  mimeType: string | null;
  resourceTypeLabel: string;
  accessLabel: string;
  href: string | null;
  linkUrl: string | null;
  isExternal: boolean;
  isManaged: boolean;
  isExercise: boolean;
  isPublished: boolean;
  dueAt: Date | null;
  passingScore: number | null;
  passingScoreLabel: string | null;
  isSubmissionClosed: boolean;
  sortOrder: number | null;
  moduleId: string | null;
  moduleTitle: string | null;
  createdByName: string | null;
  createdAt: Date | null;
  viewerSubmission: CampusResourceSubmissionItem | null;
  submissions: CampusResourceSubmissionItem[];
  submissionStats: {
    total: number;
    pending: number;
  } | null;
};

function sanitizeFileSegment(value: string) {
  return value.replace(/[^a-zA-Z0-9-_]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "") || "recurso";
}

function getStaticCampusResources(course: CatalogCourse): CampusResourceItem[] {
  const teacherSummary = course.teachers.length
    ? course.teachers.map((teacher) => `${teacher.name}. ${teacher.role}. ${teacher.bio}`).join(" ")
    : "El equipo docente se asigna desde administracion por curso y edicion.";

  return [
    {
      id: "guide",
      title: "Guia del alumno",
      description:
        "Normas del campus, funcionamiento del curso, participacion en foros y uso del area privada.",
      resourceType: "INFO",
      source: null,
      mimeType: null,
      resourceTypeLabel: "Guia",
      accessLabel: "Referencia del campus",
      href: null,
      linkUrl: null,
      isExternal: false,
      isManaged: false,
      isExercise: false,
      isPublished: true,
      dueAt: null,
      passingScore: null,
      passingScoreLabel: null,
      isSubmissionClosed: false,
      sortOrder: null,
      moduleId: null,
      moduleTitle: null,
      createdByName: null,
      createdAt: null,
      viewerSubmission: null,
      submissions: [],
      submissionStats: null
    },
    {
      id: "teachers",
      title: course.teachers.length > 1 ? "Equipo docente" : "Docente asignado",
      description: teacherSummary,
      resourceType: "INFO",
      source: null,
      mimeType: null,
      resourceTypeLabel: "Equipo",
      accessLabel: "Informacion del curso",
      href: null,
      linkUrl: null,
      isExternal: false,
      isManaged: false,
      isExercise: false,
      isPublished: true,
      dueAt: null,
      passingScore: null,
      passingScoreLabel: null,
      isSubmissionClosed: false,
      sortOrder: null,
      moduleId: null,
      moduleTitle: null,
      createdByName: null,
      createdAt: null,
      viewerSubmission: null,
      submissions: [],
      submissionStats: null
    }
  ];
}

function getResourceTypeLabel(type: CourseResourceType) {
  return type === "EXERCISE" ? "Ejercicio" : "Material";
}

function getResourceAccessLabel(source: CourseResourceSource) {
  return source === "FILE" ? "Archivo privado" : "Enlace externo";
}

function getSubmissionStatusLabel(status: CourseResourceSubmissionStatus) {
  if (status === "REVIEWED") {
    return "Revisada";
  }

  return status === "CHANGES_REQUESTED" ? "Cambios solicitados" : "Pendiente de revision";
}

function formatSubmissionScore(score: number | null) {
  if (typeof score !== "number" || Number.isNaN(score)) {
    return null;
  }

  return new Intl.NumberFormat("es-ES", {
    minimumFractionDigits: Number.isInteger(score) ? 0 : 1,
    maximumFractionDigits: 1
  }).format(score);
}

function getPassStatus(input: {
  status: CourseResourceSubmissionStatus;
  score: number | null;
  passingScore: number | null;
}) {
  if (
    input.status !== "REVIEWED" ||
    typeof input.score !== "number" ||
    Number.isNaN(input.score) ||
    typeof input.passingScore !== "number" ||
    Number.isNaN(input.passingScore)
  ) {
    return {
      isPassed: null,
      passStatusLabel: null
    };
  }

  return input.score >= input.passingScore
    ? {
        isPassed: true,
        passStatusLabel: "Aprobado"
      }
    : {
        isPassed: false,
        passStatusLabel: "No aprobado"
      };
}

function mapSubmission(input: {
  id: string;
  studentId: string;
  body: string | null;
  linkUrl: string | null;
  attachmentLabel: string | null;
  storageKey: string | null;
  status: CourseResourceSubmissionStatus;
  score: number | null;
  passingScore: number | null;
  feedback: string | null;
  submittedAt: Date;
  reviewedAt: Date | null;
  student: {
    name: string;
    email: string;
  };
  reviewer: {
    name: string;
  } | null;
}): CampusResourceSubmissionItem {
  const passStatus = getPassStatus({
    status: input.status,
    score: input.score,
    passingScore: input.passingScore
  });

  return {
    id: input.id,
    studentId: input.studentId,
    studentName: input.student.name,
    studentEmail: input.student.email,
    body: input.body,
    linkUrl: input.linkUrl,
    attachmentLabel: input.attachmentLabel,
    attachmentHref: input.storageKey ? buildProtectedCourseResourceSubmissionUrl(input.id) : null,
    status: input.status,
    statusLabel: getSubmissionStatusLabel(input.status),
    score: input.score,
    scoreLabel: formatSubmissionScore(input.score),
    isPassed: passStatus.isPassed,
    passStatusLabel: passStatus.passStatusLabel,
    feedback: input.feedback,
    submittedAt: input.submittedAt,
    reviewedAt: input.reviewedAt,
    reviewerName: input.reviewer?.name ?? null
  };
}

export async function getCampusResources(input: {
  course: CatalogCourse;
  viewerUserId: string;
  canModerate: boolean;
}) {
  const staticResources = getStaticCampusResources(input.course);

  try {
    const resources = await getDb().courseResource.findMany({
      where: {
        courseId: input.course.id,
        ...(input.canModerate ? {} : { isPublished: true })
      },
      include: {
        module: {
          select: {
            title: true
          }
        },
        createdBy: {
          select: {
            name: true
          }
        },
        submissions: {
          where: input.canModerate
            ? {}
            : {
                studentId: input.viewerUserId
              },
          include: {
            student: {
              select: {
                name: true,
                email: true
              }
            },
            reviewer: {
              select: {
                name: true
              }
            }
          },
          orderBy: {
            submittedAt: "desc"
          }
        }
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }]
    });

    return [
      ...staticResources,
      ...resources.map((resource) => {
        const submissions = resource.submissions.map((submission) =>
          mapSubmission({
            ...submission,
            passingScore: resource.passingScore
          })
        );
        const viewerSubmission = input.canModerate ? null : submissions[0] ?? null;

        return {
          id: resource.id,
          title: resource.title,
          description: resource.description ?? "Sin descripcion adicional.",
          resourceType: resource.type,
          source: resource.source,
          mimeType: resource.mimeType ?? null,
          resourceTypeLabel: getResourceTypeLabel(resource.type),
          accessLabel: getResourceAccessLabel(resource.source),
          href:
            resource.source === "FILE"
              ? buildProtectedCourseResourceUrl(resource.id)
              : resource.linkUrl ?? null,
          linkUrl: resource.linkUrl ?? null,
          isExternal: resource.source === "LINK",
          isManaged: true,
          isExercise: resource.type === "EXERCISE",
          isPublished: resource.isPublished,
          dueAt: resource.dueAt,
          passingScore: resource.passingScore,
          passingScoreLabel: formatSubmissionScore(resource.passingScore),
          isSubmissionClosed: Boolean(resource.dueAt && resource.dueAt.getTime() < Date.now()),
          sortOrder: resource.sortOrder,
          moduleId: resource.moduleId ?? null,
          moduleTitle: resource.module?.title ?? null,
          createdByName: resource.createdBy.name,
          createdAt: resource.createdAt,
          viewerSubmission,
          submissions,
          submissionStats:
            resource.type === "EXERCISE"
              ? {
                  total: submissions.length,
                  pending: submissions.filter((submission) => submission.status === "SUBMITTED").length
                }
              : null
        } satisfies CampusResourceItem;
      })
    ] satisfies CampusResourceItem[];
  } catch (error) {
    if (!isDatabaseConnectionError(error)) {
      throw error;
    }

    throw error;
  }
}

export async function createCourseResource(input: {
  courseId: string;
  moduleId?: string | null;
  createdById: string;
  type: CourseResourceType;
  source: CourseResourceSource;
  title: string;
  description?: string | null;
  linkUrl?: string | null;
  dueAt?: Date | null;
  passingScore?: number | null;
  file?: File | null;
}) {
  const lastResource = await getDb().courseResource.findFirst({
    where: {
      courseId: input.courseId
    },
    orderBy: {
      sortOrder: "desc"
    },
    select: {
      sortOrder: true
    }
  });

  let storageKey: string | null = null;
  let mimeType: string | null = null;
  let sizeInBytes: number | null = null;

  if (input.source === "FILE") {
    if (!input.file || input.file.size <= 0) {
      throw new Error("Selecciona un archivo valido.");
    }

    assertObjectStorageWriteReady();
    const validatedFile = validateFileUpload(input.file, COURSE_RESOURCE_UPLOAD_POLICY);
    const safeName = sanitizeFileSegment(validatedFile.fileName);
    const storedFileName = `${randomUUID()}-${safeName}`;
    storageKey = path.posix.join("course-resources", input.courseId, storedFileName);
    mimeType = validatedFile.mimeType;
    sizeInBytes = validatedFile.sizeInBytes;
    await upsertStoredAsset({
      storageKey,
      content: new Uint8Array(await input.file.arrayBuffer()),
      contentType: mimeType
    });

    courseResourceLogger.info("Course resource file stored.", {
      action: "createCourseResource",
      userId: input.createdById,
      courseId: input.courseId,
      storageKey,
      mimeType,
      sizeInBytes,
      result: "stored"
    });
  }

  return getDb().courseResource.create({
    data: {
      courseId: input.courseId,
      moduleId: input.moduleId ?? null,
      createdById: input.createdById,
      type: input.type,
      source: input.source,
      title: input.title.trim(),
      description: input.description?.trim() || null,
      linkUrl:
        input.source === "LINK" && input.linkUrl
          ? assertSafeHttpUrl(input.linkUrl, "La URL del recurso")
          : null,
      dueAt: input.type === "EXERCISE" ? input.dueAt ?? null : null,
      passingScore: input.type === "EXERCISE" ? input.passingScore ?? null : null,
      storageKey,
      mimeType,
      sizeInBytes,
      sortOrder: (lastResource?.sortOrder ?? -1) + 1
    }
  });
}

export async function deleteCourseResource(resourceId: string) {
  const resource = await getDb().courseResource.delete({
    where: {
      id: resourceId
    },
    select: {
      storageKey: true
    }
  });

  if (!resource.storageKey) {
    return;
  }

  try {
    await removeStoredCourseResource(resource.storageKey);
  } catch {
    // Ignore missing file cleanup failures to avoid blocking resource deletion.
  }
}

export async function updateCourseResource(input: {
  resourceId: string;
  moduleId?: string | null;
  title: string;
  description?: string | null;
  linkUrl?: string | null;
  dueAt?: Date | null;
  passingScore?: number | null;
  file?: File | null;
}) {
  const existing = await getDb().courseResource.findUnique({
    where: {
      id: input.resourceId
    },
    select: {
      source: true,
      courseId: true,
      storageKey: true,
      mimeType: true,
      sizeInBytes: true
    }
  });

  if (!existing) {
    throw new Error("El recurso indicado no existe.");
  }

  let storageKey = existing.storageKey;
  let mimeType = existing.mimeType;
  let sizeInBytes = existing.sizeInBytes;

  if (existing.source === "FILE" && input.file && input.file.size > 0) {
    assertObjectStorageWriteReady();
    const validatedFile = validateFileUpload(input.file, COURSE_RESOURCE_UPLOAD_POLICY);
    const safeName = sanitizeFileSegment(validatedFile.fileName);
    const storedFileName = `${randomUUID()}-${safeName}`;
    storageKey = path.posix.join("course-resources", existing.courseId, storedFileName);
    mimeType = validatedFile.mimeType;
    sizeInBytes = validatedFile.sizeInBytes;
    await upsertStoredAsset({
      storageKey,
      content: new Uint8Array(await input.file.arrayBuffer()),
      contentType: mimeType
    });

    courseResourceLogger.info("Course resource file replaced.", {
      action: "updateCourseResource",
      courseId: existing.courseId,
      resourceId: input.resourceId,
      storageKey,
      mimeType,
      sizeInBytes,
      result: "stored"
    });
  }

  const updated = await getDb().courseResource.update({
    where: {
      id: input.resourceId
    },
    data: {
      moduleId: input.moduleId ?? null,
      title: input.title.trim(),
      description: input.description?.trim() || null,
      linkUrl:
        existing.source === "LINK" && input.linkUrl
          ? assertSafeHttpUrl(input.linkUrl, "La URL del recurso")
          : null,
      dueAt: input.dueAt ?? null,
      passingScore: input.passingScore ?? null,
      storageKey,
      mimeType,
      sizeInBytes
    }
  });

  if (existing.storageKey && input.file && input.file.size > 0 && existing.storageKey !== storageKey) {
    try {
      await removeStoredCourseResource(existing.storageKey);
    } catch {
      // Ignore missing file cleanup failures to avoid blocking resource updates.
    }
  }

  return updated;
}

export async function setCourseResourcePublication(input: {
  resourceId: string;
  isPublished: boolean;
}) {
  return getDb().courseResource.update({
    where: {
      id: input.resourceId
    },
    data: {
      isPublished: input.isPublished
    }
  });
}

export async function moveCourseResource(input: {
  resourceId: string;
  direction: "up" | "down";
}) {
  const current = await getDb().courseResource.findUnique({
    where: {
      id: input.resourceId
    },
    select: {
      id: true,
      courseId: true,
      sortOrder: true
    }
  });

  if (!current) {
    throw new Error("El recurso indicado no existe.");
  }

  const target = await getDb().courseResource.findFirst({
    where: {
      courseId: current.courseId,
      sortOrder: input.direction === "up" ? { lt: current.sortOrder } : { gt: current.sortOrder }
    },
    orderBy: {
      sortOrder: input.direction === "up" ? "desc" : "asc"
    },
    select: {
      id: true,
      sortOrder: true
    }
  });

  if (!target) {
    return null;
  }

  await getDb().$transaction([
    getDb().courseResource.update({
      where: {
        id: current.id
      },
      data: {
        sortOrder: target.sortOrder
      }
    }),
    getDb().courseResource.update({
      where: {
        id: target.id
      },
      data: {
        sortOrder: current.sortOrder
      }
    })
  ]);

  return {
    currentId: current.id,
    targetId: target.id
  };
}

export async function upsertCourseResourceSubmission(input: {
  resourceId: string;
  studentId: string;
  body?: string | null;
  linkUrl?: string | null;
  file?: File | null;
}) {
  const existing = await getDb().courseResourceSubmission.findUnique({
    where: {
      resourceId_studentId: {
        resourceId: input.resourceId,
        studentId: input.studentId
      }
    },
    select: {
      id: true,
      storageKey: true,
      attachmentLabel: true,
      mimeType: true,
      sizeInBytes: true
    }
  });

  let storageKey: string | null = existing?.storageKey ?? null;
  let attachmentLabel: string | null = existing?.attachmentLabel ?? null;
  let mimeType: string | null = existing?.mimeType ?? null;
  let sizeInBytes: number | null = existing?.sizeInBytes ?? null;

  if (input.file && input.file.size > 0) {
    assertObjectStorageWriteReady();
    const validatedFile = validateFileUpload(input.file, COURSE_SUBMISSION_UPLOAD_POLICY);
    const safeName = sanitizeFileSegment(validatedFile.fileName);
    const storedFileName = `${randomUUID()}-${safeName}`;
    storageKey = path.posix.join("course-resource-submissions", input.resourceId, storedFileName);
    attachmentLabel = validatedFile.fileName;
    mimeType = validatedFile.mimeType;
    sizeInBytes = validatedFile.sizeInBytes;
    await upsertStoredAsset({
      storageKey,
      content: new Uint8Array(await input.file.arrayBuffer()),
      contentType: mimeType
    });

    courseResourceLogger.info("Course resource submission attachment stored.", {
      action: "upsertCourseResourceSubmission",
      userId: input.studentId,
      resourceId: input.resourceId,
      storageKey,
      mimeType,
      sizeInBytes,
      result: "stored"
    });
  }

  const submission = await getDb().courseResourceSubmission.upsert({
    where: {
      resourceId_studentId: {
        resourceId: input.resourceId,
        studentId: input.studentId
      }
    },
    update: {
      body: input.body?.trim() || null,
      linkUrl: input.linkUrl ? assertSafeHttpUrl(input.linkUrl, "La URL de la entrega") : null,
      storageKey,
      attachmentLabel,
      mimeType,
      sizeInBytes,
      status: "SUBMITTED",
      feedback: null,
      score: null,
      reviewerId: null,
      reviewedAt: null,
      submittedAt: new Date()
    },
    create: {
      resourceId: input.resourceId,
      studentId: input.studentId,
      body: input.body?.trim() || null,
      linkUrl: input.linkUrl ? assertSafeHttpUrl(input.linkUrl, "La URL de la entrega") : null,
      storageKey,
      attachmentLabel,
      mimeType,
      sizeInBytes
    }
  });

  if (existing?.storageKey && input.file && existing.storageKey !== storageKey) {
    try {
      await removeStoredCourseResourceSubmission(existing.storageKey);
    } catch {
      // Ignore missing file cleanup failures to avoid blocking submission updates.
    }
  }

  return submission;
}

export async function reviewCourseResourceSubmission(input: {
  submissionId: string;
  reviewerId: string;
  status: "REVIEWED" | "CHANGES_REQUESTED";
  score?: number | null;
  feedback: string;
}) {
  return getDb().courseResourceSubmission.update({
    where: {
      id: input.submissionId
    },
    data: {
      reviewerId: input.reviewerId,
      status: input.status,
      score: input.status === "REVIEWED" ? input.score ?? null : null,
      feedback: input.feedback.trim(),
      reviewedAt: new Date()
    }
  });
}

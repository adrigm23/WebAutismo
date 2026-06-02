import { randomUUID } from "crypto";
import path from "path";
import type {
  LibraryResourceAudience,
  LibraryResourceCategory,
  LibraryResourceStatus,
  LibraryResourceType,
  LibraryVisibility,
  UserGlobalRole,
} from "@prisma/client";
import { LIBRARY_UPLOAD_POLICY, validateFileUpload } from "@/lib/file-security";
import { getDb } from "@/lib/prisma";
import { writeStoredObject, deleteStoredObject } from "@/lib/object-storage";


function sanitizeSegment(value: string) {
  return value.replace(/[^a-zA-Z0-9-_]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "") || "recurso";
}

export function inferResourceType(mimeType: string): LibraryResourceType {
  if (mimeType === "application/pdf") return "PDF";
  if (mimeType.startsWith("video/")) return "VIDEO";
  if (
    mimeType.includes("presentation") ||
    mimeType.includes("powerpoint") ||
    mimeType.includes("pptx")
  )
    return "PRESENTATION";
  if (
    mimeType.includes("word") ||
    mimeType.includes("docx") ||
    mimeType.includes("spreadsheet") ||
    mimeType.includes("excel") ||
    mimeType.includes("csv") ||
    mimeType.includes("text/plain")
  )
    return "DOCUMENT";
  if (mimeType.startsWith("image/")) return "IMAGE";
  return "OTHER";
}

export function buildLibraryResourceUrl(id: string) {
  return `/api/library/${id}`;
}

// ─── Filter input ─────────────────────────────────────────────────────────────

export type LibraryFilters = {
  q?: string;
  type?: LibraryResourceType | "";
  category?: LibraryResourceCategory | "";
  courseId?: string;
  folderId?: string | null;
  orderBy?: "createdAt" | "title" | "fileSize" | "type";
  orderDir?: "asc" | "desc";
};

// ─── Result types ─────────────────────────────────────────────────────────────

export type LibraryResourceItem = {
  id: string;
  title: string;
  description: string | null;
  fileName: string;
  fileUrl: string;
  externalUrl: string | null;
  mimeType: string;
  fileSize: number;
  type: LibraryResourceType;
  category: LibraryResourceCategory | null;
  audience: LibraryResourceAudience | null;
  visibility: LibraryVisibility;
  status: LibraryResourceStatus;
  courseId: string | null;
  courseTitle: string | null;
  courseSlug: string | null;
  folderId: string | null;
  folderName: string | null;
  uploadedById: string;
  uploadedByName: string;
  createdAt: Date;
  updatedAt: Date;
  downloadHref: string;
};

export type LibraryFolderItem = {
  id: string;
  name: string;
  description: string | null;
  courseId: string | null;
  courseTitle: string | null;
  parentId: string | null;
  resourceCount: number;
  createdAt: Date;
};

// ─── Viewer context ───────────────────────────────────────────────────────────

type ViewerContext = {
  userId: string;
  globalRole: UserGlobalRole;
  enrolledCourseIds: string[];
  teachingCourseIds: string[];
};

function buildVisibilityFilter(ctx: ViewerContext) {
  if (ctx.globalRole === "ADMIN") return {};

  if (ctx.globalRole === "TEACHER") {
    return {
      OR: [
        { visibility: "PUBLIC" as LibraryVisibility },
        { visibility: "ENROLLED_STUDENTS" as LibraryVisibility },
        { visibility: "TEACHERS_ONLY" as LibraryVisibility },
        {
          visibility: "COURSE_ONLY" as LibraryVisibility,
          courseId: { in: ctx.teachingCourseIds },
        },
        {
          visibility: "PRIVATE" as LibraryVisibility,
          uploadedById: ctx.userId,
        },
      ],
    };
  }

  // STUDENT
  return {
    OR: [
      { visibility: "PUBLIC" as LibraryVisibility },
      {
        visibility: "ENROLLED_STUDENTS" as LibraryVisibility,
        courseId: { in: ctx.enrolledCourseIds },
      },
      {
        visibility: "COURSE_ONLY" as LibraryVisibility,
        courseId: { in: ctx.enrolledCourseIds },
      },
    ],
  };
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export async function getLibraryResources(
  filters: LibraryFilters,
  ctx: ViewerContext
): Promise<LibraryResourceItem[]> {
  const visibilityFilter = buildVisibilityFilter(ctx);
  const orderDir = filters.orderDir ?? "desc";
  const orderField = filters.orderBy ?? "createdAt";

  const where: Record<string, unknown> = {
    ...visibilityFilter,
  };

  if (filters.type) where.type = filters.type;
  if (filters.category) where.category = filters.category;
  if (filters.courseId) where.courseId = filters.courseId;
  if (filters.folderId !== undefined) where.folderId = filters.folderId ?? null;

  if (filters.q) {
    const q = filters.q.trim();
    where.OR = [
      { title: { contains: q } },
      { description: { contains: q } },
      { fileName: { contains: q } },
      { course: { title: { contains: q } } },
    ];
  }

  // Exclude other users' drafts
  if (ctx.globalRole !== "ADMIN") {
    const draftFilter = {
      OR: [
        { status: "PUBLISHED" as LibraryResourceStatus },
        { status: "DRAFT" as LibraryResourceStatus, uploadedById: ctx.userId },
      ],
    };
    Object.assign(where, draftFilter);
  }

  const resources = await getDb().libraryResource.findMany({
    where,
    include: {
      course: { select: { id: true, title: true, slug: true } },
      folder: { select: { id: true, name: true } },
      uploadedBy: { select: { name: true } },
    },
    orderBy: { [orderField]: orderDir },
  });

  return resources.map((r) => ({
    id: r.id,
    title: r.title,
    description: r.description,
    fileName: r.fileName,
    fileUrl: r.fileUrl,
    externalUrl: r.externalUrl,
    mimeType: r.mimeType,
    fileSize: r.fileSize,
    type: r.type,
    category: r.category,
    audience: r.audience,
    visibility: r.visibility,
    status: r.status,
    courseId: r.courseId,
    courseTitle: r.course?.title ?? null,
    courseSlug: r.course?.slug ?? null,
    folderId: r.folderId,
    folderName: r.folder?.name ?? null,
    uploadedById: r.uploadedById,
    uploadedByName: r.uploadedBy.name,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    downloadHref: buildLibraryResourceUrl(r.id),
  }));
}

export async function getLibraryFolders(ctx: ViewerContext): Promise<LibraryFolderItem[]> {
  const where =
    ctx.globalRole === "ADMIN"
      ? {}
      : ctx.globalRole === "TEACHER"
        ? {
            OR: [
              { courseId: { in: ctx.teachingCourseIds } },
              { courseId: null },
            ],
          }
        : { courseId: { in: ctx.enrolledCourseIds } };

  const folders = await getDb().libraryFolder.findMany({
    where,
    include: {
      course: { select: { title: true } },
      _count: { select: { resources: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return folders.map((f) => ({
    id: f.id,
    name: f.name,
    description: f.description,
    courseId: f.courseId,
    courseTitle: f.course?.title ?? null,
    parentId: f.parentId,
    resourceCount: f._count.resources,
    createdAt: f.createdAt,
  }));
}

export async function getLibraryResourceById(id: string) {
  return getDb().libraryResource.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      fileName: true,
      fileUrl: true,
      fileKey: true,
      externalUrl: true,
      mimeType: true,
      fileSize: true,
      type: true,
      visibility: true,
      status: true,
      uploadedById: true,
      courseId: true,
      course: { select: { id: true, slug: true } },
    },
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export async function createLibraryResource(input: {
  title: string;
  description?: string | null;
  file?: File | null;
  externalUrl?: string | null;
  category?: LibraryResourceCategory | null;
  audience?: LibraryResourceAudience | null;
  visibility: LibraryVisibility;
  status?: LibraryResourceStatus;
  courseId?: string | null;
  folderId?: string | null;
  uploadedById: string;
}) {
  // ── LINK type: no file upload ─────────────────────────────────────────────
  if (input.externalUrl) {
    const url = new URL(input.externalUrl.trim());
    const hostname = url.hostname;
    return getDb().libraryResource.create({
      data: {
        title: input.title.trim(),
        description: input.description?.trim() || null,
        fileName: hostname,
        fileUrl: input.externalUrl.trim(),
        externalUrl: input.externalUrl.trim(),
        mimeType: "text/html",
        fileSize: 0,
        type: "LINK",
        category: input.category ?? null,
        audience: input.audience ?? null,
        visibility: input.visibility,
        status: input.status ?? "PUBLISHED",
        courseId: input.courseId ?? null,
        folderId: input.folderId ?? null,
        uploadedById: input.uploadedById,
      },
    });
  }

  // ── File upload ───────────────────────────────────────────────────────────
  if (!input.file) throw new Error("Se requiere un archivo o un enlace externo.");

  const validatedFile = validateFileUpload(input.file, LIBRARY_UPLOAD_POLICY);
  const safeName = sanitizeSegment(validatedFile.fileName);
  const storedFileName = `${randomUUID()}-${safeName}`;
  const fileKey = path.posix.join("library-resources", input.uploadedById, storedFileName);

  await writeStoredObject({
    storageKey: fileKey,
    content: new Uint8Array(await input.file.arrayBuffer()),
    contentType: validatedFile.mimeType,
  });

  const type = inferResourceType(validatedFile.mimeType);

  return getDb().libraryResource.create({
    data: {
      title: input.title.trim(),
      description: input.description?.trim() || null,
      fileName: validatedFile.fileName,
      fileUrl: fileKey,
      fileKey,
      mimeType: validatedFile.mimeType,
      fileSize: validatedFile.sizeInBytes,
      type,
      category: input.category ?? null,
      audience: input.audience ?? null,
      visibility: input.visibility,
      status: input.status ?? "PUBLISHED",
      courseId: input.courseId ?? null,
      folderId: input.folderId ?? null,
      uploadedById: input.uploadedById,
    },
  });
}

export async function updateLibraryResource(input: {
  id: string;
  title: string;
  description?: string | null;
  category?: LibraryResourceCategory | null;
  visibility: LibraryVisibility;
  courseId?: string | null;
  folderId?: string | null;
  file?: File | null;
}) {
  const existing = await getDb().libraryResource.findUnique({
    where: { id: input.id },
    select: { fileKey: true, uploadedById: true },
  });

  if (!existing) throw new Error("El recurso no existe.");

  let fileKey = existing.fileKey;
  let fileUrl = fileKey ?? "";
  let mimeType: string | undefined;
  let fileSize: number | undefined;
  let fileName: string | undefined;
  let type: LibraryResourceType | undefined;

  if (input.file && input.file.size > 0) {
    const validatedFile = validateFileUpload(input.file, LIBRARY_UPLOAD_POLICY);
    const safeName = sanitizeSegment(validatedFile.fileName);
    const storedFileName = `${randomUUID()}-${safeName}`;
    const newKey = path.posix.join("library-resources", existing.uploadedById, storedFileName);

    await writeStoredObject({
      storageKey: newKey,
      content: new Uint8Array(await input.file.arrayBuffer()),
      contentType: validatedFile.mimeType,
    });

    if (existing.fileKey && existing.fileKey !== newKey) {
      try {
        await deleteStoredObject(existing.fileKey);
      } catch {
        // Ignore cleanup failures.
      }
    }

    fileKey = newKey;
    fileUrl = newKey;
    mimeType = validatedFile.mimeType;
    fileSize = validatedFile.sizeInBytes;
    fileName = validatedFile.fileName;
    type = inferResourceType(validatedFile.mimeType);
  }

  return getDb().libraryResource.update({
    where: { id: input.id },
    data: {
      title: input.title.trim(),
      description: input.description?.trim() || null,
      category: input.category ?? null,
      visibility: input.visibility,
      courseId: input.courseId ?? null,
      folderId: input.folderId ?? null,
      ...(fileKey !== undefined && { fileKey, fileUrl }),
      ...(mimeType !== undefined && { mimeType }),
      ...(fileSize !== undefined && { fileSize }),
      ...(fileName !== undefined && { fileName }),
      ...(type !== undefined && { type }),
    },
  });
}

export async function deleteLibraryResource(id: string) {
  const resource = await getDb().libraryResource.delete({
    where: { id },
    select: { fileKey: true },
  });

  if (resource.fileKey) {
    try {
      await deleteStoredObject(resource.fileKey);
    } catch {
      // Ignore cleanup failures.
    }
  }
}

export async function createLibraryFolder(input: {
  name: string;
  description?: string | null;
  courseId?: string | null;
  parentId?: string | null;
  createdById: string;
}) {
  return getDb().libraryFolder.create({
    data: {
      name: input.name.trim(),
      description: input.description?.trim() || null,
      courseId: input.courseId ?? null,
      parentId: input.parentId ?? null,
      createdById: input.createdById,
    },
  });
}

export async function deleteLibraryFolder(id: string) {
  return getDb().libraryFolder.delete({ where: { id } });
}

export async function getViewerContext(input: {
  userId: string;
  globalRole: UserGlobalRole;
}): Promise<ViewerContext> {
  if (input.globalRole === "ADMIN") {
    return {
      userId: input.userId,
      globalRole: input.globalRole,
      enrolledCourseIds: [],
      teachingCourseIds: [],
    };
  }

  const [enrollments, assignments] = await Promise.all([
    getDb().courseEnrollment.findMany({
      where: { userId: input.userId, status: "ACTIVE" },
      select: { courseId: true },
    }),
    input.globalRole === "TEACHER"
      ? getDb().courseTeacherAssignment.findMany({
          where: { userId: input.userId },
          select: { courseId: true },
        })
      : Promise.resolve([] as Array<{ courseId: string }>),
  ]);

  return {
    userId: input.userId,
    globalRole: input.globalRole,
    enrolledCourseIds: enrollments.map((e) => e.courseId),
    teachingCourseIds: assignments.map((a) => a.courseId),
  };
}

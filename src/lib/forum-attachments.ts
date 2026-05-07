import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { buildProtectedForumAttachmentUrl } from "@/lib/forum-attachment-storage";
import { getDb } from "@/lib/prisma";

const MAX_ATTACHMENT_COUNT = 6;
const MAX_FILE_SIZE_BYTES = 8 * 1024 * 1024;

type UploadAttachmentDraft = {
  source: "upload";
  kind: "FILE" | "IMAGE";
  label: string;
  file: File;
  mimeType: string | null;
  sizeInBytes: number;
};

type LinkAttachmentDraft = {
  source: "link";
  kind: "LINK" | "VIDEO";
  label: string;
  url: string;
};

export type ForumAttachmentDraft = UploadAttachmentDraft | LinkAttachmentDraft;

function sanitizePathSegment(value: string) {
  return value.replace(/[^a-zA-Z0-9-_]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "") || "adjunto";
}

function sanitizeFileName(name: string) {
  const extension = path.extname(name);
  const baseName = path.basename(name, extension);
  const safeBase = sanitizePathSegment(baseName).slice(0, 48);
  const safeExtension = extension.replace(/[^a-zA-Z0-9.]/g, "").slice(0, 10);
  return `${safeBase || "archivo"}${safeExtension}`;
}

function guessLinkKind(url: string) {
  return /youtube\.com|youtu\.be|vimeo\.com/i.test(url)
    ? ("VIDEO" as const)
    : ("LINK" as const);
}

function buildLinkLabel(url: string) {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.hostname.replace(/^www\./i, "");
  } catch {
    return "Enlace externo";
  }
}

export function prepareForumAttachmentDrafts(input: {
  files?: File[];
  resourceLinksText?: string | null;
}) {
  const files = (input.files ?? []).filter((file) => file.size > 0 && file.name);
  const resourceLinks = (input.resourceLinksText ?? "")
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);

  if (files.length + resourceLinks.length > MAX_ATTACHMENT_COUNT) {
    throw new Error(`Puedes adjuntar como maximo ${MAX_ATTACHMENT_COUNT} elementos por mensaje.`);
  }

  const fileDrafts = files.map((file) => {
    if (file.size > MAX_FILE_SIZE_BYTES) {
      throw new Error(`El archivo "${file.name}" supera el limite de 8 MB.`);
    }

    const mimeType = file.type || null;

    return {
      source: "upload" as const,
      kind: mimeType?.startsWith("image/") ? ("IMAGE" as const) : ("FILE" as const),
      label: sanitizeFileName(file.name),
      file,
      mimeType,
      sizeInBytes: file.size
    };
  });

  const linkDrafts = resourceLinks.map((link) => {
    try {
      const url = new URL(link);

      return {
        source: "link" as const,
        kind: guessLinkKind(url.toString()),
        label: buildLinkLabel(url.toString()),
        url: url.toString()
      };
    } catch {
      throw new Error(`El enlace "${link}" no es valido.`);
    }
  });

  return [...fileDrafts, ...linkDrafts] as ForumAttachmentDraft[];
}

export async function persistForumAttachments(input: {
  courseSlug: string;
  parentType: "thread" | "post";
  parentId: string;
  createdById: string;
  attachments: ForumAttachmentDraft[];
}) {
  if (!input.attachments.length) {
    return [];
  }

  const persistedRecords = [];
  const uploadDirectory = path.join(
    process.cwd(),
    "storage",
    "forum",
    sanitizePathSegment(input.courseSlug),
    sanitizePathSegment(input.parentId)
  );

  await mkdir(uploadDirectory, { recursive: true });

  for (const attachment of input.attachments) {
    if (attachment.source === "link") {
      persistedRecords.push(
        getDb().forumAttachment.create({
          data: {
            ...(input.parentType === "thread"
              ? { threadId: input.parentId }
              : { postId: input.parentId }),
            kind: attachment.kind,
            label: attachment.label,
            url: attachment.url,
            createdById: input.createdById
          }
        })
      );
      continue;
    }

    const storedFileName = `${randomUUID()}-${attachment.label}`;
    const targetFilePath = path.join(uploadDirectory, storedFileName);
    const fileBuffer = Buffer.from(await attachment.file.arrayBuffer());
    const storageKey = path
      .join("forum", sanitizePathSegment(input.courseSlug), sanitizePathSegment(input.parentId), storedFileName)
      .replace(/\\/g, "/");

    await writeFile(targetFilePath, fileBuffer);

    const attachmentRecord = await getDb().forumAttachment.create({
      data: {
        ...(input.parentType === "thread"
          ? { threadId: input.parentId }
          : { postId: input.parentId }),
        kind: attachment.kind,
        label: attachment.label,
        url: "",
        mimeType: attachment.mimeType,
        sizeInBytes: attachment.sizeInBytes,
        storageKey,
        createdById: input.createdById
      }
    });

    persistedRecords.push(
      getDb().forumAttachment.update({
        where: {
          id: attachmentRecord.id
        },
        data: {
          url: buildProtectedForumAttachmentUrl(attachmentRecord.id)
        }
      })
    );
  }

  return Promise.all(persistedRecords);
}

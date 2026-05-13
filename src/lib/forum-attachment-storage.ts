import { access, readFile, unlink } from "fs/promises";
import path from "path";
import { deleteStoredAsset, getStoredAssetContent } from "@/lib/stored-assets";

function assertPathWithinRoot(resolvedPath: string, rootDirectory: string) {
  const relativePath = path.relative(rootDirectory, resolvedPath);

  if (
    relativePath.startsWith("..") ||
    path.isAbsolute(relativePath)
  ) {
    throw new Error("Attachment path resolved outside of the expected storage root.");
  }
}

function resolveStorageKeyPath(rootDirectory: string, storageKey: string) {
  const resolvedPath = path.resolve(rootDirectory, storageKey);
  assertPathWithinRoot(resolvedPath, rootDirectory);
  return resolvedPath;
}

export function buildProtectedForumAttachmentUrl(id: string) {
  return `/api/forum/attachments/${id}`;
}

export async function readStoredForumAttachmentContent(storageKey: string) {
  const assetContent = await getStoredAssetContent(storageKey);

  if (assetContent) {
    return Buffer.from(assetContent);
  }

  const filePath = await resolveForumAttachmentFilePath(storageKey);
  return readFile(filePath);
}

export function legacyForumAttachmentUrlToStorageKey(url: string) {
  if (!url.startsWith("/uploads/forum/")) {
    return null;
  }

  return url.replace(/^\/uploads\//, "");
}

export async function resolveForumAttachmentFilePath(storageKey: string) {
  const storageRoot = path.resolve(process.cwd(), "storage");
  const legacyUploadsRoot = path.resolve(process.cwd(), "public", "uploads");
  const privatePath = resolveStorageKeyPath(storageRoot, storageKey);

  try {
    await access(privatePath);
    return privatePath;
  } catch {
    const legacyStorageKey = storageKey.startsWith("forum/") ? storageKey : `forum/${storageKey}`;
    const legacyPath = resolveStorageKeyPath(legacyUploadsRoot, legacyStorageKey);
    await access(legacyPath);
    return legacyPath;
  }
}

export async function removeStoredForumAttachment(storageKey: string) {
  await deleteStoredAsset(storageKey);

  try {
    const filePath = await resolveForumAttachmentFilePath(storageKey);
    await unlink(filePath);
  } catch {
    // Ignore legacy filesystem cleanup failures when the attachment already lives in the database.
  }
}

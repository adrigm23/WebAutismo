import { access, readFile } from "fs/promises";
import path from "path";
import { deleteStoredAsset, getStoredAssetContent, resolveStoredAssetPath } from "@/lib/stored-assets";

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
  const providerPath = await resolveStoredAssetPath(storageKey);

  if (providerPath) {
    return providerPath;
  }

  const storageRoot = path.resolve(/* turbopackIgnore: true */ process.cwd(), "storage");
  const legacyUploadsRoot = path.resolve(/* turbopackIgnore: true */ process.cwd(), "public", "uploads");
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
}

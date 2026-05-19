import { access, readFile } from "fs/promises";
import { resolvePublicUploadsPath, resolveStoragePath } from "@/lib/project-paths";
import { deleteStoredAsset, getStoredAssetContent } from "@/lib/stored-assets";

export function buildProtectedForumAttachmentUrl(id: string) {
  return `/api/forum/attachments/${id}`;
}

export async function readStoredForumAttachmentContent(storageKey: string) {
  const assetContent = await getStoredAssetContent(storageKey);

  if (assetContent) {
    return Buffer.from(assetContent);
  }

  const filePath = resolveStoragePath(storageKey);

  try {
    await access(filePath);
    return readFile(filePath);
  } catch {
    const legacyStorageKey = storageKey.startsWith("forum/") ? storageKey : `forum/${storageKey}`;
    const legacyPath = resolvePublicUploadsPath(legacyStorageKey);
    await access(legacyPath);
    return readFile(legacyPath);
  }
}

export function legacyForumAttachmentUrlToStorageKey(url: string) {
  if (!url.startsWith("/uploads/forum/")) {
    return null;
  }

  return url.replace(/^\/uploads\//, "");
}

export async function removeStoredForumAttachment(storageKey: string) {
  await deleteStoredAsset(storageKey);
}

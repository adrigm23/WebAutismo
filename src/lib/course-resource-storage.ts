import { access, readFile } from "fs/promises";
import { getObjectStorageProvider } from "@/lib/object-storage";
import { resolveStoragePath } from "@/lib/project-paths";
import { deleteStoredAsset, getStoredAssetContent } from "@/lib/stored-assets";

export function buildProtectedCourseResourceUrl(id: string) {
  return `/api/course-resources/${id}`;
}

export async function readStoredCourseResourceContent(storageKey: string) {
  const assetContent = await getStoredAssetContent(storageKey);

  if (assetContent) {
    return Buffer.from(assetContent);
  }

  try {
    const filePath = resolveStoragePath(storageKey);
    await access(filePath);
    return readFile(filePath);
  } catch {
    throw new Error(
      `Stored course resource "${storageKey}" was not found in provider "${getObjectStorageProvider()}" or in legacy disk storage.`
    );
  }
}

export async function removeStoredCourseResource(storageKey: string) {
  await deleteStoredAsset(storageKey);
}

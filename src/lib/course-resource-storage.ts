import { readFile } from "fs/promises";
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

  const filePath = resolveStoragePath(storageKey);
  return readFile(filePath);
}

export async function removeStoredCourseResource(storageKey: string) {
  await deleteStoredAsset(storageKey);
}

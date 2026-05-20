import { access, readFile } from "fs/promises";
import { getObjectStorageProvider } from "@/lib/object-storage";
import { resolveStoragePath } from "@/lib/project-paths";
import { deleteStoredAsset, getStoredAssetContent } from "@/lib/stored-assets";

export function buildProtectedCourseResourceSubmissionUrl(id: string) {
  return `/api/course-resource-submissions/${id}`;
}

export async function readStoredCourseResourceSubmissionContent(storageKey: string) {
  const assetContent = await getStoredAssetContent(storageKey);

  if (assetContent) {
    return Buffer.from(assetContent);
  }

  const filePath = resolveStoragePath(storageKey);
  try {
    await access(filePath);
    return readFile(filePath);
  } catch {
    throw new Error(
      `Stored submission attachment "${storageKey}" was not found in provider "${getObjectStorageProvider()}" or in legacy disk storage.`
    );
  }
}

export async function removeStoredCourseResourceSubmission(storageKey: string) {
  await deleteStoredAsset(storageKey);
}

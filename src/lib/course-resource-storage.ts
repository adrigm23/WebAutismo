import { access, readFile, unlink } from "fs/promises";
import path from "path";
import { deleteStoredAsset, getStoredAssetContent } from "@/lib/stored-assets";

function assertPathWithinRoot(resolvedPath: string, rootDirectory: string) {
  const relativePath = path.relative(rootDirectory, resolvedPath);

  if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
    throw new Error("Course resource path resolved outside of the expected storage root.");
  }
}

function resolveStorageKeyPath(rootDirectory: string, storageKey: string) {
  const resolvedPath = path.resolve(rootDirectory, storageKey);
  assertPathWithinRoot(resolvedPath, rootDirectory);
  return resolvedPath;
}

export function buildProtectedCourseResourceUrl(id: string) {
  return `/api/course-resources/${id}`;
}

export async function readStoredCourseResourceContent(storageKey: string) {
  const assetContent = await getStoredAssetContent(storageKey);

  if (assetContent) {
    return Buffer.from(assetContent);
  }

  const filePath = await resolveCourseResourceFilePath(storageKey);
  return readFile(filePath);
}

export async function resolveCourseResourceFilePath(storageKey: string) {
  const storageRoot = path.resolve(process.cwd(), "storage");
  const resolvedPath = resolveStorageKeyPath(storageRoot, storageKey);
  await access(resolvedPath);
  return resolvedPath;
}

export async function removeStoredCourseResource(storageKey: string) {
  await deleteStoredAsset(storageKey);

  try {
    const filePath = await resolveCourseResourceFilePath(storageKey);
    await unlink(filePath);
  } catch {
    // Ignore legacy filesystem cleanup failures when the asset already lives in the database.
  }
}

import { access, readFile, unlink } from "fs/promises";
import path from "path";
import { deleteStoredAsset, getStoredAssetContent } from "@/lib/stored-assets";

function assertPathWithinRoot(resolvedPath: string, rootDirectory: string) {
  const relativePath = path.relative(rootDirectory, resolvedPath);

  if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
    throw new Error("Course resource submission path resolved outside of the expected storage root.");
  }
}

function resolveStorageKeyPath(rootDirectory: string, storageKey: string) {
  const resolvedPath = path.resolve(rootDirectory, storageKey);
  assertPathWithinRoot(resolvedPath, rootDirectory);
  return resolvedPath;
}

export function buildProtectedCourseResourceSubmissionUrl(id: string) {
  return `/api/course-resource-submissions/${id}`;
}

export async function readStoredCourseResourceSubmissionContent(storageKey: string) {
  const assetContent = await getStoredAssetContent(storageKey);

  if (assetContent) {
    return Buffer.from(assetContent);
  }

  const filePath = await resolveCourseResourceSubmissionFilePath(storageKey);
  return readFile(filePath);
}

export async function resolveCourseResourceSubmissionFilePath(storageKey: string) {
  const storageRoot = path.resolve(process.cwd(), "storage");
  const resolvedPath = resolveStorageKeyPath(storageRoot, storageKey);
  await access(resolvedPath);
  return resolvedPath;
}

export async function removeStoredCourseResourceSubmission(storageKey: string) {
  await deleteStoredAsset(storageKey);

  try {
    const filePath = await resolveCourseResourceSubmissionFilePath(storageKey);
    await unlink(filePath);
  } catch {
    // Ignore legacy filesystem cleanup failures when the asset already lives in the database.
  }
}

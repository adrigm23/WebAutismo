import { access, unlink } from "fs/promises";
import path from "path";

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

export async function resolveCourseResourceFilePath(storageKey: string) {
  const storageRoot = path.resolve(process.cwd(), "storage");
  const resolvedPath = resolveStorageKeyPath(storageRoot, storageKey);
  await access(resolvedPath);
  return resolvedPath;
}

export async function removeStoredCourseResource(storageKey: string) {
  const filePath = await resolveCourseResourceFilePath(storageKey);
  await unlink(filePath);
}

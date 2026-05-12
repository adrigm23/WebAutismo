import { access, unlink } from "fs/promises";
import path from "path";

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

export async function resolveCourseResourceSubmissionFilePath(storageKey: string) {
  const storageRoot = path.resolve(process.cwd(), "storage");
  const resolvedPath = resolveStorageKeyPath(storageRoot, storageKey);
  await access(resolvedPath);
  return resolvedPath;
}

export async function removeStoredCourseResourceSubmission(storageKey: string) {
  const filePath = await resolveCourseResourceSubmissionFilePath(storageKey);
  await unlink(filePath);
}

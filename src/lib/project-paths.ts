import path from "node:path";

export function getSafeRelativeSegments(relativePath: string) {
  const normalized = relativePath.replace(/\\/g, "/");
  const segments = normalized.split("/").filter(Boolean);

  if (
    segments.length === 0 ||
    segments.some((segment) => segment === "." || segment === "..")
  ) {
    throw new Error("Resolved path escaped the expected project subdirectory.");
  }

  return segments;
}

export function resolveStoragePath(relativePath: string) {
  return path.join(
    /*turbopackIgnore: true*/ process.cwd(),
    "storage",
    ...getSafeRelativeSegments(relativePath)
  );
}

export function resolveObjectStoragePath(relativePath: string) {
  return path.join(
    /*turbopackIgnore: true*/ process.cwd(),
    "storage",
    "objects",
    ...getSafeRelativeSegments(relativePath)
  );
}

export function resolvePublicUploadsPath(relativePath: string) {
  return path.join(
    /*turbopackIgnore: true*/ process.cwd(),
    "public",
    "uploads",
    ...getSafeRelativeSegments(relativePath)
  );
}

export function resolveProjectRelativeRoot(relativePath: string) {
  return path.join(
    /*turbopackIgnore: true*/ process.cwd(),
    ...getSafeRelativeSegments(relativePath)
  );
}

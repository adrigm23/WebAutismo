import { access, mkdir, readFile, unlink, writeFile } from "fs/promises";
import path from "node:path";
import { del, get, put } from "@vercel/blob";
import {
  deleteLegacyDatabaseStoredAsset,
  getLegacyDatabaseStoredAssetContent,
  upsertLegacyDatabaseStoredAsset
} from "@/lib/legacy-stored-assets";
import { getBooleanEnv } from "@/lib/env";
import { captureOperationalWarning } from "@/lib/monitoring";

export type ObjectStorageProvider = "vercel-blob" | "filesystem" | "database";

function getConfiguredObjectStorageProvider(): ObjectStorageProvider {
  const configuredProvider = process.env.OBJECT_STORAGE_PROVIDER?.trim().toLowerCase();

  if (configuredProvider === "vercel-blob") {
    return "vercel-blob";
  }

  if (configuredProvider === "database") {
    return "database";
  }

  if (configuredProvider === "filesystem") {
    return "filesystem";
  }

  return process.env.BLOB_READ_WRITE_TOKEN?.trim() ? "vercel-blob" : "filesystem";
}

export function getObjectStorageProvider() {
  return getConfiguredObjectStorageProvider();
}

export function isDatabaseStorageFallbackAllowed() {
  return getBooleanEnv("ALLOW_DATABASE_STORAGE_FALLBACK", false);
}

function getFilesystemRoot() {
  const configuredRoot = process.env.OBJECT_STORAGE_FILESYSTEM_ROOT?.trim();
  return path.resolve(/* turbopackIgnore: true */ process.cwd(), configuredRoot || "storage/objects");
}

function isBlobPath(value: string) {
  return value.startsWith("http://") || value.startsWith("https://");
}

function assertPathWithinRoot(resolvedPath: string, rootDirectory: string) {
  const relativePath = path.relative(rootDirectory, resolvedPath);

  if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
    throw new Error("Storage key resolved outside of the configured object storage root.");
  }
}

function resolveFilesystemPath(storageKey: string) {
  const rootDirectory = getFilesystemRoot();
  const resolvedPath = path.resolve(rootDirectory, storageKey);
  assertPathWithinRoot(resolvedPath, rootDirectory);
  return resolvedPath;
}

async function readPrivateBlob(storageKey: string) {
  const response = await get(storageKey, {
    access: "private",
    useCache: false
  });

  if (!response || response.statusCode !== 200 || !response.stream) {
    return null;
  }

  const reader = response.stream.getReader();
  const chunks: Uint8Array[] = [];

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    chunks.push(value);
  }

  return Buffer.concat(chunks.map((chunk) => Buffer.from(chunk)));
}

async function writeToFilesystem(input: { storageKey: string; content: Uint8Array }) {
  const filePath = resolveFilesystemPath(input.storageKey);
  await mkdir(path.dirname(filePath), {
    recursive: true
  });
  await writeFile(filePath, Buffer.from(input.content));
}

async function readFromFilesystem(storageKey: string) {
  try {
    const filePath = resolveFilesystemPath(storageKey);
    await access(filePath);
    return readFile(filePath);
  } catch {
    return null;
  }
}

async function deleteFromFilesystem(storageKey: string) {
  try {
    const filePath = resolveFilesystemPath(storageKey);
    await unlink(filePath);
  } catch {
    // Ignore missing local assets.
  }
}

export async function writeStoredObject(input: {
  storageKey: string;
  content: Uint8Array;
  contentType?: string | null;
}) {
  const provider = getObjectStorageProvider();

  try {
    if (provider === "vercel-blob") {
      await put(input.storageKey, Buffer.from(input.content), {
        access: "private",
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: input.contentType ?? undefined
      });

      return {
        storageKey: input.storageKey,
        provider
      };
    }

    if (provider === "filesystem") {
      await writeToFilesystem(input);
      return {
        storageKey: input.storageKey,
        provider
      };
    }

    await upsertLegacyDatabaseStoredAsset(input);
    return {
      storageKey: input.storageKey,
      provider
    };
  } catch (error) {
    if (!isDatabaseStorageFallbackAllowed() || provider === "database") {
      throw error;
    }

    captureOperationalWarning("Object storage write failed; using database fallback.", {
      provider,
      storageKey: input.storageKey,
      error: error instanceof Error ? error : new Error(String(error))
    });

    await upsertLegacyDatabaseStoredAsset(input);
    return {
      storageKey: input.storageKey,
      provider: "database" as const
    };
  }
}

export async function readStoredObjectContent(storageKey: string) {
  const provider = getObjectStorageProvider();
  const readOperations = [];

  if (provider === "vercel-blob" || isBlobPath(storageKey)) {
    readOperations.push(() => readPrivateBlob(storageKey));
  }

  readOperations.push(() => readFromFilesystem(storageKey));

  if (provider === "database" || isDatabaseStorageFallbackAllowed()) {
    readOperations.push(async () => {
      const assetContent = await getLegacyDatabaseStoredAssetContent(storageKey);
      return assetContent ? Buffer.from(assetContent) : null;
    });
  }

  for (const readOperation of readOperations) {
    const content = await readOperation();

    if (content) {
      return content;
    }
  }

  return null;
}

export async function deleteStoredObject(storageKey: string) {
  const provider = getObjectStorageProvider();

  try {
    if (provider === "vercel-blob" || isBlobPath(storageKey)) {
      await del(storageKey);
    } else if (provider === "filesystem") {
      await deleteFromFilesystem(storageKey);
    }
  } catch (error) {
    captureOperationalWarning("Object storage delete failed.", {
      provider,
      storageKey,
      error: error instanceof Error ? error : new Error(String(error))
    });
  }

  await deleteFromFilesystem(storageKey);
  await deleteLegacyDatabaseStoredAsset(storageKey);
}

export async function resolveStoredObjectFilePath(storageKey: string) {
  if (isBlobPath(storageKey) || getObjectStorageProvider() === "vercel-blob") {
    return null;
  }

  try {
    const filePath = resolveFilesystemPath(storageKey);
    await access(filePath);
    return filePath;
  } catch {
    return null;
  }
}

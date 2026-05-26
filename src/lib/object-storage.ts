import { access, mkdir, readFile, unlink, writeFile } from "fs/promises";
import path from "node:path";
import { del, get, put } from "@vercel/blob";
import {
  deleteLegacyDatabaseStoredAsset,
  getLegacyDatabaseStoredAssetContent,
  upsertLegacyDatabaseStoredAsset
} from "@/lib/legacy-stored-assets";
import {
  getObjectStorageProviderEnv,
  hasEnv,
  isDatabaseStorageFallbackAllowed,
  isHostedDeploymentEnv,
  isLocalDevelopmentEnv
} from "@/lib/env";
import { captureOperationalWarning } from "@/lib/monitoring";
import {
  getSafeRelativeSegments,
  resolveObjectStoragePath,
  resolveProjectRelativeRoot
} from "@/lib/project-paths";

export type ObjectStorageProvider = "vercel-blob" | "filesystem" | "database";
export type ObjectStorageWriteReadiness =
  | {
      ok: true;
      configuredProvider: ObjectStorageProvider | null;
      effectiveProvider: ObjectStorageProvider;
      mode: "configured" | "implicit-local-database-fallback";
    }
  | {
      ok: false;
      reason: "storage-provider-not-explicit" | "blob-token-missing";
      configuredProvider: ObjectStorageProvider | null;
      effectiveProvider: ObjectStorageProvider;
      message: string;
    };

function getConfiguredObjectStorageProvider(): ObjectStorageProvider {
  const configuredProvider = getObjectStorageProviderEnv();

  if (configuredProvider) {
    return configuredProvider;
  }

  if (process.env.BLOB_READ_WRITE_TOKEN?.trim()) {
    return "vercel-blob";
  }

  // Default to MySQL-backed storage so existing StoredAsset blobs keep working unless
  // a different backend is selected explicitly.
  return "database";
}

export function getObjectStorageProvider() {
  return getConfiguredObjectStorageProvider();
}

function isLocalHostname(value: string) {
  return value === "localhost" || value === "127.0.0.1" || value === "::1";
}

function canUseImplicitDatabaseStorageWrite() {
  if (isLocalDevelopmentEnv()) {
    return true;
  }

  if (isHostedDeploymentEnv()) {
    return false;
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  if (!siteUrl) {
    return false;
  }

  try {
    return isLocalHostname(new URL(siteUrl).hostname);
  } catch {
    return false;
  }
}

export function getObjectStorageWriteReadiness(): ObjectStorageWriteReadiness {
  const configuredProvider = getObjectStorageProviderEnv();
  const effectiveProvider = getObjectStorageProvider();

  if (!configuredProvider) {
    if (effectiveProvider === "database" && canUseImplicitDatabaseStorageWrite()) {
      return {
        ok: true,
        configuredProvider: null,
        effectiveProvider,
        mode: "implicit-local-database-fallback"
      };
    }

    return {
      ok: false,
      reason: "storage-provider-not-explicit",
      configuredProvider: null,
      effectiveProvider,
      message:
        "La subida de archivos no esta disponible ahora mismo porque OBJECT_STORAGE_PROVIDER no esta configurado en este entorno."
    };
  }

  if (configuredProvider === "vercel-blob" && !hasEnv("BLOB_READ_WRITE_TOKEN")) {
    return {
      ok: false,
      reason: "blob-token-missing",
      configuredProvider,
      effectiveProvider,
      message:
        "La subida de archivos no esta disponible ahora mismo porque falta BLOB_READ_WRITE_TOKEN para el almacenamiento configurado."
    };
  }

  return {
    ok: true,
    configuredProvider,
    effectiveProvider,
    mode: "configured"
  };
}

export function assertObjectStorageWriteReady() {
  const readiness = getObjectStorageWriteReadiness();

  if (!readiness.ok) {
    throw new Error(readiness.message);
  }
}

function getFilesystemRoot() {
  const configuredRoot = process.env.OBJECT_STORAGE_FILESYSTEM_ROOT?.trim();

  if (configuredRoot) {
    return resolveProjectRelativeRoot(configuredRoot);
  }

  return path.join(/*turbopackIgnore: true*/ process.cwd(), "storage", "objects");
}

function isBlobPath(value: string) {
  return value.startsWith("http://") || value.startsWith("https://");
}

function resolveFilesystemPath(storageKey: string) {
  const configuredRoot = process.env.OBJECT_STORAGE_FILESYSTEM_ROOT?.trim();

  if (!configuredRoot) {
    return resolveObjectStoragePath(storageKey);
  }

  return path.join(getFilesystemRoot(), ...getSafeRelativeSegments(storageKey));
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

async function readFromDatabase(storageKey: string) {
  const assetContent = await getLegacyDatabaseStoredAssetContent(storageKey);
  return assetContent ? Buffer.from(assetContent) : null;
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
  } else if (provider === "filesystem") {
    readOperations.push(() => readFromFilesystem(storageKey));
  } else {
    readOperations.push(() => readFromDatabase(storageKey));
  }

  if (provider !== "database" && isDatabaseStorageFallbackAllowed()) {
    readOperations.push(() => readFromDatabase(storageKey));
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
  if (isBlobPath(storageKey) || getObjectStorageProvider() !== "filesystem") {
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

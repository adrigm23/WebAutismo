import {
  deleteStoredObject,
  readStoredObjectContent,
  resolveStoredObjectFilePath,
  writeStoredObject
} from "@/lib/object-storage";

export async function upsertStoredAsset(input: {
  storageKey: string;
  content: Uint8Array;
  contentType?: string | null;
}) {
  return writeStoredObject(input);
}

export async function getStoredAssetContent(storageKey: string) {
  return readStoredObjectContent(storageKey);
}

export async function deleteStoredAsset(storageKey: string) {
  await deleteStoredObject(storageKey);
}

export async function resolveStoredAssetPath(storageKey: string) {
  return resolveStoredObjectFilePath(storageKey);
}

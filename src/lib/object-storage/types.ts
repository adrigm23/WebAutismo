export type ObjectStorageProvider = "vercel-blob" | "filesystem" | "database";

export type StoredObjectInput = {
  storageKey: string;
  content: Uint8Array;
  contentType?: string | null;
};

export type StoredObjectWriteResult = {
  storageKey: string;
  provider: ObjectStorageProvider;
};

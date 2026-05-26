import { getLegacyDatabaseStoredAssetContent } from "@/lib/legacy-stored-assets";

vi.mock("@/lib/legacy-stored-assets", () => ({
  deleteLegacyDatabaseStoredAsset: vi.fn(),
  getLegacyDatabaseStoredAssetContent: vi.fn(),
  upsertLegacyDatabaseStoredAsset: vi.fn()
}));

describe("object storage provider resolution", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    process.env = { ...originalEnv, NODE_ENV: "test" };
    delete process.env.OBJECT_STORAGE_PROVIDER;
    delete process.env.BLOB_READ_WRITE_TOKEN;
    delete process.env.ALLOW_DATABASE_STORAGE_FALLBACK;
    delete process.env.VERCEL;
    delete process.env.VERCEL_ENV;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  test("defaults to database storage when no provider is configured", async () => {
    const objectStorage = await import("@/lib/object-storage");

    expect(objectStorage.getObjectStorageProvider()).toBe("database");
  });

  test("reads existing StoredAsset blobs through the default database provider", async () => {
    vi.mocked(getLegacyDatabaseStoredAssetContent).mockResolvedValue(Buffer.from("stored-asset"));
    const objectStorage = await import("@/lib/object-storage");

    const content = await objectStorage.readStoredObjectContent("course-resources/course-1/file.txt");

    expect(content).toEqual(Buffer.from("stored-asset"));
    expect(getLegacyDatabaseStoredAssetContent).toHaveBeenCalledWith(
      "course-resources/course-1/file.txt"
    );
  });

  test("keeps database fallback disabled outside local development", async () => {
    process.env.ALLOW_DATABASE_STORAGE_FALLBACK = "true";
    process.env.NODE_ENV = "production";
    const env = await import("@/lib/env");

    expect(env.isDatabaseStorageFallbackAllowed()).toBe(false);
  });

  test("marks hosted uploads as not ready when provider is implicit", async () => {
    process.env.NODE_ENV = "production";
    process.env.VERCEL = "1";
    process.env.VERCEL_ENV = "production";

    const objectStorage = await import("@/lib/object-storage");
    const readiness = objectStorage.getObjectStorageWriteReadiness();

    expect(readiness).toMatchObject({
      ok: false,
      reason: "storage-provider-not-explicit",
      effectiveProvider: "database"
    });
  });

  test("marks blob uploads as not ready when the write token is missing", async () => {
    process.env.OBJECT_STORAGE_PROVIDER = "vercel-blob";

    const objectStorage = await import("@/lib/object-storage");
    const readiness = objectStorage.getObjectStorageWriteReadiness();

    expect(readiness).toMatchObject({
      ok: false,
      reason: "blob-token-missing",
      configuredProvider: "vercel-blob",
      effectiveProvider: "vercel-blob"
    });
  });
});

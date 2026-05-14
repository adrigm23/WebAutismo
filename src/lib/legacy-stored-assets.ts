import { getDb } from "@/lib/prisma";
import { MAX_STORED_ASSET_SIZE_BYTES } from "@/lib/file-security";

export async function upsertLegacyDatabaseStoredAsset(input: {
  storageKey: string;
  content: Uint8Array;
}) {
  if (input.content.byteLength <= 0 || input.content.byteLength > MAX_STORED_ASSET_SIZE_BYTES) {
    throw new Error("El archivo excede el tamano maximo permitido para almacenamiento interno.");
  }

  return getDb().storedAsset.upsert({
    where: {
      storageKey: input.storageKey
    },
    update: {
      content: Buffer.from(input.content)
    },
    create: {
      storageKey: input.storageKey,
      content: Buffer.from(input.content)
    }
  });
}

export async function getLegacyDatabaseStoredAssetContent(storageKey: string) {
  const asset = await getDb().storedAsset.findUnique({
    where: {
      storageKey
    },
    select: {
      content: true
    }
  });

  return asset?.content ?? null;
}

export async function deleteLegacyDatabaseStoredAsset(storageKey: string) {
  await getDb().storedAsset.deleteMany({
    where: {
      storageKey
    }
  });
}

export async function listLegacyDatabaseStoredAssets(limit = 500) {
  return getDb().storedAsset.findMany({
    take: limit,
    orderBy: {
      createdAt: "asc"
    },
    select: {
      storageKey: true,
      content: true
    }
  });
}

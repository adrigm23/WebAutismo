import { getDb } from "@/lib/prisma";

export async function upsertStoredAsset(input: {
  storageKey: string;
  content: Uint8Array;
}) {
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

export async function getStoredAssetContent(storageKey: string) {
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

export async function deleteStoredAsset(storageKey: string) {
  await getDb().storedAsset.deleteMany({
    where: {
      storageKey
    }
  });
}

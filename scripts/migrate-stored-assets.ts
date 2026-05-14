import { deleteLegacyDatabaseStoredAsset, listLegacyDatabaseStoredAssets } from "../src/lib/legacy-stored-assets";
import { getObjectStorageProvider, writeStoredObject } from "../src/lib/object-storage";

async function main() {
  const provider = getObjectStorageProvider();

  if (provider === "database") {
    throw new Error("OBJECT_STORAGE_PROVIDER=database no permite migrar blobs fuera de MySQL.");
  }

  const batch = await listLegacyDatabaseStoredAssets(1000);

  if (!batch.length) {
    console.info("No hay blobs legacy pendientes de migracion.");
    return;
  }

  let migratedCount = 0;

  for (const asset of batch) {
    await writeStoredObject({
      storageKey: asset.storageKey,
      content: new Uint8Array(asset.content)
    });
    await deleteLegacyDatabaseStoredAsset(asset.storageKey);
    migratedCount += 1;
  }

  console.info(`Migrados ${migratedCount} blobs desde MySQL a ${provider}.`);
}

main().catch((error) => {
  console.error("Fallo durante la migracion de blobs:", error);
  process.exitCode = 1;
});

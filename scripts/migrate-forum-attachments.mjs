import { access, copyFile, mkdir, rename, unlink } from "fs/promises";
import path from "path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function buildProtectedAttachmentUrl(id) {
  return `/api/forum/attachments/${id}`;
}

function toStorageKey(url) {
  if (!url.startsWith("/uploads/forum/")) {
    return null;
  }

  return url.replace(/^\/uploads\//, "");
}

async function exists(targetPath) {
  try {
    await access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function moveFile(sourcePath, targetPath) {
  try {
    await rename(sourcePath, targetPath);
  } catch {
    await copyFile(sourcePath, targetPath);
    await unlink(sourcePath);
  }
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const attachments = await prisma.forumAttachment.findMany({
    where: {
      storageKey: null,
      kind: {
        in: ["FILE", "IMAGE"]
      },
      url: {
        startsWith: "/uploads/forum/"
      }
    },
    select: {
      id: true,
      label: true,
      url: true
    }
  });

  if (attachments.length === 0) {
    console.log("No se han encontrado adjuntos legacy para migrar.");
    return;
  }

  let migratedCount = 0;
  let skippedCount = 0;

  for (const attachment of attachments) {
    const storageKey = toStorageKey(attachment.url);

    if (!storageKey) {
      skippedCount += 1;
      console.warn(`Saltado ${attachment.id}: URL no compatible (${attachment.url}).`);
      continue;
    }

    const sourcePath = path.join(process.cwd(), "public", "uploads", storageKey);
    const targetPath = path.join(process.cwd(), "storage", storageKey);
    const sourceExists = await exists(sourcePath);
    const targetExists = await exists(targetPath);

    if (!sourceExists && !targetExists) {
      skippedCount += 1;
      console.warn(`Saltado ${attachment.id}: no existe ni origen ni destino para ${storageKey}.`);
      continue;
    }

    if (dryRun) {
      migratedCount += 1;
      console.log(`[dry-run] ${attachment.id}: ${sourcePath} -> ${targetPath}`);
      continue;
    }

    await mkdir(path.dirname(targetPath), { recursive: true });

    if (sourceExists && !targetExists) {
      await moveFile(sourcePath, targetPath);
    } else if (sourceExists && targetExists) {
      await unlink(sourcePath);
    }

    await prisma.forumAttachment.update({
      where: {
        id: attachment.id
      },
      data: {
        storageKey,
        url: buildProtectedAttachmentUrl(attachment.id)
      }
    });

    migratedCount += 1;
    console.log(`Migrado ${attachment.id}: ${attachment.label}`);
  }

  console.log(`Adjuntos migrados: ${migratedCount}`);
  console.log(`Adjuntos omitidos: ${skippedCount}`);
}

main()
  .catch((error) => {
    console.error("La migracion de adjuntos ha fallado.");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

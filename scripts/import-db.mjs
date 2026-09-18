import { PrismaClient } from "@prisma/client";
import { readFileSync } from "fs";

// Transient/operational data — intentionally NOT restored. Session tokens
// are signed with SESSION_SECRET, which must be regenerated fresh for the
// new deployment anyway, so old sessions/rate-limit counters/webhook
// processing state would be dead weight at best.
const SKIP_TABLES = new Set(["RateLimitBucket", "UserSession", "payment_webhook_events"]);

const dumpPath = process.argv[2];
if (!dumpPath) {
  console.error("Uso: node scripts/_import_db.mjs <ruta-al-json-exportado>");
  process.exit(1);
}

function deserialize(value) {
  if (value && typeof value === "object" && "__type" in value) {
    if (value.__type === "Date") return new Date(value.value);
    if (value.__type === "BigInt") return BigInt(value.value);
    if (value.__type === "Buffer") return Buffer.from(value.value, "base64");
  }

  // Plain arrays/objects come from MySQL JSON columns — the driver parses
  // them into native JS values on the way out, but $executeRawUnsafe can't
  // bind a raw array/object as a parameter, so re-stringify for the round
  // trip back in.
  if (value !== null && typeof value === "object" && !(value instanceof Date) && !Buffer.isBuffer(value)) {
    return JSON.stringify(value);
  }

  return value;
}

function deserializeRow(row) {
  const out = {};
  for (const [key, value] of Object.entries(row)) {
    out[key] = deserialize(value);
  }
  return out;
}

const prisma = new PrismaClient();
const dump = JSON.parse(readFileSync(dumpPath, "utf8"));
const tables = Object.keys(dump).filter((t) => !SKIP_TABLES.has(t));

console.log(`Restaurando ${tables.length} tablas (omitiendo: ${[...SKIP_TABLES].join(", ")})`);

await prisma.$transaction(async (tx) => {
  await tx.$executeRawUnsafe("SET FOREIGN_KEY_CHECKS = 0");

  for (const table of tables) {
    const rows = dump[table].map(deserializeRow);
    if (rows.length === 0) {
      console.log(`  ${table}: 0 filas, omitido`);
      continue;
    }

    const columns = Object.keys(rows[0]);
    const columnList = columns.map((c) => `\`${c}\``).join(", ");

    for (const row of rows) {
      const placeholders = columns.map(() => "?").join(", ");
      const values = columns.map((c) => row[c]);
      await tx.$executeRawUnsafe(
        `INSERT INTO \`${table}\` (${columnList}) VALUES (${placeholders})`,
        ...values,
      );
    }
    console.log(`  ${table}: ${rows.length} filas restauradas`);
  }

  await tx.$executeRawUnsafe("SET FOREIGN_KEY_CHECKS = 1");
});

console.log("\nRestauracion completada.");
await prisma.$disconnect();

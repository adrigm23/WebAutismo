import { PrismaClient } from "@prisma/client";
import { writeFileSync, mkdirSync } from "fs";

const prisma = new PrismaClient();

function serialize(value) {
  if (value instanceof Date) return { __type: "Date", value: value.toISOString() };
  if (typeof value === "bigint") return { __type: "BigInt", value: value.toString() };
  if (Buffer.isBuffer(value)) return { __type: "Buffer", value: value.toString("base64") };
  return value;
}

function serializeRow(row) {
  const out = {};
  for (const [key, value] of Object.entries(row)) {
    out[key] = serialize(value);
  }
  return out;
}

const tables = (await prisma.$queryRawUnsafe("SHOW TABLES"))
  .map((row) => Object.values(row)[0])
  .filter((name) => name !== "_prisma_migrations");

console.log(`Tablas encontradas (${tables.length}): ${tables.join(", ")}`);

const dump = {};
let totalRows = 0;

for (const table of tables) {
  const rows = await prisma.$queryRawUnsafe(`SELECT * FROM \`${table}\``);
  dump[table] = rows.map(serializeRow);
  totalRows += rows.length;
  console.log(`  ${table}: ${rows.length} filas`);
}

mkdirSync("backups", { recursive: true });
const outPath = `backups/full-db-export-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
writeFileSync(outPath, JSON.stringify(dump, null, 0));

console.log(`\nExport completo: ${totalRows} filas en ${tables.length} tablas.`);
console.log(`Guardado en: ${outPath}`);

await prisma.$disconnect();

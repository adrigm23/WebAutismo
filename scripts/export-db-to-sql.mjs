import { readFileSync, writeFileSync } from "fs";

// Converts the JSON dump from export-db.mjs into plain .sql INSERT
// statements, for hosts where the only way in is phpMyAdmin's "Importar"
// tab (no SSH / terminal access at all). Apply the Prisma schema first
// (via `prisma db push` from wherever you *can* run it, or by having the
// destination host run it), THEN import this file — it only inserts rows,
// it doesn't create tables.
const SKIP_TABLES = new Set(["RateLimitBucket", "UserSession", "payment_webhook_events"]);

function sqlEscape(value) {
  if (value === null || value === undefined) return "NULL";

  if (value && typeof value === "object" && "__type" in value) {
    if (value.__type === "Date") return `'${new Date(value.value).toISOString().slice(0, 19).replace("T", " ")}'`;
    if (value.__type === "BigInt") return value.value;
    if (value.__type === "Buffer") return `X'${Buffer.from(value.value, "base64").toString("hex")}'`;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return typeof value === "boolean" ? (value ? "1" : "0") : String(value);
  }

  if (typeof value === "object") {
    // JSON columns come back from MySQL already parsed into plain JS values.
    value = JSON.stringify(value);
  }

  return `'${String(value).replace(/\\/g, "\\\\").replace(/'/g, "\\'")}'`;
}

const [inPath, outPath] = process.argv.slice(2);
if (!inPath || !outPath) {
  console.error("Uso: node scripts/export-db-to-sql.mjs <entrada.json> <salida.sql>");
  process.exit(1);
}

const dump = JSON.parse(readFileSync(inPath, "utf8"));
const lines = ["SET FOREIGN_KEY_CHECKS = 0;", ""];
let totalRows = 0;

for (const [table, rows] of Object.entries(dump)) {
  if (SKIP_TABLES.has(table) || rows.length === 0) continue;

  const columns = Object.keys(rows[0]);
  const columnList = columns.map((c) => `\`${c}\``).join(", ");

  lines.push(`-- ${table} (${rows.length} filas)`);
  for (const row of rows) {
    const values = columns.map((c) => sqlEscape(row[c])).join(", ");
    lines.push(`INSERT INTO \`${table}\` (${columnList}) VALUES (${values});`);
    totalRows += 1;
  }
  lines.push("");
}

lines.push("SET FOREIGN_KEY_CHECKS = 1;");
writeFileSync(outPath, lines.join("\n"));
console.log(`Generado ${outPath}: ${totalRows} filas.`);

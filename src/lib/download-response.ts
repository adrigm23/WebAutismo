import { ensureFileNameExtension, normalizeFileName } from "@/lib/file-security";

function toAsciiFallback(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[^\x20-\x7E]/g, "")
    .replace(/["\\]/g, "")
    .replace(/[\r\n]/g, " ")
    .trim() || "download";
}

export function buildContentDisposition(input: {
  fileName: string;
  inline?: boolean;
  mimeType?: string | null;
}) {
  const normalizedName = ensureFileNameExtension(input.fileName, input.mimeType);
  const safeFileName = normalizeFileName(normalizedName);
  const asciiFallback = toAsciiFallback(safeFileName);
  const encodedFileName = encodeURIComponent(safeFileName);

  return `${input.inline ? "inline" : "attachment"}; filename="${asciiFallback}"; filename*=UTF-8''${encodedFileName}`;
}

export function buildPrivateFileHeaders(input: {
  fileName: string;
  inline?: boolean;
  mimeType?: string | null;
}) {
  const headers = new Headers();

  headers.set("Content-Type", input.mimeType || "application/octet-stream");
  headers.set("Content-Disposition", buildContentDisposition(input));
  headers.set("Cache-Control", "private, no-store");
  headers.set("X-Content-Type-Options", "nosniff");

  return headers;
}

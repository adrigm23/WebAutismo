import { MAX_APP_UPLOAD_SIZE_BYTES } from "@/lib/upload-limits";

const COURSE_UPLOAD_ALLOWED_EXTENSIONS = [
  ".doc",
  ".docx",
  ".jpg",
  ".jpeg",
  ".pdf",
  ".png",
  ".ppt",
  ".pptx",
  ".txt",
  ".webp",
  ".xls",
  ".xlsx",
  ".csv",
] as const;

const COURSE_UPLOAD_ALLOWED_MIME_TYPES = new Set<string>([
  "application/msword",
  "application/pdf",
  "application/vnd.ms-excel",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png",
  "image/webp",
  "text/csv",
  "text/plain",
]);

export const COURSE_UPLOAD_ACCEPT = COURSE_UPLOAD_ALLOWED_EXTENSIONS.join(",");
export const COURSE_UPLOAD_HELP_TEXT =
  "PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, JPG, PNG, WEBP, CSV o TXT hasta 10 MB";

function getFileExtension(fileName: string) {
  const lastDotIndex = fileName.lastIndexOf(".");

  if (lastDotIndex < 0) {
    return "";
  }

  return fileName.slice(lastDotIndex).toLowerCase();
}

export function formatUploadFileSize(sizeInBytes: number) {
  if (sizeInBytes >= 1024 * 1024) {
    const sizeInMegabytes = sizeInBytes / (1024 * 1024);
    return `${sizeInMegabytes.toFixed(sizeInBytes % (1024 * 1024) === 0 ? 0 : 1)} MB`;
  }

  if (sizeInBytes >= 1024) {
    return `${Math.ceil(sizeInBytes / 1024)} KB`;
  }

  return `${sizeInBytes} B`;
}

export function getCourseUploadTypeLabel(mimeType: string) {
  if (mimeType === "application/pdf") {
    return "PDF";
  }

  if (
    mimeType === "application/msword" ||
    mimeType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    return "Documento";
  }

  if (
    mimeType === "application/vnd.ms-excel" ||
    mimeType ===
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    mimeType === "text/csv"
  ) {
    return "Hoja de calculo";
  }

  if (
    mimeType === "application/vnd.ms-powerpoint" ||
    mimeType ===
      "application/vnd.openxmlformats-officedocument.presentationml.presentation"
  ) {
    return "Presentacion";
  }

  if (mimeType.startsWith("image/")) {
    return "Imagen";
  }

  if (mimeType === "text/plain") {
    return "Texto";
  }

  return mimeType || "Archivo";
}

export function validateCourseUploadSelection(
  file: Pick<File, "name" | "size" | "type">,
  label = "El archivo",
) {
  if (file.size <= 0) {
    return `${label} esta vacio.`;
  }

  if (file.size > MAX_APP_UPLOAD_SIZE_BYTES) {
    return `${label} supera el tamano maximo permitido de ${formatUploadFileSize(
      MAX_APP_UPLOAD_SIZE_BYTES,
    )}.`;
  }

  if (!COURSE_UPLOAD_ALLOWED_MIME_TYPES.has(file.type)) {
    return `${label} tiene un tipo MIME no permitido${
      file.type ? ` (${file.type})` : ""
    }.`;
  }

  const extension = getFileExtension(file.name);

  if (!extension || !COURSE_UPLOAD_ALLOWED_EXTENSIONS.includes(extension as (typeof COURSE_UPLOAD_ALLOWED_EXTENSIONS)[number])) {
    return `${label} debe usar una extension permitida como .pdf, .docx, .xlsx, .pptx, .jpg o .png.`;
  }

  return null;
}

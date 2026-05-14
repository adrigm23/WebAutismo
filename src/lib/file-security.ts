import path from "node:path";

export const MAX_STORED_ASSET_SIZE_BYTES = 10 * 1024 * 1024;

const MIME_EXTENSION_MAP = {
  "application/msword": [".doc"],
  "application/pdf": [".pdf"],
  "application/vnd.ms-excel": [".xls"],
  "application/vnd.ms-powerpoint": [".ppt"],
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": [".pptx"],
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/webp": [".webp"],
  "text/csv": [".csv"],
  "text/plain": [".txt"]
} as const satisfies Record<string, readonly string[]>;

type AllowedMimeType = keyof typeof MIME_EXTENSION_MAP;

export type UploadPolicy = {
  allowedMimeTypes: readonly AllowedMimeType[];
  label: string;
  maxFileSizeBytes: number;
};

export const COURSE_RESOURCE_UPLOAD_POLICY: UploadPolicy = {
  allowedMimeTypes: Object.keys(MIME_EXTENSION_MAP) as AllowedMimeType[],
  label: "El archivo",
  maxFileSizeBytes: MAX_STORED_ASSET_SIZE_BYTES
};

export const COURSE_SUBMISSION_UPLOAD_POLICY: UploadPolicy = {
  allowedMimeTypes: Object.keys(MIME_EXTENSION_MAP) as AllowedMimeType[],
  label: "El archivo",
  maxFileSizeBytes: MAX_STORED_ASSET_SIZE_BYTES
};

export const FORUM_ATTACHMENT_UPLOAD_POLICY: UploadPolicy = {
  allowedMimeTypes: [
    "application/msword",
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "image/jpeg",
    "image/png",
    "image/webp",
    "text/plain"
  ],
  label: "El archivo adjunto",
  maxFileSizeBytes: 8 * 1024 * 1024
};

function buildAllowedExtensionSet(policy: UploadPolicy) {
  return new Set<string>(
    policy.allowedMimeTypes.flatMap((mimeType) => MIME_EXTENSION_MAP[mimeType] ?? [])
  );
}

export function normalizeFileName(fileName: string) {
  const safeName = path
    .basename(fileName)
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .replace(/[<>:"/\\|?*;=]+/g, "-")
    .replace(/\s+/g, " ")
    .trim();

  return safeName || "archivo";
}

export function getPreferredExtensionForMimeType(mimeType: string | null | undefined) {
  if (!mimeType) {
    return null;
  }

  const extensions = MIME_EXTENSION_MAP[mimeType as AllowedMimeType];
  return extensions?.[0] ?? null;
}

export function ensureFileNameExtension(fileName: string, mimeType: string | null | undefined) {
  const normalizedName = normalizeFileName(fileName);

  if (path.extname(normalizedName)) {
    return normalizedName;
  }

  const preferredExtension = getPreferredExtensionForMimeType(mimeType);
  return preferredExtension ? `${normalizedName}${preferredExtension}` : normalizedName;
}

export function validateFileUpload(file: File, policy: UploadPolicy) {
  if (!(file instanceof File) || file.size <= 0 || file.size > policy.maxFileSizeBytes) {
    throw new Error(`${policy.label} no es valido o supera el tamano maximo permitido.`);
  }

  const normalizedName = normalizeFileName(file.name);
  const extension = path.extname(normalizedName).toLowerCase();
  const allowedExtensions = buildAllowedExtensionSet(policy);

  if (!extension || !allowedExtensions.has(extension)) {
    throw new Error(`${policy.label} debe usar una extension permitida.`);
  }

  if (!policy.allowedMimeTypes.includes(file.type as AllowedMimeType)) {
    throw new Error(`${policy.label} tiene un tipo no permitido.`);
  }

  return {
    fileName: normalizedName,
    mimeType: file.type,
    sizeInBytes: file.size
  };
}

export function assertSafeHttpUrl(value: string, label = "El enlace") {
  let url: URL;

  try {
    url = new URL(value.trim());
  } catch {
    throw new Error(`${label} no es valido.`);
  }

  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error(`${label} debe usar http o https.`);
  }

  return url.toString();
}

export function isSafeHttpUrl(value: string) {
  try {
    assertSafeHttpUrl(value);
    return true;
  } catch {
    return false;
  }
}

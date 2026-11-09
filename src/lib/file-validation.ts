export const MAX_FILE_SIZE_MB = 10;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
export const MAX_FILENAME_LENGTH = 255;

export const ALLOWED_EXTENSIONS = [
  ".pdf",
  ".txt",
  ".md",
  ".csv",
  ".json",
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".svg",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".ppt",
  ".pptx",
  ".odt",
  ".ods",
  ".odp",
  ".zip",
  ".gz",
  ".tar",
  ".mp3",
  ".wav",
  ".ogg",
  ".mp4",
  ".webm",
] as const;

export const ALLOWED_MIME_TYPES = new Set<string>([
  "application/pdf",
  "text/plain",
  "text/markdown",
  "text/csv",
  "application/json",
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.oasis.opendocument.text",
  "application/vnd.oasis.opendocument.spreadsheet",
  "application/vnd.oasis.opendocument.presentation",
  "application/zip",
  "application/x-zip-compressed",
  "application/gzip",
  "application/x-gzip",
  "application/x-tar",
  "audio/mpeg",
  "audio/wav",
  "audio/ogg",
  "video/mp4",
  "video/webm",
]);

function getExtension(fileName: string): string {
  const lastDot = fileName.lastIndexOf(".");
  if (lastDot <= 0 || lastDot === fileName.length - 1) {
    return "";
  }
  return fileName.slice(lastDot).toLowerCase();
}

export type FileValidationResult =
  | { valid: true }
  | { valid: false; status: number; error: string };

export function validateUploadedFile(file: {
  name: string;
  size: number;
  type: string;
}): FileValidationResult {
  const trimmedName = file.name.trim();
  if (!trimmedName) {
    return { valid: false, status: 400, error: "Le nom du fichier est invalide." };
  }

  if (trimmedName.length > MAX_FILENAME_LENGTH) {
    return {
      valid: false,
      status: 400,
      error: `Le nom du fichier est trop long (max ${MAX_FILENAME_LENGTH} caractères).`,
    };
  }

  if (file.size === 0) {
    return { valid: false, status: 400, error: "Le fichier est vide." };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      status: 413,
      error: `Le fichier dépasse la taille maximale autorisée (${MAX_FILE_SIZE_MB} Mo).`,
    };
  }

  const ext = getExtension(trimmedName);
  const isAllowedExtension = (ALLOWED_EXTENSIONS as readonly string[]).includes(ext);
  if (!isAllowedExtension) {
    return {
      valid: false,
      status: 415,
      error: `Type de fichier non autorisé (${ext || "sans extension"}).`,
    };
  }

  const mime = file.type.trim().toLowerCase();
  if (mime && mime !== "application/octet-stream" && !ALLOWED_MIME_TYPES.has(mime)) {
    return {
      valid: false,
      status: 415,
      error: `Type MIME non autorisé (${mime}).`,
    };
  }

  return { valid: true };
}

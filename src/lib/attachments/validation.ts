export const MAX_FILE_BYTES = 10 * 1024 * 1024;
export const MAX_FILES_PER_ISSUE = 10;

const IMAGE_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
]);

const DOC_MIME_TYPES = new Set(["application/pdf", "text/plain"]);

const ALLOWED_MIME_TYPES = new Set([...IMAGE_MIME_TYPES, ...DOC_MIME_TYPES]);

export const ATTACHMENT_ACCEPT = [...ALLOWED_MIME_TYPES].join(",");

export type UploadFileMeta = { name: string; type: string; size: number };

export function isImageMime(type: string): boolean {
  return IMAGE_MIME_TYPES.has(type);
}

export function validateFiles(files: UploadFileMeta[], existingCount: number): string | null {
  if (existingCount + files.length > MAX_FILES_PER_ISSUE) {
    return `Too many attachments (max ${MAX_FILES_PER_ISSUE} per issue)`;
  }
  for (const file of files) {
    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return `File type not allowed: ${file.name}`;
    }
    if (file.size > MAX_FILE_BYTES) {
      return `File too large (max 10 MB): ${file.name}`;
    }
  }
  return null;
}

/**
 * QUASAR Path & Filename Utility
 * Centralizes cross-platform path handling (Windows \ and Unix /),
 * prevents directory traversal attacks, and ensures safe file manipulation.
 */

/**
 * Normalizes backslashes to forward slashes and removes duplicate slashes.
 */
export function normalizePath(path: string | null | undefined): string {
  if (!path) return "";
  return path.replace(/\\/g, "/").replace(/\/+/g, "/").trim();
}

/**
 * Extracts the file or folder name from a path.
 */
export function getFileName(path: string | null | undefined): string {
  if (!path) return "";
  const normalized = normalizePath(path);
  const segments = normalized.split("/").filter(Boolean);
  return segments.length > 0 ? segments[segments.length - 1] : "";
}

/**
 * Extracts the file extension (without the dot), or empty string if none.
 */
export function getFileExtension(path: string | null | undefined): string {
  const fileName = getFileName(path);
  const dotIndex = fileName.lastIndexOf(".");
  if (dotIndex <= 0 || dotIndex === fileName.length - 1) return "";
  return fileName.slice(dotIndex + 1).toLowerCase();
}

/**
 * Extracts the directory path containing the file.
 */
export function getDirectoryPath(path: string | null | undefined): string {
  if (!path) return "";
  const normalized = normalizePath(path);
  const lastSlash = normalized.lastIndexOf("/");
  if (lastSlash === -1) return "";
  return normalized.slice(0, lastSlash);
}

/**
 * Splits path into cleaned segments.
 */
export function splitPath(path: string | null | undefined): string[] {
  if (!path) return [];
  return normalizePath(path).split("/").filter(Boolean);
}

/**
 * Computes a relative path from a base directory path.
 */
export function getRelativePath(path: string, basePath: string | null | undefined): string {
  if (!path) return "";
  if (!basePath) return normalizePath(path);
  const normPath = normalizePath(path);
  const normBase = normalizePath(basePath);
  if (normPath.startsWith(normBase)) {
    return normPath.slice(normBase.length).replace(/^\/+/, "");
  }
  return normPath;
}

/**
 * Sanitizes a file or folder name:
 * - Strips directory traversal tokens (.. and .)
 * - Removes illegal file system characters (< > : " / \ | ? *)
 * - Trims leading/trailing whitespace and control chars
 */
export function sanitizeFileName(name: string): string {
  if (!name) return "";
  return name
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, "")
    .replace(/\.{2,}/g, "") // remove consecutive dots (prevents ../ traversal)
    .trim();
}

/**
 * Validates whether a file/folder name is safe to create or rename.
 */
export function isValidFileName(name: string): boolean {
  const sanitized = sanitizeFileName(name);
  if (!sanitized || sanitized === "." || sanitized === "..") return false;
  return sanitized.length <= 255;
}

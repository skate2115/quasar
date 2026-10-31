import { isTauri } from "./core";

export async function join(...paths: string[]): Promise<string> {
  const isWindows = typeof navigator !== "undefined" && navigator.userAgent.toLowerCase().includes("win");
  const separator = isWindows ? "\\" : "/";

  const parts: string[] = [];
  for (const part of paths) {
    if (!part) continue;
    const clean = part.replace(/\\/g, "/");
    for (const segment of clean.split("/")) {
      if (!segment || segment === ".") continue;
      if (segment === "..") {
        parts.pop();
      } else {
        parts.push(segment);
      }
    }
  }
  const isAbsolute = paths[0]?.startsWith("/") || paths[0]?.startsWith("\\") || (isWindows && /^[a-zA-Z]:/.test(paths[0] || ""));
  const joined = parts.join(separator);
  return isAbsolute ? (paths[0]?.startsWith("/") ? `/${joined}` : joined) : joined;
}

export async function appDataDir(): Promise<string> {
  if (isTauri()) {
    const invoke = (window as any).__TAURI_INTERNALS__?.invoke || (window as any).__TAURI__?.invoke;
    if (invoke) {
      try {
        return await invoke("plugin:path|resolve_directory", { directory: 14 });
      } catch (_) {}
    }
  }
  return "/appdata";
}

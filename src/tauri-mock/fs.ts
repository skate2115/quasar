import { vfs } from "./vfs";
import { isTauri } from "./core";

export enum BaseDirectory {
  Audio = 1,
  Cache = 2,
  Config = 3,
  Data = 4,
  LocalData = 5,
  Document = 6,
  Download = 7,
  Picture = 8,
  Public = 9,
  Video = 10,
  Resource = 11,
  Temp = 12,
  AppConfig = 13,
  AppData = 14,
  AppLocalData = 15,
  AppCache = 16,
  AppLog = 17,
  Desktop = 18,
  Executable = 19,
  Font = 20,
  Home = 21,
  Runtime = 22,
  Template = 23
}

export interface FsOptions {
  baseDir?: BaseDirectory;
  recursive?: boolean;
}

function resolvePath(filePath: string, options?: FsOptions): string {
  if (options?.baseDir === BaseDirectory.AppData) {
    const clean = filePath.replace(/^\/+/, "");
    return `/appdata/${clean}`;
  }
  return filePath;
}

function getTauriInvoke() {
  if (typeof window !== "undefined") {
    return (window as any).__TAURI_INTERNALS__?.invoke || (window as any).__TAURI__?.invoke;
  }
  return null;
}

export async function readDir(
  dirPath: string,
  options?: FsOptions
): Promise<{ name: string; isDirectory: boolean; isFile: boolean }[]> {
  if (isTauri()) {
    const invoke = getTauriInvoke();
    if (invoke) {
      try {
        return await invoke("plugin:fs|read_dir", { path: dirPath, options });
      } catch (err) {
        console.warn("Tauri native readDir error:", err);
      }
    }
  }
  const resolved = resolvePath(dirPath, options);
  return vfs.readDir(resolved);
}

export async function readTextFile(
  filePath: string,
  options?: FsOptions
): Promise<string> {
  if (isTauri()) {
    const invoke = getTauriInvoke();
    if (invoke) {
      try {
        return await invoke("plugin:fs|read_text_file", { path: filePath, options });
      } catch (err) {
        console.warn("Tauri native readTextFile error:", err);
      }
    }
  }
  const resolved = resolvePath(filePath, options);
  return vfs.readTextFile(resolved);
}

export async function writeTextFile(
  filePath: string,
  contents: string,
  options?: FsOptions
): Promise<void> {
  if (isTauri()) {
    const invoke = getTauriInvoke();
    if (invoke) {
      try {
        return await invoke("plugin:fs|write_text_file", { path: filePath, contents, options });
      } catch (err) {
        console.warn("Tauri native writeTextFile error:", err);
      }
    }
  }
  const resolved = resolvePath(filePath, options);
  vfs.writeTextFile(resolved, contents);
}

export async function mkdir(
  dirPath: string,
  options?: FsOptions
): Promise<void> {
  if (isTauri()) {
    const invoke = getTauriInvoke();
    if (invoke) {
      try {
        return await invoke("plugin:fs|mkdir", { path: dirPath, options });
      } catch (err) {
        console.warn("Tauri native mkdir error:", err);
      }
    }
  }
  const resolved = resolvePath(dirPath, options);
  vfs.mkdir(resolved);
}

export async function exists(
  filePath: string,
  options?: FsOptions
): Promise<boolean> {
  if (isTauri()) {
    const invoke = getTauriInvoke();
    if (invoke) {
      try {
        return await invoke("plugin:fs|exists", { path: filePath, options });
      } catch (err) {
        console.warn("Tauri native exists error:", err);
      }
    }
  }
  const resolved = resolvePath(filePath, options);
  return vfs.exists(resolved);
}

export async function remove(
  filePath: string,
  options?: FsOptions
): Promise<void> {
  if (isTauri()) {
    const invoke = getTauriInvoke();
    if (invoke) {
      try {
        return await invoke("plugin:fs|remove", { path: filePath, options });
      } catch (err) {
        console.warn("Tauri native remove error:", err);
      }
    }
  }
  const resolved = resolvePath(filePath, options);
  vfs.remove(resolved, options);
}

export async function rename(
  oldPath: string,
  newPath: string,
  options?: FsOptions
): Promise<void> {
  if (isTauri()) {
    const invoke = getTauriInvoke();
    if (invoke) {
      try {
        return await invoke("plugin:fs|rename", { oldPath, newPath, options });
      } catch (err) {
        console.warn("Tauri native rename error:", err);
      }
    }
  }
  const resolvedOld = resolvePath(oldPath, options);
  const resolvedNew = resolvePath(newPath, options);
  vfs.rename(resolvedOld, resolvedNew);
}

export async function watch(
  dirPath: string,
  cb: () => void,
  options?: any
): Promise<() => void> {
  if (isTauri()) {
    const invoke = getTauriInvoke();
    if (invoke) {
      try {
        // Native watch or fallback poll
        const watchId = await invoke("plugin:fs|watch", { path: dirPath, options });
        return () => {
          invoke("plugin:fs|unwatch", { rid: watchId }).catch(() => {});
        };
      } catch (_) {}
    }
  }
  return vfs.watch(dirPath, cb);
}

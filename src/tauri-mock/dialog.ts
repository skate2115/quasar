import { vfs } from "./vfs";
import { isTauri } from "./core";

export interface DialogOptions {
  title?: string;
  kind?: "info" | "warning" | "error";
  okLabel?: string;
  cancelLabel?: string;
}

export interface OpenDialogOptions {
  title?: string;
  filters?: { name: string; extensions: string[] }[];
  defaultPath?: string;
  multiple?: boolean;
  directory?: boolean;
  recursive?: boolean;
}

function getTauriInvoke() {
  if (typeof window !== "undefined") {
    return (window as any).__TAURI_INTERNALS__?.invoke || (window as any).__TAURI__?.invoke;
  }
  return null;
}

export async function ask(message: string, options?: DialogOptions): Promise<boolean> {
  if (isTauri()) {
    const invoke = getTauriInvoke();
    if (invoke) {
      try {
        return await invoke("plugin:dialog|ask", {
          message,
          title: options?.title,
          kind: options?.kind
        });
      } catch (err) {
        console.warn("Tauri native ask dialog error:", err);
      }
    }
  }

  if (typeof window !== "undefined") {
    return Promise.resolve(window.confirm(message));
  }
  return Promise.resolve(true);
}

export async function open(options?: OpenDialogOptions & { multiple?: false }): Promise<string | null>;
export async function open(options: OpenDialogOptions & { multiple: true }): Promise<string[] | null>;
export async function open(options?: OpenDialogOptions): Promise<string | string[] | null>;
export async function open(options?: OpenDialogOptions): Promise<string | string[] | null> {
  // If running inside desktop Tauri app (Windows 11 / Linux), open real native OS file picker
  if (isTauri()) {
    const invoke = getTauriInvoke();
    if (invoke) {
      try {
        return await invoke("plugin:dialog|open", options);
      } catch (err) {
        console.warn("Tauri native open dialog error:", err);
      }
    }
  }

  if (typeof window === "undefined") return null;

  if (options?.directory) {
    if ("showDirectoryPicker" in window) {
      try {
        const dirHandle = await (window as any).showDirectoryPicker();
        const rootDirName = dirHandle.name || "project";
        const basePath = `/${rootDirName}`;

        async function importDirectory(handle: any, currentPath: string) {
          vfs.mkdir(currentPath);
          for await (const entry of handle.values()) {
            const entryPath = `${currentPath}/${entry.name}`;
            if (entry.kind === "file") {
              const file = await entry.getFile();
              const text = await file.text();
              vfs.writeTextFile(entryPath, text);
            } else if (entry.kind === "directory") {
              await importDirectory(entry, entryPath);
            }
          }
        }

        await importDirectory(dirHandle, basePath);
        return basePath;
      } catch (err: any) {
        return null;
      }
    }
    return null;
  } else {
    if ("showOpenFilePicker" in window) {
      try {
        const handles = await (window as any).showOpenFilePicker({
          multiple: options?.multiple
        });
        if (!handles || handles.length === 0) return null;

        const paths: string[] = [];
        for (const handle of handles) {
          const file = await handle.getFile();
          const text = await file.text();
          const filePath = `/${file.name}`;
          vfs.writeTextFile(filePath, text);
          paths.push(filePath);
        }
        return options?.multiple ? paths : paths[0];
      } catch (err: any) {
        return null;
      }
    }
    return null;
  }
}

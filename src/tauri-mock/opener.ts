import { isTauri } from "./core";

export async function openUrl(url: string): Promise<void> {
  if (isTauri()) {
    const invoke = (window as any).__TAURI_INTERNALS__?.invoke || (window as any).__TAURI__?.invoke;
    if (invoke) {
      try {
        await invoke("plugin:opener|open_url", { url });
        return;
      } catch (_) {}
    }
  }

  if (typeof window !== "undefined") {
    window.open(url, "_blank");
  }
}

export async function openPath(path: string): Promise<void> {
  if (isTauri()) {
    const invoke = (window as any).__TAURI_INTERNALS__?.invoke || (window as any).__TAURI__?.invoke;
    if (invoke) {
      try {
        await invoke("plugin:opener|open_path", { path });
        return;
      } catch (_) {}
    }
  }
  console.log(`[Quasar] openPath called for: ${path}`);
}

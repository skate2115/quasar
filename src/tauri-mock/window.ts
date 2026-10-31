import { vfs } from "./vfs";
import { isTauri } from "./core";

export interface DragDropEvent {
  payload: {
    type: "drop" | "hover" | "cancel";
    paths?: string[];
    position?: { x: number; y: number };
  };
}

function getTauriInvoke() {
  if (typeof window !== "undefined") {
    return (window as any).__TAURI_INTERNALS__?.invoke || (window as any).__TAURI__?.invoke;
  }
  return null;
}

export class MockWindow {
  async minimize(): Promise<void> {
    if (isTauri()) {
      const invoke = getTauriInvoke();
      if (invoke) {
        try {
          await invoke("plugin:window|minimize");
          return;
        } catch (_) {}
      }
    }
    console.log("[Quasar] Window minimize requested");
  }

  async toggleMaximize(): Promise<void> {
    if (isTauri()) {
      const invoke = getTauriInvoke();
      if (invoke) {
        try {
          await invoke("plugin:window|toggle_maximize");
          return;
        } catch (_) {}
      }
    }

    if (typeof document === "undefined") return;
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen().catch(() => {});
      } else {
        await document.exitFullscreen().catch(() => {});
      }
    } catch (_) {}
  }

  async close(): Promise<void> {
    if (isTauri()) {
      const invoke = getTauriInvoke();
      if (invoke) {
        try {
          await invoke("plugin:window|close");
          return;
        } catch (_) {}
      }
    }
    console.log("[Quasar] Window close requested");
  }

  async onDragDropEvent(callback: (event: DragDropEvent) => void): Promise<() => void> {
    if (typeof window === "undefined") return () => {};

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const handleDrop = async (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const files = e.dataTransfer?.files;
      if (!files || files.length === 0) return;

      const paths: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const text = await file.text();
        const filePath = `/${file.name}`;
        vfs.writeTextFile(filePath, text);
        paths.push(filePath);
      }

      callback({
        payload: {
          type: "drop",
          paths,
          position: { x: e.clientX, y: e.clientY }
        }
      });
    };

    window.addEventListener("dragover", handleDragOver);
    window.addEventListener("drop", handleDrop);

    return () => {
      window.removeEventListener("dragover", handleDragOver);
      window.removeEventListener("drop", handleDrop);
    };
  }
}

const mockWindow = new MockWindow();

export function getCurrentWindow(): MockWindow {
  return mockWindow;
}

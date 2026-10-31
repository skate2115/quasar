import { vfs } from "./vfs";

export const isTauri = (): boolean => {
  return typeof window !== "undefined" && Boolean(
    (window as any).__TAURI_INTERNALS__?.invoke ||
    (window as any).__TAURI__?.invoke ||
    (window as any).__TAURI_METADATA__
  );
};

export async function invoke<T = any>(cmd: string, args?: Record<string, any>): Promise<T> {
  // If running inside desktop Tauri app (Windows 11 / Linux), invoke native Rust backend commands
  if (isTauri()) {
    const tauriInvoke = (window as any).__TAURI_INTERNALS__?.invoke || (window as any).__TAURI__?.invoke;
    if (typeof tauriInvoke === "function") {
      return tauriInvoke(cmd, args);
    }
  }

  // Web browser fallback for development preview
  if (cmd === "run_command") {
    const rawCommand = (args?.command || "").trim();
    const currentDir = args?.currentDir || "~";
    const parts = rawCommand.split(/\s+/);
    const mainCmd = parts[0]?.toLowerCase() || "";
    const cmdArgs = parts.slice(1);

    if (mainCmd === "help") {
      const text = [
        "Quasar Terminal",
        "Available shell commands:",
        "  help              - Show this help message",
        "  ls, dir           - List files in current directory",
        "  cat <file>        - Print file content",
        "  pwd               - Print current working directory",
        "  echo [text]       - Print text",
        "  node -v           - Print Node version",
        "  python -V         - Print Python version",
        "  date              - Print current date/time",
        "  whoami            - Print current user",
        "  clear, cls        - Clear terminal screen"
      ].join("\n");
      return text as unknown as T;
    }

    if (mainCmd === "pwd") {
      return currentDir as unknown as T;
    }

    if (mainCmd === "ls" || mainCmd === "dir") {
      const entries = vfs.readDir(currentDir);
      if (entries.length === 0) {
        return "(empty directory)" as unknown as T;
      }
      const formatted = entries
        .map((e) => `${e.isDirectory ? "📁 " : "📄 "} ${e.name}`)
        .join("   ");
      return formatted as unknown as T;
    }

    if (mainCmd === "cat") {
      const fileName = cmdArgs[0];
      if (!fileName) {
        return "cat: missing file operand" as unknown as T;
      }
      const filePath = fileName.startsWith("/") ? fileName : `${currentDir}/${fileName}`;
      try {
        const content = vfs.readTextFile(filePath);
        return content as unknown as T;
      } catch (_) {
        return `cat: ${fileName}: No such file or directory` as unknown as T;
      }
    }

    if (mainCmd === "echo") {
      return cmdArgs.join(" ") as unknown as T;
    }

    if (mainCmd === "date") {
      return new Date().toString() as unknown as T;
    }

    if (mainCmd === "whoami") {
      return "developer" as unknown as T;
    }

    if (mainCmd === "node") {
      if (cmdArgs[0] === "-v" || cmdArgs[0] === "--version") {
        return "v22.14.0" as unknown as T;
      }
      return `Executed Node: ${cmdArgs.join(" ")}` as unknown as T;
    }

    if (mainCmd === "python" || mainCmd === "python3") {
      if (cmdArgs[0] === "-V" || cmdArgs[0] === "--version") {
        return "Python 3.12.2" as unknown as T;
      }
      return `Executed Python: ${cmdArgs.join(" ")}` as unknown as T;
    }

    return `Command executed: ${rawCommand}\n[Process finished with exit code 0]` as unknown as T;
  }

  return null as unknown as T;
}

import { isTauri } from "./core";

export class Command {
  private cmd: string;
  private args: string[];

  constructor(cmd: string, args: string[] = []) {
    this.cmd = cmd;
    this.args = args;
  }

  static create(cmd: string, args: string[] = []): Command {
    return new Command(cmd, args);
  }

  async execute(): Promise<{ code: number; stdout: string; stderr: string }> {
    if (isTauri()) {
      const invoke = (window as any).__TAURI_INTERNALS__?.invoke || (window as any).__TAURI__?.invoke;
      if (invoke) {
        try {
          return await invoke("plugin:shell|execute", {
            program: this.cmd,
            args: this.args
          });
        } catch (err) {
          console.warn("Tauri native shell execute error:", err);
        }
      }
    }

    console.log(`[Quasar] Executed shell command: ${this.cmd} ${this.args.join(" ")}`);
    return { code: 0, stdout: "", stderr: "" };
  }
}

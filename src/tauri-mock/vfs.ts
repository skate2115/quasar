// Virtual File System for running Quasar code editor in browser environments

export interface VfsEntry {
  name: string;
  path: string;
  isDirectory: boolean;
  content?: string;
}

const STORAGE_KEY = "quasar_vfs_data";

const DEFAULT_VFS_FILES: Record<string, string> = {
  "/appdata/quasar/settings.json": JSON.stringify(
    {
      theme: "dark",
      fontSize: 14,
      fontFamily: "Montserrat",
      language: "en",
      disabledExtensions: []
    },
    null,
    2
  )
};

class VirtualFileSystem {
  private files: Map<string, string> = new Map();
  private dirs: Set<string> = new Set();
  private watchers: Set<(path: string) => void> = new Set();

  constructor() {
    this.loadInitial();
  }

  private normalize(path: string): string {
    let p = path.replace(/\\/g, "/");
    if (!p.startsWith("/")) p = "/" + p;
    // Remove trailing slash unless root
    if (p.length > 1 && p.endsWith("/")) p = p.slice(0, -1);
    return p;
  }

  private loadInitial() {
    this.dirs.add("/");
    this.dirs.add("/appdata");
    this.dirs.add("/appdata/quasar");
    this.dirs.add("/appdata/quasar/extensions");

    // Clean old preseeded workspace from localStorage if exists
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw && raw.includes("/workspace/index.html")) {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch (_) {}

    // Load from localStorage if present
    let saved: Record<string, string> | null = null;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) saved = JSON.parse(raw);
    } catch (_) {}

    const seed = saved && Object.keys(saved).length > 0 ? saved : DEFAULT_VFS_FILES;

    for (const [p, content] of Object.entries(seed)) {
      const norm = this.normalize(p);
      this.files.set(norm, content);
      this.ensureParentDirs(norm);
    }
  }

  private persist() {
    try {
      const obj: Record<string, string> = {};
      for (const [k, v] of this.files.entries()) {
        obj[k] = v;
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
    } catch (_) {}
  }

  private notify(path: string) {
    this.watchers.forEach((cb) => {
      try {
        cb(path);
      } catch (_) {}
    });
  }

  private ensureParentDirs(filePath: string) {
    const parts = filePath.split("/").filter(Boolean);
    let cur = "";
    for (let i = 0; i < parts.length - 1; i++) {
      cur += "/" + parts[i];
      this.dirs.add(cur);
    }
  }

  public watch(path: string, cb: () => void): () => void {
    const norm = this.normalize(path);
    const handler = (changedPath: string) => {
      if (changedPath.startsWith(norm)) {
        cb();
      }
    };
    this.watchers.add(handler);
    return () => {
      this.watchers.delete(handler);
    };
  }

  public exists(path: string): boolean {
    const norm = this.normalize(path);
    return this.files.has(norm) || this.dirs.has(norm);
  }

  public mkdir(path: string): void {
    const norm = this.normalize(path);
    this.dirs.add(norm);
    this.ensureParentDirs(norm);
    this.persist();
    this.notify(norm);
  }

  public readTextFile(path: string): string {
    const norm = this.normalize(path);
    if (!this.files.has(norm)) {
      throw new Error(`File not found: ${path}`);
    }
    return this.files.get(norm)!;
  }

  public writeTextFile(path: string, content: string): void {
    const norm = this.normalize(path);
    this.ensureParentDirs(norm);
    this.files.set(norm, content);
    this.persist();
    this.notify(norm);
  }

  public remove(path: string, options?: { recursive?: boolean }): void {
    const norm = this.normalize(path);
    if (this.files.has(norm)) {
      this.files.delete(norm);
    }
    if (this.dirs.has(norm)) {
      this.dirs.delete(norm);
      if (options?.recursive) {
        for (const f of Array.from(this.files.keys())) {
          if (f.startsWith(norm + "/")) this.files.delete(f);
        }
        for (const d of Array.from(this.dirs.keys())) {
          if (d.startsWith(norm + "/")) this.dirs.delete(d);
        }
      }
    }
    this.persist();
    this.notify(norm);
  }

  public rename(oldPath: string, newPath: string): void {
    const oldNorm = this.normalize(oldPath);
    const newNorm = this.normalize(newPath);

    if (this.files.has(oldNorm)) {
      const content = this.files.get(oldNorm)!;
      this.files.delete(oldNorm);
      this.ensureParentDirs(newNorm);
      this.files.set(newNorm, content);
    } else if (this.dirs.has(oldNorm)) {
      this.dirs.delete(oldNorm);
      this.dirs.add(newNorm);
      this.ensureParentDirs(newNorm);

      for (const [k, v] of Array.from(this.files.entries())) {
        if (k.startsWith(oldNorm + "/")) {
          const updated = newNorm + k.slice(oldNorm.length);
          this.files.delete(k);
          this.files.set(updated, v);
          this.ensureParentDirs(updated);
        }
      }
      for (const d of Array.from(this.dirs.keys())) {
        if (d.startsWith(oldNorm + "/")) {
          const updated = newNorm + d.slice(oldNorm.length);
          this.dirs.delete(d);
          this.dirs.add(updated);
        }
      }
    }
    this.persist();
    this.notify(newNorm);
  }

  public readDir(dirPath: string): { name: string; isDirectory: boolean; isFile: boolean }[] {
    const norm = this.normalize(dirPath);
    const results = new Map<string, { name: string; isDirectory: boolean; isFile: boolean }>();

    // Scan directories
    for (const d of this.dirs) {
      if (d !== norm && d.startsWith(norm === "/" ? "/" : norm + "/")) {
        const sub = d.slice(norm === "/" ? 1 : norm.length + 1);
        const name = sub.split("/")[0];
        if (name && !results.has(name)) {
          results.set(name, { name, isDirectory: true, isFile: false });
        }
      }
    }

    // Scan files
    for (const f of this.files.keys()) {
      if (f.startsWith(norm === "/" ? "/" : norm + "/")) {
        const sub = f.slice(norm === "/" ? 1 : norm.length + 1);
        const parts = sub.split("/");
        if (parts.length === 1) {
          const name = parts[0];
          results.set(name, { name, isDirectory: false, isFile: true });
        } else {
          const dirName = parts[0];
          if (!results.has(dirName)) {
            results.set(dirName, { name: dirName, isDirectory: true, isFile: false });
          }
        }
      }
    }

    return Array.from(results.values());
  }

  public getAllFilesUnder(dirPath: string): { path: string; name: string }[] {
    const norm = this.normalize(dirPath);
    const out: { path: string; name: string }[] = [];
    for (const f of this.files.keys()) {
      if (f.startsWith(norm === "/" ? "/" : norm + "/")) {
        out.push({ path: f, name: f.split("/").pop()! });
      }
    }
    return out;
  }
}

export const vfs = new VirtualFileSystem();

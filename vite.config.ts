import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ["react-resizable-panels"]
  },
  resolve: {
    alias: {
      "@tauri-apps/api/window": path.resolve(__dirname, "src/tauri-mock/window.ts"),
      "@tauri-apps/api/path": path.resolve(__dirname, "src/tauri-mock/path.ts"),
      "@tauri-apps/api/core": path.resolve(__dirname, "src/tauri-mock/core.ts"),
      "@tauri-apps/api": path.resolve(__dirname, "src/tauri-mock/index.ts"),
      "@tauri-apps/plugin-fs": path.resolve(__dirname, "src/tauri-mock/fs.ts"),
      "@tauri-apps/plugin-dialog": path.resolve(__dirname, "src/tauri-mock/dialog.ts"),
      "@tauri-apps/plugin-shell": path.resolve(__dirname, "src/tauri-mock/shell.ts"),
      "@tauri-apps/plugin-opener": path.resolve(__dirname, "src/tauri-mock/opener.ts"),
    }
  },
  server: {
    port: 3000,
    host: "0.0.0.0",
    strictPort: true,
  },
  preview: {
    port: 3000,
    host: "0.0.0.0",
    strictPort: true,
  }
});


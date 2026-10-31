// src/utils/detectLang.ts
import { FileCode, FileText, FileJson, FileImage, TerminalSquare, Database, Settings2 } from "lucide-react";

export interface LangMeta {
  language: string;
  icon: any;
  color: string;
}

export default function detectLang(filename: string): LangMeta {
  const lowerName = filename.toLowerCase();
  const ext = lowerName.split('.').pop() || '';

  // Specjalne pliki konfiguracyjne
  if (lowerName === "dockerfile") {
    return { language: "dockerfile", icon: TerminalSquare, color: "docker-color" };
  }
  if (lowerName === "cargo.toml" || lowerName === "cargo.lock") {
    return { language: "toml", icon: Settings2, color: "rs-color" };
  }
  if (lowerName === ".gitignore" || lowerName === ".env" || lowerName.startsWith(".env.")) {
    return { language: "plaintext", icon: FileText, color: "env-color" };
  }

  // Klucz "language" odpowiada oficjalnym ID języków z Monaco Editor
  const langMap: Record<string, LangMeta> = {
    // Web
    html: { language: "html", icon: FileCode, color: "html-color" },
    htm:  { language: "html", icon: FileCode, color: "html-color" },
    css:  { language: "css", icon: FileCode, color: "css-color" },
    scss: { language: "scss", icon: FileCode, color: "sass-color" },
    sass: { language: "scss", icon: FileCode, color: "sass-color" },
    less: { language: "less", icon: FileCode, color: "css-color" },
    js:   { language: "javascript", icon: FileCode, color: "js-color" },
    jsx:  { language: "javascript", icon: FileCode, color: "js-color" },
    mjs:  { language: "javascript", icon: FileCode, color: "js-color" },
    cjs:  { language: "javascript", icon: FileCode, color: "js-color" },
    ts:   { language: "typescript", icon: FileCode, color: "ts-color" },
    tsx:  { language: "typescript", icon: FileCode, color: "ts-color" },
    vue:  { language: "html", icon: FileCode, color: "vue-color" },
    svelte: { language: "html", icon: FileCode, color: "svelte-color" },
    json: { language: "json", icon: FileJson, color: "json-color" },
    jsonc: { language: "json", icon: FileJson, color: "json-color" },
    xml:  { language: "xml", icon: FileCode, color: "xml-color" },
    svg:  { language: "xml", icon: FileImage, color: "html-color" },
    graphql: { language: "graphql", icon: FileCode, color: "graphql-color" },
    gql:  { language: "graphql", icon: FileCode, color: "graphql-color" },

    // System & General Programming
    py:   { language: "python", icon: FileCode, color: "py-color" },
    rs:   { language: "rust", icon: FileCode, color: "rs-color" },
    go:   { language: "go", icon: FileCode, color: "go-color" },
    java: { language: "java", icon: FileCode, color: "java-color" },
    cpp:  { language: "cpp", icon: FileCode, color: "cpp-color" },
    cxx:  { language: "cpp", icon: FileCode, color: "cpp-color" },
    cc:   { language: "cpp", icon: FileCode, color: "cpp-color" },
    c:    { language: "c", icon: FileCode, color: "c-color" },
    h:    { language: "c", icon: FileCode, color: "c-color" },
    hpp:  { language: "cpp", icon: FileCode, color: "cpp-color" },
    cs:   { language: "csharp", icon: FileCode, color: "cs-color" },
    php:  { language: "php", icon: FileCode, color: "php-color" },
    rb:   { language: "ruby", icon: FileCode, color: "rb-color" },
    swift: { language: "swift", icon: FileCode, color: "swift-color" },
    kt:   { language: "kotlin", icon: FileCode, color: "kt-color" },
    kts:  { language: "kotlin", icon: FileCode, color: "kt-color" },
    dart: { language: "dart", icon: FileCode, color: "dart-color" },
    lua:  { language: "lua", icon: FileCode, color: "lua-color" },
    r:    { language: "r", icon: FileCode, color: "r-color" },
    sql:  { language: "sql", icon: Database, color: "db-color" },

    // Scripting & Config
    sh:   { language: "shell", icon: TerminalSquare, color: "sh-color" },
    bash: { language: "shell", icon: TerminalSquare, color: "sh-color" },
    zsh:  { language: "shell", icon: TerminalSquare, color: "sh-color" },
    ps1:  { language: "powershell", icon: TerminalSquare, color: "ps-color" },
    bat:  { language: "bat", icon: TerminalSquare, color: "sh-color" },
    cmd:  { language: "bat", icon: TerminalSquare, color: "sh-color" },
    yaml: { language: "yaml", icon: FileText, color: "yaml-color" },
    yml:  { language: "yaml", icon: FileText, color: "yaml-color" },
    toml: { language: "ini", icon: Settings2, color: "toml-color" },
    ini:  { language: "ini", icon: Settings2, color: "toml-color" },
    conf: { language: "plaintext", icon: Settings2, color: "env-color" },
    md:   { language: "markdown", icon: FileText, color: "md-color" },
    txt:  { language: "plaintext", icon: FileText, color: "default-color" },

    // Assets
    png:  { language: "plaintext", icon: FileImage, color: "img-color" },
    jpg:  { language: "plaintext", icon: FileImage, color: "img-color" },
    jpeg: { language: "plaintext", icon: FileImage, color: "img-color" },
    webp: { language: "plaintext", icon: FileImage, color: "img-color" },
    ico:  { language: "plaintext", icon: FileImage, color: "img-color" },
  };

  return langMap[ext] || { language: "plaintext", icon: FileText, color: "default-color" };
}
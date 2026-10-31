// src/utils/detectLang.ts
import { FileCode, FileText, FileJson, FileImage, TerminalSquare } from "lucide-react";

export default function detectLang(filename: string) {
  const ext = filename.split('.').pop()?.toLowerCase() || '';

  // Klucz "language" musi dokładnie odpowiadać oficjalnym ID z Monaco Editor
  const langMap: Record<string, { language: string, icon: any, color: string }> = {
    html: { language: "html", icon: FileCode, color: "html-color" },
    css:  { language: "css", icon: FileCode, color: "css-color" },
    js:   { language: "javascript", icon: FileCode, color: "js-color" },
    jsx:  { language: "javascript", icon: FileCode, color: "js-color" },
    ts:   { language: "typescript", icon: FileCode, color: "ts-color" },
    tsx:  { language: "typescript", icon: FileCode, color: "ts-color" },
    json: { language: "json", icon: FileJson, color: "json-color" },
    md:   { language: "markdown", icon: FileText, color: "md-color" },
    py:   { language: "python", icon: FileCode, color: "py-color" },
    rs:   { language: "rust", icon: FileCode, color: "rs-color" },
    go:   { language: "go", icon: FileCode, color: "go-color" },
    java: { language: "java", icon: FileCode, color: "java-color" },
    cpp:  { language: "cpp", icon: FileCode, color: "cpp-color" },
    c:    { language: "c", icon: FileCode, color: "cpp-color" },
    sh:   { language: "shell", icon: TerminalSquare, color: "sh-color" },
    bat:  { language: "bat", icon: TerminalSquare, color: "sh-color" },
    env:  { language: "plaintext", icon: FileText, color: "env-color" },
    png:  { language: "plaintext", icon: FileImage, color: "img-color" },
    jpg:  { language: "plaintext", icon: FileImage, color: "img-color" },
    jpeg: { language: "plaintext", icon: FileImage, color: "img-color" },
    svg:  { language: "xml", icon: FileImage, color: "html-color" },
  };

  return langMap[ext] || { language: "plaintext", icon: FileText, color: "default-color" };
}
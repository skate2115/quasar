import { useRef, useEffect } from "react";
import Editor, { useMonaco } from "@monaco-editor/react";

interface CodeEditorProps {
  value: string;
  language: string;
  onChange: (value: string) => void;
  searchQuery?: string;
  theme: string;
  fontSize: number;
  fontFamily?: string;
  onMountInstance?: (editor: any, monaco: any) => void;
}

export default function CodeEditor({ 
  value, 
  language, 
  onChange, 
  searchQuery, 
  theme, 
  fontSize, 
  fontFamily,
  onMountInstance
}: CodeEditorProps) {
  const editorRef = useRef<any>(null);
  const monaco = useMonaco();
  const decorationsRef = useRef<any>(null);

  const handleEditorDidMount = (editor: any, monacoInstance: any) => {
    editorRef.current = editor;
    decorationsRef.current = editor.createDecorationsCollection([]);
    editor.updateOptions({
      fontSize: fontSize,
      fontFamily: fontFamily ? `${fontFamily}, monospace` : "'Montserrat', monospace",
      mouseWheelZoom: true,
      bracketPairColorization: { enabled: true }
    });

    if (onMountInstance) {
      onMountInstance(editor, monacoInstance);
    }
  };

  // 1. REJESTRACJA KOLOROWEGO MOTYWU QUASAR I PODPOWIEDZI
  useEffect(() => {
    if (!monaco) return;

    // DEFINIUJEMY WIBRANTNY, NOWOCZESNY MOTYW "quasar-dark" Z PIĘKNYMI KOLORAMI SKŁADNI
    monaco.editor.defineTheme("quasar-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "comment", foreground: "64748b", fontStyle: "italic" },
        { token: "keyword", foreground: "38bdf8", fontStyle: "bold" },
        { token: "string", foreground: "34d399" },
        { token: "string.escape", foreground: "a7f3d0" },
        { token: "number", foreground: "f472b6" },
        { token: "type", foreground: "c084fc", fontStyle: "bold" },
        { token: "class", foreground: "e879f9" },
        { token: "function", foreground: "fbbf24" },
        { token: "variable", foreground: "f8fafc" },
        { token: "variable.parameter", foreground: "fdba74" },
        { token: "tag", foreground: "f87171", fontStyle: "bold" },
        { token: "tag.id", foreground: "f472b6" },
        { token: "tag.class", foreground: "38bdf8" },
        { token: "attribute.name", foreground: "818cf8" },
        { token: "attribute.value", foreground: "34d399" },
        { token: "delimiter", foreground: "94a3b8" },
        { token: "delimiter.bracket", foreground: "facc15" },
      ],
      colors: {
        "editor.background": "#161619",
        "editor.foreground": "#f4f4f5",
        "editorCursor.foreground": "#60a5fa",
        "editor.lineHighlightBackground": "#1f1f24",
        "editorLineNumber.foreground": "#52525b",
        "editorLineNumber.activeForeground": "#cbd5e1",
        "editor.selectionBackground": "#2563eb40",
        "editor.inactiveSelectionBackground": "#2563eb20",
        "editorIndentGuide.background": "#27272a",
        "editorIndentGuide.activeBackground": "#3f3f46",
        "editorBracketMatch.background": "#2563eb30",
        "editorBracketMatch.border": "#3b82f6"
      }
    });

    monaco.editor.defineTheme("quasar-light", {
      base: "vs",
      inherit: true,
      rules: [
        { token: "comment", foreground: "64748b", fontStyle: "italic" },
        { token: "keyword", foreground: "0284c7", fontStyle: "bold" },
        { token: "string", foreground: "059669" },
        { token: "number", foreground: "db2777" },
        { token: "type", foreground: "7c3aed" },
        { token: "function", foreground: "d97706" },
        { token: "tag", foreground: "dc2626" },
      ],
      colors: {
        "editor.background": "#ffffff",
        "editor.foreground": "#18181b",
        "editor.lineHighlightBackground": "#f4f4f5",
        "editorLineNumber.foreground": "#a1a1aa",
        "editorLineNumber.activeForeground": "#18181b",
      }
    });

    // Snippety HTML
    const htmlProvider = monaco.languages.registerCompletionItemProvider("html", {
      provideCompletionItems: (model: any, position: any) => {
        const word = model.getWordUntilPosition(position);
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn,
        };

        return {
          suggestions: [
            {
              label: "html5",
              kind: monaco.languages.CompletionItemKind.Snippet,
              insertText: "<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n\t<meta charset=\"UTF-8\">\n\t<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n\t<title>${1:Document}</title>\n</head>\n<body>\n\t${2}\n</body>\n</html>",
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: "HTML5 Boilerplate",
              range: range
            }
          ]
        };
      }
    });

    // Snippety JavaScript & TypeScript
    const jsProvider = monaco.languages.registerCompletionItemProvider("javascript", {
      provideCompletionItems: (model: any, position: any) => {
        const word = model.getWordUntilPosition(position);
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn,
        };

        return {
          suggestions: [
            {
              label: "clg",
              kind: monaco.languages.CompletionItemKind.Snippet,
              insertText: "console.log(${1});",
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: "console.log snippet",
              range: range
            },
            {
              label: "afn",
              kind: monaco.languages.CompletionItemKind.Snippet,
              insertText: "const ${1:name} = (${2:args}) => {\n\t${3}\n};",
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: "Arrow function",
              range: range
            },
            {
              label: "prom",
              kind: monaco.languages.CompletionItemKind.Snippet,
              insertText: "new Promise((resolve, reject) => {\n\t${1}\n});",
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: "New Promise",
              range: range
            }
          ]
        };
      }
    });

    // Snippety Python
    const pythonProvider = monaco.languages.registerCompletionItemProvider("python", {
      provideCompletionItems: (model: any, position: any) => {
        const word = model.getWordUntilPosition(position);
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn,
        };

        return {
          suggestions: [
            {
              label: "def",
              kind: monaco.languages.CompletionItemKind.Snippet,
              insertText: "def ${1:function_name}(${2:args}):\n\t${3:pass}",
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: "Create a Python function",
              range: range
            },
            {
              label: "main",
              kind: monaco.languages.CompletionItemKind.Snippet,
              insertText: "if __name__ == '__main__':\n\t${1:main()}",
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: "Python main block",
              range: range
            }
          ]
        };
      }
    });

    // Snippety Rust
    const rustProvider = monaco.languages.registerCompletionItemProvider("rust", {
      provideCompletionItems: (model: any, position: any) => {
        const word = model.getWordUntilPosition(position);
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn,
        };

        return {
          suggestions: [
            {
              label: "fn",
              kind: monaco.languages.CompletionItemKind.Snippet,
              insertText: "fn ${1:name}(${2:args}) {\n\t${3}\n}",
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: "Rust function",
              range: range
            },
            {
              label: "main",
              kind: monaco.languages.CompletionItemKind.Snippet,
              insertText: "fn main() {\n\tprintln!(\"${1:Hello, world!}\");\n}",
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: "Rust main function",
              range: range
            }
          ]
        };
      }
    });

    return () => {
      htmlProvider.dispose();
      jsProvider.dispose();
      pythonProvider.dispose();
      rustProvider.dispose();
    };
  }, [monaco]);

  // 2. DYNAMICZNA AKTUALIZACJA CZCIONKI I ROZMIARU W MONACO
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.updateOptions({
        fontSize: fontSize,
        fontFamily: fontFamily ? `${fontFamily}, monospace` : "'Montserrat', monospace",
        mouseWheelZoom: true,
      });
    }
  }, [fontSize, fontFamily]);

  // 3. PODŚWIETLANIE WYSZUKIWANIA
  useEffect(() => {
    if (!editorRef.current || !monaco || !decorationsRef.current) return;
    const editor = editorRef.current;
    const model = editor.getModel();

    if (!searchQuery) {
      decorationsRef.current.clear();
      return;
    }

    const matches = model.findMatches(searchQuery, false, false, false, null, true);
    const newDecorations = matches.map((match: any) => ({
      range: match.range,
      options: {
        isWholeLine: false,
        className: "custom-search-highlight",
        overviewRuler: { color: "#eab308", position: 1 }, 
      }
    }));

    decorationsRef.current.set(newDecorations);

    if (matches.length > 0) {
      editor.revealRangeInCenter(matches[0].range);
    }
  }, [searchQuery, value, monaco]);

  const activeThemeName = theme === "light" ? "quasar-light" : "quasar-dark";

  return (
    <div style={{ width: "100%", height: "100%" }}>
      <Editor
        height="100%"
        language={language}
        theme={activeThemeName}
        value={value}
        onChange={(val) => onChange(val ?? "")}
        onMount={handleEditorDidMount}
        options={{
          minimap: { enabled: false },
          fontSize: fontSize,
          fontFamily: fontFamily ? `${fontFamily}, 'Montserrat', monospace` : "'Montserrat', 'JetBrains Mono', monospace",
          padding: { top: 8, bottom: 8 },
          lineHeight: 1.6,
          roundedSelection: false,
          scrollBeyondLastLine: false,
          smoothScrolling: true,
          cursorBlinking: "solid",
          renderLineHighlight: "all",
          suggestOnTriggerCharacters: true,
          acceptSuggestionOnEnter: "on",
          mouseWheelZoom: true,
          bracketPairColorization: { enabled: true },
          formatOnPaste: true,
          find: {
            addExtraSpaceOnTop: false,
            autoFindInSelection: "never",
            seedSearchStringFromSelection: "never"
          }
        }}
      />
    </div>
  );
}
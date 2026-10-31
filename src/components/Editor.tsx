import { useRef, useEffect } from "react";
import Editor, { useMonaco } from "@monaco-editor/react";

interface CodeEditorProps {
  value: string;
  language: string;
  onChange: (value: string) => void;
  searchQuery?: string;
  theme: string;
  fontSize: number;
}

export default function CodeEditor({ value, language, onChange, searchQuery, theme, fontSize }: CodeEditorProps) {
  const editorRef = useRef<any>(null);
  const monaco = useMonaco();
  const decorationsRef = useRef<any>(null);

  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor;
    decorationsRef.current = editor.createDecorationsCollection([]);
  };

  // 1. REJESTRACJA PODPOWIEDZI (SNIPPETÓW)
  useEffect(() => {
    if (!monaco) return;

    const htmlProvider = monaco.languages.registerCompletionItemProvider("html", {
      // Wstrzykujemy model i pozycję, by obliczyć zasięg kasowanego słowa (range)
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
              range: range // <--- TUTAJ JEST NAPRAWA BŁĘDU
            }
          ]
        };
      }
    });

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
              range: range // <--- TUTAJ JEST NAPRAWA BŁĘDU
            }
          ]
        };
      }
    });

    return () => {
      htmlProvider.dispose();
      pythonProvider.dispose();
    };
  }, [monaco]);

  // 2. PODŚWIETLANIE WYSZUKIWANIA
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

  const monacoTheme = theme === "light" ? "light" : "vs-dark";

  return (
    <div style={{ width: "100%", height: "100%" }}>
      <Editor
        height="100%"
        language={language}
        theme={monacoTheme}
        value={value}
        onChange={(val) => onChange(val ?? "")}
        onMount={handleEditorDidMount}
        options={{
          minimap: { enabled: false },
          fontSize: fontSize,
          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
          padding: { top: 8, bottom: 8 },
          lineHeight: 1.6,
          roundedSelection: false,
          scrollBeyondLastLine: false,
          smoothScrolling: true,
          cursorBlinking: "solid",
          renderLineHighlight: "all",
          suggestOnTriggerCharacters: true,
          acceptSuggestionOnEnter: "on",
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
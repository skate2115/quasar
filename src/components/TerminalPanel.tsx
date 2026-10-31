import { useState, useRef, useEffect } from "react";
import { Terminal, X, Trash2, CornerDownLeft } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { readDir } from "@tauri-apps/plugin-fs";
import { t, type Language } from "../i18n";

type TerminalPanelProps = {
  language: Language;
  onClose: () => void;
  projectPath: string | null;
};

type LogLine = {
  id: number;
  type: "in" | "out" | "err" | "info";
  text: string;
};

export default function TerminalPanel({ language, onClose, projectPath }: TerminalPanelProps) {
  const isWindows = typeof navigator !== "undefined" && navigator.userAgent.toLowerCase().includes("win");
  
  const [history, setHistory] = useState<LogLine[]>([
    { 
      id: 1, 
      type: "info", 
      text: `Quasar Developer Terminal [${isWindows ? "Windows 11 / PowerShell" : "Linux / Bash"}]` 
    },
    { 
      id: 2, 
      type: "info", 
      text: "Type shell commands to run directly in your project. (Use Ctrl+L to clear, Up/Down for history)" 
    }
  ]);
  const [input, setInput] = useState("");
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [isRunning, setIsRunning] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history]);

  const currentDir = projectPath || (isWindows ? "C:\\Users\\Developer\\Project" : "~/project");
  const promptSymbol = isWindows ? `${currentDir}>` : `quasar:${currentDir}$`;

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    // History Navigation
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const nextIdx = historyIndex < commandHistory.length - 1 ? historyIndex + 1 : historyIndex;
        setHistoryIndex(nextIdx);
        setInput(commandHistory[commandHistory.length - 1 - nextIdx] || "");
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex > 0) {
        const nextIdx = historyIndex - 1;
        setHistoryIndex(nextIdx);
        setInput(commandHistory[commandHistory.length - 1 - nextIdx] || "");
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setInput("");
      }
      return;
    }

    // Ctrl+L: Clear terminal
    if (e.ctrlKey && e.key.toLowerCase() === "l") {
      e.preventDefault();
      setHistory([]);
      return;
    }

    // Ctrl+C: Cancel current line
    if (e.ctrlKey && e.key.toLowerCase() === "c") {
      e.preventDefault();
      setHistory(prev => [...prev, { id: Date.now(), type: "in", text: `${promptSymbol} ${input}^C` }]);
      setInput("");
      setHistoryIndex(-1);
      return;
    }

    // Tab: Autocomplete paths & filenames
    if (e.key === "Tab") {
      e.preventDefault();
      try {
        const words = input.split(/\s+/);
        const lastWord = words[words.length - 1] || "";
        const dirToScan = projectPath || ".";
        const entries = await readDir(dirToScan).catch(() => []);
        const matches = entries.filter((ent: any) => 
          ent.name.toLowerCase().startsWith(lastWord.toLowerCase())
        );

        if (matches.length === 1) {
          const match = matches[0];
          const completedName = match.name + (match.isDirectory ? "/" : " ");
          words[words.length - 1] = completedName;
          setInput(words.join(" "));
        } else if (matches.length > 1) {
          const names = matches.map((m: any) => (m.isDirectory ? m.name + "/" : m.name)).join("   ");
          setHistory(prev => [
            ...prev,
            { id: Date.now(), type: "in", text: `${promptSymbol} ${input}` },
            { id: Date.now() + 1, type: "info", text: names }
          ]);
        }
      } catch (_) {}
      return;
    }

    if (e.key === "Enter") {
      const command = input.trim();
      if (!command) return;

      // Add to command history
      setCommandHistory(prev => [...prev, command]);
      setHistoryIndex(-1);

      setHistory(prev => [...prev, { id: Date.now(), type: "in", text: `${promptSymbol} ${command}` }]);
      setInput("");

      if (command.toLowerCase() === "clear" || command.toLowerCase() === "cls") {
        setHistory([]);
        return;
      }

      setIsRunning(true);
      try {
        const output = await invoke<string>("run_command", { 
          command: command, 
          currentDir: projectPath || "." 
        });
        
        if (output && output.trim()) {
          setHistory(prev => [...prev, { id: Date.now() + 1, type: "out", text: output.trim() }]);
        }
      } catch (error) {
        const errText = typeof error === "string" ? error : String(error);
        setHistory(prev => [...prev, { id: Date.now() + 1, type: "err", text: errText.trim() }]);
      } finally {
        setIsRunning(false);
      }
    }
  };

  return (
    <div 
      style={{ display: "flex", flexDirection: "column", height: "100%", backgroundColor: "var(--bg-panel)" }}
      onClick={() => inputRef.current?.focus()}
    >
      <div className="panel-header" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", height: "100%", alignItems: "center" }}>
          <div className="tab active" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Terminal size={13} />
            <span>{t("terminal.title", language)}</span>
            {isRunning && (
              <span style={{ fontSize: "0.65rem", color: "var(--accent)", marginLeft: "4px" }}>
                [running...]
              </span>
            )}
          </div>
        </div>
        <div style={{ display: "flex", gap: "10px", paddingRight: "14px", color: "var(--text-muted)", alignItems: "center" }}>
          <button 
            onClick={() => setHistory([])} 
            title="Clear Terminal (Ctrl+L)" 
            style={{ background: "transparent", border: "none", cursor: "pointer", color: "inherit", display: "flex", padding: "4px" }}
          >
            <Trash2 size={14} />
          </button>
          <button 
            onClick={onClose} 
            title="Close Terminal" 
            style={{ background: "transparent", border: "none", cursor: "pointer", color: "inherit", display: "flex", padding: "4px" }}
          >
            <X size={14} />
          </button>
        </div>
      </div>
      
      <div 
        className="terminal-content" 
        style={{ 
          flex: 1, 
          padding: "10px 14px", 
          overflowY: "auto", 
          fontFamily: "var(--font-mono)", 
          fontSize: "0.76rem", 
          color: "#cbd5e1", 
          display: "flex", 
          flexDirection: "column", 
          gap: "4px",
          cursor: "text",
          lineHeight: 1.45
        }}
      >
        {history.map((line) => (
          <div 
            key={line.id} 
            style={{ 
              color: line.type === "in" 
                ? "var(--text-main)" 
                : line.type === "err" 
                ? "#ef4444" 
                : line.type === "info" 
                ? "#64748b" 
                : "inherit",
              whiteSpace: "pre-wrap", 
              wordBreak: "break-all"
            }}
          >
            {line.text}
          </div>
        ))}
        
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
          <span style={{ color: "var(--accent)", fontWeight: 600, userSelect: "none" }}>{promptSymbol}</span>
          <input 
            ref={inputRef}
            type="text" 
            value={input} 
            onChange={(e) => setInput(e.target.value)} 
            onKeyDown={handleKeyDown}
            style={{ 
              background: "transparent", 
              border: "none", 
              color: "var(--text-main)", 
              flex: 1, 
              outline: "none", 
              fontFamily: "inherit", 
              fontSize: "inherit" 
            }} 
            autoFocus
            spellCheck={false}
            disabled={isRunning}
          />
          {input.length > 0 && <CornerDownLeft size={11} style={{ color: "var(--text-muted)", opacity: 0.5 }} />}
        </div>
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
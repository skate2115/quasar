import { useState, useRef, useEffect } from "react";
import { Terminal, X, Trash2 } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { t, type Language } from "../i18n";

type TerminalPanelProps = {
  language: Language;
  onClose: () => void;
  projectPath: string | null;
};

type LogLine = {
  id: number;
  type: "in" | "out" | "err";
  text: string;
};

export default function TerminalPanel({ language, onClose, projectPath }: TerminalPanelProps) {
  const [history, setHistory] = useState<LogLine[]>([
    { id: 1, type: "out", text: "Quasar Terminal" },
    { id: 2, type: "out", text: "Ready to run commands..." }
  ]);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history]);

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      const command = input.trim();
      if (!command) return;
      
      const currentDir = projectPath || "~";
      setHistory(prev => [...prev, { id: Date.now(), type: "in", text: `${currentDir}> ${command}` }]);
      setInput("");

      if (command.toLowerCase() === "clear") {
        setHistory([]);
        return;
      }

      try {
        const output = await invoke<string>("run_command", { 
          command: command, 
          currentDir: projectPath || "." 
        });
        
        if (output.trim()) {
          setHistory(prev => [...prev, { id: Date.now() + 1, type: "out", text: output.trim() }]);
        }
      } catch (error) {
        setHistory(prev => [...prev, { id: Date.now() + 1, type: "err", text: String(error).trim() }]);
      }
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", backgroundColor: "var(--bg-panel)" }}>
      <div className="panel-header">
        <div style={{ display: "flex", height: "100%" }}>
          <div className="tab active">
            <Terminal size={13} />
            <span>{t("terminal.title", language)}</span>
          </div>
        </div>
        <div style={{ display: "flex", gap: "10px", paddingRight: "14px", color: "var(--text-muted)" }}>
          <button onClick={() => setHistory([])} title="Clear Terminal" style={{ background: "transparent", border: "none", cursor: "pointer", color: "inherit", display: "flex" }}>
            <Trash2 size={14} />
          </button>
          <button onClick={onClose} title="Close Terminal" style={{ background: "transparent", border: "none", cursor: "pointer", color: "inherit", display: "flex" }}>
            <X size={14} />
          </button>
        </div>
      </div>
      
      <div className="terminal-content" style={{ flex: 1, padding: "10px 14px", overflowY: "auto", fontFamily: "'JetBrains Mono', monospace", fontSize: "0.75rem", color: "#a1a1aa", display: "flex", flexDirection: "column", gap: "4px" }}>
        {history.map((line) => (
          <div 
            key={line.id} 
            style={{ 
              color: line.type === "in" ? "var(--text-main)" : line.type === "err" ? "#ef4444" : "inherit",
              whiteSpace: "pre-wrap", 
              wordBreak: "break-all"
            }}
          >
            {line.text}
          </div>
        ))}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
          <span style={{ color: "var(--accent)" }}>&gt;</span>
          <input 
            type="text" 
            value={input} 
            onChange={(e) => setInput(e.target.value)} 
            onKeyDown={handleKeyDown}
            style={{ background: "transparent", border: "none", color: "var(--text-main)", flex: 1, outline: "none", fontFamily: "inherit", fontSize: "inherit" }} 
            autoFocus
            spellCheck={false}
          />
        </div>
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
import { useMemo } from "react";
import { GitBranch, XCircle, AlertTriangle, CheckCheck, FileCode2 } from "lucide-react";
import detectLang from "../utils/detectLang";
import { useExtensions } from "../context/ExtensionContext";

type StatusBarProps = {
  activePath: string | null;
  projectPath: string | null;
  errors?: number;
  warnings?: number;
  onFormat?: () => void;
};

export default function StatusBar({ 
  activePath, 
  projectPath, 
  errors = 0, 
  warnings = 0, 
  onFormat 
}: StatusBarProps) {
  // Jeśli błąd dotyczy braku właściwości, upewnij się że w ExtensionContext 
  // właściwość nazywa się dokładnie tak samo. Jeśli jej nie ma, użyj pustej tablicy.
  const extensions = useExtensions();
  const statusBarItems = (extensions as any).statusBarItems || [];

  const activeFileMeta = useMemo(() => {
    if (!activePath) return null;
    return detectLang(activePath.split(/[\\/]/).pop()!);
  }, [activePath]);

  return (
    <div className="status-bar">
      <div className="status-bar-left">
        {projectPath && (
          <>
            <button className="status-item" title="Current Branch">
              <GitBranch size={12} /> main
            </button>
            <button className="status-item" title="Problems">
              <XCircle size={12} /> {errors} 
              <AlertTriangle size={12} style={{ marginLeft: 6 }} /> {warnings}
            </button>
          </>
        )}
      </div>
      
      <div className="status-bar-right">
        {/* Bezpieczne mapowanie z jawnym typem any dla item */}
        {statusBarItems && statusBarItems.map((item: any) => (
          <button key={item.id} className="status-item custom-plugin-item" onClick={item.onClick}>
            {item.text}
          </button>
        ))}
        
        {activePath && (
          <>
            <button className="status-item" title="Encoding">UTF-8</button>
            <button className="status-item" title="Language Mode">
              <FileCode2 size={12} />
              {activeFileMeta ? activeFileMeta.language.toUpperCase() : "TEXT"}
            </button>
            <button 
              className="status-item" 
              onClick={onFormat} 
              title="Format Code (Prettier)"
            >
              <CheckCheck size={12} style={{ color: "var(--accent)" }} /> Prettier
            </button>
          </>
        )}
      </div>
    </div>
  );
}
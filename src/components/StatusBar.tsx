import { useMemo } from "react";
import { 
  GitBranch, XCircle, AlertTriangle, CheckCheck, FileCode2, 
  Columns, Maximize2, Minimize2, FileDiff 
} from "lucide-react";
import detectLang from "../utils/detectLang";
import { getFileName } from "../utils/pathUtils";
import { useExtensions } from "../context/ExtensionContext";
import { CursorInfo } from "./Editor";
import { t, Language } from "../i18n";

type StatusBarProps = {
  activePath: string | null;
  projectPath: string | null;
  cursorInfo?: CursorInfo | null;
  isSplitHorizontal?: boolean;
  onToggleSplit?: () => void;
  isFocusMode?: boolean;
  onToggleFocusMode?: () => void;
  dirtyCount?: number;
  errors?: number;
  warnings?: number;
  onFormat?: () => void;
  language?: Language;
};

export default function StatusBar({ 
  activePath, 
  projectPath, 
  cursorInfo,
  isSplitHorizontal,
  onToggleSplit,
  isFocusMode,
  onToggleFocusMode,
  dirtyCount = 0,
  errors = 0, 
  warnings = 0, 
  onFormat,
  language = "pl"
}: StatusBarProps) {
  const extensions = useExtensions();
  const statusBarItems = (extensions as any).statusBarItems || [];

  const activeFileMeta = useMemo(() => {
    if (!activePath) return null;
    return detectLang(getFileName(activePath));
  }, [activePath]);

  return (
    <div className={`status-bar ${isFocusMode ? "focus-mode-bar" : ""}`}>
      {/* LEWA STRONA: GIT, ZMIANY, PROBLEMY */}
      <div className="status-bar-left">
        {projectPath && (
          <button className="status-item status-branch" title={t("status.branch", language)}>
            <GitBranch size={12} />
            <span>main</span>
          </button>
        )}

        {dirtyCount > 0 && (
          <button 
            className="status-item status-changes" 
            title={`${dirtyCount} ${t("status.unsaved", language)}`}
          >
            <FileDiff size={12} />
            <span>{dirtyCount} {t("status.unsaved", language)}</span>
          </button>
        )}

        <button className="status-item status-problems" title={t("status.diagnostics", language)}>
          <XCircle size={12} className={errors > 0 ? "error-icon" : ""} /> 
          <span>{errors}</span>
          <AlertTriangle size={12} className={warnings > 0 ? "warning-icon" : ""} style={{ marginLeft: 6 }} /> 
          <span>{warnings}</span>
        </button>

        {isFocusMode && (
          <span className="status-item focus-badge">
            {t("focus.tooltip", language)}
          </span>
        )}
      </div>

      {/* PRAWA STRONA: STATUS BAR 2.0 METRYKI, SPLIT, FOCUS, ENCODING, FORMAT */}
      <div className="status-bar-right">
        {statusBarItems && statusBarItems.map((item: any) => (
          <button key={item.id} className="status-item custom-plugin-item" onClick={item.onClick}>
            {item.text}
          </button>
        ))}

        {activePath && cursorInfo && (
          <>
            {cursorInfo.selectedChars > 0 ? (
              <span className="status-item" title={t("status.selected", language)}>
                ({cursorInfo.selectedChars} {t("status.selected", language)})
              </span>
            ) : null}

            <span className="status-item" title="Ln, Col">
              Ln {cursorInfo.line}, Col {cursorInfo.col}
            </span>

            <span className="status-item status-stat" title={`${t("status.lines", language)}, ${t("status.words", language)}`}>
              {cursorInfo.lineCount} {t("status.lines", language)}, {cursorInfo.wordCount} {t("status.words", language)}
            </span>

            <span className="status-item" title={t("status.spaces", language)}>
              {t("status.spaces", language)}
            </span>

            <span className="status-item" title="UTF-8">
              UTF-8
            </span>

            <button className="status-item status-lang" title={activeFileMeta?.language || "Plain Text"}>
              <FileCode2 size={12} />
              <span>{activeFileMeta ? activeFileMeta.language.toUpperCase() : "TEXT"}</span>
            </button>
          </>
        )}

        {/* PRZYCISKI SPLIT & FOCUS */}
        {onToggleSplit && (
          <button 
            className={`status-item status-btn ${isSplitHorizontal ? "active" : ""}`}
            onClick={onToggleSplit}
            title={isSplitHorizontal ? t("split.close", language) : t("split.horizontal", language)}
          >
            <Columns size={12} />
            <span>{isSplitHorizontal ? t("split.on", language) : t("split.badge", language)}</span>
          </button>
        )}

        {onToggleFocusMode && (
          <button 
            className={`status-item status-btn ${isFocusMode ? "active" : ""}`}
            onClick={onToggleFocusMode}
            title={t("focus.tooltip", language)}
          >
            {isFocusMode ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
            <span>{isFocusMode ? t("focus.exit", language) : t("focus.badge", language)}</span>
          </button>
        )}

        {activePath && (
          <button 
            className="status-item status-prettier" 
            onClick={onFormat} 
            title={t("status.prettier", language)}
          >
            <CheckCheck size={12} style={{ color: "var(--accent)" }} /> 
            <span>Prettier</span>
          </button>
        )}
      </div>
    </div>
  );
}
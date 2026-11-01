import { ChevronRight, Folder, Columns, Maximize2, Minimize2 } from "lucide-react";
import detectLang from "../utils/detectLang";
import { splitPath, getFileName, getRelativePath } from "../utils/pathUtils";
import { t, Language } from "../i18n";

interface BreadcrumbsProps {
  activePath: string | null;
  projectPath: string | null;
  isSplitHorizontal?: boolean;
  onToggleSplit?: () => void;
  isFocusMode?: boolean;
  onToggleFocusMode?: () => void;
  language?: Language;
}

export default function Breadcrumbs({
  activePath,
  projectPath,
  isSplitHorizontal,
  onToggleSplit,
  isFocusMode,
  onToggleFocusMode,
  language = "pl",
}: BreadcrumbsProps) {
  if (!activePath) return null;

  const relativePath = getRelativePath(activePath, projectPath);
  const parts = splitPath(relativePath);
  const fileName = parts.pop() || getFileName(activePath) || "";
  const fileMeta = detectLang(fileName);
  const FileIcon = fileMeta.icon;

  const splitTooltip = isSplitHorizontal 
    ? t("breadcrumbs.closeSplitTooltip", language) 
    : t("breadcrumbs.splitTooltip", language);

  const focusTooltip = isFocusMode 
    ? t("breadcrumbs.exitFocusTooltip", language) 
    : t("breadcrumbs.focusTooltip", language);

  return (
    <div className="editor-breadcrumbs">
      <div className="breadcrumbs-path">
        {projectPath && (
          <div className="breadcrumb-item breadcrumb-project" title={projectPath}>
            <Folder size={12} className="breadcrumb-icon folder-color" />
            <span className="breadcrumb-name">{getFileName(projectPath)}</span>
            <ChevronRight size={11} className="breadcrumb-sep" />
          </div>
        )}

        {parts.map((segment, idx) => (
          <div key={idx} className="breadcrumb-item breadcrumb-folder">
            <span className="breadcrumb-name">{segment}</span>
            <ChevronRight size={11} className="breadcrumb-sep" />
          </div>
        ))}

        <div className="breadcrumb-item breadcrumb-active-file">
          <FileIcon size={12} className={`breadcrumb-icon ${fileMeta.color}`} />
          <span className="breadcrumb-name active-filename">{fileName}</span>
        </div>
      </div>

      <div className="breadcrumbs-actions">
        {onToggleSplit && (
          <button
            className={`breadcrumb-action-btn ${isSplitHorizontal ? "active" : ""}`}
            onClick={onToggleSplit}
            title={splitTooltip}
            aria-label={splitTooltip}
          >
            <Columns size={13} />
          </button>
        )}

        {onToggleFocusMode && (
          <button
            className={`breadcrumb-action-btn ${isFocusMode ? "active" : ""}`}
            onClick={onToggleFocusMode}
            title={focusTooltip}
            aria-label={focusTooltip}
          >
            {isFocusMode ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
          </button>
        )}
      </div>
    </div>
  );
}

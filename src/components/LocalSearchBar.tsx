import { ChevronDown, ChevronRight, Search, X, Replace, ArrowRight, ArrowRightToLine } from "lucide-react";
import { t, type Language } from "../i18n";

type LocalSearchBarProps = {
  language: Language;
  showReplace: boolean;
  setShowReplace: (val: boolean) => void;
  localSearchQuery: string;
  setLocalSearchQuery: (val: string) => void;
  replaceQuery: string;
  setReplaceQuery: (val: string) => void;
  setShowLocalSearch: (val: boolean) => void;
  handleReplace: () => void;
  handleReplaceAll: () => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
};

export default function LocalSearchBar({
  language,
  showReplace,
  setShowReplace,
  localSearchQuery,
  setLocalSearchQuery,
  replaceQuery,
  setReplaceQuery,
  setShowLocalSearch,
  handleReplace,
  handleReplaceAll,
  inputRef,
}: LocalSearchBarProps) {
  return (
    <div className="local-search-bar">
      <div className="local-search-row">
        <button className="search-toggle-btn" onClick={() => setShowReplace(!showReplace)}>
          {showReplace ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>

        <div className="local-search-input-container">
          <Search size={13} className="local-search-icon" />
          <input
            ref={inputRef}
            type="text"
            placeholder={t("search.local", language)}
            value={localSearchQuery}
            onChange={(e) => setLocalSearchQuery(e.target.value)}
          />
        </div>
        <button className="local-search-action-btn" onClick={() => { setShowLocalSearch(false); setLocalSearchQuery(""); setShowReplace(false); }}>
          <X size={13} />
        </button>
      </div>

      {showReplace && (
        <div className="local-search-row">
          <div style={{ width: 14 }} />
          <div className="local-search-input-container" style={{ position: "relative" }}>
            <Replace size={13} className="local-search-icon" style={{ position: "absolute", left: "6px", top: "50%", transform: "translateY(-50%)", color: "#8a8a93" }} />
            <input
              type="text"
              style={{ paddingLeft: "24px" }}
              placeholder={t("search.replace", language)}
              value={replaceQuery}
              onChange={(e) => setReplaceQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleReplace();
                }
              }}
            />
          </div>
          <div className="replace-actions">
            <button className="local-search-action-btn" onClick={handleReplace}>
              <ArrowRight size={13} />
            </button>
            <button className="local-search-action-btn" onClick={handleReplaceAll}>
              <ArrowRightToLine size={13} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
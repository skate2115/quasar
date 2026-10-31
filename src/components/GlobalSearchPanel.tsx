import { Search, X } from "lucide-react";
import { SearchResult } from "../types";
import { t, type Language } from "../i18n";

type GlobalSearchPanelProps = {
  language: Language;
  globalSearchQuery: string;
  executeGlobalSearch: (val: string) => void;
  setShowGlobalSearch: (val: boolean) => void;
  globalSearchResults: SearchResult[];
  onResultClick: (path: string) => void;
};

export default function GlobalSearchPanel({
  language,
  globalSearchQuery,
  executeGlobalSearch,
  setShowGlobalSearch,
  globalSearchResults,
  onResultClick,
}: GlobalSearchPanelProps) {
  return (
    <div className="global-search-panel">
      <div className="search-input-wrapper">
        <Search size={14} style={{ color: "#8a8a93" }} />
        <input
          type="text"
          placeholder={t("search.global", language)}
          autoFocus
          value={globalSearchQuery}
          onChange={(e) => executeGlobalSearch(e.target.value)}
        />
        <button className="tab-close-btn" onClick={() => setShowGlobalSearch(false)}>
          <X size={14} />
        </button>
      </div>
      {globalSearchResults.length > 0 && (
        <div className="search-results-container">
          {globalSearchResults.map((res, i) => (
            <div key={i} className="search-result-item" onClick={() => onResultClick(res.path)}>
              <strong style={{ color: "#ffffff" }}>
                {res.name} <span style={{ color: "#8a8a93", fontWeight: "normal" }}>(Line {res.line})</span>
              </strong>
              <span style={{ color: "#a1a1aa", fontFamily: "monospace" }}>{res.text}</span>
            </div>
          ))}
        </div>
      )}
      {globalSearchQuery && globalSearchResults.length === 0 && (
          <div style={{ padding: "12px", color: "#8a8a93", fontSize: "0.85rem", textAlign: "center" }}>
              {t("search.noResults", language)}
          </div>
      )}
    </div>
  );
}
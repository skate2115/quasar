import { useState, useRef, useEffect } from "react";
import { X, ChevronDown, Check, Search, Settings, Monitor, Keyboard, Puzzle, FolderOpen, RefreshCw } from "lucide-react";
import { useExtensions } from "../context/ExtensionContext";
import { t, Language } from "../i18n";

type SettingsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  theme: string;
  setTheme: (theme: string) => void;
  fontSize: number;
  setFontSize: (size: number) => void;
  fontFamily: string;
  setFontFamily: (family: string) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  onSave: () => void; 
};

const CustomSelect = ({ 
  value, options, onChange 
}: { 
  value: string; options: { label: string; value: string }[]; onChange: (val: string) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find(o => o.value === value) || options[0];

  return (
    <div className="custom-select-container" ref={ref}>
      <div className="custom-select-trigger" onClick={() => setIsOpen(!isOpen)}>
        <span>{selectedOption?.label}</span>
        <ChevronDown size={12} className="select-chevron" style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0)" }} />
      </div>
      {isOpen && (
        <div className="custom-select-menu">
          {options.map(option => (
            <div
              key={option.value}
              className={`custom-select-option ${value === option.value ? 'selected' : ''}`}
              onClick={() => { onChange(option.value); setIsOpen(false); }}
            >
              {option.label} {value === option.value && <Check size={12} className="select-check-icon" />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default function SettingsModal({ 
  isOpen, onClose, theme, setTheme, fontSize, setFontSize, 
  fontFamily, setFontFamily, language, setLanguage, onSave
}: SettingsModalProps) {
  const { 
    themesList, setActiveTheme, installedExtensions, 
    toggleExtension, openExtensionsFolder, reloadExtensions 
  } = useExtensions();
  
  const [activeTab, setActiveTab] = useState<"general" | "editor" | "keys" | "extensions">("general");
  const [searchQuery, setSearchQuery] = useState("");

  if (!isOpen) return null;

  const handleClose = () => {
    onSave();
    onClose();
  };

  const themeOptions = [
    { label: "Dark Theme (Default)", value: "dark" },
    { label: "Light Theme (Default)", value: "light" },
    ...themesList.map(t => ({
      label: `${t.id.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}`, 
      value: t.id
    }))
  ];

  const match = (...keywords: string[]) => {
    if (!searchQuery) return false;
    const query = searchQuery.toLowerCase();
    return keywords.some(kw => kw.toLowerCase().includes(query));
  };

  const show = (tab: string, keywords: string[]) => {
    if (searchQuery) return match(...keywords);
    return activeTab === tab;
  };

  const hasAnyResults = 
    show("general", [t("settings.language", language), "language", "język", t("settings.theme", language), "theme", "motyw"]) ||
    show("editor", [t("settings.fontSize", language), "font", "czcionk", t("settings.fontFamily", language), "font", "czcionka"]) ||
    show("keys", [t("settings.keybindings", language), "keys", "skróty"]) ||
    show("extensions", ["extensions", "wtyczki", "rozszerzenia", "plugins"]);

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-box settings-modal" onClick={(e) => e.stopPropagation()}>
        
        {/* HEADER */}
        <div className="settings-header">
          <div className="modal-title">{t("settings.title", language) || "Settings"}</div>
          
          <div className="settings-search-wrapper">
            <Search size={13} className="settings-search-icon" />
            <input 
              type="text" 
              className="settings-search-input" 
              placeholder={t("settings.search", language as any) || "Search..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <button className="settings-close-btn" onClick={handleClose} title="Close settings">
            <X size={15} />
          </button>
        </div>
        
        {/* UKŁAD WEWNĘTRZNY */}
        <div className="settings-layout">
          
          {/* LEWY PANEL (Znikający podczas wyszukiwania dla przejrzystości) */}
          {!searchQuery && (
            <div className="settings-sidebar">
              <button className={`settings-tab ${activeTab === 'general' ? 'active' : ''}`} onClick={() => setActiveTab("general")}>
                <Settings size={14} /> {t("settings.cat.general", language as any) || "General"}
              </button>
              <button className={`settings-tab ${activeTab === 'editor' ? 'active' : ''}`} onClick={() => setActiveTab("editor")}>
                <Monitor size={14} /> {t("settings.cat.editor", language as any) || "Editor"}
              </button>
              <button className={`settings-tab ${activeTab === 'keys' ? 'active' : ''}`} onClick={() => setActiveTab("keys")}>
                <Keyboard size={14} /> {t("settings.cat.keys", language as any) || "Keybindings"}
              </button>
              <button className={`settings-tab ${activeTab === 'extensions' ? 'active' : ''}`} onClick={() => setActiveTab("extensions")}>
                <Puzzle size={14} /> {t("settings.cat.extensions", language as any) || "Extensions"}
              </button>
            </div>
          )}

          {/* PANEL Z OPCJAMI */}
          <div className="settings-main">
            
            {/* KATEGORIA: OGÓLNE */}
            {(show("general", [t("settings.language", language), "language", "język"]) || show("general", [t("settings.theme", language), "theme", "motyw"])) && (
              <div className="settings-section-group">
                <div className="settings-category-title">{t("settings.cat.general", language as any) || "General"}</div>
                
                {show("general", [t("settings.language", language), "language", "język"]) && (
                  <div className="setting-item">
                    <label className="setting-label">{t("settings.language", language)}</label>
                    <CustomSelect value={language} onChange={(val) => setLanguage(val as Language)} options={[{ label: "English", value: "en" }, { label: "Polski", value: "pl" }]} />
                  </div>
                )}

                {show("general", [t("settings.theme", language), "theme", "motyw"]) && (
                  <div className="setting-item">
                    <label className="setting-label">{t("settings.theme", language)}</label>
                    <CustomSelect value={theme} onChange={(v) => { setTheme(v); setActiveTheme(v); }} options={themeOptions} />
                  </div>
                )}
              </div>
            )}

            {/* KATEGORIA: EDYTOR */}
            {(show("editor", [t("settings.fontSize", language), "font", "czcionk"]) || show("editor", [t("settings.fontFamily", language), "font", "czcionka"])) && (
              <div className="settings-section-group">
                <div className="settings-category-title">{t("settings.cat.editor", language as any) || "Editor"}</div>
                
                {show("editor", [t("settings.fontSize", language), "font", "czcionk"]) && (
                  <div className="setting-item">
                    <label className="setting-label">{t("settings.fontSize", language)}</label>
                    <input type="number" className="modal-input font-size-input" value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))} />
                  </div>
                )}

                {show("editor", [t("settings.fontFamily", language), "font", "czcionka"]) && (
                  <div className="setting-item">
                    <label className="setting-label">{t("settings.fontFamily", language)}</label>
                    <CustomSelect value={fontFamily} onChange={(val) => setFontFamily(val)} options={[
                      { label: "Montserrat (Recommended)", value: "Montserrat" },
                      { label: "JetBrains Mono", value: "'JetBrains Mono', monospace" },
                      { label: "Fira Code", value: "'Fira Code', monospace" },
                      { label: "Monospace", value: "monospace" },
                      { label: "Sans-Serif", value: "sans-serif" },
                      { label: "Courier New", value: "'Courier New', monospace" },
                    ]} />
                  </div>
                )}
              </div>
            )}

            {/* KATEGORIA: SKRÓTY */}
            {show("keys", [t("settings.keybindings", language), "keys", "skróty", t("keybind.preview", language), t("keybind.terminal", language), t("keybind.search", language), t("keybind.find", language), t("keybind.save", language)]) && (
              <div className="settings-section-group">
                <div className="settings-category-title">{t("settings.cat.keys", language as any) || "Keybindings"}</div>
                
                <div className="keybind-container">
                  {show("keys", [t("keybind.preview", language), "preview", "podgląd"]) && (
                    <div className="keybind-row"><span className="keybind-desc">{t("keybind.preview", language)}</span><div className="keybind-keys"><span className="key">Ctrl</span><span className="key">Alt</span><span className="key">P</span></div></div>
                  )}
                  {show("keys", [t("keybind.terminal", language), "terminal"]) && (
                    <div className="keybind-row"><span className="keybind-desc">{t("keybind.terminal", language)}</span><div className="keybind-keys"><span className="key">Ctrl</span><span className="key">`</span></div></div>
                  )}
                  {show("keys", [t("keybind.search", language), "search", "szukaj"]) && (
                    <div className="keybind-row"><span className="keybind-desc">{t("keybind.search", language)}</span><div className="keybind-keys"><span className="key">Ctrl</span><span className="key">Shift</span><span className="key">F</span></div></div>
                  )}
                  {show("keys", [t("keybind.find", language), "find", "znajdź"]) && (
                    <div className="keybind-row"><span className="keybind-desc">{t("keybind.find", language)}</span><div className="keybind-keys"><span className="key">Ctrl</span><span className="key">F</span></div></div>
                  )}
                  {show("keys", [t("keybind.save", language), "save", "zapisz"]) && (
                    <div className="keybind-row"><span className="keybind-desc">{t("keybind.save", language)}</span><div className="keybind-keys"><span className="key">Ctrl</span><span className="key">S</span></div></div>
                  )}
                  {show("keys", ["zoom", "font", "powiększ"]) && (
                    <div className="keybind-row"><span className="keybind-desc">{language === "pl" ? "Powiększ czcionkę w locie" : "Zoom In (Font Size)"}</span><div className="keybind-keys"><span className="key">Ctrl</span><span className="key">+</span></div></div>
                  )}
                  {show("keys", ["zoom", "font", "pomniejsz"]) && (
                    <div className="keybind-row"><span className="keybind-desc">{language === "pl" ? "Pomniejsz czcionkę w locie" : "Zoom Out (Font Size)"}</span><div className="keybind-keys"><span className="key">Ctrl</span><span className="key">-</span></div></div>
                  )}
                  {show("keys", ["format", "prettier", "kod"]) && (
                    <div className="keybind-row"><span className="keybind-desc">{language === "pl" ? "Formatuj dokument (Prettier)" : "Format Document"}</span><div className="keybind-keys"><span className="key">Shift</span><span className="key">Alt</span><span className="key">F</span></div></div>
                  )}
                </div>
              </div>
            )}

            {/* KATEGORIA: WTYCZKI */}
            {show("extensions", ["extensions", "wtyczki", "rozszerzenia", "plugins"]) && (
              <div className="settings-section-group">
                <div className="settings-category-title flex-between">
                  <span>{t("settings.cat.extensions", language as any) || "Extensions"}</span>
                  <div className="ext-actions">
                    <button className="ext-btn" onClick={openExtensionsFolder}>
                      <FolderOpen size={12}/> {t("settings.ext.openFolder", language as any) || "Open Folder"}
                    </button>
                    <button className="ext-btn" onClick={reloadExtensions}>
                      <RefreshCw size={12}/> {t("settings.ext.refresh", language as any) || "Refresh"}
                    </button>
                  </div>
                </div>

                <div className="extensions-list">
                  {installedExtensions.length === 0 ? (
                    <div className="ext-empty">{t("settings.ext.empty", language as any) || "No extensions found in the folder."}</div>
                  ) : (
                    installedExtensions.map(ext => (
                      <div className={`ext-item ${!ext.enabled ? 'disabled' : ''}`} key={ext.id}>
                        <div className="ext-info">
                          <div className="ext-name">
                            {ext.name} 
                            <span className="ext-version">v{ext.version}</span>
                          </div>
                          <div className="ext-desc">{ext.description || "No description provided."}</div>
                        </div>
                        <label className="ext-toggle">
                          <input type="checkbox" checked={ext.enabled} onChange={() => toggleExtension(ext.id)} />
                          <span className="ext-slider"></span>
                        </label>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* KOMUNIKAT O BRAKU WYNIKÓW */}
            {!hasAnyResults && (
              <div className="settings-no-results">
                <Search size={24} />
                <div>{t("settings.noResults", language as any) || "No settings found."}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
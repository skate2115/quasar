import React from "react";
import { ChevronDown, File, FolderOpen, X, FolderX, Minus, Square, Settings, Check, Sidebar as SidebarIcon, Terminal as TerminalIcon, LayoutTemplate } from "lucide-react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { t, type Language } from "../i18n";

interface TopbarProps {
  language: Language;
  activeMenu: 'file' | 'view' | null;
  setActiveMenu: (menu: 'file' | 'view' | null) => void;
  menuRef: React.RefObject<HTMLDivElement | null>;
  projectPath: string | null;
  tabs: string[];
  activePath: string | null;
  showSidebar: boolean; setShowSidebar: (val: boolean) => void;
  showPreview: boolean; setShowPreview: (val: boolean) => void;
  isTerminalOpen: boolean; setIsTerminalOpen: (val: boolean) => void;
  openFile: () => void;
  openFolder: () => void;
  closeTab: (path: string) => void;
  setTabs: (tabs: string[]) => void;
  setOpenFiles: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  setActivePath: (path: string | null) => void;
  setDirtyFiles: React.Dispatch<React.SetStateAction<Set<string>>>;
  setProjectPath: (path: string | null) => void;
  setProjectTree: React.Dispatch<React.SetStateAction<any[]>>;
  openSettings: () => void;
}

export default function Topbar({
  language, activeMenu, setActiveMenu, menuRef, projectPath, tabs, activePath,
  showSidebar, setShowSidebar, showPreview, setShowPreview, isTerminalOpen, setIsTerminalOpen,
  openFile, openFolder, closeTab, setTabs, setOpenFiles, setActivePath, setDirtyFiles, setProjectPath, setProjectTree, openSettings,
}: TopbarProps) {
  
  const toggleMenu = (menu: 'file' | 'view') => {
    setActiveMenu(activeMenu === menu ? null : menu);
  };

  return (
    <header className="topbar">
      <div className="topbar-left">
        <span className="topbar-title">QUASAR</span>

        <div className="menu-container" ref={menuRef} style={{ display: "flex", gap: "2px", marginLeft: "8px" }}>
          {/* MENU: FILE */}
          <div style={{ position: "relative" }}>
            <button className={`menu-trigger ${activeMenu === 'file' ? "active" : ""}`} onClick={() => toggleMenu('file')}>
              {t("topbar.file", language)} <ChevronDown size={12} className={`dropdown-chevron ${activeMenu === 'file' ? "rotate" : ""}`} />
            </button>
            {activeMenu === 'file' && (
              <div className="dropdown-menu">
                <button className="dropdown-item" onClick={() => { openFile(); setActiveMenu(null); }}>
                  <File size={14} className="dropdown-item-icon" /> {t("topbar.openFile", language)}
                </button>
                <button className="dropdown-item" onClick={() => { openFolder(); setActiveMenu(null); }}>
                  <FolderOpen size={14} className="dropdown-item-icon" /> {t("topbar.openFolder", language)}
                </button>
                {(projectPath || tabs.length > 0) && <div className="context-divider" style={{ margin: "4px 5px" }}></div>}
                
                {tabs.length > 0 && (
                  projectPath ? (
                    <button className="dropdown-item danger" onClick={() => { setTabs([]); setOpenFiles({}); setActivePath(null); setDirtyFiles(new Set()); setActiveMenu(null); }}>
                      <X size={14} className="dropdown-item-icon" /> {t("topbar.closeAll", language)}
                    </button>
                  ) : (
                    activePath && (
                      <button className="dropdown-item danger" onClick={() => { closeTab(activePath); setActiveMenu(null); }}>
                        <X size={14} className="dropdown-item-icon" /> {t("topbar.closeFile", language)}
                      </button>
                    )
                  )
                )}

                {projectPath && (
                  <button className="dropdown-item danger" onClick={() => { setProjectPath(null); setProjectTree([]); setTabs([]); setOpenFiles({}); setActivePath(null); setDirtyFiles(new Set()); setActiveMenu(null); }}>
                    <FolderX size={14} className="dropdown-item-icon" /> {t("topbar.closeProject", language)}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* MENU: VIEW */}
          <div style={{ position: "relative" }}>
            <button className={`menu-trigger ${activeMenu === 'view' ? "active" : ""}`} onClick={() => toggleMenu('view')}>
              {t("topbar.view", language)} <ChevronDown size={12} className={`dropdown-chevron ${activeMenu === 'view' ? "rotate" : ""}`} />
            </button>
            {activeMenu === 'view' && (
              <div className="dropdown-menu">
                <button className="dropdown-item" onClick={() => { setShowSidebar(!showSidebar); setActiveMenu(null); }}>
                  <SidebarIcon size={14} className="dropdown-item-icon" /> {t("topbar.explorer", language)}
                  {showSidebar && <Check size={14} style={{ marginLeft: "auto", color: "var(--accent)" }} />}
                </button>
                
                <button className="dropdown-item" onClick={() => { setIsTerminalOpen(!isTerminalOpen); setActiveMenu(null); }}>
                  <TerminalIcon size={14} className="dropdown-item-icon" /> {t("topbar.terminal", language)}
                  {isTerminalOpen && <Check size={14} style={{ marginLeft: "auto", color: "var(--accent)" }} />}
                </button>
                
                <button className="dropdown-item" onClick={() => { setShowPreview(!showPreview); setActiveMenu(null); }}>
                  <LayoutTemplate size={14} className="dropdown-item-icon" /> {t("topbar.preview", language)}
                  {showPreview && <Check size={14} style={{ marginLeft: "auto", color: "var(--accent)" }} />}
                </button>
              </div>
            )}
          </div>

        </div>
      </div>

      <div className="topbar-controls" style={{ display: "flex", alignItems: "center" }}>
        <button onClick={openSettings} title={t("topbar.settings", language)} className="settings-btn"><Settings size={15} /></button>
        <button onClick={() => getCurrentWindow().minimize()}><Minus size={14} /></button>
        <button onClick={() => getCurrentWindow().toggleMaximize()}><Square size={12} /></button>
        <button onClick={() => getCurrentWindow().close()} className="close-btn"><X size={14} /></button>
      </div>
    </header>
  );
}
import { useState, useMemo, useRef, useEffect } from "react";
import { Layout, GripVertical, GripHorizontal } from "lucide-react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { readTextFile } from "@tauri-apps/plugin-fs";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";

import CodeEditor from "./components/Editor";
import Preview from "./components/Preview";
import Topbar from "./components/Topbar";
import Sidebar from "./components/Sidebar";
import StatusBar from "./components/StatusBar";
import TabsBar from "./components/TabsBar";
import LocalSearchBar from "./components/LocalSearchBar";
import GlobalSearchPanel from "./components/GlobalSearchPanel";
import TerminalPanel from "./components/TerminalPanel";
import CreationModal from "./components/CreationModal";
import SettingsModal from "./components/SettingsModal";
import CrashReportModal from "./components/CrashReportModal";
import detectLang from "./utils/detectLang";
import "./App.css";

import { useTabs } from "./hooks/useTabs";
import { useFileSystem } from "./hooks/useFileSystem";
import { useSearch } from "./hooks/useSearch";

// Importy dla zapisu, rozszerzeń i TŁUMACZEŃ
import { ExtensionProvider } from "./context/ExtensionContext"; 
import { loadSettings, saveSettings, defaultSettings } from "./utils/settingsManager";
import { t, type Language } from "./i18n"; 

export default function App() {
  const tabsState = useTabs();
  const fileSystem = useFileSystem(tabsState);
  const searchState = useSearch(fileSystem.projectPath, tabsState);

  // 1. DESTRUKTURYZACJA OBIEKTÓW
  const {
    projectPath, setProjectTree, projectTree, contextMenu, dialog, setDialog,
    newItemName, setNewItemName, handleModalSubmit, openFile, openFolder,
    handleNodeClick, handleContextMenu, openCreationDialogTop,
    openCreationDialogContext, openRenameDialogContext, handleDeleteItem,
    handleMoveNode, setContextMenu, handleOpenFileSuccess, expandedPaths, setProjectPath,
    recentProjects, openRecentProject, clearRecentProjects
  } = fileSystem;

  const {
    tabs, openFiles, activePath, dirtyFiles, draggedTab, setDraggedTab,
    setActivePath, closeTab, handleTabReorder, handleEditorChange, saveFile,
    setTabs, setOpenFiles, setDirtyFiles,
    autoSaveEnabled, setAutoSaveEnabled, revertToLastSaved
  } = tabsState;

  const {
    showGlobalSearch, setShowGlobalSearch, globalSearchQuery, globalSearchResults,
    showLocalSearch, setShowLocalSearch, showReplace, setShowReplace,
    localSearchQuery, setLocalSearchQuery, replaceQuery, setReplaceQuery,
    localSearchInputRef, executeGlobalSearch, handleGlobalResultClick,
    handleReplace, handleReplaceAll
  } = searchState;

  // 2. STANY U.I. & USTAWIENIA
  const [activeMenu, setActiveMenu] = useState<'file' | 'view' | null>(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const menuRef = useRef<HTMLDivElement>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [previewCode, setPreviewCode] = useState("");
  const [crashError, setCrashError] = useState<Error | null>(null);
  
  const [theme, setTheme] = useState(defaultSettings.theme);
  const [fontSize, setFontSize] = useState(defaultSettings.fontSize);
  const [fontFamily, setFontFamily] = useState(defaultSettings.fontFamily);
  const [language, setLanguage] = useState<Language>(defaultSettings.language);
  const [showPreview, setShowPreview] = useState(true);

  // Referencja do aktywnego edytora Monaco dla formatowania kodu i zoomu
  const activeEditorRef = useRef<any>(null);

  // 3. EFEKTY: ŁADOWANIE USTAWIEN Z APPDATA PRZY STARCIE
  useEffect(() => {
    loadSettings().then((settings) => {
      setTheme(settings.theme);
      setFontSize(settings.fontSize);
      setFontFamily(settings.fontFamily);
      setLanguage(settings.language);
      if (settings.autoSave !== undefined) {
        setAutoSaveEnabled(settings.autoSave);
      }
    });
  }, [setAutoSaveEnabled]);

  // Synchronizacja czcionki w czasie rzeczywistym z całym interfejsem
  useEffect(() => {
    if (fontFamily) {
      document.documentElement.style.setProperty('--font-main', fontFamily);
      document.documentElement.style.setProperty('--font-editor', fontFamily);
      document.body.style.fontFamily = fontFamily;
    }
  }, [fontFamily]);

  const handleSaveSettings = async () => {
    const currentSettings = await loadSettings();
    
    // Zapisujemy połączone dane
    await saveSettings({ 
      ...currentSettings, 
      theme, 
      fontSize, 
      fontFamily, 
      language,
      autoSave: autoSaveEnabled
    });
  };

  // FORMATOWANIE KODU (PRETTIER / MONACO BUILT-IN)
  const formatDocument = () => {
    if (activeEditorRef.current) {
      activeEditorRef.current.getAction('editor.action.formatDocument')?.run();
    }
  };

  const handleCrashReportSend = async (message: string) => {
    console.error("Crash report:", { 
      error: crashError?.message, 
      stack: crashError?.stack, 
      userMessage: message 
    });
    setCrashError(null);
  };

  // 3.5 GLOBALNA OBSŁUGA BŁĘDÓW
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error("Uncaught error:", event.error);
      setCrashError(event.error || new Error(event.message));
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error("Unhandled promise rejection:", event.reason);
      setCrashError(new Error(String(event.reason)));
    };

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
    };
  }, []);

  // 4. BEZPIECZNE EFEKTY GLOBALNE
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (menuRef.current && !menuRef.current.contains(target)) setActiveMenu(null);
      if (target instanceof Element && !target.closest('.context-menu')) setContextMenu(null);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [setContextMenu]);

  useEffect(() => {
    const disableRightClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.sidebar')) e.preventDefault();
    };
    document.addEventListener("contextmenu", disableRightClick);
    return () => document.removeEventListener("contextmenu", disableRightClick);
  }, []);

  useEffect(() => {
    if (!projectPath && tabs.length === 0 && projectTree.length > 0) {
      setProjectTree([]);
    }
  }, [tabs.length, projectPath, setProjectTree, projectTree.length]);

  // OBSŁUGA SKRÓTÓW KLAWISZOWYCH (W TYM POWIĘKSZANIE CZCIONKI W LOCIE I FORMATOWANIE)
  useEffect(() => {
    const handleKeyDownCapture = (e: KeyboardEvent) => {
      const isCtrl = e.ctrlKey || e.metaKey;

      // POWIĘKSZANIE / POMNIEJSZANIE CZCIONKI W LOCIE
      if (isCtrl && (e.key === "=" || e.key === "+")) {
        e.preventDefault();
        setFontSize(s => Math.min(s + 1, 36));
        return;
      }
      if (isCtrl && e.key === "-") {
        e.preventDefault();
        setFontSize(s => Math.max(s - 1, 9));
        return;
      }
      if (isCtrl && e.key === "0") {
        e.preventDefault();
        setFontSize(14);
        return;
      }

      // FORMATOWANIE DOKUMENTU: Shift + Alt + F
      if (e.shiftKey && e.altKey && e.key.toLowerCase() === "f") {
        e.preventDefault();
        formatDocument();
        return;
      }

      if (isCtrl && e.shiftKey && e.key.toLowerCase() === "f") {
        e.preventDefault(); e.stopPropagation();
        setShowGlobalSearch(prev => !prev); setShowLocalSearch(false);
      }
      else if (isCtrl && !e.shiftKey && e.key.toLowerCase() === "f") {
        e.preventDefault(); e.stopPropagation();
        setShowGlobalSearch(false); setShowLocalSearch(prev => !prev);
      }
      else if (e.key === "Escape") {
        setShowLocalSearch(false); setShowGlobalSearch(false); setShowReplace(false);
      }
      else if (isCtrl && e.key === "`") {
        e.preventDefault(); e.stopPropagation();
        setIsTerminalOpen(prev => !prev);
      }
      else if (isCtrl && e.altKey && e.key.toLowerCase() === "p") {
        e.preventDefault(); e.stopPropagation();
        setShowPreview(prev => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDownCapture, true);
    return () => window.removeEventListener("keydown", handleKeyDownCapture, true);
  }, [setShowGlobalSearch, setShowLocalSearch, setShowReplace]);

  useEffect(() => {
    const onKey = async (e: KeyboardEvent) => { 
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") { e.preventDefault(); await saveFile(); } 
    };
    window.addEventListener("keydown", onKey); 
    return () => window.removeEventListener("keydown", onKey);
  }, [saveFile]);

  useEffect(() => {
    let unlistenFn: (() => void) | null = null;
    const listenToDragDrop = async () => {
      unlistenFn = await getCurrentWindow().onDragDropEvent(async (event) => {
        if (event.payload.type === "drop" && event.payload.paths && event.payload.paths.length > 0) {
          try {
            const content = await readTextFile(event.payload.paths[0]);
            handleOpenFileSuccess(event.payload.paths[0], content);
          } catch (err) {}
        }
      });
    };
    listenToDragDrop();
    return () => { if (unlistenFn) unlistenFn(); };
  }, [handleOpenFileSuccess]);

  // 5. BUDOWANIE PREVIEW W TLE
  useEffect(() => {
    let isMounted = true;
    const buildPreview = async () => {
      let html = "", css = "", js = "";
      const scan = async (nodes: any[]) => {
        for (const n of nodes) {
          if (n.isDirectory && n.children) await scan(n.children);
          else {
            if (n.name.toLowerCase() === "index.html") html = openFiles[n.path] ?? await readTextFile(n.path).catch(() => "");
            if (n.name.toLowerCase() === "style.css") css = openFiles[n.path] ?? await readTextFile(n.path).catch(() => "");
            if (n.name.toLowerCase() === "script.js") js = openFiles[n.path] ?? await readTextFile(n.path).catch(() => "");
          }
        }
      };
      if (projectTree.length > 0) await scan(projectTree);
      
      if (activePath && openFiles[activePath] !== undefined) {
        const name = activePath.split(/[\\/]/).pop()!.toLowerCase();
        if (name.endsWith(".html")) html = openFiles[activePath];
        if (name.endsWith(".css")) css = openFiles[activePath];
        if (name.endsWith(".js")) js = openFiles[activePath];
      }
      if (isMounted) setPreviewCode(`${html}<style>${css}</style><script>${js}</script>`);
    };
    buildPreview();
    return () => { isMounted = false; };
  }, [projectTree, openFiles, activePath]);

  // 6. MEMO PROPERTIES
  const hasHtmlFile = useMemo(() => {
    const checkHtml = (nodes: any[]): boolean => nodes.some(n => n.isDirectory && n.children ? checkHtml(n.children) : n.name.toLowerCase().endsWith('.html'));
    return checkHtml(projectTree) || !!activePath?.toLowerCase().endsWith('.html');
  }, [projectTree, activePath]);

  const activeFileMeta = useMemo(() => activePath ? detectLang(activePath.split(/[\\/]/).pop()!) : null, [activePath]);

  // 7. RENDER EDYTORA
  const editorContent = (
    <>
      {tabs.length > 0 && <TabsBar tabs={tabs} activePath={activePath} draggedTab={draggedTab} dirtyFiles={dirtyFiles} setDraggedTab={setDraggedTab} setActivePath={setActivePath} closeTab={closeTab} handleTabReorder={handleTabReorder} />}
      {showLocalSearch && activePath && <LocalSearchBar language={language} showReplace={showReplace} setShowReplace={setShowReplace} localSearchQuery={localSearchQuery} setLocalSearchQuery={setLocalSearchQuery} replaceQuery={replaceQuery} setReplaceQuery={setReplaceQuery} setShowLocalSearch={setShowLocalSearch} handleReplace={handleReplace} handleReplaceAll={handleReplaceAll} inputRef={localSearchInputRef} />}
      <div className="panel-content">
        {activePath ? (
          <CodeEditor 
            value={openFiles[activePath] || ""} 
            language={activeFileMeta?.language || "text"} 
            onChange={handleEditorChange} 
            searchQuery={localSearchQuery} 
            theme={theme} 
            fontSize={fontSize} 
            fontFamily={fontFamily}
            onMountInstance={(editor) => { activeEditorRef.current = editor; }}
          />
        ) : (
            <div className="no-file-screen">
              <span>{projectPath ? t("editor.empty.file", language) : t("editor.empty.folder", language)}</span>
            </div>
        )}
      </div>
    </>
  );

  return (
    <ExtensionProvider>
      <div className="app-wrapper" data-theme={theme}>
        <Topbar 
          language={language}
          activeMenu={activeMenu} setActiveMenu={setActiveMenu} menuRef={menuRef} projectPath={projectPath} tabs={tabs} activePath={activePath} 
          showSidebar={showSidebar} setShowSidebar={setShowSidebar} showPreview={showPreview} setShowPreview={setShowPreview} isTerminalOpen={isTerminalOpen} setIsTerminalOpen={setIsTerminalOpen}
          openFile={openFile} openFolder={openFolder} closeTab={closeTab} setTabs={setTabs} setOpenFiles={setOpenFiles} setActivePath={setActivePath} setDirtyFiles={setDirtyFiles} setProjectPath={setProjectPath} setProjectTree={setProjectTree} 
          openSettings={() => setIsSettingsOpen(true)} 
          recentProjects={recentProjects}
          openRecentProject={openRecentProject}
          clearRecentProjects={clearRecentProjects}
          autoSaveEnabled={autoSaveEnabled}
          setAutoSaveEnabled={setAutoSaveEnabled}
          revertToLastSaved={revertToLastSaved}
        />

        {showGlobalSearch && <GlobalSearchPanel language={language} globalSearchQuery={globalSearchQuery} executeGlobalSearch={executeGlobalSearch} setShowGlobalSearch={setShowGlobalSearch} globalSearchResults={globalSearchResults} onResultClick={handleGlobalResultClick} />}
        
        <div className="layout">
          {showSidebar && (
            <Sidebar language={language} projectPath={projectPath} projectTree={projectTree} expandedPaths={expandedPaths} activePath={activePath} handleNodeClick={handleNodeClick} handleContextMenu={handleContextMenu} openCreationDialogTop={openCreationDialogTop} contextMenu={contextMenu} openCreationDialogContext={openCreationDialogContext} openRenameDialogContext={openRenameDialogContext} handleDeleteItem={handleDeleteItem} handleMoveNode={handleMoveNode} />
          )}
          <main className="main" style={{ width: "100%", height: "100%" }}>
            <PanelGroup direction="vertical">
              <Panel minSize={20} style={{ display: "flex" }}>
                {projectPath || tabs.length > 0 ? (
                  hasHtmlFile && showPreview ? (
                    <PanelGroup direction="horizontal">
                      <Panel defaultSize={50} minSize={20} className="panel">{editorContent}</Panel>
                      <PanelResizeHandle className="resize-handle"><GripVertical size={14} /></PanelResizeHandle>
                      <Panel defaultSize={50} minSize={20} className="panel">
                        <div className="panel-header"><div className="tab active"><Layout size={13} /><span>{t("preview.title", language)}</span></div></div>
                        <div className="panel-content preview-bg"><Preview code={previewCode} /></div>
                      </Panel>
                    </PanelGroup>
                  ) : <div className="panel" style={{ width: "100%", height: "100%" }}>{editorContent}</div>
                ) : <div className="panel" style={{ width: "100%", height: "100%" }}>{editorContent}</div>}
              </Panel>

              {isTerminalOpen && (
                <>
                  <PanelResizeHandle className="resize-handle-horizontal"><GripHorizontal size={14} /></PanelResizeHandle>
                  <Panel defaultSize={25} minSize={10} className="panel">
                    <TerminalPanel
                      language={language}
                      onClose={() => setIsTerminalOpen(false)}
                      projectPath={projectPath}
                    />
                  </Panel>
                </>
              )}
            </PanelGroup>
          </main>
        </div>

        <StatusBar
          activePath={activePath}
          projectPath={projectPath}
          errors={0}
          warnings={0}
          onFormat={formatDocument}
        />
        
        <CreationModal 
          language={language}
          dialog={dialog} setDialog={setDialog} newItemName={newItemName} setNewItemName={setNewItemName} handleModalSubmit={handleModalSubmit} 
        />
        
        <SettingsModal 
          isOpen={isSettingsOpen} 
          onClose={() => setIsSettingsOpen(false)} 
          theme={theme} 
          setTheme={setTheme} 
          fontSize={fontSize} 
          setFontSize={setFontSize} 
          fontFamily={fontFamily}
          setFontFamily={setFontFamily}
          language={language}
          setLanguage={setLanguage}
          onSave={handleSaveSettings}
        />

        <CrashReportModal 
          isOpen={crashError !== null}
          error={crashError}
          onClose={() => setCrashError(null)}
          onSendAndClose={handleCrashReportSend}
          language={language}
        />
      </div>
    </ExtensionProvider>
  );
}
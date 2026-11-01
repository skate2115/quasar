import { useState, useMemo, useRef, useEffect } from "react";
import { Layout, GripVertical, GripHorizontal, Columns, Minimize2, FolderOpen, X } from "lucide-react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { readTextFile } from "@tauri-apps/plugin-fs";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";

import CodeEditor, { type CursorInfo } from "./components/Editor";
import Preview from "./components/Preview";
import Topbar from "./components/Topbar";
import Sidebar from "./components/Sidebar";
import StatusBar from "./components/StatusBar";
import TabsBar from "./components/TabsBar";
import Breadcrumbs from "./components/Breadcrumbs";
import LocalSearchBar from "./components/LocalSearchBar";
import GlobalSearchPanel from "./components/GlobalSearchPanel";
import TerminalPanel from "./components/TerminalPanel";
import CreationModal from "./components/CreationModal";
import SettingsModal from "./components/SettingsModal";
import CrashReportModal from "./components/CrashReportModal";
import CommandPalette from "./components/CommandPalette";
import detectLang from "./utils/detectLang";
import "./App.css";

import { useTabs } from "./hooks/useTabs";
import { useFileSystem } from "./hooks/useFileSystem";
import { useSearch } from "./hooks/useSearch";

// Importy dla zapisu, rozszerzeń i TŁUMACZEŃ
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
    autoSaveEnabled, setAutoSaveEnabled, revertToLastSaved,
    savedSnapshots
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
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [previewCode, setPreviewCode] = useState("");
  const [crashError, setCrashError] = useState<Error | null>(null);
  
  const [theme, setTheme] = useState(defaultSettings.theme);
  const [fontSize, setFontSize] = useState(defaultSettings.fontSize);
  const [fontFamily, setFontFamily] = useState(defaultSettings.fontFamily);
  const [language, setLanguage] = useState<Language>(defaultSettings.language);
  const [showPreview, setShowPreview] = useState(true);

  // Nowe funkcje: Split Editor, Focus Mode, Cursor stats, Drag&Drop
  const [isSplitHorizontal, setIsSplitHorizontal] = useState(false);
  const [splitActivePath, setSplitActivePath] = useState<string | null>(null);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [cursorInfo, setCursorInfo] = useState<CursorInfo | null>(null);
  const [isDraggingOverWindow, setIsDraggingOverWindow] = useState(false);

  // Referencja do aktywnego edytora Monaco dla formatowania kodu i zoomu
  const activeEditorRef = useRef<any>(null);

  const toggleTheme = async () => {
    const next = theme === "light" ? "quasar-dark" : "light";
    setTheme(next);
    const current = await loadSettings();
    await saveSettings({ ...current, theme: next });
  };

  const toggleSplitEditor = () => {
    setIsSplitHorizontal((prev) => {
      const next = !prev;
      if (next && !splitActivePath) {
        const other = tabs.find((t) => t !== activePath) || activePath;
        setSplitActivePath(other);
      }
      return next;
    });
  };

  const toggleFocusMode = () => {
    setIsFocusMode((prev) => !prev);
  };

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
      if (
        !event.reason ||
        event.reason.type === "cancelation" ||
        event.reason === "Canceled" ||
        String(event.reason).includes("Canceled")
      ) {
        event.preventDefault();
        return;
      }
      console.error("Unhandled promise rejection:", event.reason);
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

  // OBSŁUGA SKRÓTÓW KLAWISZOWYCH
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

      // FOCUS MODE (F11)
      if (e.key === "F11") {
        e.preventDefault();
        toggleFocusMode();
        return;
      }

      // SPLIT EDITOR (Ctrl + \)
      if (isCtrl && e.key === "\\") {
        e.preventDefault();
        toggleSplitEditor();
        return;
      }

      // FORMATOWANIE DOKUMENTU: Shift + Alt + F
      if (e.shiftKey && e.altKey && e.key.toLowerCase() === "f") {
        e.preventDefault();
        formatDocument();
        return;
      }

      // COMMAND PALETTE: Ctrl + Shift + P, Ctrl + P lub F1
      if ((isCtrl && e.shiftKey && e.key.toLowerCase() === "p") || (isCtrl && !e.shiftKey && e.key.toLowerCase() === "p") || e.key === "F1") {
        e.preventDefault();
        e.stopPropagation();
        setIsCommandPaletteOpen(prev => !prev);
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
        setShowLocalSearch(false); 
        setShowGlobalSearch(false); 
        setShowReplace(false); 
        setIsCommandPaletteOpen(false);
        if (isFocusMode) setIsFocusMode(false);
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
  }, [setShowGlobalSearch, setShowLocalSearch, setShowReplace, isFocusMode]);

  useEffect(() => {
    const onKey = async (e: KeyboardEvent) => { 
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") { e.preventDefault(); await saveFile(); } 
    };
    window.addEventListener("keydown", onKey); 
    return () => window.removeEventListener("keydown", onKey);
  }, [saveFile]);

  // OBSŁUGA TAURI DRAG & DROP
  useEffect(() => {
    let unlistenFn: (() => void) | null = null;
    const listenToDragDrop = async () => {
      try {
        unlistenFn = await getCurrentWindow().onDragDropEvent(async (event) => {
          if (event.payload.type === "drop" && event.payload.paths && event.payload.paths.length > 0) {
            const first = event.payload.paths[0];
            try {
              const content = await readTextFile(first);
              handleOpenFileSuccess(first, content);
            } catch (err) {
              try {
                setProjectPath(first);
              } catch (e) {}
            }
          }
        });
      } catch (err) {}
    };
    listenToDragDrop();
    return () => { if (unlistenFn) unlistenFn(); };
  }, [handleOpenFileSuccess, setProjectPath]);

  // OBSŁUGA ZEWNĘTRZNEGO HTML5 DRAG & DROP (PLIKI I FOLDERY Z SYSTEMU)
  const handleWindowDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOverWindow(true);
  };

  const handleWindowDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDraggingOverWindow(false);
    }
  };

  const handleWindowDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOverWindow(false);

    const items = e.dataTransfer.items;
    if (items && items.length > 0) {
      const entryPromises: Promise<any>[] = [];
      const readEntry = async (entry: any, basePath = ""): Promise<any> => {
        if (!entry) return null;
        if (entry.isFile) {
          return new Promise((resolve) => {
            entry.file(async (file: File) => {
              try {
                const text = await file.text();
                const path = basePath ? `${basePath}/${file.name}` : file.name;
                resolve({ name: file.name, path, isDirectory: false, content: text });
              } catch {
                resolve(null);
              }
            }, () => resolve(null));
          });
        } else if (entry.isDirectory) {
          const dirReader = entry.createReader();
          return new Promise((resolve) => {
            dirReader.readEntries(async (entries: any[]) => {
              const children = await Promise.all(
                entries.map(sub => readEntry(sub, basePath ? `${basePath}/${entry.name}` : entry.name))
              );
              resolve({
                name: entry.name,
                path: basePath ? `${basePath}/${entry.name}` : entry.name,
                isDirectory: true,
                children: children.filter(Boolean)
              });
            }, () => resolve(null));
          });
        }
        return null;
      };

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if ((item as any).webkitGetAsEntry) {
          const entry = (item as any).webkitGetAsEntry();
          if (entry) entryPromises.push(readEntry(entry));
        }
      }

      const results = (await Promise.all(entryPromises)).filter(Boolean);
      if (results.length > 0) {
        const newFiles: Record<string, string> = {};
        const collectFiles = (nodes: any[]) => {
          for (const node of nodes) {
            if (node.isDirectory && node.children) collectFiles(node.children);
            else if (node.content !== undefined) {
              newFiles[node.path] = node.content;
            }
          }
        };
        collectFiles(results);

        const firstNode = results[0];
        if (firstNode.isDirectory) {
          setProjectPath(firstNode.name);
          setProjectTree(firstNode.children || []);
        } else {
          setProjectTree(results);
        }

        const filePaths = Object.keys(newFiles);
        if (filePaths.length > 0) {
          setOpenFiles(prev => ({ ...prev, ...newFiles }));
          const mainFile = filePaths.find(p => p.endsWith("index.html") || p.endsWith("App.tsx") || p.endsWith("main.ts")) || filePaths[0];
          setTabs(prev => Array.from(new Set([...prev, ...filePaths])));
          setActivePath(mainFile);
        }
        return;
      }
    }

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      for (let i = 0; i < e.dataTransfer.files.length; i++) {
        const file = e.dataTransfer.files[i];
        try {
          const content = await file.text();
          handleOpenFileSuccess(file.name, content);
        } catch (err) {}
      }
    }
  };

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

  // 7. RENDER PRIMARY EDYTORA
  const renderPrimaryEditor = () => (
    <div className="panel" style={{ width: "100%", height: "100%" }}>
      {tabs.length > 0 && (
        <TabsBar 
          tabs={tabs} 
          activePath={activePath} 
          draggedTab={draggedTab} 
          dirtyFiles={dirtyFiles} 
          setDraggedTab={setDraggedTab} 
          setActivePath={setActivePath} 
          closeTab={closeTab} 
          handleTabReorder={handleTabReorder} 
        />
      )}
      {activePath && (
        <Breadcrumbs 
          activePath={activePath} 
          projectPath={projectPath} 
          isSplitHorizontal={isSplitHorizontal}
          onToggleSplit={toggleSplitEditor}
          isFocusMode={isFocusMode}
          onToggleFocusMode={toggleFocusMode}
        />
      )}
      {showLocalSearch && activePath && (
        <LocalSearchBar 
          language={language} 
          showReplace={showReplace} 
          setShowReplace={setShowReplace} 
          localSearchQuery={localSearchQuery} 
          setLocalSearchQuery={setLocalSearchQuery} 
          replaceQuery={replaceQuery} 
          setReplaceQuery={setReplaceQuery} 
          setShowLocalSearch={setShowLocalSearch} 
          handleReplace={handleReplace} 
          handleReplaceAll={handleReplaceAll} 
          inputRef={localSearchInputRef} 
        />
      )}
      <div className="panel-content">
        {activePath ? (
          <CodeEditor 
            value={openFiles[activePath] || ""} 
            baselineValue={savedSnapshots[activePath]}
            language={activeFileMeta?.language || "text"} 
            onChange={handleEditorChange} 
            searchQuery={localSearchQuery} 
            theme={theme} 
            fontSize={fontSize} 
            fontFamily={fontFamily}
            onMountInstance={(editor) => { activeEditorRef.current = editor; }}
            onCursorChange={setCursorInfo}
          />
        ) : (
          <div className="no-file-screen">
            <span>{projectPath ? t("editor.empty.file", language) : t("editor.empty.folder", language)}</span>
          </div>
        )}
      </div>
    </div>
  );

  // 8. RENDER SECONDARY EDYTORA (DLA SPLIT EDITOR HORIZONTAL)
  const renderSecondaryEditor = () => {
    const secPath = splitActivePath || activePath;
    const secMeta = secPath ? detectLang(secPath.split(/[\\/]/).pop()!) : null;
    return (
      <div className="split-pane">
        <div className="split-pane-header">
          <div className="split-pane-title">
            <Columns size={13} style={{ color: "var(--accent)" }} />
            <span>{secPath ? secPath.split(/[\\/]/).pop() : "Split Editor"}</span>
          </div>
          <button 
            className="split-pane-close" 
            onClick={() => setIsSplitHorizontal(false)}
            title="Zamknij podział (Close Split)"
          >
            <X size={13} />
          </button>
        </div>
        {secPath && (
          <Breadcrumbs 
            activePath={secPath} 
            projectPath={projectPath} 
          />
        )}
        <div className="panel-content">
          {secPath ? (
            <CodeEditor 
              value={openFiles[secPath] || ""} 
              baselineValue={savedSnapshots[secPath]}
              language={secMeta?.language || "text"} 
              onChange={(val) => {
                setOpenFiles(prev => ({ ...prev, [secPath]: val }));
                setDirtyFiles(prev => new Set(prev).add(secPath));
              }}
              theme={theme} 
              fontSize={fontSize} 
              fontFamily={fontFamily}
            />
          ) : (
            <div className="no-file-screen">
              <span>Wybierz plik do wyświetlenia w drugim panelu</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  const editorLayout = isSplitHorizontal ? (
    <PanelGroup direction="horizontal">
      <Panel defaultSize={50} minSize={25} className="panel">
        {renderPrimaryEditor()}
      </Panel>
      <PanelResizeHandle className="resize-handle">
        <GripVertical size={14} />
      </PanelResizeHandle>
      <Panel defaultSize={50} minSize={25} className="panel">
        {renderSecondaryEditor()}
      </Panel>
    </PanelGroup>
  ) : renderPrimaryEditor();

  return (
    <div 
      className="app-wrapper" 
      data-theme={theme}
      onDragOver={handleWindowDragOver}
      onDragLeave={handleWindowDragLeave}
      onDrop={handleWindowDrop}
    >
      {/* DRAG AND DROP OVERLAY */}
      {isDraggingOverWindow && (
        <div className="drag-drop-global-overlay">
          <div className="drag-drop-card">
            <FolderOpen size={44} className="drag-drop-icon" />
            <div className="drag-drop-title">
              {language === "pl" ? "Upuść pliki lub folder projektu tutaj" : "Drop files or project folder here"}
            </div>
            <div className="drag-drop-subtitle">
              {language === "pl" ? "QUASAR natychmiast załaduje zawartość do edytora" : "QUASAR will automatically load them into your workspace"}
            </div>
          </div>
        </div>
      )}

      {/* FLOATING FOCUS MODE EXIT BUTTON */}
      {isFocusMode && (
        <button 
          className="focus-mode-exit-btn"
          onClick={() => setIsFocusMode(false)}
          title="Wyjdź z trybu skupienia (Esc lub F11)"
        >
          <Minimize2 size={13} /> {language === "pl" ? "Wyjdź ze skupienia (Esc)" : "Exit Focus (Esc)"}
        </button>
      )}

      <Topbar 
        language={language}
        activeMenu={activeMenu} setActiveMenu={setActiveMenu} menuRef={menuRef} projectPath={projectPath} tabs={tabs} activePath={activePath} 
        showSidebar={showSidebar} setShowSidebar={setShowSidebar} showPreview={showPreview} setShowPreview={setShowPreview} isTerminalOpen={isTerminalOpen} setIsTerminalOpen={setIsTerminalOpen}
        openFile={openFile} openFolder={openFolder} closeTab={closeTab} setTabs={setTabs} setOpenFiles={setOpenFiles} setActivePath={setActivePath} setDirtyFiles={setDirtyFiles} setProjectPath={setProjectPath} setProjectTree={setProjectTree} 
        openSettings={() => setIsSettingsOpen(true)} 
        openCommandPalette={() => setIsCommandPaletteOpen(true)}
        recentProjects={recentProjects}
        openRecentProject={openRecentProject}
        clearRecentProjects={clearRecentProjects}
        autoSaveEnabled={autoSaveEnabled}
        setAutoSaveEnabled={setAutoSaveEnabled}
        revertToLastSaved={revertToLastSaved}
        onToggleSplit={toggleSplitEditor}
        isSplitHorizontal={isSplitHorizontal}
        onToggleFocusMode={toggleFocusMode}
        isFocusMode={isFocusMode}
      />

      {showGlobalSearch && <GlobalSearchPanel language={language} globalSearchQuery={globalSearchQuery} executeGlobalSearch={executeGlobalSearch} setShowGlobalSearch={setShowGlobalSearch} globalSearchResults={globalSearchResults} onResultClick={handleGlobalResultClick} />}
      
      <div className="layout">
        {showSidebar && !isFocusMode && (
          <Sidebar language={language} projectPath={projectPath} projectTree={projectTree} expandedPaths={expandedPaths} activePath={activePath} handleNodeClick={handleNodeClick} handleContextMenu={handleContextMenu} openCreationDialogTop={openCreationDialogTop} contextMenu={contextMenu} openCreationDialogContext={openCreationDialogContext} openRenameDialogContext={openRenameDialogContext} handleDeleteItem={handleDeleteItem} handleMoveNode={handleMoveNode} />
        )}
        <main className="main" style={{ width: "100%", height: "100%" }}>
          <PanelGroup direction="vertical">
            <Panel minSize={20} style={{ display: "flex" }}>
              {projectPath || tabs.length > 0 ? (
                hasHtmlFile && showPreview && !isFocusMode ? (
                  <PanelGroup direction="horizontal">
                    <Panel defaultSize={50} minSize={20} className="panel">{editorLayout}</Panel>
                    <PanelResizeHandle className="resize-handle"><GripVertical size={14} /></PanelResizeHandle>
                    <Panel defaultSize={50} minSize={20} className="panel">
                      <div className="panel-header"><div className="tab active"><Layout size={13} /><span>{t("preview.title", language)}</span></div></div>
                      <div className="panel-content preview-bg"><Preview code={previewCode} /></div>
                    </Panel>
                  </PanelGroup>
                ) : <div className="panel" style={{ width: "100%", height: "100%" }}>{editorLayout}</div>
              ) : <div className="panel" style={{ width: "100%", height: "100%" }}>{editorLayout}</div>}
            </Panel>

            {isTerminalOpen && !isFocusMode && (
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
        cursorInfo={cursorInfo}
        isSplitHorizontal={isSplitHorizontal}
        onToggleSplit={toggleSplitEditor}
        isFocusMode={isFocusMode}
        onToggleFocusMode={toggleFocusMode}
        dirtyCount={dirtyFiles.size}
        errors={0}
        warnings={0}
        onFormat={formatDocument}
        language={language}
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

      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        language={language}
        onOpenFile={openFile}
        onOpenFolder={openFolder}
        onSaveFile={() => { saveFile(); }}
        onRevertToSaved={revertToLastSaved}
        onToggleAutoSave={() => setAutoSaveEnabled(!autoSaveEnabled)}
        autoSaveEnabled={autoSaveEnabled}
        onFormatDocument={formatDocument}
        onZoomIn={() => setFontSize(s => Math.min(s + 1, 36))}
        onZoomOut={() => setFontSize(s => Math.max(s - 1, 9))}
        onResetZoom={() => setFontSize(14)}
        onToggleSidebar={() => setShowSidebar(prev => !prev)}
        onToggleTerminal={() => setIsTerminalOpen(prev => !prev)}
        onTogglePreview={() => setShowPreview(prev => !prev)}
        onToggleSplit={toggleSplitEditor}
        isSplitHorizontal={isSplitHorizontal}
        onToggleFocusMode={toggleFocusMode}
        isFocusMode={isFocusMode}
        onFindInFile={() => { setShowLocalSearch(true); setShowGlobalSearch(false); }}
        onFindInFiles={() => { setShowGlobalSearch(true); setShowLocalSearch(false); }}
        onToggleTheme={toggleTheme}
        currentTheme={theme}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onReportCrash={() => setCrashError(new Error("Zgłoszenie użytkownika z Palety Poleceń"))}
        onNewFile={() => openCreationDialogTop("file")}
        onNewFolder={() => openCreationDialogTop("folder")}
        onCloseActiveTab={() => activePath && closeTab(activePath)}
        onCloseAllTabs={() => { setTabs([]); setActivePath(null); }}
        tabs={tabs}
        activePath={activePath}
        onSelectTab={(path) => setActivePath(path)}
      />
    </div>
  );
}
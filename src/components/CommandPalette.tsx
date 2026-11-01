import React, { useState, useEffect, useRef, useMemo } from "react";
import { 
  Command, Search, File, FolderOpen, Save, RotateCcw, CheckCheck, 
  ZoomIn, ZoomOut, Maximize2, Sidebar, Terminal, LayoutTemplate, 
  Sun, Moon, Settings, Bug, Plus, FolderPlus, X, FileCode2
} from "lucide-react";
import { type Language } from "../i18n";

export interface CommandItem {
  id: string;
  category: "file" | "edit" | "view" | "preferences" | "tools";
  categoryLabel: string;
  title: string;
  description?: string;
  icon: React.ReactNode;
  shortcut?: string[];
  action: () => void;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  onOpenFile: () => void;
  onOpenFolder: () => void;
  onSaveFile: () => void;
  onRevertToSaved?: () => void;
  onToggleAutoSave?: () => void;
  autoSaveEnabled?: boolean;
  onFormatDocument: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onToggleSidebar: () => void;
  onToggleTerminal: () => void;
  onTogglePreview: () => void;
  onFindInFile: () => void;
  onFindInFiles: () => void;
  onToggleTheme: () => void;
  currentTheme: string;
  onOpenSettings: () => void;
  onReportCrash: () => void;
  onNewFile?: () => void;
  onNewFolder?: () => void;
  onCloseActiveTab?: () => void;
  onCloseAllTabs?: () => void;
  tabs?: string[];
  activePath?: string | null;
  onSelectTab?: (path: string) => void;
}

export default function CommandPalette({
  isOpen,
  onClose,
  language,
  onOpenFile,
  onOpenFolder,
  onSaveFile,
  onRevertToSaved,
  onToggleAutoSave,
  autoSaveEnabled,
  onFormatDocument,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onToggleSidebar,
  onToggleTerminal,
  onTogglePreview,
  onFindInFile,
  onFindInFiles,
  onToggleTheme,
  currentTheme,
  onOpenSettings,
  onReportCrash,
  onNewFile,
  onNewFolder,
  onCloseActiveTab,
  onCloseAllTabs,
  tabs = [],
  onSelectTab
}: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const isPl = language === "pl";

  const allCommands = useMemo<CommandItem[]>(() => {
    const list: CommandItem[] = [
      // Kategoria: Plik (File)
      {
        id: "save-file",
        category: "file",
        categoryLabel: isPl ? "Plik" : "File",
        title: isPl ? "Zapisz plik" : "Save File",
        description: isPl ? "Zapisuje bieżący plik na dysku" : "Save active file to disk",
        icon: <Save size={15} />,
        shortcut: ["Ctrl", "S"],
        action: onSaveFile,
      },
      {
        id: "revert-saved",
        category: "file",
        categoryLabel: isPl ? "Plik" : "File",
        title: isPl ? "Przywróć do zapisanego (Revert)" : "Revert to Saved",
        description: isPl ? "Cofa niezapisane zmiany do ostatniej wersji z dysku" : "Discard unsaved changes and reload from disk",
        icon: <RotateCcw size={15} />,
        action: () => onRevertToSaved?.(),
      },
      {
        id: "toggle-autosave",
        category: "file",
        categoryLabel: isPl ? "Plik" : "File",
        title: isPl ? `Autozapis: ${autoSaveEnabled ? "Wyłącz" : "Włącz"}` : `Auto-Save: ${autoSaveEnabled ? "Turn Off" : "Turn On"}`,
        description: isPl ? "Automatyczny bezpieczny zapis z zachowaniem Ctrl+Z" : "Automatic debounced saving without resetting undo stack",
        icon: <Save size={15} />,
        action: () => onToggleAutoSave?.(),
      },
      {
        id: "open-file",
        category: "file",
        categoryLabel: isPl ? "Plik" : "File",
        title: isPl ? "Otwórz plik..." : "Open File...",
        description: isPl ? "Otwiera plik z dysku komputera" : "Open an existing file from disk",
        icon: <File size={15} />,
        shortcut: ["Ctrl", "O"],
        action: onOpenFile,
      },
      {
        id: "open-folder",
        category: "file",
        categoryLabel: isPl ? "Plik" : "File",
        title: isPl ? "Otwórz folder projektu..." : "Open Folder...",
        description: isPl ? "Wczytuje katalog projektu do drzewa bocznego" : "Open a project directory into workspace tree",
        icon: <FolderOpen size={15} />,
        shortcut: ["Ctrl", "K", "Ctrl", "O"],
        action: onOpenFolder,
      },
      {
        id: "new-file",
        category: "file",
        categoryLabel: isPl ? "Plik" : "File",
        title: isPl ? "Nowy plik..." : "New File...",
        description: isPl ? "Tworzy nowy pusty plik" : "Create a new file in workspace",
        icon: <Plus size={15} />,
        action: () => onNewFile?.(),
      },
      {
        id: "new-folder",
        category: "file",
        categoryLabel: isPl ? "Plik" : "File",
        title: isPl ? "Nowy folder..." : "New Folder...",
        description: isPl ? "Tworzy nowy podkatalog" : "Create a new folder in workspace",
        icon: <FolderPlus size={15} />,
        action: () => onNewFolder?.(),
      },
      {
        id: "close-active-tab",
        category: "file",
        categoryLabel: isPl ? "Plik" : "File",
        title: isPl ? "Zamknij aktywną kartę" : "Close Active Tab",
        description: isPl ? "Zamyka aktualnie edytowany plik" : "Close the currently active editor tab",
        icon: <X size={15} />,
        shortcut: ["Ctrl", "W"],
        action: () => onCloseActiveTab?.(),
      },
      {
        id: "close-all-tabs",
        category: "file",
        categoryLabel: isPl ? "Plik" : "File",
        title: isPl ? "Zamknij wszystkie karty" : "Close All Tabs",
        description: isPl ? "Zamyka wszystkie otwarte pliki" : "Close all open editor tabs",
        icon: <X size={15} />,
        action: () => onCloseAllTabs?.(),
      },

      // Kategoria: Edycja & Kod (Edit)
      {
        id: "format-document",
        category: "edit",
        categoryLabel: isPl ? "Edycja" : "Edit",
        title: isPl ? "Formatuj dokument (Prettier)" : "Format Document (Prettier)",
        description: isPl ? "Wyrównuje wcięcia, cudzysłowy i strukturę kodu" : "Format code with syntax parser and indentation",
        icon: <CheckCheck size={15} />,
        shortcut: ["Shift", "Alt", "F"],
        action: onFormatDocument,
      },
      {
        id: "find-in-file",
        category: "edit",
        categoryLabel: isPl ? "Edycja" : "Edit",
        title: isPl ? "Znajdź w pliku..." : "Find in File...",
        description: isPl ? "Wyszukiwanie i zamiana w aktywnym dokumencie" : "Search and replace in the current document",
        icon: <Search size={15} />,
        shortcut: ["Ctrl", "F"],
        action: onFindInFile,
      },
      {
        id: "find-in-files",
        category: "edit",
        categoryLabel: isPl ? "Edycja" : "Edit",
        title: isPl ? "Szukaj w projekcie (Global Search)..." : "Find in Project (Global Search)...",
        description: isPl ? "Wyszukaj frazę we wszystkich plikach projektu" : "Search across all workspace files",
        icon: <Search size={15} />,
        shortcut: ["Ctrl", "Shift", "F"],
        action: onFindInFiles,
      },
      {
        id: "zoom-in",
        category: "edit",
        categoryLabel: isPl ? "Edycja" : "Edit",
        title: isPl ? "Powiększ czcionkę (Zoom In)" : "Zoom In (Font Size)",
        description: isPl ? "Zwiększa rozmiar tekstu o 1px" : "Increase editor font size by 1px",
        icon: <ZoomIn size={15} />,
        shortcut: ["Ctrl", "+"],
        action: onZoomIn,
      },
      {
        id: "zoom-out",
        category: "edit",
        categoryLabel: isPl ? "Edycja" : "Edit",
        title: isPl ? "Pomniejsz czcionkę (Zoom Out)" : "Zoom Out (Font Size)",
        description: isPl ? "Zmniejsza rozmiar tekstu o 1px" : "Decrease editor font size by 1px",
        icon: <ZoomOut size={15} />,
        shortcut: ["Ctrl", "-"],
        action: onZoomOut,
      },
      {
        id: "reset-zoom",
        category: "edit",
        categoryLabel: isPl ? "Edycja" : "Edit",
        title: isPl ? "Zresetuj rozmiar czcionki" : "Reset Zoom",
        description: isPl ? "Przywraca domyślny rozmiar 14px" : "Reset font size back to default 14px",
        icon: <Maximize2 size={15} />,
        shortcut: ["Ctrl", "0"],
        action: onResetZoom,
      },

      // Kategoria: Widok (View)
      {
        id: "toggle-sidebar",
        category: "view",
        categoryLabel: isPl ? "Widok" : "View",
        title: isPl ? "Przełącz pasek boczny (Eksplorator)" : "Toggle Sidebar (Explorer)",
        description: isPl ? "Pokaż lub ukryj drzewo plików projektu" : "Show or hide file tree explorer",
        icon: <Sidebar size={15} />,
        shortcut: ["Ctrl", "B"],
        action: onToggleSidebar,
      },
      {
        id: "toggle-terminal",
        category: "view",
        categoryLabel: isPl ? "Widok" : "View",
        title: isPl ? "Przełącz Terminal" : "Toggle Terminal",
        description: isPl ? "Otwiera lub zamyka wbudowany wiersz poleceń" : "Open or close embedded shell terminal",
        icon: <Terminal size={15} />,
        shortcut: ["Ctrl", "`"],
        action: onToggleTerminal,
      },
      {
        id: "toggle-preview",
        category: "view",
        categoryLabel: isPl ? "Widok" : "View",
        title: isPl ? "Przełącz podgląd na żywo" : "Toggle Live Preview",
        description: isPl ? "Pokaż lub ukryj okno podglądu HTML/CSS" : "Show or hide HTML/CSS live rendering frame",
        icon: <LayoutTemplate size={15} />,
        action: onTogglePreview,
      },

      // Kategoria: Preferencje & Narzędzia (Preferences)
      {
        id: "toggle-theme",
        category: "preferences",
        categoryLabel: isPl ? "Preferencje" : "Preferences",
        title: currentTheme === "light" 
          ? (isPl ? "Przełącz na ciemny motyw" : "Switch to Dark Theme") 
          : (isPl ? "Przełącz na jasny motyw" : "Switch to Light Theme"),
        description: isPl ? "Zmienia schemat kolorów aplikacji i edytora" : "Toggle between high-contrast dark and light themes",
        icon: currentTheme === "light" ? <Moon size={15} /> : <Sun size={15} />,
        action: onToggleTheme,
      },
      {
        id: "open-settings",
        category: "preferences",
        categoryLabel: isPl ? "Preferencje" : "Preferences",
        title: isPl ? "Otwórz Ustawienia..." : "Open Settings...",
        description: isPl ? "Dostosuj czcionki, motywy, język i wtyczki" : "Configure fonts, themes, language and extensions",
        icon: <Settings size={15} />,
        action: onOpenSettings,
      },
      {
        id: "report-crash",
        category: "tools",
        categoryLabel: isPl ? "Narzędzia" : "Tools",
        title: isPl ? "Zgłoś błąd / Raport awarii" : "Report Bug / Crash Report",
        description: isPl ? "Zgłoś problem techniczny lub sugestię" : "Submit diagnostics, crash log or feedback",
        icon: <Bug size={15} />,
        action: onReportCrash,
      }
    ];

    // Dodaj otwarte pliki jako szybkie przejścia
    if (tabs.length > 0) {
      tabs.forEach((tabPath) => {
        const fileName = tabPath.split(/[\\/]/).pop() || tabPath;
        list.push({
          id: `tab-${tabPath}`,
          category: "file",
          categoryLabel: isPl ? "Otwarte Pliki" : "Open Files",
          title: `${isPl ? "Przejdź do pliku" : "Switch to file"}: ${fileName}`,
          description: tabPath,
          icon: <FileCode2 size={15} />,
          action: () => {
            onSelectTab?.(tabPath);
          }
        });
      });
    }

    return list;
  }, [
    isPl, onSaveFile, onRevertToSaved, autoSaveEnabled, onToggleAutoSave, 
    onOpenFile, onOpenFolder, onNewFile, onNewFolder, onCloseActiveTab, 
    onCloseAllTabs, onFormatDocument, onFindInFile, onFindInFiles, onZoomIn, 
    onZoomOut, onResetZoom, onToggleSidebar, onToggleTerminal, onTogglePreview, 
    currentTheme, onToggleTheme, onOpenSettings, onReportCrash, tabs, onSelectTab
  ]);

  // Filtrowanie poleceń wg wpisanej frazy
  const filteredCommands = useMemo(() => {
    let cleanQuery = query.trim().toLowerCase();
    if (cleanQuery.startsWith(">")) {
      cleanQuery = cleanQuery.slice(1).trim();
    }
    if (!cleanQuery) return allCommands;

    return allCommands.filter((cmd) => {
      const matchTitle = cmd.title.toLowerCase().includes(cleanQuery);
      const matchDesc = cmd.description ? cmd.description.toLowerCase().includes(cleanQuery) : false;
      const matchCat = cmd.categoryLabel.toLowerCase().includes(cleanQuery);
      return matchTitle || matchDesc || matchCat;
    });
  }, [query, allCommands]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredCommands]);

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Płynne przewijanie do zaznaczonego elementu
  useEffect(() => {
    if (listRef.current) {
      const activeElem = listRef.current.querySelector<HTMLElement>(".command-palette-item.active");
      if (activeElem) {
        activeElem.scrollIntoView({ block: "nearest" });
      }
    }
  }, [selectedIndex]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (filteredCommands.length || 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % (filteredCommands.length || 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const current = filteredCommands[selectedIndex];
      if (current) {
        onClose();
        current.action();
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="command-palette-overlay" onClick={onClose}>
      <div 
        className="command-palette-container" 
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <div className="command-palette-input-wrapper">
          <Command size={18} className="command-palette-icon" />
          <input
            ref={inputRef}
            type="text"
            className="command-palette-input"
            placeholder={isPl ? "Wpisz polecenie lub szukaj akcji... (np. motyw, zapisz, formatuj)" : "Type a command or search action... (e.g. theme, save, format)"}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            spellCheck={false}
          />
          {query.length > 0 && (
            <button 
              className="command-palette-clear-btn" 
              onClick={() => { setQuery(""); inputRef.current?.focus(); }}
              title={isPl ? "Wyczyść" : "Clear"}
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="command-palette-list" ref={listRef}>
          {filteredCommands.length === 0 ? (
            <div className="command-palette-empty">
              {isPl ? "Nie znaleziono pasujących poleceń." : "No matching commands found."}
            </div>
          ) : (
            filteredCommands.map((cmd, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={cmd.id}
                  className={`command-palette-item ${isSelected ? "active" : ""}`}
                  onClick={() => {
                    onClose();
                    cmd.action();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                >
                  <div className="command-palette-item-left">
                    <span className="command-palette-item-icon">{cmd.icon}</span>
                    <div className="command-palette-item-content">
                      <span className="command-palette-item-title">{cmd.title}</span>
                      {cmd.description && (
                        <span className="command-palette-item-desc">{cmd.description}</span>
                      )}
                    </div>
                  </div>

                  {cmd.shortcut && cmd.shortcut.length > 0 && (
                    <div className="command-palette-shortcut">
                      {cmd.shortcut.map((key, kIdx) => (
                        <kbd key={kIdx}>{key}</kbd>
                      ))}
                    </div>
                  )}
                </button>
              );
            })
          )}
        </div>

        <div className="command-palette-footer">
          <div className="command-palette-hints">
            <span className="command-palette-hint"><kbd>↑</kbd><kbd>↓</kbd> {isPl ? "nawigacja" : "navigate"}</span>
            <span className="command-palette-hint"><kbd>↵</kbd> {isPl ? "uruchom" : "run"}</span>
            <span className="command-palette-hint"><kbd>esc</kbd> {isPl ? "zamknij" : "close"}</span>
          </div>
          <span style={{ opacity: 0.7 }}>Quasar Studio</span>
        </div>
      </div>
    </div>
  );
}

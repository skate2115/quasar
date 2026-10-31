import { useRef, useEffect } from "react";
import { X } from "lucide-react";
import detectLang from "../utils/detectLang";

type TabsBarProps = {
  tabs: string[];
  activePath: string | null;
  draggedTab: string | null;
  dirtyFiles: Set<string>;
  setDraggedTab: (path: string | null) => void;
  setActivePath: (path: string | null) => void;
  closeTab: (path: string) => void;
  handleTabReorder: (path: string) => void;
};

export default function TabsBar({
  tabs,
  activePath,
  draggedTab,
  dirtyFiles,
  setDraggedTab,
  setActivePath,
  closeTab,
  handleTabReorder,
}: TabsBarProps) {
  const lastSwapTime = useRef<number>(0);

  // Gwarantuje, że niezależnie od tego, gdzie puścisz myszkę w oknie aplikacji,
  // zakładka zostanie "upuszczona".
  useEffect(() => {
    const handleMouseUp = () => setDraggedTab(null);
    window.addEventListener("mouseup", handleMouseUp);
    return () => window.removeEventListener("mouseup", handleMouseUp);
  }, [setDraggedTab]);

  const onTabEnter = (tabPath: string) => {
    if (!draggedTab || draggedTab === tabPath) return;

    const now = Date.now();
    if (now - lastSwapTime.current < 150) return;
    
    lastSwapTime.current = now;
    handleTabReorder(tabPath);
  };

  return (
    <div className="tabs-bar" style={{ userSelect: "none" }}>
      {tabs.map((tabPath) => {
        const tabName = tabPath.split(/[\\/]/).pop()!;
        const meta = detectLang(tabName);
        const isTabActive = activePath === tabPath;
        const isDirty = dirtyFiles.has(tabPath);
        const isDragging = draggedTab === tabPath;

        return (
          <div
            key={tabPath}
            className={`tab-item ${isTabActive ? "active" : ""} ${isDragging ? "dragging" : ""}`}
            onMouseDown={(e) => {
              if (e.button === 0) {
                setDraggedTab(tabPath);
                setActivePath(tabPath);
              } else if (e.button === 1) {
                e.preventDefault();
                closeTab(tabPath);
              }
            }}
            onMouseEnter={() => onTabEnter(tabPath)}
            // KLUCZOWY FIX: Blokujemy przeglądarkę przed kradzieżą zdarzenia myszy
            onDragStart={(e) => e.preventDefault()} 
            title={tabPath}
          >
            <meta.icon size={13} className={meta.color} />
            <span>{tabName}</span>
            {isDirty && <span className="dirty-indicator" title="Unsaved changes" />}
            <button
              className="tab-close-btn"
              onClick={(e) => {
                e.stopPropagation();
                closeTab(tabPath);
              }}
            >
              <X size={12} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
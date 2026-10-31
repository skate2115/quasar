import { useState, useCallback } from "react";
import { ask } from "@tauri-apps/plugin-dialog";
import { writeTextFile } from "@tauri-apps/plugin-fs";

export function useTabs() {
  const [tabs, setTabs] = useState<string[]>([]);
  const [openFiles, setOpenFiles] = useState<Record<string, string>>({});
  const [activePath, setActivePath] = useState<string | null>(null);
  const [dirtyFiles, setDirtyFiles] = useState<Set<string>>(new Set());
  const [draggedTab, setDraggedTab] = useState<string | null>(null);

  const openFileInTab = useCallback((filePath: string, content: string) => {
    setOpenFiles(prev => ({ ...prev, [filePath]: content }));
    setTabs(prev => prev.includes(filePath) ? prev : [...prev, filePath]);
    setActivePath(filePath);
  }, []);

  const closeTab = useCallback(async (pathToRemove: string, force = false) => {
    if (!force && dirtyFiles.has(pathToRemove)) {
      const fileName = pathToRemove.split(/[\\/]/).pop();
      const confirmed = await ask(
        `You have unsaved changes in "${fileName}". Are you sure you want to close it without saving?`, 
        { title: "Unsaved Changes", kind: "warning" }
      );
      if (!confirmed) return false;
    }

    setTabs(prevTabs => {
      const activeIdx = prevTabs.indexOf(pathToRemove);
      const newTabs = prevTabs.filter(t => t !== pathToRemove);
      
      setActivePath(currentActive => {
        if (currentActive === pathToRemove) {
          if (newTabs.length > 0) return newTabs[Math.max(0, activeIdx - 1)];
          return null;
        }
        return currentActive;
      });
      return newTabs;
    });

    setOpenFiles(prev => { const next = { ...prev }; delete next[pathToRemove]; return next; });
    setDirtyFiles(prev => { const next = new Set(prev); next.delete(pathToRemove); return next; });
    return true;
  }, [dirtyFiles]);

  const saveFile = useCallback(async () => {
    if (activePath && openFiles[activePath] !== undefined) {
      await writeTextFile(activePath, openFiles[activePath]);
      setDirtyFiles(prev => { const next = new Set(prev); next.delete(activePath); return next; });
    }
  }, [activePath, openFiles]);

  const handleEditorChange = useCallback((value: string) => {
    if (!activePath) return;
    setOpenFiles(prev => ({ ...prev, [activePath]: value }));
    setDirtyFiles(prev => new Set(prev).add(activePath));
  }, [activePath]);

  const handleTabReorder = useCallback((targetTabPath: string) => {
    if (!draggedTab || draggedTab === targetTabPath) return;
    setTabs((prev) => {
      const draggedIdx = prev.indexOf(draggedTab);
      const targetIdx = prev.indexOf(targetTabPath);
      if (draggedIdx === -1 || targetIdx === -1 || draggedIdx === targetIdx) return prev;
      const newTabs = [...prev];
      newTabs.splice(draggedIdx, 1);
      newTabs.splice(targetIdx, 0, draggedTab);
      return newTabs;
    });
  }, [draggedTab]);

  return {
    tabs, setTabs,
    openFiles, setOpenFiles,
    activePath, setActivePath,
    dirtyFiles, setDirtyFiles,
    draggedTab, setDraggedTab,
    openFileInTab, closeTab, saveFile, handleEditorChange, handleTabReorder
  };
}

export type TabsState = ReturnType<typeof useTabs>;
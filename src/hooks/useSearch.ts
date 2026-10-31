import { useState, useRef, useEffect } from "react";
import { readDir, readTextFile } from "@tauri-apps/plugin-fs";
import { join } from "@tauri-apps/api/path";
import { SearchResult } from "../types";
import { TabsState } from "./useTabs";

export function useSearch(projectPath: string | null, tabsState: TabsState) {
  const [showGlobalSearch, setShowGlobalSearch] = useState(false);
  const [globalSearchQuery, setGlobalSearchQuery] = useState("");
  const [globalSearchResults, setGlobalSearchResults] = useState<SearchResult[]>([]);

  const [showLocalSearch, setShowLocalSearch] = useState(false);
  const [showReplace, setShowReplace] = useState(false);
  const [localSearchQuery, setLocalSearchQuery] = useState("");
  const [replaceQuery, setReplaceQuery] = useState("");
  const localSearchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showLocalSearch && localSearchInputRef.current) {
      localSearchInputRef.current.focus();
      localSearchInputRef.current.select();
    }
  }, [showLocalSearch]);

  const executeGlobalSearch = async (query: string) => {
    setGlobalSearchQuery(query);
    if (!projectPath || !query.trim()) return setGlobalSearchResults([]);
    const results: SearchResult[] = [];
    const allowedExts = ["html", "css", "js", "jsx", "ts", "tsx", "json", "md", "py", "rs", "txt", "env", "yml", "yaml", "cpp", "c", "java", "php", "go"];

    const searchDir = async (dirPath: string) => {
      for (const entry of await readDir(dirPath)) {
        if (entry.name.startsWith(".")) continue;
        const fullPath = await join(dirPath, entry.name);
        if (entry.isDirectory) await searchDir(fullPath);
        else if (allowedExts.includes(entry.name.split(".").pop()?.toLowerCase() || "")) {
          try {
            const lines = (await readTextFile(fullPath)).split(/\r?\n/);
            lines.forEach((line, idx) => {
              if (line.toLowerCase().includes(query.toLowerCase())) results.push({ path: fullPath, name: entry.name, line: idx + 1, text: line.trim() });
            });
          } catch (_) {}
        }
      }
    };
    try { await searchDir(projectPath); setGlobalSearchResults(results); } catch (err) {}
  };

  const handleGlobalResultClick = async (path: string) => {
    if (tabsState.openFiles[path] === undefined) {
      const content = await readTextFile(path);
      tabsState.setOpenFiles(prev => ({ ...prev, [path]: content }));
    }
    tabsState.setTabs(prev => prev.includes(path) ? prev : [...prev, path]);
    tabsState.setActivePath(path);
  };

  const handleReplace = () => {
    if (!tabsState.activePath || !localSearchQuery || tabsState.openFiles[tabsState.activePath] === undefined) return;
    
    const path = tabsState.activePath;
    const currentContent = tabsState.openFiles[path];
    
    // Zabezpieczamy query przed znakami specjalnymi (np. jeśli szukasz słowa z kropką albo nawiasem)
    const escapeRegExp = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    // Tworzymy Regex z flagą 'i' (case-insensitive), żeby ignorował wielkość liter jak Monaco
    const regex = new RegExp(escapeRegExp(localSearchQuery), 'i');
    
    const newContent = currentContent.replace(regex, replaceQuery);

    // Jeśli zaszła zmiana, delegujemy ją do naturalnego systemu edycji
    if (newContent !== currentContent) {
      tabsState.handleEditorChange(newContent);
    }
  };

  const handleReplaceAll = () => {
    if (!tabsState.activePath || !localSearchQuery || tabsState.openFiles[tabsState.activePath] === undefined) return;
    
    const path = tabsState.activePath;
    const currentContent = tabsState.openFiles[path];
    
    const escapeRegExp = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    // Flaga 'g' (global - podmień wszystkie) i 'i' (case-insensitive)
    const regex = new RegExp(escapeRegExp(localSearchQuery), 'gi');
    
    const newContent = currentContent.replace(regex, replaceQuery);

    if (newContent !== currentContent) {
      tabsState.handleEditorChange(newContent);
    }
  };

  return {
    showGlobalSearch, setShowGlobalSearch, globalSearchQuery, globalSearchResults,
    showLocalSearch, setShowLocalSearch, showReplace, setShowReplace,
    localSearchQuery, setLocalSearchQuery, replaceQuery, setReplaceQuery, localSearchInputRef,
    executeGlobalSearch, handleGlobalResultClick, handleReplace, handleReplaceAll
  };
}
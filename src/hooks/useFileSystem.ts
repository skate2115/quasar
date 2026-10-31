import { useState, useCallback, useEffect } from "react";
import { readDir, readTextFile, writeTextFile, mkdir, watch, remove, rename } from "@tauri-apps/plugin-fs";
import { join } from "@tauri-apps/api/path";
import { ask, open } from "@tauri-apps/plugin-dialog";
import { FileNode } from "../types";
import { TabsState } from "./useTabs";

export function useFileSystem(tabsState: TabsState) {
  const [projectPath, setProjectPath] = useState<string | null>(null);
  const [projectTree, setProjectTree] = useState<FileNode[]>([]);
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; visible: boolean; targetPath: string; node: FileNode | null; } | null>(null);
  const [dialog, setDialog] = useState<{ visible: boolean; type: "file" | "folder" | "rename"; parentPath: string; } | null>(null);
  const [newItemName, setNewItemName] = useState("");

  // Zamiast polegać na całym obiekcie, używamy tylko stabilnej funkcji openFileInTab
  const { openFileInTab } = tabsState;

  const handleOpenFileSuccess = useCallback((filePath: string, content: string) => {
    openFileInTab(filePath, content);
    if (!projectPath) {
      setProjectTree([{ name: filePath.split(/[\\/]/).pop()!, path: filePath, isDirectory: false }]);
    }
  }, [projectPath, openFileInTab]);

  const loadDirectory = useCallback(async (dirPath: string): Promise<FileNode[]> => {
    const entries = await readDir(dirPath);
    const ignoredFolders = new Set(["node_modules", ".git", "dist", "build", ".next", "target"]);
    const promises = entries.map(async (entry) => {
      if (entry.name.startsWith(".") && !['.env', '.gitignore'].includes(entry.name)) return null;
      if (ignoredFolders.has(entry.name)) return null;
      const fullPath = await join(dirPath, entry.name);
      return {
        name: entry.name, path: fullPath, isDirectory: entry.isDirectory,
        children: entry.isDirectory ? await loadDirectory(fullPath) : undefined
      } as FileNode;
    });
    const nodes = (await Promise.all(promises)).filter(Boolean) as FileNode[];
    return nodes.sort((a, b) => a.isDirectory === b.isDirectory ? a.name.localeCompare(b.name) : (a.isDirectory ? -1 : 1));
  }, []);

  const refreshTree = useCallback(async () => {
    if (projectPath) setProjectTree(await loadDirectory(projectPath));
  }, [projectPath, loadDirectory]);

  useEffect(() => { if (projectPath) refreshTree(); }, [projectPath, refreshTree]);

  useEffect(() => {
    if (!projectPath) return;
    let timeoutId: NodeJS.Timeout;
    const unwatch = watch(projectPath, () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => refreshTree(), 50);
    }, { recursive: true });
    return () => { clearTimeout(timeoutId); unwatch.then(fn => fn()); };
  }, [projectPath, refreshTree]);

  const handleMoveNode = async (sourcePath: string, targetDirPath: string) => {
    try {
      const sourceName = sourcePath.split(/[\\/]/).pop();
      if (!sourceName || targetDirPath.startsWith(sourcePath)) return;
      const newPath = await join(targetDirPath, sourceName);
      if (sourcePath === newPath) return;

      await rename(sourcePath, newPath);
      const updatePath = (p: string) => p === sourcePath ? newPath : p.startsWith(sourcePath + "/") || p.startsWith(sourcePath + "\\") ? p.replace(sourcePath, newPath) : p;

      tabsState.setTabs(prev => prev.map(updatePath));
      tabsState.setOpenFiles(prev => {
        const next: Record<string, string> = {};
        Object.entries(prev).forEach(([k, v]) => next[updatePath(k)] = v);
        return next;
      });
      tabsState.setDirtyFiles(prev => {
        const next = new Set<string>();
        prev.forEach(p => next.add(updatePath(p)));
        return next;
      });
      tabsState.setActivePath(prev => prev ? updatePath(prev) : null);
      setExpandedPaths(prev => new Set(prev).add(targetDirPath));
      await refreshTree();
    } catch (err) { console.error("Move error:", err); }
  };

  const handleNodeClick = async (node: FileNode) => {
    if (node.isDirectory) {
      setExpandedPaths(prev => { const next = new Set(prev); next.has(node.path) ? next.delete(node.path) : next.add(node.path); return next; });
    } else {
      if (tabsState.openFiles[node.path] === undefined) tabsState.setOpenFiles(prev => ({ ...prev, [node.path]: "" }));
      const content = tabsState.openFiles[node.path] ?? await readTextFile(node.path);
      tabsState.openFileInTab(node.path, content);
    }
  };

  const handleContextMenu = (e: React.MouseEvent, node: FileNode | null) => {
    e.preventDefault(); e.stopPropagation();
    if (!projectPath) return;
    let targetPath = projectPath;
    if (node) targetPath = node.isDirectory ? node.path : node.path.substring(0, Math.max(node.path.lastIndexOf("/"), node.path.lastIndexOf("\\")));
    setContextMenu({ x: e.clientX, y: e.clientY, visible: true, targetPath, node });
  };

  const handleModalSubmit = async () => {
    if (!dialog || !newItemName.trim()) return;
    try {
      if (dialog.type === "rename") {
        const oldPath = dialog.parentPath;
        const newPath = await join(oldPath, "..", newItemName.trim());
        if (oldPath !== newPath) {
          await rename(oldPath, newPath);
          const updatePath = (p: string) => p === oldPath ? newPath : p.startsWith(oldPath + "/") || p.startsWith(oldPath + "\\") ? p.replace(oldPath, newPath) : p;
          tabsState.setTabs(prev => prev.map(updatePath));
          tabsState.setOpenFiles(prev => {
            const next: Record<string, string> = {};
            Object.entries(prev).forEach(([k, v]) => next[updatePath(k)] = v);
            return next;
          });
          tabsState.setDirtyFiles(prev => {
            const next = new Set<string>();
            prev.forEach(p => next.add(updatePath(p)));
            return next;
          });
          tabsState.setActivePath(prev => prev ? updatePath(prev) : null);
          setExpandedPaths(prev => new Set(prev).add(updatePath(oldPath)));
        }
      } else {
        const fullPath = await join(dialog.parentPath, newItemName.trim());
        if (dialog.type === "file") { await writeTextFile(fullPath, ""); handleOpenFileSuccess(fullPath, ""); }
        else await mkdir(fullPath);
        setExpandedPaths(prev => new Set(prev).add(dialog.parentPath));
      }
      setDialog(null); await refreshTree();
    } catch (err) { console.error(err); }
  };

  const handleDeleteItem = async () => {
    if (!contextMenu?.node) return;
    const nodeToDelete = contextMenu.node; setContextMenu(null);
    if (await ask(`Are you sure you want to delete "${nodeToDelete.name}"?`, { title: "Confirm", kind: "warning" })) {
      try {
        if (nodeToDelete.isDirectory) {
          await remove(nodeToDelete.path, { recursive: true });
          tabsState.tabs.forEach(t => { if (t.startsWith(nodeToDelete.path + "/") || t.startsWith(nodeToDelete.path + "\\")) tabsState.closeTab(t, true); });
        } else {
          await remove(nodeToDelete.path);
          tabsState.closeTab(nodeToDelete.path, true);
        }
        await refreshTree();
      } catch (err) {}
    }
  };

  const openFolder = async () => {
    const selected = await open({ directory: true });
    if (selected) { setProjectPath(selected); setExpandedPaths(new Set([selected])); tabsState.setTabs([]); tabsState.setOpenFiles({}); tabsState.setActivePath(null); tabsState.setDirtyFiles(new Set()); }
  };

  const openFile = async () => {
    const selected = await open({ directory: false });
    if (selected) { setProjectPath(null); handleOpenFileSuccess(selected, await readTextFile(selected)); }
  };

  return {
    projectPath, setProjectPath, projectTree, setProjectTree, expandedPaths, setExpandedPaths,
    contextMenu, setContextMenu, dialog, setDialog, newItemName, setNewItemName,
    handleOpenFileSuccess, loadDirectory, refreshTree, handleMoveNode, handleNodeClick,
    handleContextMenu, handleModalSubmit, handleDeleteItem, openFolder, openFile,
    openCreationDialogTop: (type: "file" | "folder") => { if (projectPath) { setDialog({ visible: true, type, parentPath: projectPath }); setNewItemName(""); } },
    openCreationDialogContext: (type: "file" | "folder") => { if (contextMenu) { setDialog({ visible: true, type, parentPath: contextMenu.targetPath }); setNewItemName(""); setContextMenu(null); } },
    openRenameDialogContext: () => { if (contextMenu?.node) { setDialog({ visible: true, type: "rename", parentPath: contextMenu.node.path }); setNewItemName(contextMenu.node.name); setContextMenu(null); } }
  };
}
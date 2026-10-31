import React, { useState, useEffect, useRef } from "react";
import { ChevronRight, ChevronDown, Folder, FilePlus, FolderPlus, Edit2, Trash2 } from "lucide-react";
import detectLang from "../utils/detectLang";
import { useExtensions, CustomPanel } from "../context/ExtensionContext";
import { t, type Language } from "../i18n";

type FileNode = {
  name: string;
  path: string;
  isDirectory: boolean;
  children?: FileNode[];
};

type SidebarProps = {
  language: Language;
  projectPath: string | null;
  projectTree: FileNode[];
  expandedPaths: Set<string>;
  activePath: string | null;
  handleNodeClick: (node: FileNode) => void;
  handleContextMenu: (e: React.MouseEvent, node: FileNode | null) => void;
  openCreationDialogTop: (type: "file" | "folder") => void;
  contextMenu: any;
  openCreationDialogContext: (type: "file" | "folder") => void;
  openRenameDialogContext: () => void;
  handleDeleteItem: () => void;
  handleMoveNode: (sourcePath: string, targetDirPath: string) => void;
};

function PluginPanelWrapper({ panel }: { panel: CustomPanel }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.innerHTML = ""; 
      panel.render(containerRef.current);
    }
  }, [panel]);

  return <div ref={containerRef} className="plugin-container" />;
}

export default function Sidebar({
  language, projectPath, projectTree, expandedPaths, activePath, handleNodeClick, handleContextMenu,
  openCreationDialogTop, contextMenu, openCreationDialogContext, openRenameDialogContext, handleDeleteItem, handleMoveNode
}: SidebarProps) {
  
  const [draggedNode, setDraggedNode] = useState<FileNode | null>(null);
  const [hoveredFolder, setHoveredFolder] = useState<string | null>(null);
  const { customPanels } = useExtensions();

  useEffect(() => {
    const handleMouseUp = () => {
      if (draggedNode && hoveredFolder) {
        handleMoveNode(draggedNode.path, hoveredFolder);
      }
      setDraggedNode(null);
      setHoveredFolder(null);
    };

    if (draggedNode) {
      window.addEventListener("mouseup", handleMouseUp);
    }
    return () => window.removeEventListener("mouseup", handleMouseUp);
  }, [draggedNode, hoveredFolder, handleMoveNode]);

  const renderTree = (nodes: FileNode[], depth = 0) => {
    return nodes.map(node => {
      const isExpanded = expandedPaths.has(node.path);
      const isActive = activePath === node.path;
      const meta = !node.isDirectory ? detectLang(node.name) : null;
      const Icon = node.isDirectory ? Folder : meta!.icon;
      
      const isBeingDragged = draggedNode?.path === node.path;
      const isDragTarget = hoveredFolder === node.path;

      return (
        <div key={node.path} className="tree-node-wrapper">
          <div 
            className={`tree-node ${isActive ? "active" : ""} ${isDragTarget ? "drag-over" : ""} ${isBeingDragged ? "dragging" : ""}`}
            style={{ paddingLeft: `${depth * 12 + 4}px` }}
            onClick={() => handleNodeClick(node)}
            onContextMenu={(e) => handleContextMenu(e, node)}
            onMouseDown={(e) => {
              if (e.button !== 0) return;
              setDraggedNode(node);
            }}
            onMouseOver={(e) => {
              e.stopPropagation();
              if (draggedNode) {
                if (node.isDirectory && node.path !== draggedNode.path) {
                  setHoveredFolder(node.path);
                } else {
                  setHoveredFolder(null); 
                }
              }
            }}
          >
            <div className="tree-arrow">
              {node.isDirectory && (isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />)}
            </div>
            <Icon size={14} className={node.isDirectory ? "folder-color" : meta!.color} />
            <span className="tree-label">{node.name}</span>
          </div>
          {node.isDirectory && isExpanded && node.children && renderTree(node.children, depth + 1)}
        </div>
      );
    });
  };

  return (
    <aside 
      className={`sidebar ${draggedNode ? "is-dragging" : ""}`}
      onContextMenu={(e) => handleContextMenu(e, null)}
    >
      <div className="sidebar-header">
        <span className="section-title">{t("sidebar.explorer", language)}</span>
        <div className="sidebar-actions">
          <button onClick={() => openCreationDialogTop("file")} title={t("sidebar.newFile", language)}><FilePlus size={14} /></button>
          <button onClick={() => openCreationDialogTop("folder")} title={t("sidebar.newFolder", language)}><FolderPlus size={14} /></button>
        </div>
      </div>
      
      <div 
        className="tree-scroll-container"
        onMouseOver={() => {
          if (draggedNode && projectPath && draggedNode.path !== projectPath) {
            setHoveredFolder(projectPath);
          }
        }}
        style={draggedNode && hoveredFolder === projectPath ? { backgroundColor: "rgba(255,255,255,0.03)" } : {}}
      >
        {projectTree.length > 0 ? (
          renderTree(projectTree)
        ) : (
          <div className="empty-project-prompt">
            {projectPath ? t("sidebar.emptyProject", language) : t("sidebar.emptyNoProject", language)}
          </div>
        )}
      </div>

      {customPanels && customPanels.length > 0 && (
        <div className="plugin-panels-section">
          {customPanels.map((panel) => (
            <PluginPanelWrapper key={panel.id} panel={panel} />
          ))}
        </div>
      )}

      {contextMenu?.visible && (
        <div className="context-menu" style={{ top: contextMenu.y, left: contextMenu.x }} onClick={(e) => e.stopPropagation()}>
          <button className="context-item" onClick={() => openCreationDialogContext("file")}>
            <FilePlus size={14} /> {t("menu.newFile", language)}
          </button>
          <button className="context-item" onClick={() => openCreationDialogContext("folder")}>
            <FolderPlus size={14} /> {t("menu.newFolder", language)}
          </button>
          {contextMenu.node && (
            <>
              <div className="context-divider" />
              <button className="context-item" onClick={openRenameDialogContext}>
                <Edit2 size={14} /> {t("menu.rename", language)}
              </button>
              <button className="context-item delete" onClick={handleDeleteItem}>
                <Trash2 size={14} /> {t("menu.delete", language)}
              </button>
            </>
          )}
        </div>
      )}
    </aside>
  );
}
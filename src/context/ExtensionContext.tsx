import React, { createContext, useContext, useState, useEffect } from "react";
import { readDir, readTextFile, mkdir, exists } from "@tauri-apps/plugin-fs";
import { appDataDir, join } from "@tauri-apps/api/path";
import { Command } from "@tauri-apps/plugin-shell"; 
import { loadSettings, saveSettings } from "../utils/settingsManager";

export type ExtensionManifest = {
  id: string;
  name: string;
  version: string;
  description?: string;
  main?: string;
  contributes?: {
    languages?: { id: string; extensions: string[] }[];
    snippets?: { language: string; label: string; body: string; description: string }[];
    themes?: any[];
  };
};

export type CustomPanel = {
  id: string;
  title: string;
  render: (container: HTMLDivElement) => void;
};

export type InstalledExtension = ExtensionManifest & { enabled: boolean };

type ExtensionContextType = {
  customLanguages: any[];
  customSnippets: any[];
  customPanels: CustomPanel[];
  activeTheme: string;
  setActiveTheme: (themeId: string) => void;
  themesList: any[];
  installedExtensions: InstalledExtension[];
  reloadExtensions: () => Promise<void>;
  toggleExtension: (id: string) => Promise<void>;
  openExtensionsFolder: () => Promise<void>;
};

const ExtensionContext = createContext<ExtensionContextType | undefined>(undefined);

export function ExtensionProvider({ children }: { children: React.ReactNode }) {
  const [customLanguages, setCustomLanguages] = useState<any[]>([]);
  const [customSnippets, setCustomSnippets] = useState<any[]>([]);
  const [customPanels, setCustomPanels] = useState<CustomPanel[]>([]);
  const [themesList, setThemesList] = useState<any[]>([]);
  const [activeTheme, setActiveTheme] = useState<string>("default");
  
  const [installedExtensions, setInstalledExtensions] = useState<InstalledExtension[]>([]);

  const applyGlobalTheme = (themeId: string, allThemes: any[]) => {
    const theme = allThemes.find(t => t.id === themeId);
    if (!theme || !theme.ui) {
      return;
    }
    const root = document.documentElement;
    Object.entries(theme.ui).forEach(([key, value]) => {
      const cssKey = `--${key.replace(/([A-Z])/g, "-$1").toLowerCase()}`;
      root.style.setProperty(cssKey, value as string);
    });
  };

  useEffect(() => {
    if (themesList.length > 0) applyGlobalTheme(activeTheme, themesList);
  }, [activeTheme, themesList]);

  const getExtensionsDir = async () => {
    const appData = await appDataDir();
    const extDir = await join(appData, "quasar", "extensions");
    const dirExists = await exists(extDir);
    if (!dirExists) {
      await mkdir(extDir, { recursive: true });
    }
    return extDir;
  };

  // Niezawodne otwieranie folderu bazujące na naszym nowym default.json
  const openExtensionsFolder = async () => {
    try {
      const dir = await getExtensionsDir();
      const isWin = navigator.userAgent.toLowerCase().includes('win');
      const isMac = navigator.userAgent.toLowerCase().includes('mac');
      
      if (isWin) {
        await Command.create('explorer', [dir]).execute();
      } else if (isMac) {
        await Command.create('open', [dir]).execute();
      } else {
        await Command.create('xdg-open', [dir]).execute();
      }
    } catch (err) {
      console.error("Nie udało się otworzyć systemowego menedżera plików:", err);
    }
  };

  const toggleExtension = async (id: string) => {
    const settings = await loadSettings();
    const disabled = settings.disabledExtensions || [];
    const isCurrentlyDisabled = disabled.includes(id);

    const newDisabled = isCurrentlyDisabled
      ? disabled.filter((x: string) => x !== id)
      : [...disabled, id];

    await saveSettings({ ...settings, disabledExtensions: newDisabled });
    await reloadExtensions();
  };

  const reloadExtensions = async () => {
    try {
      const settings = await loadSettings();
      const disabledExtensions = settings.disabledExtensions || [];
      const extensionsDir = await getExtensionsDir();
      const entries = await readDir(extensionsDir).catch(() => []);
      
      const langs: any[] = [];
      const snippets: any[] = [];
      const panels: CustomPanel[] = [];
      const themes: any[] = [];
      const loadedExts: InstalledExtension[] = [];
      
      // Tablica przechowująca ID wszystkich obecnie wykrytych wtyczek na dysku
      const foundExtensionIds: string[] = [];

      for (const entry of entries) {
        if (entry.isDirectory) {
          try {
            const extPath = await join(extensionsDir, entry.name);
            const manifestContent = await readTextFile(await join(extPath, "manifest.json"));
            const manifest: ExtensionManifest = JSON.parse(manifestContent);
            
            foundExtensionIds.push(manifest.id);
            const isEnabled = !disabledExtensions.includes(manifest.id);

            loadedExts.push({ ...manifest, enabled: isEnabled });

            if (!isEnabled) continue;

            if (manifest.contributes?.languages) langs.push(...manifest.contributes.languages);
            if (manifest.contributes?.snippets) snippets.push(...manifest.contributes.snippets);
            if (manifest.contributes?.themes) themes.push(...manifest.contributes.themes);

            if (manifest.main) {
              const jsCode = await readTextFile(await join(extPath, manifest.main));
              
              const editorAPI = {
                ui: {
                  showNotification: (msg: string) => alert(`[${manifest.name}]: ${msg}`),
                  registerPanel: (id: string, title: string, renderFn: (container: HTMLDivElement) => void) => {
                    panels.push({ id, title, render: renderFn });
                  }
                }
              };

              const runPlugin = new Function('editorAPI', jsCode);
              runPlugin(editorAPI);
            }
          } catch (e) {
            console.error(`Błąd ładowania wtyczki ${entry.name}:`, e);
          }
        }
      }

      // AUTOCZYSZCZENIE USTAWIEN: Usun z disabledExtensions te wtyczki, których juz nie ma fizycznie na dysku
      const cleanDisabledExtensions = disabledExtensions.filter((id: string) => foundExtensionIds.includes(id));
      if (cleanDisabledExtensions.length !== disabledExtensions.length) {
        // Zapisujemy tylko jeśli zaszła zmiana (usunięto nieistniejącą wtyczkę)
        await saveSettings({ ...settings, disabledExtensions: cleanDisabledExtensions });
      }

      setCustomLanguages(langs);
      setCustomSnippets(snippets);
      setCustomPanels(panels);
      setThemesList(themes);
      setInstalledExtensions(loadedExts);

    } catch (err) {
      console.error("System rozszerzeń napotkał problem:", err);
    }
  };

  useEffect(() => { reloadExtensions(); }, []);

  return (
    <ExtensionContext.Provider value={{ 
      customLanguages, customSnippets, customPanels, 
      activeTheme, setActiveTheme, themesList,
      installedExtensions, reloadExtensions, toggleExtension, openExtensionsFolder
    }}>
      {children}
    </ExtensionContext.Provider>
  );
}

export const useExtensions = () => {
  const context = useContext(ExtensionContext);
  if (!context) throw new Error("useExtensions musi być użyte wewnątrz ExtensionProvider");
  return context;
};
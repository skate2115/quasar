// src/utils/settingsManager.ts
import { readTextFile, writeTextFile, exists, mkdir, BaseDirectory } from "@tauri-apps/plugin-fs";
import type { Language } from "../i18n";

export interface AppSettings {
  theme: string;
  fontSize: number;
  fontFamily: string;
  language: Language;
  disabledExtensions: string[];
  autoSave: boolean;
  autoSaveDelay: number;
  recentProjects: string[];
}

export const defaultSettings: AppSettings = {
  theme: "dark",
  fontSize: 14,
  fontFamily: "Montserrat",
  language: "en",
  disabledExtensions: [],
  autoSave: true,
  autoSaveDelay: 1500,
  recentProjects: [],
};

// Używamy małych liter "quasar", aby folder pokrywał się z folderem "quasar/extensions" z ExtensionContext
const FOLDER_NAME = "quasar";
const FILE_NAME = "quasar/settings.json";

export async function loadSettings(): Promise<AppSettings> {
  try {
    const folderExists = await exists(FOLDER_NAME, { baseDir: BaseDirectory.AppData });
    if (!folderExists) {
      await mkdir(FOLDER_NAME, { baseDir: BaseDirectory.AppData, recursive: true });
    }

    const fileExists = await exists(FILE_NAME, { baseDir: BaseDirectory.AppData });
    
    if (!fileExists) {
      await writeTextFile(
        FILE_NAME, 
        JSON.stringify(defaultSettings, null, 2), 
        { baseDir: BaseDirectory.AppData }
      );
      return defaultSettings;
    }

    const content = await readTextFile(FILE_NAME, { baseDir: BaseDirectory.AppData });
    return { ...defaultSettings, ...JSON.parse(content) };
  } catch (error) {
    console.error("Nie udało się załadować/stworzyć ustawień:", error);
    return defaultSettings;
  }
}

export async function saveSettings(settings: AppSettings) {
  try {
    const folderExists = await exists(FOLDER_NAME, { baseDir: BaseDirectory.AppData });
    if (!folderExists) {
      await mkdir(FOLDER_NAME, { baseDir: BaseDirectory.AppData, recursive: true });
    }

    await writeTextFile(
      FILE_NAME, 
      JSON.stringify(settings, null, 2), 
      { baseDir: BaseDirectory.AppData }
    );
  } catch (error) {
    console.error("Nie udało się zapisać ustawień:", error);
  }
}
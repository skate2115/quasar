import { Language } from "../i18n";

export interface SystemDiagnostics {
  userAgent: string;
  language: string;
  screenResolution: string;
  theme: string;
  activePath?: string | null;
  openTabsCount: number;
  memory?: {
    usedJSHeapSize?: number;
    totalJSHeapSize?: number;
    jsHeapSizeLimit?: number;
  };
}

export interface CrashReportItem {
  id: string;
  timestamp: string;
  source: "palette" | "system" | "unhandled" | "manual";
  title: string;
  errorMessage: string;
  stack?: string;
  userMessage?: string;
  diagnostics: SystemDiagnostics;
}

const STORAGE_KEY = "quasar_crash_reports";
const MAX_STORED_REPORTS = 20;

/**
 * Creates a language-appropriate Error with localized title based on the error source.
 */
export function createLocalizedReportError(
  source: "palette" | "system" | "unhandled" | "manual",
  language: Language,
  detail?: string
): Error {
  const isPl = language === "pl";
  let title = "";

  switch (source) {
    case "palette":
      title = isPl ? "Zgłoszenie użytkownika z Palety Poleceń" : "User report from Command Palette";
      break;
    case "system":
      title = isPl ? "Błąd systemowy aplikacji QUASAR" : "QUASAR Application System Error";
      break;
    case "unhandled":
      title = isPl ? "Nieobsłużony wyjątek aplikacji" : "Unhandled Application Exception";
      break;
    case "manual":
    default:
      title = isPl ? "Zgłoszenie błędu użytkownika" : "User Bug Report";
      break;
  }

  const message = detail ? `${title}: ${detail}` : title;
  const error = new Error(message);
  error.name = title;
  return error;
}

/**
 * Gathers current system diagnostics safely without exposing private data.
 */
export function getSystemDiagnostics(
  theme: string,
  language: Language,
  activePath?: string | null,
  openTabsCount = 0
): SystemDiagnostics {
  const perf = typeof window !== "undefined" ? (window.performance as any) : null;
  const memoryInfo = perf?.memory
    ? {
        usedJSHeapSize: Math.round(perf.memory.usedJSHeapSize / 1024 / 1024),
        totalJSHeapSize: Math.round(perf.memory.totalJSHeapSize / 1024 / 1024),
        jsHeapSizeLimit: Math.round(perf.memory.jsHeapSizeLimit / 1024 / 1024),
      }
    : undefined;

  return {
    userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "Unknown",
    language,
    screenResolution:
      typeof window !== "undefined"
        ? `${window.innerWidth}x${window.innerHeight} (${window.devicePixelRatio}x)`
        : "Unknown",
    theme,
    activePath,
    openTabsCount,
    memory: memoryInfo,
  };
}

/**
 * Persists a crash or feedback report into localStorage for persistence and debugging.
 */
export function recordCrashReport(
  error: Error | null,
  userMessage: string,
  options: {
    source?: "palette" | "system" | "unhandled" | "manual";
    theme: string;
    language: Language;
    activePath?: string | null;
    openTabsCount?: number;
  }
): CrashReportItem {
  const report: CrashReportItem = {
    id: `crash_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
    source: options.source || "manual",
    title: error?.name || (options.language === "pl" ? "Raport awarii" : "Crash Report"),
    errorMessage: error?.message || "Unknown error",
    stack: error?.stack,
    userMessage: userMessage.trim(),
    diagnostics: getSystemDiagnostics(
      options.theme,
      options.language,
      options.activePath,
      options.openTabsCount || 0
    ),
  };

  try {
    const existingRaw = localStorage.getItem(STORAGE_KEY);
    const reports: CrashReportItem[] = existingRaw ? JSON.parse(existingRaw) : [];
    reports.unshift(report);
    if (reports.length > MAX_STORED_REPORTS) {
      reports.length = MAX_STORED_REPORTS;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
  } catch (e) {
    console.warn("Could not save crash report to localStorage:", e);
  }

  return report;
}

/**
 * Retrieves all stored crash reports from localStorage.
 */
export function getSavedCrashReports(): CrashReportItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Clears stored crash reports from localStorage.
 */
export function clearSavedCrashReports(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore error
  }
}

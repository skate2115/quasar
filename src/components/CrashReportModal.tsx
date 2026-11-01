import { useState } from "react";
import { X, AlertTriangle, Copy, Check, Terminal } from "lucide-react";
import { t, Language } from "../i18n";
import { getSystemDiagnostics } from "../utils/crashReporter";

type CrashReportModalProps = {
  isOpen: boolean;
  error: Error | null;
  onClose: () => void;
  onSendAndClose: (message: string) => void;
  language: Language;
  theme?: string;
  activePath?: string | null;
};

export default function CrashReportModal({ 
  isOpen, 
  error, 
  onClose, 
  onSendAndClose, 
  language,
  theme = "dark",
  activePath = null
}: CrashReportModalProps) {
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen || !error) return null;

  const diagnostics = getSystemDiagnostics(theme, language, activePath);

  const handleCopyDiagnostics = () => {
    const payload = JSON.stringify({
      title: error.name || error.message,
      errorMessage: error.message,
      stack: error.stack,
      userNote: message,
      diagnostics
    }, null, 2);

    navigator.clipboard?.writeText(payload);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const handleSendAndClose = async () => {
    setIsSending(true);
    try {
      await onSendAndClose(message);
    } finally {
      setIsSending(false);
      setMessage("");
    }
  };

  const handleClose = () => {
    setMessage("");
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-box crash-report-modal" onClick={(e) => e.stopPropagation()}>
        
        {/* HEADER */}
        <div className="crash-report-header">
          <div className="crash-report-title-wrapper">
            <AlertTriangle size={20} className="crash-icon" />
            <div className="crash-report-title">{t("crash.title", language)}</div>
          </div>
          <button className="crash-report-close-btn" onClick={handleClose} title={t("modal.btn.cancel", language)}>
            <X size={15} />
          </button>
        </div>

        {/* CONTENT */}
        <div className="crash-report-content">
          <div className="error-message">
            <span className="error-label">{t("crash.error", language)}:</span>
            <div className="error-details">{error.message || "Unknown error occurred"}</div>
          </div>

          <div className="message-section">
            <label className="message-label">{t("crash.message", language)}:</label>
            <textarea
              className="crash-report-textarea"
              placeholder={t("crash.placeholder", language)}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={isSending}
              rows={3}
            />
          </div>

          {/* SYSTEM DIAGNOSTICS ACCORDION */}
          <div className="crash-diagnostics-box" style={{
            marginTop: "10px",
            padding: "8px 12px",
            background: "rgba(0,0,0,0.2)",
            borderRadius: "var(--radius-sm)",
            border: "1px solid var(--border)",
            fontSize: "0.72rem"
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
              <span style={{ fontWeight: 600, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 5 }}>
                <Terminal size={12} /> {t("crash.diagnostics", language)}
              </span>
              <button 
                type="button"
                onClick={handleCopyDiagnostics}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: copied ? "var(--accent)" : "var(--text-muted)",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: "0.7rem",
                  padding: "2px 6px",
                  borderRadius: "4px"
                }}
              >
                {copied ? <Check size={12} /> : <Copy size={12} />}
                <span>{copied ? t("crash.copied", language) : t("crash.copyDiagnostics", language)}</span>
              </button>
            </div>
            <div style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)", fontSize: "0.68rem" }}>
              App: QUASAR IDE • Theme: {theme} • Resolution: {diagnostics.screenResolution} • Lang: {language.toUpperCase()}
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="crash-report-footer">
          <button 
            className="crash-report-btn close-btn" 
            onClick={handleClose}
            disabled={isSending}
          >
            {t("crash.close", language)}
          </button>
          <button 
            className="crash-report-btn send-btn" 
            onClick={handleSendAndClose}
            disabled={isSending}
          >
            {isSending ? t("crash.sending", language) : t("crash.sendAndClose", language)}
          </button>
        </div>
      </div>
    </div>
  );
}

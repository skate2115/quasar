import { useState } from "react";
import { X, AlertTriangle } from "lucide-react";
import { t, Language } from "../i18n";

type CrashReportModalProps = {
  isOpen: boolean;
  error: Error | null;
  onClose: () => void;
  onSendAndClose: (message: string) => void;
  language: Language;
};

export default function CrashReportModal({ 
  isOpen, 
  error, 
  onClose, 
  onSendAndClose, 
  language 
}: CrashReportModalProps) {
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  if (!isOpen || !error) return null;

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
            <div className="crash-report-title">{t("crash.title", language) || "Application Error"}</div>
          </div>
          <button className="crash-report-close-btn" onClick={handleClose} title="Close">
            <X size={15} />
          </button>
        </div>

        {/* CONTENT */}
        <div className="crash-report-content">
          <div className="error-message">
            <span className="error-label">{t("crash.error", language) || "Error Details"}:</span>
            <div className="error-details">{error.message || "Unknown error occurred"}</div>
          </div>

          <div className="message-section">
            <label className="message-label">{t("crash.message", language) || "Optional message (describe what happened)"}:</label>
            <textarea
              className="crash-report-textarea"
              placeholder={t("crash.placeholder", language) || "What were you doing when this happened?"}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={isSending}
              rows={4}
            />
          </div>
        </div>

        {/* FOOTER */}
        <div className="crash-report-footer">
          <button 
            className="crash-report-btn close-btn" 
            onClick={handleClose}
            disabled={isSending}
          >
            {t("crash.close", language) || "Close"}
          </button>
          <button 
            className="crash-report-btn send-btn" 
            onClick={handleSendAndClose}
            disabled={isSending}
          >
            {isSending ? (t("crash.sending", language) || "Sending...") : (t("crash.sendAndClose", language) || "Send & Close")}
          </button>
        </div>
      </div>
    </div>
  );
}

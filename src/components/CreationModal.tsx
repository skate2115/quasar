import { t, type Language } from "../i18n";

type CreationModalProps = {
  language: Language;
  dialog: { visible: boolean; type: "file" | "folder" | "rename"; parentPath: string } | null;
  setDialog: (val: null) => void;
  newItemName: string;
  setNewItemName: (val: string) => void;
  handleModalSubmit: () => void;
};

export default function CreationModal({
  language, dialog, setDialog, newItemName, setNewItemName, handleModalSubmit,
}: CreationModalProps) {
  if (!dialog?.visible) return null;

  const isRename = dialog.type === "rename";
  
  const title = isRename 
    ? t("modal.rename.title", language) 
    : dialog.type === "file" ? t("modal.create.file", language) : t("modal.create.folder", language);
    
  const subtitle = isRename 
    ? `${dialog.parentPath.split(/[\\/]/).pop()}`
    : `in: ${dialog.parentPath.split(/[\\/]/).pop() || "root"}`;
    
  const btnText = t("modal.btn.confirm", language);

  return (
    <div className="modal-overlay" onClick={() => setDialog(null)}>
      <div className="modal-box creation-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">{title}</div>
        <div className="modal-subtitle">{subtitle}</div>
        
        <input
          type="text"
          className="modal-input"
          placeholder={t("modal.input", language)}
          autoFocus
          value={newItemName}
          onChange={(e) => setNewItemName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleModalSubmit()}
        />
        
        <div className="modal-footer">
          <button className="modal-btn cancel" onClick={() => setDialog(null)}>{t("modal.btn.cancel", language)}</button>
          <button className="modal-btn confirm" onClick={handleModalSubmit}>{btnText}</button>
        </div>
      </div>
    </div>
  );
}
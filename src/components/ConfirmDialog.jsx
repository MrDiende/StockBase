import { AlertTriangle } from "lucide-react";
import { Modal } from "./Modal";

// A small confirmation dialog used before destructive actions.
export function ConfirmDialog({ open, title, message, confirmLabel = "Delete", onConfirm, onCancel }) {
  return (
    <Modal open={open} title="" onClose={onCancel} width="sm">
      <div className="confirm-body">
        <div className="confirm-icon">
          <AlertTriangle size={22} />
        </div>
        <h3 className="confirm-title">{title}</h3>
        <p className="confirm-message">{message}</p>
        <div className="confirm-actions">
          <button className="btn btn-secondary btn-block" onClick={onCancel}>
            Cancel
          </button>
          <button className="btn btn-danger btn-block" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}

import { X } from "lucide-react";
import { useEffect } from "react";

// A centered dialog with a dark backdrop. Closes on Escape or backdrop click.
// `width` is one of: "sm" | "md" | "lg" | "xl".
export function Modal({ open, title, subtitle, onClose, children, width = "lg" }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-backdrop" onClick={onClose} />

      <div className={`modal-box modal-width-${width}`}>
        <div className="modal-header">
          <div>
            <h2 className="modal-title">{title}</h2>
            {subtitle && <p className="modal-subtitle">{subtitle}</p>}
          </div>
          <button className="modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

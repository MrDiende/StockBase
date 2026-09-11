import { useEffect, useState } from "react";
import { Modal } from "./Modal";

// A fixed set of colors; each category is given one automatically so the
// dashboard charts can show distinct bars.
const palette = ["#EE4D2D", "#0ea5e9", "#f59e0b", "#10b981", "#ec4899", "#8b5cf6", "#ef4444", "#14b8a6"];

function colorForName(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return palette[Math.abs(hash) % palette.length];
}

export function CategoryModal({ open, onClose, onSave, initial }) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setName(initial?.name ?? "");
      setError("");
    }
  }, [open, initial]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Category name is required.");
      return;
    }
    onSave({ name: name.trim(), color: initial?.color ?? colorForName(name.trim()) });
  };

  return (
    <Modal open={open} onClose={onClose} title={initial ? "Edit Category" : "Add Category"} width="sm">
      <form className="form" onSubmit={handleSubmit}>
        <div className="field">
          <label className="field-label">Category Name</label>
          <input
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Electronics"
            autoFocus
          />
        </div>

        {error && <p className="form-error">{error}</p>}

        <div className="form-actions">
          <button type="button" className="btn btn-secondary btn-block" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary btn-block">
            Save
          </button>
        </div>
      </form>
    </Modal>
  );
}

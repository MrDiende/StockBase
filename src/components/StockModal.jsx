import { useEffect, useState } from "react";
import { Modal } from "./Modal";
import { cn } from "../utils/classNames";

// The three ways to change stock.
const stockActions = [
  { id: "in", label: "Stock In" },
  { id: "out", label: "Stock Out" },
  { id: "adjust", label: "Set Exact" },
];

export function StockModal({ open, onClose, product, onSubmit }) {
  const [type, setType] = useState("in");
  const [quantity, setQuantity] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setType("in");
      setQuantity("");
      setNote("");
      setError("");
    }
  }, [open]);

  if (!product) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const qty = Number(quantity);
    if (!qty || qty <= 0) {
      setError("Enter a quantity greater than zero.");
      return;
    }
    if (type === "out" && qty > product.quantity) {
      setError("Cannot remove more than current stock.");
      return;
    }
    const defaultNote =
      type === "in" ? "Stock received" : type === "out" ? "Stock removed" : "Manual adjustment";
    onSubmit(type, qty, note.trim() || defaultNote);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Adjust Stock"
      subtitle={`${product.name} · currently ${product.quantity} stocks`}
      width="md"
    >
      <form className="form" onSubmit={handleSubmit}>
        <div className="segmented">
          {stockActions.map((action) => (
            <button
              type="button"
              key={action.id}
              className={cn("segment", type === action.id && "segment-active")}
              onClick={() => setType(action.id)}
            >
              {action.label}
            </button>
          ))}
        </div>

        <div className="field">
          <label className="field-label">{type === "adjust" ? "New quantity" : "Quantity"}</label>
          <input
            className="input"
            type="number"
            min={0}
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="0"
            autoFocus
          />
        </div>

        <div className="field">
          <label className="field-label">Note (optional)</label>
          <input
            className="input"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Purchase order #1023"
          />
        </div>

        {error && <p className="form-error">{error}</p>}

        <div className="form-actions">
          <button type="button" className="btn btn-secondary btn-block" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary btn-block">
            Confirm
          </button>
        </div>
      </form>
    </Modal>
  );
}
